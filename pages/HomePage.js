// Interactions sur la page d'accueil Ozeroute (recherche transfert, langue, passagers)

const BasePage = require('./BasePage');

class HomePage extends BasePage {
  constructor(page, logger) {
    super(page, logger);
  }

  async fillDeparture(address) {
    await this.clearOverlays();
    this.logger.info(`Saisie départ : "${address}"`);

    const depInput = this.page.locator('input.MuiAutocomplete-input').nth(0);
    await depInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.showStep(`Saisie départ : ${address}`, depInput);
    await depInput.click();
    await depInput.fill(address);
    await this.page.waitForTimeout(1800);

    const option = this.page.locator('.MuiAutocomplete-option, [role="option"]').first();
    try {
      await option.waitFor({ state: 'visible', timeout: 4000 });
      const selectedText = (await option.innerText()).replace(/\n+/g, ' - ').trim();
      await this.showStep(`Sélection Google Places : ${selectedText}`, option);
      await option.click({ timeout: 4000 });
      this.logger.info(`Départ sélectionné : ${selectedText}`);
    } catch (e) {
      await this.page.keyboard.press('ArrowDown');
      await this.page.keyboard.press('Enter');
    }
    await this.page.waitForTimeout(600);
    await this.clearOverlays();
  }

  async fillDestination(address) {
    await this.clearOverlays();
    this.logger.info(`Saisie destination : "${address}"`);

    const destInput = this.page.locator('input.MuiAutocomplete-input').nth(1);
    await destInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.showStep(`Saisie destination : ${address}`, destInput);
    await destInput.click();
    await destInput.fill(address);
    await this.page.waitForTimeout(1800);

    const option = this.page.locator('.MuiAutocomplete-option, [role="option"]').first();
    try {
      await option.waitFor({ state: 'visible', timeout: 4000 });
      const selectedText = (await option.innerText()).replace(/\n+/g, ' - ').trim();
      await this.showStep(`Sélection Google Places : ${selectedText}`, option);
      await option.click({ timeout: 4000 });
      this.logger.info(`Destination sélectionnée : ${selectedText}`);
    } catch (e) {
      await this.page.keyboard.press('ArrowDown');
      await this.page.keyboard.press('Enter');
    }
    await this.page.waitForTimeout(700);
    await this.clearOverlays();
  }

  async fillDateAndTime(daysAhead = 4, time = '14:00') {
    await this.clearOverlays();
    const dateStr = this.getFutureDate(daysAhead);
    this.logger.info(`Date : ${dateStr} | Heure : ${time}`);

    const dateInput = this.page.locator('input[placeholder="dd/mm/yyyy"]').first();
    if (await dateInput.count() > 0) {
      await this.showStep(`Date de prise en charge : ${dateStr}`, dateInput);
      await dateInput.fill(dateStr);
      await this.page.waitForTimeout(250);
    }

    const timeInput = this.page.locator('input[placeholder="hh:mm"], input[type="time"]').first();
    if (await timeInput.count() > 0 && await timeInput.isVisible()) {
      await this.showStep(`Heure : ${time}`, timeInput);
      await timeInput.fill(time);
      await this.page.waitForTimeout(250);
    }
    await this.clearOverlays();
    return dateStr;
  }

  async selectPassengers(adults = 2, children = 0, babies = 0) {
    await this.clearOverlays();
    this.logger.info(`Passagers : ${adults} Adulte(s), ${children} Enfant(s), ${babies} Bébé(s)`);

    const paxTrigger = this.page.locator('text=/Choisissez les passagers|Choose passengers|\\d+\\s*passager|\\d+\\s*passenger/i').first();
    await paxTrigger.waitFor({ state: 'visible', timeout: 8000 });
    await this.showStep(`Sélection passagers (${adults} ad, ${children} enf, ${babies} bébé)`, paxTrigger);
    await paxTrigger.click();
    await this.page.waitForTimeout(450);

    const addAdultBtn = this.page.locator('button[aria-label*="Augmenter Adult" i], button[aria-label*="Increase Adult" i]').first();
    for (let i = 0; i < adults; i++) {
      await this.showStep(`Ajout adulte (${i + 1}/${adults})`, addAdultBtn);
      await addAdultBtn.click();
      await this.page.waitForTimeout(180);
    }

    if (children > 0) {
      const addChildBtn = this.page.locator('button[aria-label*="Augmenter Enfant" i], button[aria-label*="Increase Child" i], button[aria-label*="Increase Infant" i]').first();
      for (let i = 0; i < children; i++) {
        await this.showStep(`Ajout enfant (${i + 1}/${children})`, addChildBtn);
        await addChildBtn.click();
        await this.page.waitForTimeout(180);
      }
    }

    if (babies > 0) {
      const addBabyBtn = this.page.locator('button[aria-label*="Augmenter Bébé" i], button[aria-label*="Increase Baby" i]').first();
      for (let i = 0; i < babies; i++) {
        await this.showStep(`Ajout bébé (${i + 1}/${babies})`, addBabyBtn);
        await addBabyBtn.click();
        await this.page.waitForTimeout(180);
      }
    }

    await this.page.keyboard.press('Escape');
    await this.page.mouse.click(20, 200).catch(() => {});
    await this.page.waitForTimeout(350);
    await this.clearOverlays();
  }

  async switchLanguageToEnglish() {
    await this.clearOverlays();
    this.logger.info('Changement de langue FR -> EN');
    try {
      const langBtn = this.page.locator('button[aria-label="Changer de langue"], header button:has-text("FR"), button:has-text("FR")').first();
      if (await langBtn.count() > 0 && await langBtn.isVisible()) {
        await this.showStep('Ouverture du menu langue (FR -> EN)', langBtn);
        await langBtn.click({ timeout: 5000 });
        await this.page.waitForTimeout(450);
        const enItem = this.page.locator('[role="menuitem"]:has-text("English"), li:has-text("English")').first();
        if (await enItem.count() > 0) {
          await this.showStep('Sélection English', enItem);
          await enItem.click({ timeout: 5000 });
          await this.page.waitForTimeout(2000);
        }
      }
    } catch (e) {
      // Fallback direct vers /en si le menu header est masqué
    }
    if (!this.page.url().includes('/en')) {
      await this.navigate('/en');
    }
    await this.clearOverlays();
  }

  async submitSearch() {
    await this.clearOverlays();
    this.logger.info('Clic sur Rechercher');

    const submitBtn = this.page.locator('button:has-text("Rechercher"), button:has-text("Search")').first();
    await submitBtn.waitFor({ state: 'visible', timeout: 8000 });
    await this.showStep('Lancement de la recherche d\'offres', submitBtn);
    await submitBtn.click();
    await this.page.waitForTimeout(2000);
    if (!this.page.url().includes('reservation') && await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click().catch(() => {});
      await this.page.waitForTimeout(2000);
    }
    await this.clearOverlays();
  }

  async checkRequiredFieldErrors() {
    const errors = await this.page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('.MuiFormHelperText-root, .Mui-error, p, span'));
      return candidates
        .map(el => (el.innerText || '').trim())
        .filter(txt => txt.length > 3 && txt.length < 120 && /adulte|adult|obligatoire|requis|required|départ|destination/i.test(txt));
    });
    const uniqueErrors = [...new Set(errors)];
    this.logger.info(`Messages d'erreur affichés : ${JSON.stringify(uniqueErrors)}`);
    return uniqueErrors;
  }
}

module.exports = HomePage;
