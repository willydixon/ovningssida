// Städar bort räknarna för gränserna per uppkoppling varje natt (netlify/lib/limits.mjs),
// så att kontrollvärdena av IP-adresserna aldrig ligger kvar längre än integritetssidan
// säger, även när ingen använder sidan. Funktionen har ingen adress och körs bara av Netlify.

import { getStore } from '@netlify/blobs';
import { sweep, resetSweep } from '../lib/limits.mjs';

export async function run(store, now = new Date()) {
  resetSweep(); // städa även om funktionen redan har städat den här timmen
  return sweep(store, now);
}

export default async () => {
  const removed = await run(getStore({ name: 'ai-minuter', consistency: 'strong' }));
  console.log(`Tog bort ${removed} gamla räknare för gränserna`);
};

// Varje natt klockan 03:17 UTC (04:17 svensk vintertid, 05:17 sommartid).
export const config = { schedule: '17 3 * * *' };
