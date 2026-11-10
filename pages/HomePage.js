/**
 * Page Object : Page d'Accueil & Moteur de Recherche (HomePage)
 * Gère la saisie Google Places, le calendrier dynamique, le compteur de passagers et le changement de langue
 * Auteur : Amenallah JERBI - ESPRIT / REM4U SARL
 */

const BasePage = require('./BasePage');

class HomePage extends BasePage {
  constructor(page, logger) {
    super(page, logger);
  }

  /**
   * Saisie de l'adresse de départ via le premier champ Google Places Autocomplete
   */
  async fillDeparture(address) {
    await this.clearOverlays();
    this.logger.info(`Saisie du point de départ : "${address}"`);

    const depInput = this.page.locator('input.MuiAutocomplete-input').nth(0);
    await depInput.waitFor({ state: 'visible', timeout: 10000 });
    await depInput.click();
    await depInput.fill(address);
    await this.page.waitForTimeout(1800);

    const option = this.page.locator('.MuiAutocomplete-option, [role="option"]').first();
    try {
      await option.waitFor({ state: 'visible', timeout: 4000 });
      const selectedText = (await option.innerText()).replace(/\n+/g, ' - ').trim();
      await option.click({ timeout: 4000 });
      this.logger.info(`Suggestion Google Places sélectionnée (Départ) : ${selectedText}`);
    } catch (e) {
      await this.page.keyboard.press('ArrowDown');
      await this.page.keyboard.press('Enter');
    }
    await this.page.waitForTimeout(700);
    await this.clearOverlays();
  }

  /**
   * Saisie de l'adresse de destination via le second champ Google Places Autocomplete
   */
  async fillDestination(address) {
    await this.clearOverlays();
    this.logger.info(`Saisie de la destination : "${address}"`);

    const destInput = this.page.locator('input.MuiAutocomplete-input').nth(1);
    await destInput.waitFor({ state: 'visible', timeout: 10000 });
    await destInput.click();
    await destInput.fill(address);
    await this.page.waitForTimeout(1800);

    const option = this.page.locator('.MuiAutocomplete-option, [role="option"]').first();
    try {
      await option.waitFor({ state: 'visible', timeout: 4000 });
      const selectedText = (await option.innerText()).replace(/\n+/g, ' - ').trim();
      await option.click({ timeout: 4000 });
      this.logger.info(`Suggestion Google Places sélectionnée (Destination) : ${selectedText}`);
    } catch (e) {
      await this.page.keyboard.press('ArrowDown');
      await this.page.keyboard.press('Enter');
    }
    await this.page.waitForTimeout(900);
    await this.clearOverlays();
  }

  /**
   * Saisie de la date (dynamique J+daysAhead) et de l'heure de prise en charge
   */
  async fillDateAndTime(daysAhead = 4, time = '14:00') {
    await this.clearOverlays();
    const dateStr = this.getFutureDate(daysAhead);
    this.logger.info(`Configuration de la date (${dateStr}) et de l'heure (${time})`);

    const dateInput = this.page.locator('input[placeholder="dd/mm/yyyy"]').first();
    if (await dateInput.count() > 0) {
      await dateInput.fill(dateStr);
      await this.page.waitForTimeout(300);
    }

    const timeInput = this.page.locator('input[placeholder="hh:mm"], input[type="time"]').first();
    if (await timeInput.count() > 0 && await timeInput.isVisible()) {
      await timeInput.fill(time);
      await this.page.waitForTimeout(300);
    }
    await this.clearOverlays();
    return dateStr;
  }

  /**
   * Sélection du nombre de passagers (Adultes, Enfants, Bébés) dans le popover MUI
   */
  async selectPassengers(adults = 2, children = 0, babies = 0) {
    await this.clearOverlays();
    this.logger.info(`Configuration des passagers : ${adults} Adulte(s), ${children} Enfant(s), ${babies} Bébé(s)`);

    const paxTrigger = this.page.locator('text=/Choisissez les passagers|Choose passengers|\\d+\\s*passager|\\d+\\s*passenger/i').first();
    await paxTrigger.waitFor({ state: 'visible', timeout: 8000 });
    await paxTrigger.click();
    await this.page.waitForTimeout(500);

    // Incrémenter les adultes
    const addAdultBtn = this.page.locator('button[aria-label*="Augmenter Adult" i], button[aria-label*="Increase Adult" i]').first();
    for (let i = 0; i < adults; i++) {
      await addAdultBtn.click();
      await this.page.waitForTimeout(180);
    }

    // Incrémenter les enfants
    if (children > 0) {
      const addChildBtn = this.page.locator('button[aria-label*="Augmenter Enfant" i], button[aria-label*="Increase Child" i], button[aria-label*="Increase Infant" i]').first();
      for (let i = 0; i < children; i++) {
        await addChildBtn.click();
        await this.page.waitForTimeout(180);
      }
    }

    // Incrémenter les bébés
    if (babies > 0) {
      const addBabyBtn = this.page.locator('button[aria-label*="Augmenter Bébé" i], button[aria-label*="Increase Baby" i]').first();
      for (let i = 0; i < babies; i++) {
        await addBabyBtn.click();
        await this.page.waitForTimeout(180);
      }
    }

    // Fermer le popover des passagers
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(400);
    await this.clearOverlays();
  }

  /**
   * Bascule l'interface en version anglaise (/en) via le sélecteur de langue du header
   */
  async switchLanguageToEnglish() {
    await this.clearOverlays();
    this.logger.info('Changement de langue vers Anglais (EN) via le menu de navigation');
    const langBtn = this.page.locator('button[aria-label="Changer de langue"], header button:has-text("FR")').first();
    if (await langBtn.count() > 0 && await langBtn.isVisible()) {
      await langBtn.click();
      await this.page.waitForTimeout(500);
      const enItem = this.page.locator('[role="menuitem"]:has-text("English")').first();
      if (await enItem.count() > 0) {
        await enItem.click();
        await this.page.waitForTimeout(2000);
      }
    }
    await this.clearOverlays();
  }

  /**
   * Soumission du formulaire de recherche et attente de la navigation
   */
  async submitSearch() {
    await this.clearOverlays();
    this.logger.info('Clic sur le bouton de soumission "Rechercher / Search"');

    const submitBtn = this.page.locator('button:has-text("Rechercher"), button:has-text("Search")').first();
    await submitBtn.waitFor({ state: 'visible', timeout: 8000 });
    await submitBtn.click();
    await this.page.waitForTimeout(4500);
    await this.clearOverlays();
  }

  /**
   * Récupère les messages d'erreur de validation affichés sous les champs du formulaire
   */
  async checkRequiredFieldErrors() {
    const errors = await this.page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('.MuiFormHelperText-root, .Mui-error, p, span'));
      return candidates
        .map(el => (el.innerText || '').trim())
        .filter(txt => txt.length > 3 && txt.length < 120 && /adulte|adult|obligatoire|requis|required|départ|destination/i.test(txt));
    });
    const uniqueErrors = [...new Set(errors)];
    this.logger.info(`Messages de validation détectés : ${JSON.stringify(uniqueErrors)}`);
    return uniqueErrors;
  }

  /**
   * Défile jusqu'à la section des avis Google sur la page d'accueil
   */
  async scrollToReviewsSection() {
    await this.page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('h2, h3, h4, p, span'));
      const target = els.find(e => e.innerText && /avis Google|Google reviews|Avis clients/i.test(e.innerText));
      if (target) {
        target.scrollIntoView({ behavior: 'instant', block: 'center' });
      } else {
        window.scrollTo(0, 1400);
      }
    });
    await this.page.waitForTimeout(1200);
  }
}

module.exports = HomePage;
