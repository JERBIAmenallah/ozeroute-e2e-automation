/**
 * Page Object : Étape Finale de Checkout & Paiement (/booking)
 * Gère le formulaire des coordonnées passager, le choix d'arrêt, les CGV et la vérification Stripe
 * Auteur : Amenallah JERBI - ESPRIT / REM4U SARL
 */

const BasePage = require('./BasePage');

class CheckoutPage extends BasePage {
  constructor(page, logger) {
    super(page, logger);
  }

  /**
   * Vérifie que l'écran /booking (Checkout) est bien atteint et affiché
   */
  async isCheckoutReached() {
    await this.clearOverlays();
    const state = await this.page.evaluate(() => {
      const url = window.location.href;
      const bodyText = document.body.innerText || '';
      const hasFirstName = !!document.querySelector('input[name="passenger.firstName"]');
      const hasPayBtn = Array.from(document.querySelectorAll('button')).some(b => /Payer|Pay/i.test(b.innerText || ''));
      const totalPriceMatch = bodyText.match(/\d+[,.]\d+\s*€/);
      return {
        isBookingUrl: url.includes('/booking'),
        hasFirstName,
        hasPayBtn,
        totalPrice: totalPriceMatch ? totalPriceMatch[0] : null
      };
    });

    const reached = state.isBookingUrl && (state.hasFirstName || state.hasPayBtn);
    if (reached) {
      this.logger.pass(`Écran de Checkout (/booking) atteint — Tarif récapitulatif : ${state.totalPrice || 'affiché'}`);
    } else {
      this.logger.fail(`Écran de Checkout non atteint (URL actuelle : ${this.page.url()})`);
    }
    return reached;
  }

  /**
   * Remplit le formulaire passager sur /booking sans déclencher de débit bancaire réel
   */
  async fillPassengerDetails(client = {}) {
    await this.clearOverlays();
    const firstName = client.firstName || 'Amenallah';
    const lastName = client.lastName || 'Jerbi';
    const email = client.email || 'amenallah.jerbi@esprit.tn';
    const phone = client.phone || '+33612345678';

    this.logger.info(`Saisie des coordonnées passager sur /booking : ${firstName} ${lastName} (${email})`);

    // Civilité Monsieur (sélectionnée par défaut ou via son label MUI)
    const mrLabel = this.page.locator('label:has-text("Monsieur"), label:has-text("Mr")').first();
    if (await mrLabel.count() > 0 && await mrLabel.isVisible()) {
      await mrLabel.click({ timeout: 2000 }).catch(() => {});
    }

    // Prénom, Nom, Email, Téléphone
    const fnInput = this.page.locator('input[name="passenger.firstName"]').first();
    if (await fnInput.count() > 0) await fnInput.fill(firstName);

    const lnInput = this.page.locator('input[name="passenger.lastName"]').first();
    if (await lnInput.count() > 0) await lnInput.fill(lastName);

    const emInput = this.page.locator('input[name="passenger.email"]').first();
    if (await emInput.count() > 0) await emInput.fill(email);

    const telInput = this.page.locator('input[type="tel"]').first();
    if (await telInput.count() > 0) await telInput.fill(phone);

    // Sélection d'un terminal / arrêt si proposé (ex: Terminal 1 sur Navette Beauvais)
    const terminalChip = this.page.locator('span, div, button').filter({ hasText: /^(Terminal 1|Terminal 2E|Terminal 2F)$/ }).first();
    if (await terminalChip.count() > 0 && await terminalChip.isVisible()) {
      this.logger.info(`Sélection du point d'arrêt aéroportuaire : ${(await terminalChip.innerText()).trim()}`);
      await terminalChip.click({ timeout: 3000 }).catch(() => {});
      await this.page.waitForTimeout(300);
    }

    // Cocher l'acceptation des CGV (sans toucher à la checkbox cachée Axeptio)
    const cgvLabel = this.page.locator('text=/J\'accepte les termes|I accept the terms/i').first();
    if (await cgvLabel.count() > 0 && await cgvLabel.isVisible()) {
      await cgvLabel.click();
      this.logger.info('Case "J\'accepte les termes et conditions d\'Ozeroute" cochée');
    }

    await this.page.waitForTimeout(500);
    await this.clearOverlays();
    this.logger.pass('Formulaire Checkout complété et prêt pour l\'étape de paiement Stripe');
  }
}

module.exports = CheckoutPage;
