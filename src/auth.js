import { CONFIG } from './config.js';

export function validateApiToken(token) {
  if (!token) return null;
  return Object.entries(CONFIG.API_TOKENS).find(([_, t]) => t === token)?.[0] || null;
}
