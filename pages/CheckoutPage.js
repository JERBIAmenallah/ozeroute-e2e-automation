const BasePage = require('./BasePage');

/**
 * CheckoutPage - Page Object pour l'écran de finalisation de commande
 * Encapsule les éléments du récapitulatif et des coordonnées client.
 * Auteur : Amenallah JERBI - REM4U SARL / ESPRIT
 */
class CheckoutPage extends BasePage {
  constructor(page, context, config) {
    super(page, context, config);

    this.selectors = {
      emailInput: 'input[name="email"], input[type="email"]',
      phoneInput: 'input[name="phone"], input[type="tel"]',
      firstNameInput: 'input[name="firstName"], input[placeholder*="Prénom"]',
      lastNameInput: 'input[name="lastName"], input[placeholder*="Nom"]',
      stripeFrame: 'iframe[name*="__privateStripeFrame"], .StripeElement',
      summaryContainer: '.summary, [class*="summary"], [class*="recap"]'
    };
  }

  /**
   * Vérifie si le tunnel est parvenu à l'étape de confirmation / saisie des informations
   */
  async isCheckoutReached() {
    await this.clearOverlays();
    const url = this.page.url();
    const hasForm = await this.page.$(this.selectors.emailInput) || await this.page.$(this.selectors.phoneInput);
    return url.includes('reservation') || !!hasForm;
  }
}

module.exports = CheckoutPage;
