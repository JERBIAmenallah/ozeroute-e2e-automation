// Page des résultats d'offres (/mobilite-aeroport/reservation) : navettes, VTC et modale bagages

const BasePage = require('./BasePage');
const config = require('../config/ozeroute.config');

class BookingPage extends BasePage {
  constructor(page, logger) {
    super(page, logger);
  }

  buildDeepLinkUrl(preset = 'bva_disneyland', daysAhead = 4, adults = 2) {
    const dateStr = this.getFutureDate(daysAhead);
    let queryObj;

    if (preset === 'orly_orly') {
      queryObj = {
        from: {
          id: "ChIJHTtq-rF15kcRIoTbQ9feeJ0",
          name: "Paris-Orly Airport",
          location: { lat: 48.7272255, lng: 2.3623199 },
          address: "94390 Orly",
          postalCode: "",
          countryCode: "FR",
          countryName: "France",
          city: "Orly"
        },
        to: {
          id: "ChIJHTtq-rF15kcRIoTbQ9feeJ0",
          name: "Paris-Orly Airport",
          location: { lat: 48.7272255, lng: 2.3623199 },
          address: "94390 Orly",
          postalCode: "",
          countryCode: "FR",
          countryName: "France",
          city: "Orly"
        },
        direction: "FROM",
        directionType: "one_way",
        place: null,
        extension: null,
        passengers: { adult: adults, infant: 0, baby: 0 },
        dateOfGo: dateStr,
        timeOfGo: "14:00",
        provision: false,
        provisionDuration: ""
      };
    } else if (preset === 'paris_cdg') {
      queryObj = {
        from: {
          id: "ChIJS78AIBty5kcRZLsIMcKhPAA",
          name: "Gare de Lyon",
          location: { lat: 48.8443038, lng: 2.3743773 },
          address: "Pl. Louis-Armand, 75012 Paris",
          postalCode: "75012",
          countryCode: "FR",
          countryName: "France",
          city: "Paris"
        },
        to: {
          id: "ChIJW89MjgM-5kcRLKZbL5jgKwQ",
          name: "Paris Charles de Gaulle Airport",
          location: { lat: 49.0078597, lng: 2.5507715 },
          address: "95700 Roissy-en-France",
          postalCode: "95700",
          countryCode: "FR",
          countryName: "France",
          city: "Roissy-en-France"
        },
        direction: "FROM",
        directionType: "one_way",
        place: null,
        extension: null,
        passengers: { adult: adults, infant: 0, baby: 0 },
        dateOfGo: dateStr,
        timeOfGo: "14:00",
        provision: false,
        provisionDuration: ""
      };
    } else {
      queryObj = {
        from: {
          id: "ChIJLTyNDYxv5kcRbtc9TZBbD_o",
          name: "Paris Beauvais Airport",
          location: { lat: 49.4544677, lng: 2.1115111 },
          address: "Rte de l'Aéroport, 60000 Tillé",
          postalCode: "60000",
          countryCode: "FR",
          countryName: "France",
          city: "Tillé"
        },
        to: {
          id: "ChIJveJ6yhkd5kcRYOYQY8v4-lc",
          name: "Disneyland Paris",
          location: { lat: 48.8673858, lng: 2.783593 },
          address: "Bd de Parc, 77700 Coupvray",
          postalCode: "77700",
          countryCode: "FR",
          countryName: "France",
          city: "Coupvray"
        },
        direction: "FROM",
        directionType: "one_way",
        place: null,
        extension: null,
        passengers: { adult: adults, infant: 0, baby: 0 },
        dateOfGo: dateStr,
        timeOfGo: "12:00",
        provision: false,
        provisionDuration: ""
      };
    }

    const qBase64 = Buffer.from(JSON.stringify(queryObj)).toString('base64');
    return `${config.baseUrl}/mobilite-aeroport/reservation?q=${encodeURIComponent(qBase64)}`;
  }

  async waitForVehicles() {
    this.logger.info('Attente du chargement des véhicules...');
    await this.showStep('Attente des offres (Navette / Transfert Privé)...');
    await this.clearOverlays();

    const btnLocator = this.page.locator('button:has-text("Choisir"):visible, button:has-text("Choose"):visible, button:has-text("Select"):visible').first();
    await btnLocator.waitFor({ state: 'visible', timeout: 18000 }).catch(() => {});

    await this.page.waitForTimeout(900);
    await this.clearOverlays();

    const pageState = await this.page.evaluate(() => {
      const bodyText = document.body.innerText || '';
      const hasCrash = bodyText.includes("Quelque chose s'est mal passé") || bodyText.includes("Something went wrong");
      const hasEuro = bodyText.includes('€');
      const visibleButtons = Array.from(document.querySelectorAll('button'))
        .filter(b => b.offsetParent !== null && /Choisir|Choose|Select|Réserver/i.test(b.innerText || ''))
        .length;
      const sampleOffers = Array.from(document.querySelectorAll('.MuiPaper-root, div'))
        .map(el => (el.innerText || '').trim().replace(/\n+/g, ' | '))
        .filter(t => t.includes('€') && t.length > 20 && t.length < 220)
        .slice(0, 3);
      return {
        url: window.location.href,
        hasCrash,
        hasEuro,
        visibleButtons,
        sampleOffers
      };
    });

    if (pageState.hasCrash) {
      this.logger.fail('Erreur affichée sur la page ("Quelque chose s\'est mal passé")');
      return false;
    }

    if (!pageState.url.includes('reservation') || (!pageState.hasEuro && pageState.visibleButtons === 0)) {
      this.logger.fail(`Aucune offre affichée sur ${pageState.url}`);
      return false;
    }

    this.logger.pass(`${pageState.visibleButtons} offre(s) affichée(s) — ${pageState.sampleOffers[0] || 'Tarifs chargés'}`);
    return true;
  }

  async switchTab(category = 'private') {
    await this.clearOverlays();
    const pattern = category === 'private'
      ? /Transfert privé|Private transfer/i
      : /Navette|Shuttle/i;

    const tab = this.page.locator(`text=${pattern}`).first();
    if (await tab.count() > 0 && await tab.isVisible()) {
      await this.showStep(`Changement d'onglet : ${category === 'private' ? 'Transfert privé' : 'Navette'}`, tab);
      this.logger.info(`Sélection onglet : ${category === 'private' ? 'Transfert privé' : 'Navette Économique'}`);
      await tab.click();
      await this.page.waitForTimeout(1400);
      await this.clearOverlays();
    }
  }

  async selectFirstAvailableVehicle() {
    await this.clearOverlays();
    const chooseBtn = this.page.locator('button:has-text("Choisir"):visible, button:has-text("Choose"):visible, button:has-text("Select"):visible').first();

    if (await chooseBtn.count() === 0) {
      this.logger.fail('Bouton "Choisir" introuvable');
      return false;
    }

    await this.showStep('Clic sur "Choisir" pour réserver le véhicule', chooseBtn);
    this.logger.info('Clic sur le bouton "Choisir"');
    await chooseBtn.click();
    await this.page.waitForTimeout(1200);

    // En Transfert Privé, la popup "Bagages Transportés" s'ouvre avant d'aller sur /booking
    const bagagesModalBtn = this.page.locator('.MuiDialog-root button:has-text("Choisir"):visible, .MuiDialog-root button:has-text("Choose"):visible').first();
    if (await bagagesModalBtn.count() > 0 && await bagagesModalBtn.isVisible()) {
      await this.showStep('Validation de la popup "Bagages Transportés"', bagagesModalBtn);
      this.logger.info('Validation de la modale "Bagages Transportés"');
      await bagagesModalBtn.click();
      await this.page.waitForTimeout(2400);
    } else {
      await this.page.waitForTimeout(1600);
    }

    await this.clearOverlays();
    const currentUrl = this.page.url();
    const reachedBooking = currentUrl.includes('/booking');
    if (reachedBooking) {
      this.logger.pass(`Arrivée sur la page Checkout (/booking)`);
    } else {
      this.logger.warn(`URL actuelle après sélection : ${currentUrl}`);
    }
    return reachedBooking;
  }

  async inspectDisplayedPricesAndDistance() {
    await this.clearOverlays();
    return await this.page.evaluate(() => {
      const bodyText = document.body.innerText || '';
      const prices = bodyText.match(/\d+[,.]\d+\s*€/g) || [];
      const has3125 = bodyText.includes('31,25') || bodyText.includes('31.25');
      const hasBerline = /Berline Eco/i.test(bodyText);
      return {
        prices: [...new Set(prices)],
        has3125,
        hasBerline,
        excerpt: bodyText.replace(/\n+/g, ' | ').substring(0, 500)
      };
    });
  }
}

module.exports = BookingPage;
