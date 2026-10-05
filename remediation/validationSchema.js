/**
 * Schéma de Validation Métier & Résilience Tunnel Ozeroute
 * Remédiation de la Faille Logique Métier (Réf: Rapport Chapitre 4.2)
 * Auteur : Amenallah JERBI - Élève-Ingénieur ESPRIT (REM4U SARL)
 * 
 * Implémente la validation stricte des itinéraires et prévient la tarification
 * de courses aberrantes (départ = arrivée ou distance nulle).
 */

class RouteValidationError extends Error {
  constructor(message, field = 'route') {
    super(message);
    this.name = 'RouteValidationError';
    this.field = field;
  }
}

/**
 * Validateur fonctionnel d'itinéraire
 * @param {object} params
 * @param {string} params.departure - Adresse ou libellé de départ
 * @param {string} params.destination - Adresse ou libellé d'arrivée
 * @param {number} [params.distanceKm] - Distance calculée par le service cartographique
 * @param {number} params.adults - Nombre d'adultes
 */
function validateBookingRequest({ departure, destination, distanceKm = null, adults = 1 }) {
  const errors = [];

  // 1. Contrôle de présence des adresses
  if (!departure || !departure.trim()) {
    errors.push({ field: 'departure', message: "Le point de départ est obligatoire." });
  }
  if (!destination || !destination.trim()) {
    errors.push({ field: 'destination', message: "Le point de destination est obligatoire." });
  }

  // 2. Remédiation Faille 0 km (Orly -> Orly)
  if (departure && destination) {
    const cleanDep = departure.trim().toLowerCase();
    const cleanDest = destination.trim().toLowerCase();
    
    if (cleanDep === cleanDest || cleanDep.includes(cleanDest) || cleanDest.includes(cleanDep)) {
      errors.push({
        field: 'route',
        code: 'ERR_IDENTICAL_LOCATIONS',
        message: "L'adresse de départ et de destination ne peuvent pas être identiques."
      });
    }
  }

  // 3. Contrôle distance métrique minimale
  if (distanceKm !== null && distanceKm <= 0.5) {
    errors.push({
      field: 'distance',
      code: 'ERR_MINIMUM_DISTANCE_NOT_REACHED',
      message: "La distance minimale pour un transfert privé ou navette doit être supérieure à 1 km."
    });
  }

  // 4. Contrôle passagers & correction de la faute de français UI ("Faut avoir au moin un adulte")
  if (typeof adults !== 'number' || adults < 1) {
    errors.push({
      field: 'passengers',
      code: 'ERR_MINIMUM_ADULT_REQUIRED',
      message: "La réservation doit comporter au moins un passager adulte."
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateBookingRequest,
  RouteValidationError
};
