// Classe de base pour les pages Ozeroute (navigation, cookies, mode visuel et captures)

const config = require('../config/ozeroute.config');

class BasePage {
  constructor(page, logger) {
    this.page = page;
    this.logger = logger;
    this.handlersRegistered = false;
  }

  getFutureDate(daysAhead = 4) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

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

  // Affiche un indicateur visuel à l'écran et encadre l'élément ciblé quand on regarde le test en direct
  async showStep(stepText, targetLocator = null) {
    try {
      await this.page.evaluate((txt) => {
        let banner = document.getElementById('qa-live-step-banner');
        if (!banner) {
          banner = document.createElement('div');
          banner.id = 'qa-live-step-banner';
          banner.style.cssText = 'position:fixed;bottom:16px;left:16px;z-index:999999;background:#0f172a;color:#38bdf8;padding:10px 16px;border-radius:8px;font-family:system-ui,sans-serif;font-size:13px;font-weight:600;box-shadow:0 8px 20px rgba(0,0,0,0.35);border-left:4px solid #22c55e;pointer-events:none;transition:opacity 0.15s;';
          document.body.appendChild(banner);
        }
        banner.style.opacity = '1';
        banner.textContent = '▶ Test Auto : ' + txt;
      }, stepText);

      if (targetLocator) {
        const handle = await targetLocator.elementHandle({ timeout: 1500 }).catch(() => null);
        if (handle) {
          await this.page.evaluate((el) => {
            const prevOutline = el.style.outline;
            const prevOffset = el.style.outlineOffset;
            el.style.outline = '3px solid #ef4444';
            el.style.outlineOffset = '2px';
            setTimeout(() => {
              el.style.outline = prevOutline;
              el.style.outlineOffset = prevOffset;
            }, 650);
          }, handle).catch(() => {});
        }
      }
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
    await this.page.waitForTimeout(2200);
    await this.clearOverlays();
    await this.showStep(`Page chargée : ${urlPath}`);
  }

  async clearOverlays() {
    try {
      await this.page.evaluate(() => {
        if (!document.getElementById('qa-hide-axeptio')) {
          const style = document.createElement('style');
          style.id = 'qa-hide-axeptio';
          style.innerHTML = '#axeptio_overlay, .axeptio_mount, [id*="axeptio"], iframe[title*="Axeptio"] { display: none !important; pointer-events: none !important; }';
          document.head.appendChild(style);
        }
      });

      const promoDialog = this.page.locator('.MuiDialog-root:visible');
      if (await promoDialog.count() > 0) {
        const text = await promoDialog.first().innerText().catch(() => '');
        if (/TOP DESTINATION|Réservation Anticipée|Cookies|Salut/i.test(text)) {
          await this.page.keyboard.press('Escape');
          await this.page.waitForTimeout(300);
        }
      }
    } catch (err) {}
  }

  async takeScreenshot(filePath, options = {}) {
    await this.clearOverlays();
    await this.page.evaluate(() => {
      const b = document.getElementById('qa-live-step-banner');
      if (b) b.style.display = 'none';
    }).catch(() => {});
    await this.page.screenshot({ path: filePath, ...options });
    await this.page.evaluate(() => {
      const b = document.getElementById('qa-live-step-banner');
      if (b) b.style.display = 'block';
    }).catch(() => {});
    this.logger.capture(`Capture enregistrée`, filePath);
  }
}

module.exports = BasePage;
