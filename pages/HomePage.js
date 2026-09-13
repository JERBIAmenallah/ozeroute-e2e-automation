const BasePage = require('./BasePage');

/**
 * HomePage - Page Object pour la page d'accueil d'Ozeroute
 * Encapsule les sélecteurs du formulaire de réservation et les actions utilisateur.
 * Auteur : Amenallah JERBI - REM4U SARL / ESPRIT
 */
class HomePage extends BasePage {
  constructor(page, context, config) {
    super(page, context, config);

    this.selectors = {
      fromInput: 'input[placeholder*="part"], input[name="from"]',
      toInput: 'input[placeholder*="estination"], input[name="to"]',
      autocompleteOption: '[role="option"], .MuiAutocomplete-option',
      dateInput: 'input[placeholder*="dd/mm"], input[type="text"][value*="/"]',
      passengersButton: 'button:has-text("passager"), button:has-text("Passager"), button:has-text("passenger")',
      minusAdultBtn: 'button:has-text("-"), [aria-label*="decrease"], [aria-label*="diminuer"]',
      plusAdultBtn: 'button:has-text("+"), [aria-label*="increase"], [aria-label*="augmenter"]',
      searchButton: 'button:has-text("Rechercher"), button:has-text("Search")',
      errorMessage: '.MuiFormHelperText-root.Mui-error, .MuiAlert-message, p.text-red-500'
    };
  }

  /**
   * Ouvre la page d'accueil selon la langue choisie
   */
  async open(locale = 'fr') {
    const url = locale === 'en' ? '/en' : '/';
    await this.navigate(url);
    await this.page.waitForTimeout(1500);
    await this.clearOverlays();
  }

  /**
   * Renseigne l'adresse de départ
   */
  async fillDeparture(address) {
    await this.clearOverlays();
    const input = await this.page.waitForSelector(this.selectors.fromInput, { timeout: 8000 });
    await input.click();
    await input.fill(address);
    await this.page.waitForTimeout(1000);
    
    try {
      const opt = await this.page.waitForSelector(this.selectors.autocompleteOption, { timeout: 3000 });
      if (opt) await opt.click();
    } catch (e) {
      // Si pas de liste d'autocomplétion, on conserve le texte
    }
  }

  /**
   * Renseigne l'adresse d'arrivée
   */
  async fillDestination(address) {
    await this.clearOverlays();
    const input = await this.page.waitForSelector(this.selectors.toInput, { timeout: 8000 });
    await input.click();
    await input.fill(address);
    await this.page.waitForTimeout(1000);

    try {
      const opt = await this.page.waitForSelector(this.selectors.autocompleteOption, { timeout: 3000 });
      if (opt) await opt.click();
    } catch (e) {
      // Si pas de liste d'autocomplétion, on conserve le texte
    }
  }

  /**
   * Ouvre le sélecteur de passagers et ajuste le compteur
   */
  async adjustPassengers() {
    await this.clearOverlays();
    const passBtn = await this.page.$(this.selectors.passengersButton);
    if (passBtn) {
      await passBtn.click();
      await this.page.waitForTimeout(600);
      const plusBtn = await this.page.$(this.selectors.plusAdultBtn);
      if (plusBtn) {
        await plusBtn.click();
        await this.page.waitForTimeout(500);
      }
      // Recliquer pour refermer
      await passBtn.click();
      await this.page.waitForTimeout(500);
      return true;
    }
    return false;
  }

  /**
   * Soumet la recherche
   */
  async clickSearch() {
    await this.clearOverlays();
    const btn = await this.page.waitForSelector(this.selectors.searchButton, { timeout: 8000 });
    await btn.click();
    await this.page.waitForTimeout(2000);
  }

  /**
   * Vérifie si l'utilisateur est resté sur la page d'accueil (soumission bloquée)
   */
  isStillOnHomePage() {
    const currentUrl = this.page.url();
    return !currentUrl.includes('/reservation');
  }

  /**
   * Récupère un éventuel message d'erreur ou d'alerte affiché sur le formulaire
   */
  async getErrorMessage() {
    try {
      const errEl = await this.page.waitForSelector(this.selectors.errorMessage, { timeout: 3000 });
      return errEl ? await errEl.textContent() : null;
    } catch (e) {
      return null;
    }
  }
}

module.exports = HomePage;
