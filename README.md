# Tests automatisés Ozeroute (Playwright)

Ce projet contient les scripts Playwright pour tester automatiquement le site [Ozeroute](https://www.ozeroute.com) de bout en bout (recherche de trajet, choix du véhicule, popup bagages, formulaire `/booking`, nouvelles pages `Excursions`, `Mise à disposition` et `Mon Trajet`).

Par défaut, quand on lance les tests sur PC, **le navigateur Chrome s'ouvre devant nous** (`headless: false`) et on voit le script remplir les champs et cliquer étape par étape.

---

## Comment lancer les tests

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer tous les tests (ouvre le navigateur devant vous)
npm test

# 3. Ou lancer un test précis en direct :
npm run test:nominal         # Réservation Transfert Privé (Gare de Lyon -> CDG -> /booking)
npm run test:mise-a-dispo    # Test Mise à disposition + bug prix 1€ dans l'URL
npm run test:excursions      # Test nouvelle page Excursions (/excursions/versailles)
npm run test:security        # Vérification API (CORS, headers et pub Stripe)
npm run test:api             # Test rapide des réponses HTTP / API

# 4. Ouvrir le rapport HTML avec les captures d'écran
npm run report:open
```

---

## Ce que fait le script (les 10 tests dans `config/scenarios.json`)

1. **Réservation Transfert Privé (`parcours_nominal_cdg`) :**
    Tape `Gare de Lyon` et `Charles de Gaulle`, choisit la date et 2 adultes, clique sur `Transfert privé`, valide la popup `"Bagages Transportés"`, arrive sur `/booking` (`62,50 €`) et remplit le formulaire client.
2. **Lien direct Google (`parcours_acces_deeplink`) :**
    Ouvre directement un lien de recherche `Beauvais -> Disneyland` et vérifie que les voitures s'affichent bien.
3. **Navette Économique + Terminal 1 (`parcours_aller_retour`) :**
    Choisit une navette partagée (`57,80 €`), sélectionne `Terminal 1` sur la page `/booking` et remplit les infos passager.
4. **Version Anglaise (`parcours_multilingue_en`) :**
    Passe le site en anglais (`/en`) et vérifie que la recherche fonctionne (`Economy Shuttle` / `Private transfer`).
5. **Nouvelle page Excursions (`parcours_excursion_versailles`) :**
    Va sur `/excursions/versailles`, clique sur `Réserver cette excursion` et remplit le formulaire de demande (`190 €`).
6. **Bug sur Mise à disposition (`audit_bug_mise_a_disposition`) :**
   - Sur `/booking?q=...&offer=...`, tout le détail de l'offre (avec les prix) est passé dans l'URL en Base64 (`offer=`). Si on change le prix dans le Base64 de l'URL (`prices["3H"] = 1`), la page `/booking` affiche directement **`Prix total : 1,00 €`** au lieu de `160,00 €`.
   - En plus, dans la réponse de l'API `/v1/common/privates`, le tarif **11H (`587 €`)** et le tarif **12H (`587 €`)** sont identiques (la 12ème heure n'est pas comptée).
7. **Bug même adresse départ et arrivée (`audit_faille_metier_0km`) :**
    Si on met `Aéroport de Paris-Orly` en départ et `Aéroport de Paris-Orly` en arrivée (0 km), le site accepte et propose une voiture à **`31,25 €`**.
8. **Validation passagers (`audit_validation_typo_ui`) :**
    Vérifie que le formulaire bloque quand il y a 0 adulte (avec le message `"Faut avoir au moin un adulte"` où il manque un `s`, et un appel `404` sur `/v1/common/promo`).
9. **Tarif groupe + Mon Trajet (`parcours_groupe_et_mytrip`) :**
    Teste une recherche pour `2 adultes + 1 enfant + 1 bébé`, puis teste la vérification d'un numéro de réservation sur `https://mytrip.ozeroute.com`.
10. **Vérification API & Sécurité (`audit_securite_api_cors`) :**
   - `api.ozeroute.com` accepte n'importe quel domaine dans `Origin` (CORS) avec `Access-Control-Allow-Credentials: true`.
   - Les nouveaux sous-domaines `mytrip.ozeroute.com` et `partner.ozeroute.com` n'ont pas les headers de sécurité (`X-Frame-Options`, `CSP`, `HSTS`) qui sont pourtant bien mis sur `www.ozeroute.com`.

---

## Organisation des fichiers

- `runner.js` : script principal qui lance les tests.
- `config/` : configuration du navigateur (`ozeroute.config.js`) et liste des tests (`scenarios.json`).
- `pages/` : actions sur chaque page (`HomePage.js`, `BookingPage.js`, `CheckoutPage.js`, `BasePage.js`).
- `tests/api.test.js` : vérification rapide des pages et de l'API.
- `reports/report.html` : rapport visuel généré à la fin avec toutes les captures d'écran (`screenshots/`).
