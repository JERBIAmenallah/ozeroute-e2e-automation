# Ozeroute — Suite de Tests Automatisés E2E (Playwright)

> **Projet de Stage d'Immersion en Entreprise — ESPRIT (2025 - 2026)**  
> **Élève-Ingénieur :** Amenallah JERBI (`201JMT0157`)  
> **Entreprise d'Accueil :** REM4U SARL (Tunis)  
> **Plateforme Cible :** [Ozeroute](https://www.ozeroute.com) (Mobilité & Transferts Aéroportuaires)  
> **Encadrant Entreprise :** Wael (Pôle Technique REM4U)

---

## 1. Contexte & Objectifs

Dans le cadre du projet de validation continue de la plateforme **Ozeroute**, ce projet met en place une suite de tests End-to-End (E2E) automatisés à l'aide de **Playwright** et **Node.js**.

L'objectif principal est de sécuriser le tunnel de réservation (sélection du trajet, affichage des offres de véhicules, saisie des informations) et de prévenir les régressions fonctionnelles lors des futures évolutions de la plateforme.

Le projet est conçu selon deux principes majeurs :
1. **Page Object Model (POM)** : Séparation claire entre les sélecteurs / interactions de pages et les scénarios de test pour faciliter la maintenance.
2. **Architecture Data-Driven** : Centralisation des scénarios dans un fichier de configuration (`scenarios.json`), permettant d'ajouter ou ajuster des cas de test sans modifier le code source du moteur d'exécution.

---

## 2. Structure du Projet

```text
├── config/
│   ├── ozeroute.config.js      # Configuration globale (URL de base, viewports, cookies Axeptio, timeouts)
│   └── scenarios.json          # Référentiel des scénarios de test (adresses, options, langues)
├── pages/                      # Classes Page Object Model (POM)
│   ├── BasePage.js             # Classe de base (méthodes communes, gestion des cookies et overlays)
│   ├── HomePage.js             # Formulaire d'accueil (départ, destination, passagers, recherche)
│   ├── BookingPage.js          # Affichage des offres, sélection de véhicules et bandeau de recherche
│   └── CheckoutPage.js         # Écran de récapitulatif et finalisation de commande
├── utils/
│   ├── logger.js               # Journalisation horodatée (console et fichier execution.log)
│   └── reporter.js             # Génération automatique du rapport HTML et du fichier JSON
├── reports/                    # Résultats d'exécution générés automatiquement
│   ├── report.html             # Rapport de synthèse visuel
│   ├── summary.json            # Statistiques d'exécution au format JSON
│   └── execution.log           # Fichier de journalisation
├── screenshots/                # Captures d'écran prises au cours des tests
├── runner.js                   # Moteur d'exécution et orchestration des tests Playwright
└── package.json                # Dépendances npm et scripts de lancement
```

---

## 3. Prérequis et Installation

- **Node.js** : Version 18 ou supérieure recommandée.
- **Navigateur** : Microsoft Edge ou Chromium.

```bash
# 1. Cloner le projet ou extraire le dossier
cd "Stage projet"

# 2. Installer les dépendances
npm install
```

---

## 4. Exécution des Tests

Plusieurs scripts npm sont disponibles pour lancer l'ensemble des scénarios ou un test spécifique :

```bash
# Exécuter l'ensemble de la suite de tests
npm test

# Exécuter uniquement le parcours nominal (Paris -> Aéroport CDG)
npm run test:nominal

# Tester la validation des champs obligatoires (formulaire vide)
npm run test:validation

# Tester la gestion du compteur de passagers
npm run test:passengers

# Tester l'accès direct via URL paramétrée
npm run test:direct

# Tester la version en langue anglaise
npm run test:multilang

# Tester l'affichage sous format tablette
npm run test:responsive

# Ouvrir le dernier rapport HTML généré
npm run report:open
```

Il est également possible d'exécuter un scénario spécifique directement avec Node :

```bash
node runner.js --scenario=parcours_nominal
```

---

## 5. Ajouter un Nouveau Scénario de Test

Grâce à la structure pilotée par les données, un nouveau scénario s'ajoute simplement dans `config/scenarios.json` :

```json
{
  "id": "parcours_orly_paris",
  "category": "E2E_NOMINAL",
  "name": "Réservation Navette Orly vers Paris Centre",
  "description": "Validation du parcours de transfert depuis l'aéroport d'Orly vers Paris",
  "active": true,
  "locale": "fr",
  "viewport": "desktop",
  "route": {
    "from": "Aéroport de Paris-Orly",
    "to": "Paris Bastille"
  },
  "passengers": { "adults": 1, "children": 0 }
}
```

---

## 6. Rapports d'Exécution

À la fin de chaque exécution, le framework génère automatiquement :
- Un **rapport HTML interactif** (`reports/report.html`) présentant la liste des tests, leur statut (PASS/FAIL), la durée et les captures d'écran associées.
- Un **fichier JSON** (`reports/summary.json`) contenant les métriques complètes.
- Un **fichier de log** (`reports/execution.log`) traçant chaque étape avec horodatage.
