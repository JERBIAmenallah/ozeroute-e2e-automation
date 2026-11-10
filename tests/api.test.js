// Tests HTTP, endpoints API REST et vérification des headers de sécurité / CORS

const { request } = require('playwright');
const config = require('../config/ozeroute.config');
const Logger = require('../utils/logger');

async function runApiTests() {
  const logger = new Logger();
  logger.info('Lancement des tests HTTP / API et contrôle des headers de sécurité');

  const apiContext = await request.newContext({
    baseURL: config.baseUrl,
    extraHTTPHeaders: {
      'Accept': 'text/html,application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0'
    }
  });

  const endpointsToTest = [
    { name: 'Accueil Transferts (FR)', url: '/', expectedStatus: 200 },
    { name: 'Version Anglaise (/en)', url: '/en', expectedStatus: 200 },
    { name: 'Chauffeur Mise à disposition (/mise-a-disposition)', url: '/mise-a-disposition', expectedStatus: 200 },
    { name: 'Module Excursions (/excursions)', url: '/excursions', expectedStatus: 200 },
    { name: 'Fiche Excursion Versailles (/excursions/versailles)', url: '/excursions/versailles', expectedStatus: 200 },
    { name: 'Espace Client Mon Trajet (mytrip.ozeroute.com)', url: 'https://mytrip.ozeroute.com', expectedStatus: 200 },
    { name: 'Portail Partenaires (partner.ozeroute.com)', url: 'https://partner.ozeroute.com/fr', expectedStatus: 200 },
    { name: 'API Sites d\'activité (/v1/activity_sites)', url: 'https://api.ozeroute.com/v1/activity_sites?locale=fr', expectedStatus: 200 }
  ];

  const results = [];

  for (const ep of endpointsToTest) {
    try {
      const t0 = Date.now();
      const res = await apiContext.get(ep.url, { timeout: 12000 });
      const duration = Date.now() - t0;
      const headers = res.headers();
      const hasSecurityHeaders = Boolean(headers['x-frame-options'] || headers['content-security-policy']);
      const ok = res.status() === ep.expectedStatus;
      logger.log(ok ? 'PASS' : 'FAIL', `[GET ${ep.url}] ${ep.name} -> ${res.status()} (${duration}ms) | Headers sécu: ${hasSecurityHeaders ? 'OUI' : 'MANQUANTS'}`);
      results.push({
        module: ep.name,
        endpoint: ep.url,
        status: res.status(),
        durationMs: duration,
        secHeaders: hasSecurityHeaders ? 'OK' : 'MANQUANTS',
        pass: ok
      });
    } catch (err) {
      logger.fail(`[GET ${ep.url}] ${ep.name} erreur: ${err.message}`);
      results.push({ module: ep.name, endpoint: ep.url, error: err.message, pass: false });
    }
  }

  // Test CORS sur api.ozeroute.com
  const corsRes = await apiContext.get('https://api.ozeroute.com/v1/activity_sites?locale=fr', {
    headers: { 'Origin': 'https://test-external-origin.com' }
  });
  const reflectedOrigin = corsRes.headers()['access-control-allow-origin'];
  const allowCreds = corsRes.headers()['access-control-allow-credentials'];
  if (reflectedOrigin === 'https://test-external-origin.com' && allowCreds === 'true') {
    logger.warn('ALERTE SÉCURITÉ CORS : api.ozeroute.com reflète une origine externe arbitraire avec Access-Control-Allow-Credentials: true');
  }

  await apiContext.dispose();

  console.log('\n----------------------------------------------------------------------');
  console.log('              RÉSULTATS DES TESTS HTTP, API & SÉCURITÉ                ');
  console.log('----------------------------------------------------------------------');
  console.table(results);
  console.log('----------------------------------------------------------------------\n');

  return results;
}

if (require.main === module) {
  runApiTests().catch(err => {
    console.error('Erreur:', err);
    process.exit(1);
  });
}

module.exports = runApiTests;
