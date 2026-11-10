const fs = require('fs');
const path = require('path');

class Reporter {
  constructor(reportsDir = null) {
    this.reportsDir = reportsDir || path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  generateReport(testResults, totalDurationSec) {
    const summary = {
      timestamp: new Date().toISOString(),
      durationSeconds: String(totalDurationSec),
      total: testResults.length,
      passed: testResults.filter(r => r.status === 'PASS').length,
      failed: testResults.filter(r => r.status === 'FAIL').length,
      anomaliesDetected: testResults.filter(r => r.anomalyDetected).length,
      scenarios: testResults
    };

    const jsonPath = path.join(this.reportsDir, 'summary.json');
    fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2), 'utf8');

    const htmlContent = this.buildHtmlReport(summary);
    const htmlPath = path.join(this.reportsDir, 'report.html');
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');

    return { jsonPath, htmlPath, summary };
  }

  generateReports(testResults, totalDurationMs) {
    return this.generateReport(testResults, (totalDurationMs / 1000).toFixed(2));
  }

  buildHtmlReport(summary) {
    const scenarioCards = summary.scenarios.map(s => {
      const badgeClass = s.status === 'PASS' ? 'bg-emerald-500' : 'bg-rose-500';
      const anomalyBadge = s.anomalyDetected
        ? `<span class="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-slate-950 ml-2">Bug / Faille Détectée</span>`
        : '';

      const logsHtml = (s.logs || []).map(l =>
        `<div class="text-xs font-mono py-0.5 text-slate-300"><span class="text-sky-400 font-bold">[${l.category}]</span> ${l.message}${l.details ? ' <span class="text-slate-400">(' + l.details + ')</span>' : ''}</div>`
      ).join('');

      const imgSrc = s.screenshot || (s.screenshotPath ? `../${path.relative(path.join(__dirname, '..'), s.screenshotPath).replace(/\\/g, '/')}` : null);
      const screenshotHtml = imgSrc
        ? `<div class="mt-3"><div class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Capture Playwright :</div>
             <a href="${imgSrc}" target="_blank"><img src="${imgSrc}" class="rounded-lg border border-slate-700 max-h-64 w-full object-contain bg-slate-950 cursor-pointer hover:opacity-95 transition" /></a>
           </div>`
        : '';

      const anomalyBox = s.anomalyDetails
        ? `<div class="mb-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 leading-relaxed"><strong>Constat :</strong> ${s.anomalyDetails}</div>`
        : '';

      const dur = s.durationSec !== undefined ? `${s.durationSec}s` : `${((s.durationMs || 0) / 1000).toFixed(2)}s`;

      return `
        <div class="bg-slate-900/90 rounded-xl p-5 border border-slate-800 shadow-xl">
          <div class="flex items-start justify-between border-b border-slate-800 pb-3 mb-3 gap-2">
            <div>
              <span class="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">${s.category || 'E2E'}</span>
              <h3 class="text-base font-bold text-white mt-0.5 leading-snug">${s.title || s.name}</h3>
            </div>
            <div class="flex items-center shrink-0">
              <span class="px-3 py-1 text-xs font-extrabold text-white rounded-full ${badgeClass}">${s.status}</span>
              ${anomalyBadge}
            </div>
          </div>
          ${anomalyBox}
          <div class="bg-slate-950 rounded-lg p-3 max-h-44 overflow-y-auto space-y-1 border border-slate-900">
            ${logsHtml || '<div class="text-xs text-slate-600">Aucun log</div>'}
          </div>
          ${screenshotHtml}
          <div class="mt-3 text-right text-xs font-mono text-slate-500">Durée : ${dur}</div>
        </div>
      `;
    }).join('');

    return `<!DOCTYPE html>
<html lang="fr" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ozeroute - Rapport de Tests Playwright E2E</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-6 md:p-8 font-sans">
  <div class="max-w-7xl mx-auto">
    <header class="mb-8 border-b border-slate-800/80 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1.5">
          <span class="px-2.5 py-0.5 text-xs font-bold rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">OZEROUTE QA</span>
          <span class="text-xs text-slate-400 font-medium">• Tests E2E & Audit Sécurité / API</span>
        </div>
        <h1 class="text-3xl font-black tracking-tight text-white">Rapport d'Exécution Playwright</h1>
        <p class="text-sm text-slate-400 mt-1">Transferts Aéroport, Excursions, Mise à disposition, Mon Trajet & API</p>
      </div>
      <div class="text-right shrink-0 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
        <div class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Dernière exécution</div>
        <div class="text-sm font-mono font-bold text-slate-200">${new Date(summary.timestamp).toLocaleString('fr-FR')}</div>
        <div class="text-xs font-bold text-emerald-400 mt-0.5">Durée totale : ${summary.durationSeconds}s</div>
      </div>
    </header>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div class="text-xs text-slate-400 uppercase font-semibold">Total Scénarios</div>
        <div class="text-3xl font-black text-white mt-1">${summary.total}</div>
      </div>
      <div class="bg-slate-900/90 border border-emerald-900/40 rounded-xl p-4 shadow-lg">
        <div class="text-xs text-emerald-400 uppercase font-semibold">Scénarios Validés</div>
        <div class="text-3xl font-black text-emerald-400 mt-1">${summary.passed}</div>
      </div>
      <div class="bg-slate-900/90 border border-rose-900/40 rounded-xl p-4 shadow-lg">
        <div class="text-xs text-rose-400 uppercase font-semibold">Échecs</div>
        <div class="text-3xl font-black text-rose-400 mt-1">${summary.failed}</div>
      </div>
      <div class="bg-slate-900/90 border border-amber-900/40 rounded-xl p-4 shadow-lg">
        <div class="text-xs text-amber-400 uppercase font-semibold">Bugs & Failles Détectés</div>
        <div class="text-3xl font-black text-amber-400 mt-1">${summary.anomaliesDetected}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      ${scenarioCards}
    </div>

    <footer class="mt-12 text-center text-xs text-slate-500 border-t border-slate-900 pt-6">
      Tests E2E Playwright • Ozeroute / REM4U
    </footer>
  </div>
</body>
</html>`;
  }
}

module.exports = Reporter;
