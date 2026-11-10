/**
 * Configuration Globale du Framework de Test Ozeroute
 * Projet : Automatisation E2E Modulaire, Data-Driven & Audit Qualité Logicielle
 * Auteur : Amenallah JERBI - Élève-Ingénieur ESPRIT (REM4U SARL)
 */

module.exports = {
  baseUrl: process.env.BASE_URL || 'https://www.ozeroute.com',
  apiUrl: process.env.API_URL || 'https://api.ozeroute.com',
  
  browser: {
    headless: process.env.HEADLESS !== 'false',
    channel: process.env.BROWSER_CHANNEL || 'msedge',
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO, 10) : 0,
    timeout: 30000
  },

  viewports: {
    desktop: { width: 1920, height: 1080 },
    laptop: { width: 1366, height: 768 },
    tablet_960: { width: 960, height: 800 },
    tablet_768: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
  },

  // Cookies de consentement Axeptio pour neutraliser les bannières bloquantes
  axeptioCookies: [
    { name: 'axeptio_cookies', value: 'true', domain: '.ozeroute.com', path: '/' },
    { name: 'axeptio_all_vendors', value: 'true', domain: '.ozeroute.com', path: '/' },
    { name: 'axeptio_authorized_vendors', value: '%2Call%2C', domain: '.ozeroute.com', path: '/' },
    { name: 'axeptio_token', value: 'accepted', domain: '.ozeroute.com', path: '/' }
  ],

  // Règles d'interception réseau et simulation de résilience (Chapitre 3.3 du rapport)
  networkRules: {
    simulateAdblockerOnStripeRadar: false,
    stripeRadarPattern: '**/*r.stripe.com/*',
    promoEndpointPattern: '**/v1/common/promo*'
  },

  timeouts: {
    pageLoad: 35000,
    action: 10000,
    assertion: 5000
  }
};
