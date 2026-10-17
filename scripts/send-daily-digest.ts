#!/usr/bin/env node
/**
 * CollabLand - Script autonome pour le résumé quotidien par email (Daily Digest)
 * Exécutable via : npx tsx scripts/send-daily-digest.ts
 * Ou via npm run digest
 */

import { sendDailyDigestBatch } from "../src/lib/email-digest.server";

async function run() {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] Démarrage de l'envoi du résumé quotidien CollabLand...`);

  try {
    const result = await sendDailyDigestBatch(100);
    const duration = ((Date.now() - start) / 1000).toFixed(2);

    console.log(`[${new Date().toISOString()}] Résumé quotidien terminé en ${duration}s :`);
    console.log(` - Profils traités : ${result.processedProfiles}`);
    console.log(` - E-mails envoyés : ${result.digestsSent}`);
    console.log(` - Notifications archivées : ${result.totalNotificationsEmailed}`);
    console.log(` - Ignorés (sans activité) : ${result.skipped}`);

    if (result.errors.length > 0) {
      console.warn(` - Erreurs rencontrées (${result.errors.length}) :`, result.errors);
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Échec critique du digest :`, err);
    process.exit(1);
  }
}

run();
