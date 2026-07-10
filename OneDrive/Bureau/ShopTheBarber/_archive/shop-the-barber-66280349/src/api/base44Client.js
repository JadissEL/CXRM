import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, serverUrl, token, functionsVersion } = appParams;

//Create a client with authentication required
/**
 * @typedef {Object} Base44Entity
 * @property {function(string=): Promise<any[]>} list
 */

/**
 * @typedef {Object} Base44Client
 * @property {Object} entities
 * @property {Base44Entity} entities.User
 * @property {Base44Entity} entities.BarberProfile
 * @property {Base44Entity} entities.Booking
 * @property {Base44Entity} entities.Product
 * @property {Base44Entity} entities.Order
 * @property {Base44Entity} entities.Article
 * @property {Object} integrations
 * @property {Object} integrations.Core
 * @property {function(string, string=): Promise<any[]>} integrations.Core.list
 */

/** @type {Base44Client} */
export const base44 = /** @type {any} */ (createClient({
  appId,
  serverUrl,
  token,
  functionsVersion,
  requiresAuth: false
}));
