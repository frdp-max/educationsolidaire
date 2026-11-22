/**
 * UNISSON — Association Éducation Solidaire
 * Serveur d'Application & API Backend (point d'entrée)
 */

import dotenv from 'dotenv';

dotenv.config();

// Import dynamique : les modules lisent process.env au chargement, après dotenv
const { app } = await import('./app.js');
const { startRetentionSchedule } = await import('./emergency.js');

// RGPD : suppression des demandes de plus de 6 mois, au démarrage puis chaque jour
startRetentionSchedule();

const PORT = process.env.PORT || 3000;

if (!process.env.ADMIN_SECRET_KEY || process.env.ADMIN_SECRET_KEY.length < 16) {
  console.warn('⚠️  ADMIN_SECRET_KEY absente ou trop courte : la consultation des alertes est désactivée.');
}

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Serveur UNISSON opérationnel sur http://localhost:${PORT}`);
  console.log(`🌐 Environnement : ${process.env.NODE_ENV || 'production'}`);
  console.log(`💳 HelloAsso API : ${process.env.HELLOASSO_ENV || 'sandbox'}`);
  console.log(`====================================================`);
});
