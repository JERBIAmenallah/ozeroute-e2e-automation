// Mesure des temps de chargement sur les pages principales Ozeroute

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const config = require('./config/ozeroute.config');

async function launchBrowser() {
  for (const ch of [config.browser.channel, 'chrome', undefined]) {
    try {
      return await chromium.launch(ch ? { headless: true, channel: ch } : { headless: true });
    } catch (e) {}
  }
  return await chromium.launch({ headless: true });
}

async function runBenchmark() {
  console.log('\n----------------------------------------------------------------------');
  console.log('          BENCHMARK TEMPS DE CHARGEMENT — OZEROUTE                    ');
  console.log('----------------------------------------------------------------------\n');

  const browser = await launchBrowser();
  const context = await browser.newContext({ viewport: config.viewports.desktop });
  await context.addCookies(config.axeptioCookies);
  await context.route('**/*axept*', route => route.abort());

  const page = await context.newPage();
  const networkLogs = [];

  page.on('request', req => {
    networkLogs.push({ type: 'REQ', url: req.url(), resourceType: req.resourceType() });
  });

  page.on('response', res => {
    networkLogs.push({ type: 'RES', url: res.url(), status: res.status() });
  });

  const targetUrls = [
    { name: 'Transferts Accueil (FR)', url: 'https://www.ozeroute.com/' },
    { name: 'Version Anglaise (/en)', url: 'https://www.ozeroute.com/en' },
    { name: 'Mise à Disposition (/mise-a-disposition)', url: 'https://www.ozeroute.com/mise-a-disposition' },
    { name: 'Excursions (/excursions)', url: 'https://www.ozeroute.com/excursions' },
    { name: 'Mon Trajet (mytrip.ozeroute.com)', url: 'https://mytrip.ozeroute.com/' }
  ];

  const benchmarkMetrics = [];

  for (const target of targetUrls) {
    console.log(`[MESURE] ${target.name} (${target.url})`);
    const startTime = Date.now();

    await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await page.waitForTimeout(1500);
    const loadTime = Date.now() - startTime;

    const perfTiming = await page.evaluate(() => {
      const timing = performance.getEntriesByType('navigation')[0];
      if (!timing) return { dnsLookup: 0, tcpConnect: 0, ttfb: 0, domInteractive: 0, domContentLoaded: 0 };
      return {
        dnsLookup: Math.round(timing.domainLookupEnd - timing.domainLookupStart),
        tcpConnect: Math.round(timing.connectEnd - timing.connectStart),
        ttfb: Math.round(timing.responseStart - timing.requestStart),
        domInteractive: Math.round(timing.domInteractive),
        domContentLoaded: Math.round(timing.domContentLoadedEventEnd)
      };
    });

    benchmarkMetrics.push({
      target: target.name,
      url: target.url,
      totalLoadTimeMs: loadTime,
      ...perfTiming
    });
  }

  await browser.close();

  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const summaryPath = path.join(reportsDir, 'benchmark_summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(benchmarkMetrics, null, 2), 'utf8');

  const consoleLogLines = [
    `=== BENCHMARK TEMPS DE RÉPONSE OZEROUTE - ${new Date().toISOString()} ===\n`,
    `Pages testées : ${benchmarkMetrics.length}`,
    `Requêtes réseau tracées : ${networkLogs.length}\n`
  ];

  benchmarkMetrics.forEach(m => {
    consoleLogLines.push(`--- ${m.target} ---`);
    consoleLogLines.push(`  URL                        : ${m.url}`);
    consoleLogLines.push(`  Temps de chargement global : ${m.totalLoadTimeMs} ms`);
    consoleLogLines.push(`  TTFB (Time to First Byte)  : ${m.ttfb} ms`);
    consoleLogLines.push(`  DOM Content Loaded         : ${m.domContentLoaded} ms\n`);
  });

  const consoleLogPath = path.join(reportsDir, 'rapport_console.txt');
  fs.writeFileSync(consoleLogPath, consoleLogLines.join('\n'), 'utf8');

  console.table(benchmarkMetrics);
  console.log(`Fichier généré : ${consoleLogPath}\n`);
}

if (require.main === module) {
  runBenchmark().catch(err => {
    console.error('Erreur:', err);
    process.exit(1);
  });
}

module.exports = runBenchmark;
