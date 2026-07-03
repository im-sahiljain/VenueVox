import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend/.env first, then root .env as fallback
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const getConfig = () => {
  return {
    vapiApiKey: process.env.VAPI_API_KEY || '',
    vapiPublicKey: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
    port: process.env.PORT || 3001,
  };
};

export const validateEnv = () => {
  const config = getConfig();
  const missing = [];

  // We won't strict throw because of MVP testing (fallback to simulated calls)
  if (!config.vapiApiKey) console.warn('⚠️ Missing VAPI_API_KEY. Vapi provisioning will fail.');
  if (!config.geminiApiKey) console.warn('⚠️ Missing GEMINI_API_KEY. Webhook answers will fail.');
};
