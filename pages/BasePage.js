/**
 * BasePage - Classe Fondamentale du Pattern Page Object Model (POM)
 * Fournit les méthodes communes de navigation, synchronisation,
 * neutralisation des overlays et gestion des cookies.
 * Auteur : Amenallah JERBI - REM4U SARL / ESPRIT
 */

class BasePage {
  /**
   * @param {import('playwright').Page} page
   * @param {import('playwright').BrowserContext} context
   * @param {object} config
   */
  constructor(page, context, config) {
    this.page = page;
    this.context = context;
    this.config = config;
  }

  /**
   * Injecte les cookies de consentement Axeptio avant la navigation
   */
  async injectAxeptioCookies() {
    if (this.config.axeptioCookies && this.context) {
      await this.context.addCookies(this.config.axeptioCookies);
    }
  }

  /**
   * Navigue vers une URL avec attente réseau
   * @param {string} pathOrUrl
   */
  async navigate(pathOrUrl = '') {
    const fullUrl = pathOrUrl.startsWith('http') 
      ? pathOrUrl 
      : `${this.config.baseUrl}${pathOrUrl}`;
    
    await this.injectAxeptioCookies();
    await this.page.goto(fullUrl, {
      waitUntil: 'domcontentloaded',
      timeout: this.config.timeouts.pageLoad
    });
    await this.clearOverlays();
  }

  /**
   * Supprime les éléments bloquants (Axeptio, modales MUI, backdrops)
   */
  async clearOverlays() {
    try {
      await this.page.evaluate(() => {
        const selectors = [
          '#axeptio_overlay',
          '.axeptio_mount',
          '.MuiDialog-root',
          '.MuiBackdrop-root',
          'div[role="dialog"]',
          '.modal-backdrop'
        ];
        document.querySelectorAll(selectors.join(', ')).forEach(el => el.remove());
        document.body.style.overflow = 'auto';
      });
    } catch (err) {
      // Élément non présent ou page en cours de navigation
    }
  }

  /**
   * Clic sécurisé avec auto-waiting et suppression préalable des overlays
   */
  async safeClick(selector, timeout = 5000) {
    await this.clearOverlays();
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
    await this.page.click(selector);
  }

  /**
   * Saisie sécurisée avec nettoyage de champ préalable
   */
  async safeFill(selector, text, timeout = 5000) {
    await this.clearOverlays();
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
    await this.page.fill(selector, text);
  }

  /**
   * Capture d'écran horodatée
   */
  async takeScreenshot(filepath, clip = null) {
    const options = { path: filepath };
    if (clip) {
      options.clip = clip;
    }
    await this.page.screenshot(options);
    return filepath;
  }
}

module.exports = BasePage;
