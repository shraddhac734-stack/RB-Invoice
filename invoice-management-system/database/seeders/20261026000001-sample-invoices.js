'use strict';

/**
 * Seeder: Sample invoice files in `invoicefile` table
 */
module.exports = {
  up: async (queryInterface) => {
    const [existing] = await queryInterface.sequelize.query(
      'SELECT id FROM invoicefile LIMIT 1'
    ).catch(() => [[]]);

    if (existing && existing.length > 0) {
      console.log('[Seeder] invoicefile table already has records. Skipping seed.');
      return;
    }

    const now = new Date();

    const sampleInvoices = [
      {
        fileName: 'Acme_Supply_INV1001.pdf',
        normalizeFileName: 'Acme_Supply_INV1001.pdf',
        fileUrl: '/uploads/invoices/Acme_Supply_INV1001.pdf',
        folderPath: 'uploads/invoices',
        isVerified: '1',
        storeId: 1,
        expenseId: 101,
        overInvoice: 'false',
        totalInvoice: 1,
        skipInvoices: 'false',
        IsAiIssue: 'false',
        AiIssueDes: null,
        isQueue: 'false',
        createdAt: now,
        lastModifiedDate: now,
        invoiceJson: JSON.stringify({
          document_type: 'invoice',
          invoice_number: 'INV-2026-001',
          invoice_date: '2026-10-01',
          due_date: '2026-10-31',
          raw_date_text: 'Oct 01, 2026',
          currency: 'USD',
          status: 'PAID',
          description: 'Office IT equipment and hardware',
          vendor_name: 'Acme Corporation',
          vendor_address: '123 Tech Park, Phase 1',
          vendor_city: 'Bangalore',
          vendor_state: 'Karnataka',
          vendor_zip: '560100',
          vendor_phone: '+91-80-12345678',
          customer_name: 'Retail Budget Solutions',
          subtotal: 13500.00,
          tax: 1500.00,
          total: 15000.00,
          total_amount: 15000.00,
          payment_method: 'Bank Transfer (NEFT)',
          payment_amount: 15000.00,
          payment_status: 'Completed',
          line_items: [
            {
              item_code: 'MON-24',
              description: 'Dell 24-inch IPS Monitor',
              quantity: 2,
              unit: 'PCS',
              unit_price: 5000.00,
              amount: 10000.00
            },
            {
              item_code: 'KEY-WL',
              description: 'Wireless Keyboard & Mouse Combo',
              quantity: 2,
              unit: 'SET',
              unit_price: 1750.00,
              amount: 3500.00
            }
          ]
        })
      },
      {
        fileName: 'Globex_Servers_INV1002.pdf',
        normalizeFileName: 'Globex_Servers_INV1002.pdf',
        fileUrl: '/uploads/invoices/Globex_Servers_INV1002.pdf',
        folderPath: 'uploads/invoices',
        isVerified: '0',
        storeId: 1,
        expenseId: 102,
        overInvoice: 'false',
        totalInvoice: 1,
        skipInvoices: 'false',
        IsAiIssue: 'false',
        AiIssueDes: null,
        isQueue: 'false',
        createdAt: now,
        lastModifiedDate: now,
        invoiceJson: JSON.stringify({
          document_type: 'invoice',
          invoice_number: 'INV-2026-002',
          invoice_date: '2026-10-10',
          due_date: '2026-11-10',
          raw_date_text: '10/10/2026',
          currency: 'USD',
          status: 'PENDING',
          description: 'Server rack maintenance and patch cables',
          vendor_name: 'Globex Industries',
          vendor_address: '45 Industrial Estate',
          vendor_city: 'Mumbai',
          vendor_state: 'Maharashtra',
          vendor_zip: '400001',
          vendor_phone: '+91-22-87654321',
          customer_name: 'Retail Budget Solutions',
          subtotal: 7500.00,
          tax: 1000.00,
          total: 8500.00,
          total_amount: 8500.00,
          payment_method: 'Credit Card',
          payment_amount: 0.00,
          payment_status: 'Pending',
          line_items: [
            {
              item_code: 'CAB-CAT6',
              description: 'Cat6 Shielded Patch Cable Bundle',
              quantity: 1,
              unit: 'BOX',
              unit_price: 7500.00,
              amount: 7500.00
            }
          ]
        })
      }
    ];

    await queryInterface.bulkInsert('invoicefile', sampleInvoices);
    console.log('[Seeder] Successfully seeded sample invoice files.');
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('invoicefile', null, {});
  }
};
