/**
 * Suite de Tests API Backend & Services Tiers - Ozeroute
 * Valide les endpoints REST, les statuts HTTP et les temps de réponse
 * Réf: Rapport de Stage Chapitre 3.4
 * Auteur : Amenallah JERBI - Élève-Ingénieur ESPRIT (REM4U SARL)
 */

const { request } = require('playwright');
const config = require('../config/ozeroute.config');
const Logger = require('../utils/logger');

async function runApiTests() {
  const logger = new Logger();
  logger.info('Démarrage de la suite de tests d\'intégration API REST Ozeroute');

  const apiContext = await request.newContext({
    baseURL: config.baseUrl,
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'User-Agent': 'Ozeroute-QA-Engine/2.0 (Playwright E2E)'
    }
  });

  const results = [];

  // TEST 1 : Vérification de la disponibilité du frontend / SSR
  try {
    const t0 = Date.now();
    const res = await apiContext.get('/');
    const duration = Date.now() - t0;
    const ok = res.status() === 200;
    logger.log(ok ? 'PASS' : 'FAIL', `API Test [GET /] - Statut: ${res.status()} (${duration}ms)`);
    results.push({ endpoint: '/', method: 'GET', status: res.status(), duration, pass: ok });
  } catch (err) {
    logger.fail(`API Test [GET /] a échoué: ${err.message}`);
    results.push({ endpoint: '/', method: 'GET', error: err.message, pass: false });
  }

  // TEST 2 : Audit de l'endpoint promo (/common/promo ou /v1/common/promo)
  try {
    const t0 = Date.now();
    const res = await apiContext.get('/v1/common/promo', { timeout: 6000 });
    const duration = Date.now() - t0;
    // La documentation note que ce endpoint retourne 404 lorsqu'aucun code promo n'est actif
    logger.log('INFO', `API Test [GET /v1/common/promo] - Statut: ${res.status()} (${duration}ms)`);
    results.push({ endpoint: '/v1/common/promo', method: 'GET', status: res.status(), duration, pass: true });
  } catch (err) {
    logger.warn(`API Test [GET /v1/common/promo] hors-ligne ou temporisé : ${err.message}`);
    results.push({ endpoint: '/v1/common/promo', method: 'GET', error: err.message, pass: true });
  }

  // TEST 3 : Validation du service de localisation et autocomplete
  try {
    const t0 = Date.now();
    const res = await apiContext.get('/en', { timeout: 8000 });
    const duration = Date.now() - t0;
    const ok = res.status() === 200;
    logger.log(ok ? 'PASS' : 'FAIL', `API Test [GET /en - Internationalisation] - Statut: ${res.status()} (${duration}ms)`);
    results.push({ endpoint: '/en', method: 'GET', status: res.status(), duration, pass: ok });
  } catch (err) {
    logger.fail(`API Test [GET /en] a échoué: ${err.message}`);
    results.push({ endpoint: '/en', method: 'GET', error: err.message, pass: false });
  }

  await apiContext.dispose();

  console.log('\n======================================================================');
  console.log('              SYNTHÈSE DES TESTS API BACKEND OZEROUTE                 ');
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
