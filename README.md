# Ozeroute — Tests E2E Playwright & Audit Technique

Suite de tests End-to-End automatisés sous **Playwright (Node.js)** pour tester le tunnel de réservation d'[Ozeroute](https://www.ozeroute.com), les nouveaux modules (`Excursions`, `Mise à disposition`, `Mon Trajet`) et vérifier la sécurité des endpoints API.

Par défaut en local, les tests se lancent en **mode visuel (`headless: false`)** avec un indicateur d'étape à l'écran et un encadrement des champs cliqués, pour voir le navigateur effectuer chaque action en direct comme un testeur manuel.

---

## 1. Ce qui est testé dans la suite (`config/scenarios.json`)

1. **`parcours_nominal_cdg` (Transfert Privé E2E) :**
   - Recherche `Gare de Lyon ➔ Paris-CDG` via Google Places Autocomplete, sélection de la date (`J+4`) et de `2 Adultes`.
   - Passage sur l'onglet `Transfert privé`, clic sur `Choisir`, validation de la modale **`"Bagages Transportés"`**, arrivée sur `/booking` (`62,50 €`) et remplissage du formulaire passager + CGV.
2. **`parcours_acces_deeplink` (Accès direct lien Google / Deep Link) :**
   - Ouverture directe d'un lien de recherche pré-rempli (`Beauvais BVA ➔ Disneyland Paris`) et vérification de l'affichage des offres.
3. **`parcours_aller_retour` (Navette Économique & Terminal) :**
   - Recherche `Beauvais ➔ Disneyland`, sélection d'une `Navette Économique` (`57,80 €`), sélection de l'arrêt **`Terminal 1`** sur `/booking` et validation des coordonnées.
4. **`parcours_multilingue_en` (Version Anglaise `/en`) :**
   - Changement de langue via le menu du header (`FR ➔ English`) et test complet du formulaire en anglais (`Economy Shuttle` / `Private transfer`).
5. **`parcours_excursion_versailles` (Nouveau module `/excursions`) :**
   - Navigation vers `/excursions/versailles` (*Château de Versailles*), clic sur **`Réserver cette excursion`** et remplissage du tiroir de demande de réservation (`190 €`).
6. **`audit_bug_mise_a_disposition` (Faille & Bug Tarifaire sur `/mise-a-disposition` ➔ `/booking`) :**
   - Test de bout en bout sur la nouvelle page `/mise-a-disposition` (`Gare de Lyon ➔ Tour Eiffel`), sélection d'une `Berline Eco (3)` (`160,00 €` pour `3H`) et arrivée sur `/booking`.
   - **Faille & Bugs identifiés :**
     1. **Manipulation de prix côté client (CWE-472) :** Sur `/booking?q=...&offer=...`, tout l'objet de l'offre sélectionnée (y compris la grille tarifaire `prices` et `price.total.value`) est passé dans le paramètre d'URL `offer=` encodé en Base64 **sans signature cryptographique**. En modifiant `prices["3H"] = 1` dans le Base64 de l'URL, la page `/booking` affiche directement **`Prix total : 1,00 €`** au lieu de `160,00 €`.
     2. **Bug de calcul tarifaire (11H = 12H) :** Dans la réponse de `POST /v1/common/privates`, les paliers `11H` (`587 €`) et `12H` (`587 €`) ont exactement le même prix (la 12ème heure n'est pas facturée), et la requête envoie `"campaign_code": "undefined"`.
7. **`audit_faille_metier_0km` (Trajet identique `Orly ➔ Orly` à 0 km) :**
   - Saisie de la même adresse en départ et en destination (`Aéroport de Paris-Orly ➔ Aéroport de Paris-Orly`) : le système accepte la recherche et propose une `Berline Eco` facturée `31,25 €`.
8. **`audit_validation_typo_ui` (Validation formulaire & appel 404) :**
   - Soumission avec 0 adulte : vérification du blocage de sécurité et capture du message `"Faut avoir au moin un adulte"` ainsi que de l'appel en 404 sur `https://api.ozeroute.com/v1/common/promo`.
9. **`parcours_groupe_et_mytrip` (Tarif groupe & Espace `Mon Trajet`) :**
   - Test multi-passagers (`2 Adultes + 1 Enfant + 1 Bébé` avec remise groupe `-12%`) puis vérification de la recherche de réservation sur `https://mytrip.ozeroute.com` (`POST /v1/common/orders/exists`).
10. **`audit_securite_api_cors` (Audit Sécurité API & Sous-domaines) :**
    - Vérification de la configuration CORS sur `https://api.ozeroute.com` (qui reflète actuellement n'importe quel header `Origin` externe avec `Access-Control-Allow-Credentials: true`).
    - Vérification des headers de sécurité (`X-Frame-Options`, `Content-Security-Policy`, `Strict-Transport-Security`) présents sur `www.ozeroute.com` mais manquants sur les nouveaux sous-domaines `mytrip.ozeroute.com` et `partner.ozeroute.com`.
    - Test de résilience du Checkout `/booking` lorsque `r.stripe.com` (Stripe Radar) est bloqué par un bloqueur de publicité.

---

## 2. Structure du projet

```text
├── config/
│   ├── ozeroute.config.js      # URLs, options navigateur (headed/headless), cookies Axeptio
│   └── scenarios.json          # Liste des 10 scénarios configurables
├── pages/
│   ├── BasePage.js             # Navigation, neutralisation promo (ozr_promo_popup_minimized) & indicateur visuel
│   ├── HomePage.js             # Saisie Google Places, dates, passagers, changement de langue
│   ├── BookingPage.js          # Attente des offres, changement d'onglet, popup "Bagages Transportés"
│   └── CheckoutPage.js         # Formulaire /booking (passager, choix Terminal, CGV)
├── tests/
│   └── api.test.js             # Tests HTTP/SSR, API et vérification des headers de sécurité / CORS
├── utils/
│   ├── logger.js               # Logs console et fichier
│   └── reporter.js             # Génération du rapport HTML (reports/report.html) et JSON
├── reports/                    # Rapports générés après exécution
├── screenshots/                # Captures d'écran prises pendant les tests
├── runner.js                   # Script principal d'exécution Playwright
└── benchmark.js                # Mesure des temps de chargement (TTFB, DOMContentLoaded)
```

---

## 3. Installation & Exécution

```bash
# Installer les dépendances
npm install

# Lancer tous les tests en mode VISUEL (ouvre le navigateur devant vous)
npm test

# Lancer un seul scénario en direct (ex: Transfert privé, Excursions, ou Bug Mise à disposition)
npm run test:nominal
npm run test:excursions
npm run test:mise-a-dispo
npm run test:security

# Lancer les tests API & vérification sécurité HTTP/CORS
npm run test:api

# Lancer les tests en arrière-plan (sans ouvrir la fenêtre)
npm run test:headless

# Ouvrir le rapport HTML avec toutes les captures
npm run report:open
```
