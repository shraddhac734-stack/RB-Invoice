#!/usr/bin/env python3
"""
Batch Invoice Uploader & Processing Timing Script
-------------------------------------------------
Automates sequential uploading of PDF invoices from a local folder to the
Invoice Management System API (POST /api/invoices/upload), measures exact
execution/extraction duration per document, and saves full API responses
and metrics into a consolidated JSON file.

Works with standard Python 3.7+ (zero external pip packages required).
"""

import os
import sys
import time
import json
import uuid
import mimetypes
import argparse
from datetime import datetime
from pathlib import Path

# Fallback: check if requests is available, else use standard library urllib
USE_REQUESTS = False
try:
    import requests
    USE_REQUESTS = True
except ImportError:
    import urllib.request
    import urllib.error
    import urllib.parse


def format_bytes(size_bytes: int) -> str:
    """Format file size in human-readable KB or MB."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"


def upload_file_urllib(api_url: str, file_path: str, timeout: int = 240):
    """
    Upload a file using Python's standard library (urllib.request)
    via multipart/form-data. Zero external pip dependencies required.
    """
    boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
    filename = os.path.basename(file_path)
    content_type = mimetypes.guess_type(file_path)[0] or "application/pdf"

    with open(file_path, "rb") as f:
        file_bytes = f.read()

    body = bytearray()
    # Form field: "file"
    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode("utf-8")
    )
    body.extend(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
    body.extend(file_bytes)
    body.extend(b"\r\n")
    body.extend(f"--{boundary}--\r\n".encode("utf-8"))

    req = urllib.request.Request(api_url, data=bytes(body), method="POST")
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    req.add_header("Accept", "application/json")
    req.add_header("User-Agent", "Python-Batch-Invoice-Uploader/1.0")

    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status_code = resp.status
            raw_data = resp.read().decode("utf-8")
            try:
                json_data = json.loads(raw_data)
            except Exception:
                json_data = {"raw_text": raw_data}
            return status_code, json_data, None
    except urllib.error.HTTPError as e:
        status_code = e.code
        err_body = e.read().decode("utf-8", errors="replace")
        try:
            json_err = json.loads(err_body)
        except Exception:
            json_err = {"raw_text": err_body}
        return status_code, json_err, f"HTTP {status_code}: {e.reason}"
    except urllib.error.URLError as e:
        return 0, None, f"Network / Connection Error: {e.reason}"
    except TimeoutError:
        return 504, None, f"Request timed out after {timeout} seconds"
    except Exception as e:
        return 0, None, f"Unexpected error: {str(e)}"


def upload_file_requests(api_url: str, file_path: str, timeout: int = 240):
    """Upload a file using the requests library if available."""
    filename = os.path.basename(file_path)
    with open(file_path, "rb") as f:
        files = {"file": (filename, f, "application/pdf")}
        headers = {"Accept": "application/json"}
        try:
            resp = requests.post(api_url, files=files, headers=headers, timeout=timeout)
            status_code = resp.status_code
            try:
                json_data = resp.json()
            except Exception:
                json_data = {"raw_text": resp.text}
            err = None if resp.ok else f"HTTP {status_code}: {resp.reason}"
            return status_code, json_data, err
        except requests.exceptions.Timeout:
            return 504, None, f"Request timed out after {timeout} seconds"
        except requests.exceptions.ConnectionError as e:
            return 0, None, f"Connection error: {str(e)}"
        except Exception as e:
            return 0, None, f"Unexpected error: {str(e)}"


def upload_single_file(api_url: str, file_path: str, timeout: int = 240):
    """Dispatches upload using either requests or standard urllib."""
    if USE_REQUESTS:
        return upload_file_requests(api_url, file_path, timeout)
    return upload_file_urllib(api_url, file_path, timeout)


def save_results_to_json(output_path: str, payload: dict):
    """Atomically save results payload to JSON file."""
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    temp_path = f"{output_path}.tmp"
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    os.replace(temp_path, output_path)


def main():
    parser = argparse.ArgumentParser(
        description="Batch upload PDF invoices to Invoice Management API and record timings."
    )
    parser.add_argument(
        "--dir",
        default=r"E:\RB invoices",
        help=r"Source directory containing PDF invoices (default: E:\RB invoices)",
    )
    parser.add_argument(
        "--url",
        default="http://localhost:3009/api/invoices/upload",
        help="Target upload endpoint URL (default: http://localhost:3009/api/invoices/upload)",
    )
    parser.add_argument(
        "--output",
        default=os.path.join(os.path.dirname(__file__), "batch_upload_results.json"),
        help="Path to output JSON file (default: pyscript/batch_upload_results.json)",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=240,
        help="Timeout in seconds per upload request (default: 240)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Optional limit on number of files to process (e.g. --limit 5)",
    )

    args = parser.parse_args()

    source_dir = os.path.abspath(args.dir)
    api_url = args.url
    output_path = os.path.abspath(args.output)
    timeout = args.timeout

    print("=" * 65)
    print("🚀 Batch Invoice Uploader & Processing Timing Script")
    print("=" * 65)
    print(f"📂 Source Directory : {source_dir}")
    print(f"🎯 Target API       : {api_url}")
    print(f"📁 Output File      : {output_path}")
    print(f"⏱️  Request Timeout  : {timeout}s per file")
    print(f"📦 HTTP Client Engine: {'requests' if USE_REQUESTS else 'standard urllib (no pip needed)'}")
    print("-" * 65)

    if not os.path.exists(source_dir):
        print(f"❌ Error: Source directory does not exist: {source_dir}")
        sys.exit(1)

    # Gather all PDF files sorted alphabetically
    pdf_files = [
        os.path.join(source_dir, f)
        for f in os.listdir(source_dir)
        if f.lower().endswith(".pdf") and os.path.isfile(os.path.join(source_dir, f))
    ]
    pdf_files.sort()

    total_files = len(pdf_files)
    if total_files == 0:
        print(f"⚠️  No PDF files found in {source_dir}!")
        sys.exit(0)

    if args.limit and args.limit > 0:
        pdf_files = pdf_files[: args.limit]
        print(f"ℹ️  Processing limit applied: {len(pdf_files)} of {total_files} files")

    files_to_process = len(pdf_files)
    print(f"📋 Found {files_to_process} PDF document(s) to process sequentially.\n")

    started_at_dt = datetime.now()
    batch_start_time = time.perf_counter()

    results = []
    successful_count = 0
    failed_count = 0

    master_payload = {
        "summary": {
            "source_directory": source_dir,
            "target_api": api_url,
            "total_files_found": total_files,
            "total_processed": 0,
            "successful_uploads": 0,
            "failed_uploads": 0,
            "total_time_seconds": 0.0,
            "average_time_seconds": 0.0,
            "started_at": started_at_dt.isoformat(),
            "completed_at": None,
            "status": "IN_PROGRESS",
        },
        "results": results,
    }

    # Initial save of empty structure
    save_results_to_json(output_path, master_payload)

    for idx, file_path in enumerate(pdf_files, 1):
        filename = os.path.basename(file_path)
        file_size = os.path.getsize(file_path)
        file_size_formatted = format_bytes(file_size)

        print(f"[{idx}/{files_to_process}] 📄 Processing: {filename} ({file_size_formatted})...")
        sys.stdout.flush()

        file_start = time.perf_counter()
        file_start_iso = datetime.now().isoformat()

        status_code, api_resp, err_msg = upload_single_file(api_url, file_path, timeout=timeout)

        elapsed = round(time.perf_counter() - file_start, 2)
        is_success = 200 <= status_code < 300 and err_msg is None

        if is_success:
            successful_count += 1
            # Extract high-level summary info from response if available
            record = api_resp.get("data", {}).get("record", {}) if isinstance(api_resp, dict) else {}
            vendor = record.get("vendor_name") or "Unknown Vendor"
            inv_num = record.get("invoice_number") or "N/A"
            total = record.get("total_amount") or record.get("total") or 0.0
            print(f"      ✅ Status: {status_code} | Time: {elapsed}s | Vendor: {vendor} | Invoice #: {inv_num} | Total: ${total}")
        else:
            failed_count += 1
            print(f"      ❌ Failed: Status {status_code} | Time: {elapsed}s | Error: {err_msg}")

        # Summary data extracted from response for clean report rendering
        extracted_info = None
        if isinstance(api_resp, dict) and api_resp.get("data", {}).get("record"):
            rec = api_resp["data"]["record"]
            extracted_info = {
                "id": rec.get("id"),
                "invoice_number": rec.get("invoice_number"),
                "vendor_name": rec.get("vendor_name"),
                "customer_name": rec.get("customer_name"),
                "invoice_date": rec.get("invoice_date"),
                "due_date": rec.get("due_date"),
                "total_amount": rec.get("total_amount") or rec.get("total"),
                "currency": rec.get("currency", "USD"),
                "status": rec.get("status"),
                "line_items_count": len(rec.get("line_items", [])) if isinstance(rec.get("line_items"), list) else 0,
                "processing_seconds": rec.get("processing_seconds"),
                "ollama_seconds": rec.get("ollama_seconds"),
                "page_count": rec.get("page_count", 1),
            }

        file_result = {
            "index": idx,
            "file_name": filename,
            "file_path": file_path,
            "file_size_bytes": file_size,
            "file_size_formatted": file_size_formatted,
            "status_code": status_code,
            "success": is_success,
            "upload_time_seconds": elapsed,
            "started_at": file_start_iso,
            "completed_at": datetime.now().isoformat(),
            "extracted_data": extracted_info,
            "api_response": api_resp,
            "error": err_msg,
        }

        results.append(file_result)

        # Update and flush master payload after every single file (crash-safe!)
        total_so_far = round(time.perf_counter() - batch_start_time, 2)
        master_payload["summary"]["total_processed"] = idx
        master_payload["summary"]["successful_uploads"] = successful_count
        master_payload["summary"]["failed_uploads"] = failed_count
        master_payload["summary"]["total_time_seconds"] = total_so_far
        master_payload["summary"]["average_time_seconds"] = round(total_so_far / idx, 2)
        save_results_to_json(output_path, master_payload)

    total_batch_time = round(time.perf_counter() - batch_start_time, 2)
    avg_time = round(total_batch_time / files_to_process, 2) if files_to_process > 0 else 0.0

    master_payload["summary"]["status"] = "COMPLETED"
    master_payload["summary"]["completed_at"] = datetime.now().isoformat()
    master_payload["summary"]["total_time_seconds"] = total_batch_time
    master_payload["summary"]["average_time_seconds"] = avg_time
    save_results_to_json(output_path, master_payload)

    print("\n" + "=" * 65)
    print("🎉 BATCH UPLOAD PROCESS COMPLETED!")
    print("=" * 65)
    print(f"📊 Total Files Processed : {files_to_process}")
    print(f"✅ Successful Uploads    : {successful_count}")
    print(f"❌ Failed Uploads        : {failed_count}")
    print(f"⏱️  Total Elapsed Time    : {total_batch_time}s ({total_batch_time / 60:.2f} mins)")
    print(f"⚡ Average Time Per File : {avg_time}s")
    print(f"💾 Full Results Saved To : {output_path}")
    print("=" * 65)


if __name__ == "__main__":
    main()

