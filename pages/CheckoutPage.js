const BasePage = require('./BasePage');

/**
 * CheckoutPage - Page Object pour l'écran de finalisation et paiement
 * Encapsule les formulaires client, l'intégration Stripe Elements et le calcul récapitulatif.
 * Auteur : Amenallah JERBI - Élève-Ingénieur ESPRIT (REM4U SARL)
 */
class CheckoutPage extends BasePage {
  constructor(page, context, config) {
    super(page, context, config);

    this.selectors = {
      firstNameInput: 'input[name="firstName"], input[placeholder*="Prénom"]',
      lastNameInput: 'input[name="lastName"], input[placeholder*="Nom"]',
      emailInput: 'input[name="email"], input[type="email"]',
      phoneInput: 'input[name="phone"], input[type="tel"]',
      stripeCardElement: 'iframe[name*="__privateStripeFrame"], .StripeElement',
      submitPaymentBtn: 'button[type="submit"]:has-text("Payer"), button:has-text("Valider et payer")',
      summaryTotal: '.total-amount, [class*="total"], [class*="Total"]'
    };
  }

  async isCheckoutReached() {
    await this.clearOverlays();
    const url = this.page.url();
    const hasStripeOrForm = await this.page.$(this.selectors.emailInput) || await this.page.$(this.selectors.stripeCardElement);
    return url.includes('reservation') || url.includes('checkout') || !!hasStripeOrForm;
  }

  async verifyStripePresence() {
    await this.clearOverlays();
    try {
      const stripeFrame = await this.page.waitForSelector(this.selectors.stripeCardElement, { timeout: 8000 });
      return !!stripeFrame;
    } catch (e) {
      return false;
    }
  }
}

module.exports = CheckoutPage;
