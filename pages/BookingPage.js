const BasePage = require('./BasePage');

/**
 * BookingPage - Page Object pour la page des résultats et sélection de véhicules
 * Gère les cartes d'offres (Berline / Van / Navette), le stepper de réservation
 * et l'inspection de layout responsive à 960px.
 * Auteur : Amenallah JERBI - Élève-Ingénieur ESPRIT (REM4U SARL)
 */
class BookingPage extends BasePage {
  constructor(page, context, config) {
    super(page, context, config);

    this.selectors = {
      vehicleCards: '.vehicle-card, [class*="VehicleCard"], .MuiCard-root',
      selectButtons: 'button:has-text("Choisir"), button:has-text("Select"), button:has-text("Réserver"), button:has-text("Retour")',
      horizontalBar: '.search-horizontal-bar, [class*="SearchBar"], header + div form',
      dateInput: 'input[placeholder*="dd/mm"], input[value*="05/09"], input[value*="/20"]',
      passengersTrigger: 'button:has-text("passager"), button:has-text("enger")',
      summaryPrice: '.price, [class*="price"], [class*="Price"], span:has-text("€")',
      distanceDisplay: 'span:has-text("km"), div:has-text("km")'
    };
  }

  async openDirectUrl(url) {
    await this.navigate(url);
    await this.page.waitForTimeout(3000);
    await this.clearOverlays();
  }

  async waitForVehicles(timeout = 12000) {
    await this.clearOverlays();
    try {
      await this.page.waitForSelector(
        'button:has-text("Choisir"), button:has-text("Select"), button:has-text("Réserver"), button:has-text("Retour"), .vehicle-card, .MuiCard-root, header + div',
        { timeout }
      );
      return true;
    } catch (e) {
      return false;
    }
  }

  async selectFirstAvailableVehicle() {
    await this.clearOverlays();
    try {
      const btn = await this.page.waitForSelector(
        'button:has-text("Choisir"), button:has-text("Select"), button:has-text("Réserver")',
        { timeout: 8000 }
      );
      if (btn) {
        await btn.click();
        await this.page.waitForTimeout(1500);
        await this.clearOverlays();
        return true;
      }
    } catch (e) {
      // Étape suivante automatique ou bouton non cliquable
    }
    return false;
  }

  /**
   * Inspection fine du bandeau horizontal de réservation à 960px
   * Mesure l'écrasement des conteneurs Flexbox et identifie la troncature.
   */
  async inspectHorizontalBarAt960px() {
    await this.clearOverlays();
    return await this.page.evaluate(() => {
      const dateInput = document.querySelector('input[placeholder*="dd/mm"], input[value*="05/09"], input[value*="/20"]');
      let clip = { x: 0, y: 0, width: 960, height: 260 };
      let dateWidth = 0;
      let passengerText = '';
      let isTruncated = false;

      if (dateInput) {
        const dateRect = dateInput.getBoundingClientRect();
        dateWidth = Math.round(dateRect.width);

        let parent = dateInput.parentElement;
        while (parent && parent.tagName !== 'BODY') {
          const rect = parent.getBoundingClientRect();
          if (rect.width >= 750 && rect.height <= 260 && rect.height >= 45) {
            clip = {
              x: Math.max(0, Math.floor(rect.x)),
              y: Math.max(0, Math.floor(rect.y)),
              width: Math.min(960, Math.ceil(rect.width)),
              height: Math.ceil(rect.height)
            };
            break;
          }
          parent = parent.parentElement;
        }
      }

      const passBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent.includes('passager') || b.textContent.includes('enger')
      );
      if (passBtn) {
        passengerText = passBtn.textContent.trim();
        if (passengerText.includes('enger') || dateWidth < 130) {
          isTruncated = true;
        }
      }

      return { clip, dateWidth, passengerText, isTruncated };
    });
  }

  /**
   * Récupère les informations de tarification et de distance calculées par la plateforme
   */
  async getPricingAndRouteSummary() {
    return await this.page.evaluate(() => {
      const bodyText = document.body.innerText;
      const prices = [];
      const priceRegex = /(\d+[,.]\d{2})\s*€/g;
      let match;
      while ((match = priceRegex.exec(bodyText)) !== null) {
        prices.push(match[1]);
      }
      return {
        url: window.location.href,
        hasZeroKm: bodyText.includes('0 km') || bodyText.includes('0km'),
        prices: prices.slice(0, 5)
      };
    });
  }
}

module.exports = BookingPage;
