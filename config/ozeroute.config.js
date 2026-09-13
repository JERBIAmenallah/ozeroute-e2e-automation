/**
 * Configuration Globale du Framework de Test Ozeroute
 * Projet : Automatisation E2E Modulaire & Data-Driven
 * Auteur : Amenallah JERBI - REM4U SARL / ESPRIT
 */

module.exports = {
  baseUrl: process.env.BASE_URL || 'https://www.ozeroute.com',
  
  browser: {
    headless: process.env.HEADLESS !== 'false',
    channel: process.env.BROWSER_CHANNEL || 'msedge',
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO, 10) : 0,
    timeout: 30000
  },

  viewports: {
    desktop: { width: 1920, height: 1080 },
    laptop: { width: 1366, height: 768 },
    tablet: { width: 960, height: 800 },
    mobile: { width: 375, height: 667 }
  },

  axeptioCookies: [
    { name: 'axeptio_cookies', value: 'true', domain: '.ozeroute.com', path: '/' },
    { name: 'axeptio_all_vendors', value: 'true', domain: '.ozeroute.com', path: '/' },
    { name: 'axeptio_authorized_vendors', value: '%2Call%2C', domain: '.ozeroute.com', path: '/' },
    { name: 'axeptio_token', value: 'accepted', domain: '.ozeroute.com', path: '/' }
  ],

  timeouts: {
    pageLoad: 30000,
    action: 10000,
    assertion: 5000
  }
};
