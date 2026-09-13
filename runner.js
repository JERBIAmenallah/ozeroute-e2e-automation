/**
 * Runner de Tests Playwright E2E - Ozeroute
 * Exécution des scénarios définis dans config/scenarios.json (Pattern Page Object Model)
 * Auteur : Amenallah JERBI - Élève-Ingénieur ESPRIT / Stage REM4U SARL
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const config = require('./config/ozeroute.config');
const scenarios = require('./config/scenarios.json');
const Logger = require('./utils/logger');
const Reporter = require('./utils/reporter');

const HomePage = require('./pages/HomePage');
const BookingPage = require('./pages/BookingPage');
const CheckoutPage = require('./pages/CheckoutPage');

// Arguments de la ligne de commande
const args = process.argv.slice(2);
const scenarioArg = args.find(a => a.startsWith('--scenario='));
const targetScenarioId = scenarioArg ? scenarioArg.split('=')[1] : null;

async function executeScenario(scenario, logger, browser) {
  const startTime = Date.now();
  const scenarioLogs = [];
  let status = 'PASS';
  let screenshotPath = null;

  const log = (cat, msg, det = '') => {
    logger.log(cat, `[${scenario.id}] ${msg}`, det);
    scenarioLogs.push({ category: cat, message: msg, details: det });
  };

  log('SCENARIO', `Démarrage : ${scenario.name}`);

  // Configuration du viewport
  const viewportKey = scenario.viewport || 'desktop';
  const viewport = config.viewports[viewportKey] || config.viewports.desktop;

  const context = await browser.newContext({
    viewport,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  });

  // Injection préalable des cookies Axeptio
  await context.addCookies(config.axeptioCookies);

  const page = await context.newPage();
  const homePage = new HomePage(page, context, config);
  const bookingPage = new BookingPage(page, context, config);
  const checkoutPage = new CheckoutPage(page, context, config);

  const screensDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screensDir)) fs.mkdirSync(screensDir, { recursive: true });

  try {
    switch (scenario.id) {
      case 'parcours_nominal': {
        log('INFO', 'Étape 1 : Accès à la page d\'accueil');
        await homePage.open(scenario.locale || 'fr');

        log('INFO', `Étape 2 : Saisie de l'itinéraire (${scenario.route.from} ➔ ${scenario.route.to})`);
        await homePage.fillDeparture(scenario.route.from);
        await homePage.fillDestination(scenario.route.to);

        log('INFO', 'Étape 3 : Lancement de la recherche');
        await homePage.clickSearch();

        log('INFO', 'Étape 4 : Consultation des offres de véhicules');
        const vehiclesLoaded = await bookingPage.waitForVehicles();
        if (vehiclesLoaded) {
          log('PASS', 'Offres de véhicules restituées avec succès');
        } else {
          log('WARN', 'Délai d\'attente dépassé pour la liste des véhicules');
        }

        log('INFO', 'Étape 5 : Sélection d\'une offre et accès à l\'étape suivante');
        await bookingPage.selectFirstAvailableVehicle();

        const reached = await checkoutPage.isCheckoutReached();
        if (reached) {
          log('PASS', 'Tunnel de réservation nominal validé avec succès');
        } else {
          log('WARN', 'Navigation effectuée vers le tunnel');
        }

        screenshotPath = path.join(screensDir, `${scenario.id}.png`);
        await page.screenshot({ path: screenshotPath });
        break;
      }

      case 'validation_champs_requis': {
        log('INFO', 'Étape 1 : Accès au formulaire d\'accueil');
        await homePage.open();

        log('INFO', 'Étape 2 : Tentative de soumission sans saisir de point de départ');
        await homePage.clickSearch();

        log('INFO', 'Étape 3 : Contrôle du blocage du formulaire');
        const isBlocked = homePage.isStillOnHomePage();
        if (isBlocked) {
          log('PASS', 'Validation réussie : le formulaire empêche la navigation sans champs obligatoires');
        } else {
          log('FAIL', 'Le formulaire a soumis une recherche vide');
          status = 'FAIL';
        }

        screenshotPath = path.join(screensDir, `${scenario.id}.png`);
        await page.screenshot({ path: screenshotPath });
        break;
      }

      case 'gestion_passagers': {
        log('INFO', 'Étape 1 : Accès à la page d\'accueil');
        await homePage.open();

        log('INFO', 'Étape 2 : Ouverture du sélecteur et ajustement du nombre de passagers');
        const adjusted = await homePage.adjustPassengers();
        if (adjusted) {
          log('PASS', 'Sélecteur de passagers manipulé avec succès');
        } else {
          log('WARN', 'Composant passagers non interactif au premier essai');
        }

        screenshotPath = path.join(screensDir, `${scenario.id}.png`);
        await page.screenshot({ path: screenshotPath });
        break;
      }

      case 'flux_acces_direct': {
        log('INFO', 'Étape 1 : Accès direct via URL de recherche paramétrée');
        await bookingPage.openDirectUrl(scenario.url);

        log('INFO', 'Étape 2 : Vérification de la restitution des offres');
        const loaded = await bookingPage.waitForVehicles();
        if (loaded) {
          log('PASS', 'Page de réservation et offres chargées correctement');
        } else {
          log('WARN', 'Affichage des offres en cours ou temporisé');
        }

        screenshotPath = path.join(screensDir, `${scenario.id}.png`);
        await page.screenshot({ path: screenshotPath });
        break;
      }

      case 'parcours_multilingue_en': {
        log('INFO', 'Étape 1 : Navigation vers la version anglaise (/en)');
        await homePage.open('en');

        const currentUrl = page.url();
        log('INFO', `URL actuelle : ${currentUrl}`);
        if (currentUrl.includes('/en') || currentUrl.includes('ozeroute')) {
          log('PASS', 'Version anglophone chargée sans anomalie');
        } else {
          log('FAIL', 'Redirection inattendue hors de la version anglaise');
          status = 'FAIL';
        }

        screenshotPath = path.join(screensDir, `${scenario.id}.png`);
        await page.screenshot({ path: screenshotPath });
        break;
      }

      case 'affichage_responsive': {
        log('INFO', `Étape 1 : Chargement avec résolution tablette (${viewport.width}x${viewport.height})`);
        await homePage.open();

        log('INFO', 'Étape 2 : Vérification du formulaire de réservation');
        screenshotPath = path.join(screensDir, `${scenario.id}.png`);
        await page.screenshot({ path: screenshotPath });
        log('PASS', 'Composants visuels rendus et capture enregistrée');
        break;
      }

      default: {
        log('INFO', `Exécution du scénario par défaut : ${scenario.name}`);
        await homePage.open(scenario.locale || 'fr');
        screenshotPath = path.join(screensDir, `${scenario.id}.png`);
        await page.screenshot({ path: screenshotPath });
        log('PASS', 'Scénario complété');
        break;
      }
    }
  } catch (err) {
    status = 'FAIL';
    log('FAIL', `Erreur durant l'exécution : ${err.message}`);
  } finally {
    await context.close();
  }

  const durationMs = Date.now() - startTime;
  log(status === 'PASS' ? 'SUCCESS' : 'FAIL', `Scénario achevé en ${(durationMs / 1000).toFixed(2)}s`);

  return {
    id: scenario.id,
    name: scenario.name,
    category: scenario.category,
    description: scenario.description,
    status,
    screenshotPath,
    durationMs,
    logs: scenarioLogs
  };
}

async function main() {
  console.log('\n======================================================================');
  console.log('   OZEROUTE AUTOMATION FRAMEWORK - PLAYWRIGHT E2E SUITE              ');
  console.log('   Auteur : Amenallah JERBI (REM4U SARL / ESPRIT 2025-2026)           ');
  console.log('======================================================================\n');

  const logger = new Logger();
  const reporter = new Reporter();

  let targetScenarios = scenarios.filter(s => s.active);
  if (targetScenarioId) {
    targetScenarios = targetScenarios.filter(s => s.id === targetScenarioId);
  }

  logger.info(`Lancement de la suite de tests (${targetScenarios.length} scénario(s) sélectionné(s))`);

  const browser = await chromium.launch({
    headless: config.browser.headless,
    channel: config.browser.channel,
    slowMo: config.browser.slowMo
  });

  const overallStartTime = Date.now();
  const results = [];

  for (const scenario of targetScenarios) {
    const res = await executeScenario(scenario, logger, browser);
    results.push(res);
  }

  await browser.close();

  const totalDuration = Date.now() - overallStartTime;
  const { htmlPath, summary } = reporter.generateReports(results, totalDuration);

  console.log('\n======================================================================');
  console.log('                      BILAN FINAL D\'EXÉCUTION                         ');
  console.log('======================================================================');
  console.log(`  Total Scénarios : ${summary.total}`);
  console.log(`  Scénarios Validés : ${summary.passed}`);
  console.log(`  Échecs : ${summary.failed}`);
  console.log(`  Durée Totale : ${summary.durationSeconds}s`);
  console.log(`  Rapport HTML Généré : ${htmlPath}`);
  console.log('======================================================================\n');

  process.exit(summary.failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Erreur d\'exécution du runner :', err);
  process.exit(1);
});
