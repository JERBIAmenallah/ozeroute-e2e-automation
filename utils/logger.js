const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

class Logger {
  constructor(logFilePath = null) {
    this.logFilePath = logFilePath || path.join(__dirname, '..', 'reports', 'execution.log');
    this.memoryLogs = [];

    const dir = path.dirname(this.logFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Initialise le fichier de log
    fs.writeFileSync(this.logFilePath, `=== OZEROUTE QA AUTOMATION LOG - ${new Date().toISOString()} ===\n\n`, 'utf8');
  }

  log(category, message, details = '') {
    const timestamp = new Date().toISOString();
    const formattedCategory = `[${category.toUpperCase()}]`.padEnd(14);
    const rawLine = `[${timestamp}] ${formattedCategory} ${message}${details ? ' | Détails: ' + details : ''}`;
    
    this.memoryLogs.push({ timestamp, category, message, details, raw: rawLine });
    fs.appendFileSync(this.logFilePath, rawLine + '\n', 'utf8');

    // Coloration console
    let color = colors.reset;
    if (category.includes('SUCCESS') || category.includes('PASS')) color = colors.green;
    else if (category.includes('WARN') || category.includes('ANOMALY')) color = colors.yellow;
    else if (category.includes('FAIL') || category.includes('ERROR')) color = colors.red;
    else if (category.includes('SCENARIO')) color = colors.cyan;
    else if (category.includes('NETWORK')) color = colors.magenta;

    console.log(`${colors.dim}[${timestamp.substring(11, 19)}]${colors.reset} ${color}${formattedCategory}${colors.reset} ${message}`);
    if (details) {
      console.log(`  ${colors.dim}↳ ${details}${colors.reset}`);
    }
  }

  info(msg, details = '') { this.log('INFO', msg, details); }
  scenario(msg, details = '') { this.log('SCENARIO', msg, details); }
  pass(msg, details = '') { this.log('PASS', msg, details); }
  fail(msg, details = '') { this.log('FAIL', msg, details); }
  warn(msg, details = '') { this.log('WARN', msg, details); }
  anomaly(msg, details = '') { this.log('ANOMALIE', msg, details); }
  network(msg, details = '') { this.log('NETWORK', msg, details); }
  capture(msg, details = '') { this.log('CAPTURE', msg, details); }

  getLogs() {
    return this.memoryLogs;
  }

  getEntries() {
    return this.memoryLogs;
  }
}

module.exports = Logger;
