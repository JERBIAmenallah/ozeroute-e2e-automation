/**
 * Suite de Tests d'Intégration HTTP / SSR & Nouveaux Modules - Ozeroute
 * Valide les routes principales, l'internationalisation (/en), les nouveaux modules
 * (/mise-a-disposition, /excursions, mytrip.ozeroute.com) et les temps de réponse.
 * Auteur : Amenallah JERBI - Élève-Ingénieur ESPRIT (REM4U SARL)
 */

const { request } = require('playwright');
const config = require('../config/ozeroute.config');
const Logger = require('../utils/logger');

async function runApiTests() {
  const logger = new Logger();
  logger.info('Démarrage de la suite de tests d\'intégration HTTP & SSR Ozeroute');

  const apiContext = await request.newContext({
    baseURL: config.baseUrl,
    extraHTTPHeaders: {
      'Accept': 'text/html,application/json',
      'User-Agent': 'Ozeroute-QA-Engine/2.0 (Playwright Integration)'
    }
  });

  const endpointsToTest = [
    { name: 'Portail Principal (Transferts FR)', url: '/', expectedStatus: 200 },
    { name: 'Portail International (Anglais /en)', url: '/en', expectedStatus: 200 },
    { name: 'Module Chauffeur Horaire (/mise-a-disposition)', url: '/mise-a-disposition', expectedStatus: 200 },
    { name: 'Nouveau Module Visites (/excursions)', url: '/excursions', expectedStatus: 200 },
    { name: 'Espace Client Suivi & QR Code (mytrip.ozeroute.com)', url: 'https://mytrip.ozeroute.com', expectedStatus: 200 },
    { name: 'Page FAQ & Support (/faq)', url: '/faq', expectedStatus: 200 },
    { name: 'Page Contact (/contact)', url: '/contact', expectedStatus: 200 }
  ];

  const results = [];

  for (const ep of endpointsToTest) {
    try {
      const t0 = Date.now();
      const res = await apiContext.get(ep.url, { timeout: 12000 });
      const duration = Date.now() - t0;
      const ok = res.status() === ep.expectedStatus;
      logger.log(ok ? 'PASS' : 'FAIL', `[GET ${ep.url}] ${ep.name} - Statut: ${res.status()} (${duration}ms)`);
      results.push({ module: ep.name, endpoint: ep.url, status: res.status(), durationMs: duration, pass: ok });
    } catch (err) {
      logger.fail(`[GET ${ep.url}] ${ep.name} a échoué: ${err.message}`);
      results.push({ module: ep.name, endpoint: ep.url, error: err.message, pass: false });
    }
  }

  await apiContext.dispose();

  console.log('\n======================================================================');
  console.log('         SYNTHÈSE DES TESTS HTTP / SSR & MODULES OZEROUTE             ');
  console.log('======================================================================');
  console.table(results);
  console.log('======================================================================\n');

  return results;
}

if (require.main === module) {
  runApiTests().catch(err => {
    console.error('Fatal API Test Error:', err);
    process.exit(1);
  });
}

module.exports = runApiTests;
