const BasePage = require('./BasePage');

/**
 * HomePage - Page Object pour la page d'accueil d'Ozeroute
 * Encapsule les sélecteurs du formulaire de réservation, l'autocomplétion Google Places,
 * les contrôles passagers et les déclencheurs de validation.
 * Auteur : Amenallah JERBI - Élève-Ingénieur ESPRIT (REM4U SARL)
 */
class HomePage extends BasePage {
  constructor(page, context, config) {
    super(page, context, config);

    this.selectors = {
      fromInput: 'input[placeholder*="part"], input[name="from"]',
      toInput: 'input[placeholder*="estination"], input[name="to"]',
      autocompleteOption: '[role="option"], .MuiAutocomplete-option',
      dateInput: 'input[placeholder*="dd/mm"], input[type="text"][value*="/"]',
      roundTripRadio: 'input[value="roundtrip"], label:has-text("Aller-retour"), label:has-text("Round trip")',
      passengersButton: 'button:has-text("passager"), button:has-text("Passager"), button:has-text("passenger")',
      minusAdultBtn: 'button:has-text("-"), [aria-label*="decrease"], [aria-label*="diminuer"]',
      plusAdultBtn: 'button:has-text("+"), [aria-label*="increase"], [aria-label*="augmenter"]',
      searchButton: 'button:has-text("Rechercher"), button:has-text("Search")',
      errorMessage: '.MuiFormHelperText-root.Mui-error, .MuiAlert-message, p.text-red-500, div[role="alert"]',
      reviewsSection: 'h2:has-text("Avis"), h2:has-text("confiance"), [class*="elfsight"]'
    };
  }

  async open(locale = 'fr') {
    const url = locale === 'en' ? '/en' : '/';
    await this.navigate(url);
    await this.page.waitForTimeout(1500);
    await this.clearOverlays();
  }

  async fillDeparture(address) {
    await this.clearOverlays();
    const input = await this.page.waitForSelector(this.selectors.fromInput, { timeout: 10000 });
    await input.click();
    await input.fill(address);
    await this.page.waitForTimeout(1000);
    
    try {
      const opt = await this.page.waitForSelector(this.selectors.autocompleteOption, { timeout: 3500 });
      if (opt) await opt.click();
    } catch (e) {
      // Si l'autocomplétion API met du temps, on conserve la saisie brute
    }
  }

  async fillDestination(address) {
    await this.clearOverlays();
    const input = await this.page.waitForSelector(this.selectors.toInput, { timeout: 10000 });
    await input.click();
    await input.fill(address);
    await this.page.waitForTimeout(1000);

    try {
      const opt = await this.page.waitForSelector(this.selectors.autocompleteOption, { timeout: 3500 });
      if (opt) await opt.click();
    } catch (e) {
      // Conserve la saisie
    }
  }

  async setPassengersToZeroAdults() {
    await this.clearOverlays();
    const passBtn = await this.page.$(this.selectors.passengersButton);
    if (passBtn) {
      await passBtn.click();
      await this.page.waitForTimeout(600);
      const minus = await this.page.$(this.selectors.minusAdultBtn);
      if (minus) {
        await minus.click();
        await this.page.waitForTimeout(500);
      }
    }
  }

  async adjustPassengers(adults = 2, children = 1) {
    await this.clearOverlays();
    const passBtn = await this.page.$(this.selectors.passengersButton);
    if (passBtn) {
      await passBtn.click();
      await this.page.waitForTimeout(500);
      const plusBtn = await this.page.$(this.selectors.plusAdultBtn);
      if (plusBtn && adults > 1) {
        await plusBtn.click();
        await this.page.waitForTimeout(300);
      }
      await passBtn.click();
      await this.page.waitForTimeout(400);
      return true;
    }
    return false;
  }

  async enableRoundTrip() {
    await this.clearOverlays();
    const radio = await this.page.$(this.selectors.roundTripRadio);
    if (radio) {
      await radio.click();
      await this.page.waitForTimeout(600);
      return true;
    }
    return false;
  }

  async clickSearch() {
    await this.clearOverlays();
    const btn = await this.page.waitForSelector(this.selectors.searchButton, { timeout: 10000 });
    await btn.click();
    await this.page.waitForTimeout(2500);
  }

  async getValidationMessage() {
    try {
      const errEl = await this.page.waitForSelector(this.selectors.errorMessage, { timeout: 4000 });
      return errEl ? (await errEl.textContent()).trim() : null;
    } catch (e) {
      // Recherche textuelle alternative
      return await this.page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('*'));
        const found = els.find(el => el.textContent && el.textContent.includes('adulte'));
        return found ? found.textContent.trim() : null;
      });
    }
  }

  async scrollToReviews() {
    await this.clearOverlays();
    await this.page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h2, h3, h4, p'));
      const reviewHeader = headings.find(h => h.innerText && (h.innerText.includes('Avis') || h.innerText.includes('Reviews') || h.innerText.includes('confiance')));
      if (reviewHeader) {
        reviewHeader.scrollIntoView({ behavior: 'instant', block: 'center' });
      } else {
        window.scrollTo(0, 1600);
      }
    });
    await this.page.waitForTimeout(2000);
  }
}

module.exports = HomePage;
