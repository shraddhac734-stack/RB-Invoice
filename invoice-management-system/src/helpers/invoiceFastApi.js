/**
 * FastAPI Invoice Extraction Helper
 *
 * Sends invoice PDF files to the external FastAPI AI/OCR extraction service
 * (https://testing-qa-llm.datarover.us/core/invoice/upload-invoices-lineitems/)
 * and maps the output directly to our single-table invoice schema.
 */

const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const { callApi } = require("./callApi");

/**
 * Adapter function to map the FastAPI extraction response into standard Invoice fields.
 * Matches the single-table schema with flattened vendor fields and JSON line_items.
 */
function mapFastApiResponseToInvoice(rawResponse) {
  if (!rawResponse) return null;

  // Support both array payload (rawResponse.data.invoices[0]) and direct object
  let data = rawResponse;
  if (rawResponse.data) {
    if (
      Array.isArray(rawResponse.data.invoices) &&
      rawResponse.data.invoices.length > 0
    ) {
      data = rawResponse.data.invoices[0];
    } else if (rawResponse.data.invoice) {
      data = rawResponse.data.invoice;
    } else {
      data = rawResponse.data;
    }
  } else if (rawResponse.result) {
    data = rawResponse.result;
  }

  // Map line items into standard array: { item_code, description, quantity, unit, unit_price, amount }
  const rawItems = data.line_items || data.items || data.inline_details || [];
  const lineItems = Array.isArray(rawItems)
    ? rawItems.map((item) => ({
        item_code: item.item_code || null,
        description: item.description || item.item_name || item.name || "",
        quantity:
          item.quantity !== undefined && item.quantity !== null
            ? parseFloat(item.quantity)
            : null,
        unit: item.unit || null,
        unit_price:
          item.unit_price !== undefined && item.unit_price !== null
            ? parseFloat(item.unit_price)
            : null,
        amount:
          item.amount !== undefined && item.amount !== null
            ? parseFloat(item.amount)
            : parseFloat(item.total || 0),
      }))
    : [];

  const subtotal = parseFloat(data.subtotal || 0);
  const tax = parseFloat(data.tax || 0);

  // Calculate line items sum if header total is 0 or missing
  const lineItemsSum = lineItems.reduce(
    (acc, it) => acc + (parseFloat(it.amount) || 0),
    0,
  );
  let total = parseFloat(
    data.total !== undefined ? data.total : data.total_amount || 0,
  );
  if (total === 0 && lineItemsSum > 0) {
    total = lineItemsSum;
  } else if (total === 0 && parseFloat(data.payment_amount || 0) > 0) {
    total = parseFloat(data.payment_amount);
  } else if (total === 0 && subtotal + tax > 0) {
    total = subtotal + tax;
  }

  const tokenUsage = rawResponse.token_usage || {};
  const inputTokens =
    data.input_tokens !== undefined && data.input_tokens !== null
      ? parseInt(data.input_tokens, 10)
      : tokenUsage.input_tokens || null;

  const outputTokens =
    data.output_tokens !== undefined && data.output_tokens !== null
      ? parseInt(data.output_tokens, 10)
      : tokenUsage.output_tokens || null;

  return {
    source_file: data.source_file || null,
    document_type:
      data.document_type || (data.credit_no ? "credit_memo" : "invoice"),
    invoice_number:
      data.invoice_number || data.invoice_no || data.bill_number || null,
    invoice_date: data.invoice_date || data.bill_date || null,
    due_date: data.due_date || null,
    raw_date_text: data.raw_date_text || null,
    currency: data.currency || "USD",
    status: data.status || "DRAFT",
    description: data.description || null,

    // Vendor fields (Flattened)
    vendor_name: data.vendor_name || data.seller_name || data.supplier || null,
    vendor_address: data.vendor_address || null,
    vendor_city: data.vendor_city || null,
    vendor_state: data.vendor_state || null,
    vendor_zip: data.vendor_zip || null,
    vendor_phone: data.vendor_phone || null,

    // Customer fields
    customer_name: data.customer_name || null,

    // Financials
    subtotal: subtotal > 0 ? subtotal : total - tax > 0 ? total - tax : total,
    tax,
    total,
    total_amount: total,

    // Payment fields
    payment_method: data.payment_method || null,
    payment_amount:
      data.payment_amount !== undefined && data.payment_amount !== null
        ? parseFloat(data.payment_amount)
        : total,
    payment_status: data.payment_status || null,

    // Credit memo fields
    credit_no: data.credit_no || null,
    credit_date: data.credit_date || null,
    credit_amount:
      data.credit_amount !== undefined && data.credit_amount !== null
        ? parseFloat(data.credit_amount)
        : 0.0,

    // Line items array
    line_items: lineItems,

    // Extraction metrics
    extraction_status:
      data.extraction_status ||
      (rawResponse.status === "success" ? "success" : "failed"),
    error_message: data.error_message || null,
    received_at: data.received_at || null,
    processing_seconds: data.processing_seconds
      ? parseFloat(data.processing_seconds)
      : null,
    ollama_seconds: data.ollama_seconds
      ? parseFloat(data.ollama_seconds)
      : null,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    page_count: data.page_count ? parseInt(data.page_count, 10) : 1,
  };
}

/**
 * Uploads a PDF invoice file to the FastAPI extraction service.
 */
async function uploadToFastApi(filePath, originalName) {
  const baseUrl = process.env.FASTAPI_BASE_URL;
  const endpoint =
    process.env.FASTAPI_ENDPOINT || "/core/invoice/upload-invoices-lineitems/";
  const project = process.env.FASTAPI_PROJECT || "Retail Budget";
  const timeout = parseInt(process.env.FASTAPI_TIMEOUT_MS || "180000", 10);

  // If FastAPI is not configured, operate locally without errors
  if (!baseUrl || baseUrl.trim() === "") {
    return {
      extracted: false,
      message:
        "FastAPI extraction skipped: FASTAPI_BASE_URL is not configured.",
    };
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found for extraction at path: ${filePath}`);
  }

  const form = new FormData();
  const filename = originalName || path.basename(filePath);

  // FastAPI expects "files" (binary file) and "project"
  form.append("files", fs.createReadStream(filePath), { filename });
  form.append("project", project);

  const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const endpointUrl = `${cleanBaseUrl}${cleanEndpoint}`;

  console.log(
    `[FastAPI] Forwarding PDF to extraction endpoint: ${endpointUrl} (Project: "${project}", Timeout: ${timeout}ms)`,
  );

  const rawResponse = await callApi({
    url: endpointUrl,
    method: "POST",
    data: form,
    headers: form.getHeaders(),
    timeout,
  });

  const mapped = mapFastApiResponseToInvoice(rawResponse);

  return {
    extracted: true,
    message:
      rawResponse.message ||
      "Invoice data extracted successfully from FastAPI.",
    raw: rawResponse,
    mapped,
  };
}

module.exports = {
  uploadToFastApi,
  mapFastApiResponseToInvoice,
};
