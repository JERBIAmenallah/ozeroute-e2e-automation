const BasePage = require('./BasePage');

/**
 * BookingPage - Page Object pour la page de réservation et sélection des véhicules
 * Gère les offres de navettes/berlines et la sélection de véhicule.
 * Auteur : Amenallah JERBI - REM4U SARL / ESPRIT
 */
class BookingPage extends BasePage {
  constructor(page, context, config) {
    super(page, context, config);

    this.selectors = {
      vehicleCards: '.vehicle-card, [class*="VehicleCard"], .MuiCard-root',
      selectButtons: 'button:has-text("Choisir"), button:has-text("Select"), button:has-text("Réserver"), button:has-text("Retour")',
      searchSummaryBar: '.search-horizontal-bar, [class*="SearchBar"], header + div form',
      dateDisplay: 'input[placeholder*="dd/mm"], input[value*="/20"]',
      priceElement: '.price, [class*="price"], [class*="Price"]'
    };
  }

  /**
   * Ouvre directement une URL de réservation avec paramètres
   */
  async openDirectUrl(url) {
    await this.navigate(url);
    await this.page.waitForTimeout(2500);
    await this.clearOverlays();
  }

  /**
   * Attend le chargement de la liste des véhicules disponibles
   */
  async waitForVehicles(timeout = 10000) {
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

  /**
   * Sélectionne la première offre de véhicule disponible
   */
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
      // Bouton non interactif ou étape suivante automatique
    }
    return false;
  }

  /**
   * Vérifie la présence des éléments de réservation sur la page
   */
  async isReservationLoaded() {
    const url = this.page.url();
    return url.includes('reservation');
  }
}

module.exports = BookingPage;
