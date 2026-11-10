// Configuration Playwright pour les tests E2E Ozeroute

module.exports = {
  baseUrl: process.env.BASE_URL || 'https://www.ozeroute.com',
  apiUrl: process.env.API_URL || 'https://api.ozeroute.com',
  myTripUrl: 'https://mytrip.ozeroute.com',
  partnerUrl: 'https://partner.ozeroute.com/fr',

  browser: {
    // Mode visuel (headed) activé par défaut en local pour voir le test tourner en direct
    // Passe automatiquement en headless sur GitHub Actions (CI=true) ou si HEADLESS=true
    headless: process.env.CI === 'true' || process.env.HEADLESS === 'true',
    channel: process.env.BROWSER_CHANNEL || 'msedge',
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO, 10) : (process.env.CI === 'true' ? 0 : 120),
    timeout: 30000
  },

  viewports: {
    desktop: { width: 1440, height: 900 },
    tablet_960: { width: 960, height: 800 },
    mobile: { width: 390, height: 844 }
  },

  axeptioCookies: [
    { name: 'axeptio_cookies', value: 'true', domain: '.ozeroute.com', path: '/' },
    { name: 'axeptio_all_vendors', value: 'true', domain: '.ozeroute.com', path: '/' },
    { name: 'axeptio_authorized_vendors', value: '%2Call%2C', domain: '.ozeroute.com', path: '/' },
    { name: 'axeptio_token', value: 'accepted', domain: '.ozeroute.com', path: '/' }
  ],

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
