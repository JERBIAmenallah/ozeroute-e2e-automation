const fs = require('fs');
const path = require('path');

class Reporter {
  constructor(reportsDir = null) {
    this.reportsDir = reportsDir || path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  generateReports(testResults, totalDurationMs) {
    const summary = {
      timestamp: new Date().toISOString(),
      durationSeconds: (totalDurationMs / 1000).toFixed(2),
      total: testResults.length,
      passed: testResults.filter(r => r.status === 'PASS').length,
      failed: testResults.filter(r => r.status === 'FAIL').length,
      anomaliesDetected: testResults.filter(r => r.anomalyDetected).length,
      scenarios: testResults
    };

    // 1. Sauvegarde du fichier JSON brut
    const jsonPath = path.join(this.reportsDir, 'summary.json');
    fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2), 'utf8');

    // 2. Génération du rapport HTML interactif
    const htmlContent = this.buildHtmlReport(summary);
    const htmlPath = path.join(this.reportsDir, 'report.html');
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');

    return { jsonPath, htmlPath, summary };
  }

  buildHtmlReport(summary) {
    const scenarioCards = summary.scenarios.map(s => {
      const badgeClass = s.status === 'PASS' ? 'bg-emerald-500' : 'bg-rose-500';
      const anomalyBadge = s.anomalyDetected 
        ? `<span class="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-slate-950 ml-2">Anomalie Documentée</span>` 
        : '';
      
      const logsHtml = (s.logs || []).map(l => 
        `<div class="text-xs font-mono py-0.5 text-slate-300"><span class="text-sky-400 font-bold">[${l.category}]</span> ${l.message}</div>`
      ).join('');

      const screenshotHtml = s.screenshotPath && fs.existsSync(s.screenshotPath)
        ? `<div class="mt-3"><div class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Preuve Capture Réalisée :</div>
             <img src="../${path.relative(path.join(__dirname, '..'), s.screenshotPath).replace(/\\/g, '/')}" class="rounded-lg border border-slate-700 max-h-56 object-cover cursor-pointer hover:opacity-95 transition" />
           </div>`
        : '';

      return `
        <div class="bg-slate-900/90 rounded-xl p-5 border border-slate-800 shadow-xl backdrop-blur-sm">
          <div class="flex items-start justify-between border-b border-slate-800 pb-3 mb-3 gap-2">
            <div>
              <span class="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">${s.category || 'TEST'}</span>
              <h3 class="text-base font-bold text-white mt-0.5 leading-snug">${s.name}</h3>
            </div>
            <div class="flex items-center shrink-0">
              <span class="px-3 py-1 text-xs font-extrabold text-white rounded-full ${badgeClass}">${s.status}</span>
              ${anomalyBadge}
            </div>
          </div>
          <p class="text-xs text-slate-400 mb-3 leading-relaxed">${s.description || ''}</p>
          <div class="bg-slate-950 rounded-lg p-3 max-h-44 overflow-y-auto space-y-1 border border-slate-900">
            ${logsHtml || '<div class="text-xs text-slate-600">Aucun log enregistré</div>'}
          </div>
          ${screenshotHtml}
          <div class="mt-3 text-right text-xs font-mono text-slate-500">Durée : ${(s.durationMs / 1000).toFixed(2)}s</div>
        </div>
      `;
    }).join('');

    return `<!DOCTYPE html>
<html lang="fr" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ozeroute QA Lab - Rapport d'Exécution Playwright</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-6 md:p-8 font-sans">
  <div class="max-w-7xl mx-auto">
    <header class="mb-8 border-b border-slate-800/80 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1.5">
          <span class="px-2.5 py-0.5 text-xs font-bold rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">REM4U QA LAB</span>
          <span class="text-xs text-slate-400 font-medium">• ESPRIT Ingénieurs (2025-2026)</span>
        </div>
        <h1 class="text-3xl font-black tracking-tight text-white">Rapport d'Exécution & d'Audit Playwright E2E</h1>
        <p class="text-sm text-slate-400 mt-1">Plateforme Ozeroute • Validation continue, détection de régressions et tests de résilience</p>
      </div>
      <div class="text-right shrink-0 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
        <div class="text-xs text-slate-400 uppercase tracking-wider font-semibold">Date d'Exécution</div>
        <div class="text-sm font-mono font-bold text-slate-200">${new Date(summary.timestamp).toLocaleString('fr-FR')}</div>
        <div class="text-xs font-bold text-emerald-400 mt-0.5">Durée totale : ${summary.durationSeconds}s</div>
      </div>
    </header>

    <!-- KPI Summary Grid -->
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
        <div class="text-xs text-rose-400 uppercase font-semibold">Échecs Détectés</div>
        <div class="text-3xl font-black text-rose-400 mt-1">${summary.failed}</div>
      </div>
      <div class="bg-slate-900/90 border border-amber-900/40 rounded-xl p-4 shadow-lg">
        <div class="text-xs text-amber-400 uppercase font-semibold">Anomalies Certifiées</div>
        <div class="text-3xl font-black text-amber-400 mt-1">${summary.anomaliesDetected}</div>
      </div>
    </div>

    <!-- Scenarios List -->
    <h2 class="text-xl font-extrabold text-white mb-4 flex items-center gap-2">
      <span>Détail des Scénarios Configurés & Audits</span>
      <span class="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">Data-Driven Engine</span>
    </h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      ${scenarioCards}
    </div>

    <footer class="mt-12 text-center text-xs text-slate-500 border-t border-slate-900 pt-6">
      Développé par <strong>Amenallah JERBI</strong> (201JMT0157) • Stage d'Immersion REM4U SARL • ESPRIT Ingénierie Informatique
    </footer>
  </div>
</body>
</html>`;
  }
}

module.exports = Reporter;
