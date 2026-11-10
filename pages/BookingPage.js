/**
 * Page Object : Page des Résultats & Sélection de Véhicule (BookingPage)
 * Gère les offres Navette / Transfert Privé, la modale Bagages et l'inspection responsive à 960px
 * Auteur : Amenallah JERBI - ESPRIT / REM4U SARL
 */

const BasePage = require('./BasePage');
const config = require('../config/ozeroute.config');

class BookingPage extends BasePage {
  constructor(page, logger) {
    super(page, logger);
  }

  /**
   * Génère une URL Deep Link valide (/mobilite-aeroport/reservation?q=...) avec date future dynamique
   */
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
      // Preset par défaut : Beauvais (BVA) -> Disneyland Paris
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

  /**
   * Vérifie strictement que la page des offres de véhicules est chargée sans erreur
   */
  async waitForVehicles() {
    this.logger.info('Attente du chargement des offres de transport (Navette / Transfert Privé)...');
    await this.clearOverlays();

    // Attendre positivement que les cartes d'offres (tarifs en € et boutons Choisir/Select) soient rendues dans le DOM
    await this.page.waitForFunction(() => {
      const bodyText = document.body.innerText || '';
      const hasEuro = bodyText.includes('€');
      const visibleButtons = Array.from(document.querySelectorAll('button'))
        .filter(b => b.offsetParent !== null && /Choisir|Choose|Select|Réserver/i.test(b.innerText || ''))
        .length;
      return hasEuro && visibleButtons > 0;
    }, { timeout: 16000 }).catch(() => {});

    await this.page.waitForTimeout(1000);
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
      this.logger.fail('Page d\'erreur détectée ("Quelque chose s\'est mal passé") !');
      return false;
    }

    if (!pageState.url.includes('reservation') || (!pageState.hasEuro && pageState.visibleButtons === 0)) {
      this.logger.fail(`Aucune offre de véhicule trouvée sur ${pageState.url}`);
      return false;
    }

    this.logger.pass(`${pageState.visibleButtons} offre(s) réservable(s) affichée(s) avec succès. Extrait : ${pageState.sampleOffers[0] || 'Tarifs € affichés'}`);
    return true;
  }

  /**
   * Bascule entre l'onglet "Navette Economique" et "Transfert privé"
   */
  async switchTab(category = 'private') {
    await this.clearOverlays();
    const pattern = category === 'private'
      ? /Transfert privé|Private transfer/i
      : /Navette|Shuttle/i;

    const tab = this.page.locator(`text=${pattern}`).first();
    if (await tab.count() > 0 && await tab.isVisible()) {
      this.logger.info(`Bascule vers l'onglet d'offres : "${category === 'private' ? 'Transfert privé' : 'Navette Économique'}"`);
      await tab.click();
      await this.page.waitForTimeout(1500);
      await this.clearOverlays();
    }
  }

  /**
   * Clique sur le premier bouton "Choisir" visible et valide la modale "Bagages Transportés" si elle s'ouvre
   */
  async selectFirstAvailableVehicle() {
    await this.clearOverlays();
    const chooseBtn = this.page.locator('button:has-text("Choisir"):visible, button:has-text("Choose"):visible, button:has-text("Select"):visible').first();

    if (await chooseBtn.count() === 0) {
      this.logger.fail('Aucun bouton "Choisir" visible sur la liste des offres');
      return false;
    }

    this.logger.info('Sélection du véhicule (clic sur "Choisir")...');
    await chooseBtn.click();
    await this.page.waitForTimeout(1200);

    // Si c'est un transfert privé, une modale "Bagages Transportés" s'ouvre avec un bouton "Choisir"
    const bagagesModalBtn = this.page.locator('.MuiDialog-root button:has-text("Choisir"):visible, .MuiDialog-root button:has-text("Choose"):visible').first();
    if (await bagagesModalBtn.count() > 0 && await bagagesModalBtn.isVisible()) {
      this.logger.info('Confirmation de la modale "Bagages Transportés" (clic sur "Choisir")');
      await bagagesModalBtn.click();
      await this.page.waitForTimeout(2500);
    } else {
      await this.page.waitForTimeout(1800);
    }

    await this.clearOverlays();
    const currentUrl = this.page.url();
    const reachedBooking = currentUrl.includes('/booking');
    if (reachedBooking) {
      this.logger.pass(`Navigation réussie vers l'étape Checkout (/booking)`);
    } else {
      this.logger.warn(`URL après sélection du véhicule : ${currentUrl}`);
    }
    return reachedBooking;
  }

  /**
   * Inspecte les prix et la distance affichés (pour l'audit Orly -> Orly 0 km)
   */
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

  /**
   * Inspecte le bandeau supérieur de recherche à 960px (Audit Responsive CSS)
   */
  async inspectResponsiveBar960px() {
    await this.page.setViewportSize({ width: 960, height: 800 });
    await this.page.waitForTimeout(1200);
    await this.clearOverlays();

    const metrics = await this.page.evaluate(() => {
      const dateInput = document.querySelector('input[placeholder*="dd/mm"], input[value*="/202"]');
      const paxEl = Array.from(document.querySelectorAll('p, span, button'))
        .find(el => el.children.length === 0 && /passager|passenger/i.test(el.innerText || ''));

      let barClip = { x: 0, y: 0, width: 960, height: 220 };
      if (dateInput) {
        let el = dateInput;
        while (el && el.parentElement && el.parentElement.tagName !== 'BODY') {
          const r = el.parentElement.getBoundingClientRect();
          if (r.width >= 700 && r.height >= 45 && r.height <= 260) {
            barClip = {
              x: Math.max(0, Math.floor(r.x)),
              y: Math.max(0, Math.floor(r.y)),
              width: Math.min(960, Math.ceil(r.width)),
              height: Math.ceil(r.height)
            };
            break;
          }
          el = el.parentElement;
        }
      }

      return {
        viewportWidth: window.innerWidth,
        dateWidth: dateInput ? Math.round(dateInput.getBoundingClientRect().width) : 0,
        dateValue: dateInput ? dateInput.value : '',
        passengerText: paxEl ? paxEl.innerText.trim() : '',
         passengerWidth: paxEl ? Math.round(paxEl.getBoundingClientRect().width) : 0,
        barClip
      };
    });

    this.logger.info(`Mesures Responsive à 960px : Champ Date = ${metrics.dateWidth}px (${metrics.dateValue}) | Passagers = "${metrics.passengerText}" (${metrics.passengerWidth}px)`);
    return metrics;
  }
}

module.exports = BookingPage;
