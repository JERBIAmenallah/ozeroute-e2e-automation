/**
 * Module de Télémétrie & Benchmark de Performance - Ozeroute
 * Mesure les temps de réponse SSR, TTFB et DOMContentLoaded sur les modules clés
 * Auteur : Amenallah JERBI - Élève-Ingénieur ESPRIT (REM4U SARL)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const config = require('./config/ozeroute.config');

async function runBenchmark() {
  console.log('======================================================================');
  console.log('       OZEROUTE PERFORMANCE & TELEMETRY BENCHMARK ENGINE             ');
  console.log('======================================================================\n');

  const browser = await chromium.launch({
    headless: true,
    channel: config.browser.channel
  });

  const context = await browser.newContext({
    viewport: config.viewports.desktop
  });
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
    { name: 'Portail Transferts (FR)', url: 'https://www.ozeroute.com/' },
    { name: 'Portail International (EN)', url: 'https://www.ozeroute.com/en' },
    { name: 'Chauffeur Mise à Disposition', url: 'https://www.ozeroute.com/mise-a-disposition' },
    { name: 'Module Excursions (Nouveau)', url: 'https://www.ozeroute.com/excursions' },
    { name: 'Espace Client Mon Trajet', url: 'https://mytrip.ozeroute.com/' }
  ];

  const benchmarkMetrics = [];

  for (const target of targetUrls) {
    console.log(`[BENCHMARK] Analyse de : ${target.name} (${target.url})`);
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

    const metric = {
      target: target.name,
      url: target.url,
      totalLoadTimeMs: loadTime,
      ...perfTiming
    };

    benchmarkMetrics.push(metric);
  }

  await browser.close();

  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const summaryPath = path.join(reportsDir, 'benchmark_summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(benchmarkMetrics, null, 2), 'utf8');

  const consoleLogLines = [
    `=== OZEROUTE BENCHMARK & TÉLÉMÉTRIE - ${new Date().toISOString()} ===\n`,
    `Total Modules Évalués : ${benchmarkMetrics.length}`,
    `Total Requêtes Réseau Tracées : ${networkLogs.length}\n`
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

  console.log('\n======================================================================');
  console.log('              BILAN DE TÉLÉMÉTRIE ET PERFORMANCE                      ');
  console.log('======================================================================');
  console.table(benchmarkMetrics);
  console.log(`Rapport sauvegardé : ${consoleLogPath}`);
  console.log('======================================================================\n');
}

if (require.main === module) {
  runBenchmark().catch(err => {
    console.error('Fatal Benchmark Error:', err);
    process.exit(1);
  });
}

module.exports = runBenchmark;
