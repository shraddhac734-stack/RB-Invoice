/**
 * Public Tunnel Helper (ngrok / localtunnel)
 * 
 * Exposes the local server (PORT 3009) to a public HTTPS URL
 * so Frontend Developers can access APIs remotely.
 * 
 * - If NGROK_AUTHTOKEN is configured in .env -> uses official ngrok
 * - If NGROK_AUTHTOKEN is not set -> automatically uses localtunnel (free, no account needed)
 */

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = parseInt(process.env.PORT || '3009', 10);
const authtoken = process.env.NGROK_AUTHTOKEN;

async function startTunnel() {
  console.log('--------------------------------------------------');
  console.log(`📡 Starting public tunnel for local port: ${PORT}...`);

  // 1. Try ngrok if authtoken is present
  if (authtoken && authtoken.trim() !== '') {
    try {
      const ngrok = require('@ngrok/ngrok');
      console.log('Using official ngrok with NGROK_AUTHTOKEN...');
      const listener = await ngrok.forward({
        addr: PORT,
        authtoken: authtoken.trim()
      });

      const url = listener.url();
      console.log('==================================================');
      console.log('🚀 Public Server URL (Give this to your FE developer):');
      console.log(`👉 ${url}`);
      console.log(`📄 Swagger UI:  ${url}/api-docs`);
      console.log(`🩺 Health Check: ${url}/health`);
      console.log(`📦 Invoices API: ${url}/api/invoices`);
      console.log('==================================================');
      return;
    } catch (err) {
      console.warn(`[ngrok Warning] Failed to start ngrok: ${err.message}`);
      console.log('Falling back to localtunnel...');
    }
  } else {
    console.log('💡 Note: NGROK_AUTHTOKEN not found in .env.');
    console.log('Using LocalTunnel (no account or signup required)...');
  }

  // 2. LocalTunnel fallback (instant, free public HTTPS link without tokens)
  try {
    const localtunnel = require('localtunnel');
    const tunnel = await localtunnel({ port: PORT });

    console.log('==================================================');
    console.log('🚀 Public Server URL (Give this to your FE developer):');
    console.log(`👉 ${tunnel.url}`);
    console.log(`📄 Swagger UI:  ${tunnel.url}/api-docs`);
    console.log(`🩺 Health Check: ${tunnel.url}/health`);
    console.log(`📦 Invoices API: ${tunnel.url}/api/invoices`);
    console.log('==================================================');
    console.log('ℹ️  Keep this terminal open while your FE developer is testing.');
    console.log('ℹ️  To use ngrok instead, add NGROK_AUTHTOKEN=your_token in .env');
    console.log('==================================================');

    tunnel.on('close', () => {
      console.log('Tunnel closed.');
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err.message);
    });

  } catch (err) {
    console.error('Failed to establish tunnel:', err.message);
  }
}

startTunnel();
