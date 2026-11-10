// Page de paiement / coordonnées passager (/booking)

const BasePage = require('./BasePage');

class CheckoutPage extends BasePage {
  constructor(page, logger) {
    super(page, logger);
  }

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
      this.logger.pass(`Page /booking chargée — Prix total : ${state.totalPrice || 'affiché'}`);
    } else {
      this.logger.fail(`Page /booking non atteinte (URL : ${this.page.url()})`);
    }
    return reached;
  }

  async fillPassengerDetails(client = {}) {
    await this.clearOverlays();
    const firstName = client.firstName || 'Amenallah';
    const lastName = client.lastName || 'Jerbi';
    const email = client.email || 'amenallah.jerbi@esprit.tn';
    const phone = client.phone || '+33612345678';

    this.logger.info(`Remplissage coordonnées passager : ${firstName} ${lastName}`);

    const mrLabel = this.page.locator('label:has-text("Monsieur"), label:has-text("Mr")').first();
    if (await mrLabel.count() > 0 && await mrLabel.isVisible()) {
      await mrLabel.click({ timeout: 2000 }).catch(() => {});
    }

    const fnInput = this.page.locator('input[name="passenger.firstName"]').first();
    if (await fnInput.count() > 0) {
      await this.showStep(`Saisie Prénom : ${firstName}`, fnInput);
      await fnInput.fill(firstName);
    }

    const lnInput = this.page.locator('input[name="passenger.lastName"]').first();
    if (await lnInput.count() > 0) {
      await this.showStep(`Saisie Nom : ${lastName}`, lnInput);
      await lnInput.fill(lastName);
    }

    const emInput = this.page.locator('input[name="passenger.email"]').first();
    if (await emInput.count() > 0) {
      await this.showStep(`Saisie Email : ${email}`, emInput);
      await emInput.fill(email);
    }

    const telInput = this.page.locator('input[type="tel"]').first();
    if (await telInput.count() > 0) {
      await this.showStep(`Saisie Téléphone : ${phone}`, telInput);
      await telInput.fill(phone);
    }

    const terminalChip = this.page.locator('span, div, button').filter({ hasText: /^(Terminal 1|Terminal 2E|Terminal 2F)$/ }).first();
    if (await terminalChip.count() > 0 && await terminalChip.isVisible()) {
      const termName = (await terminalChip.innerText()).trim();
      await this.showStep(`Sélection arrêt : ${termName}`, terminalChip);
      this.logger.info(`Arrêt sélectionné : ${termName}`);
      await terminalChip.click({ timeout: 3000 }).catch(() => {});
      await this.page.waitForTimeout(300);
    }

    const cgvLabel = this.page.locator('text=/J\'accepte les termes|I accept the terms/i').first();
    if (await cgvLabel.count() > 0 && await cgvLabel.isVisible()) {
      await this.showStep('Acceptation des conditions générales (CGV)', cgvLabel);
      await cgvLabel.click();
      this.logger.info('Case CGV cochée');
    }

    await this.page.waitForTimeout(500);
    await this.clearOverlays();
    this.logger.pass('Formulaire /booking prêt pour le paiement Stripe');
  }
}

module.exports = CheckoutPage;
