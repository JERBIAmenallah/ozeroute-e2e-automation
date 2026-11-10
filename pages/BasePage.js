/**
 * Page Object de Base - Ozeroute E2E Framework
 * Centralise la navigation, la gestion des cookies Axeptio et la fermeture propre des modales React/MUI
 * Auteur : Amenallah JERBI - ESPRIT / REM4U SARL
 */

const config = require('../config/ozeroute.config');

class BasePage {
  constructor(page, logger) {
    this.page = page;
    this.logger = logger;
    this.handlersRegistered = false;
  }

  /**
   * Calcule une date future au format JJ/MM/AAAA pour éviter les créneaux expirés
   */
  getFutureDate(daysAhead = 4) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  /**
   * Enregistre l'intercepteur réseau pour bloquer le widget Axeptio à la source
   * et initialise la clé localStorage 'ozr_promo_popup_minimized' pour désactiver
   * l'ouverture asynchrone (à T+9s) de la modale promotionnelle "TOP DESTINATION"
   */
  async setupOverlayProtection() {
    if (this.handlersRegistered) return;
    this.handlersRegistered = true;

    try {
      await this.page.context().route('**/*axept*', route => route.abort());
      await this.page.context().addInitScript(() => {
        try {
          window.localStorage.setItem('ozr_promo_popup_minimized', '1');
        } catch (e) {}
      });
    } catch (e) {}
  }

  async navigate(urlPath = '/') {
    await this.setupOverlayProtection();
    const targetUrl = urlPath.startsWith('http') ? urlPath : `${config.baseUrl}${urlPath}`;
    this.logger.info(`Navigation vers : ${targetUrl}`);
    await this.page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: config.timeouts.pageLoad
    });
    await this.page.waitForTimeout(2500);
    await this.clearOverlays();
  }

  /**
   * Ferme proprement les popups promotionnelles ou bannières cookies sans supprimer
   * les modales fonctionnelles du tunnel (ex: modale "Bagages Transportés")
   */
  async clearOverlays() {
    try {
      // 1. Masquer tout résidu Axeptio par CSS sans perturber React
      await this.page.evaluate(() => {
        if (!document.getElementById('qa-hide-axeptio')) {
          const style = document.createElement('style');
          style.id = 'qa-hide-axeptio';
          style.innerHTML = '#axeptio_overlay, .axeptio_mount, [id*="axeptio"], iframe[title*="Axeptio"] { display: none !important; pointer-events: none !important; }';
          document.head.appendChild(style);
        }
      });

      // 2. Si une modale promotionnelle "TOP DESTINATION" ou "Cookies" est ouverte, la fermer via Escape
      const promoDialog = this.page.locator('.MuiDialog-root:visible');
      if (await promoDialog.count() > 0) {
        const text = await promoDialog.first().innerText().catch(() => '');
        if (/TOP DESTINATION|Réservation Anticipée|Cookies|Salut/i.test(text)) {
          const closeBtn = promoDialog.locator('button[aria-label*="Fermer" i], button[aria-label*="Close" i], button:has-text("OK pour moi")').first();
          if (await closeBtn.count() > 0 && await closeBtn.isVisible()) {
            await closeBtn.click();
          } else {
            await this.page.keyboard.press('Escape');
          }
          await this.page.waitForTimeout(350);
        }
      }
    } catch (err) {
      // Ignorer si la page est en cours de transition
    }
  }

  async takeScreenshot(filePath, options = {}) {
    await this.clearOverlays();
    await this.page.screenshot({ path: filePath, ...options });
    this.logger.capture(`Capture d'écran enregistrée`, filePath);
  }
}

module.exports = BasePage;
