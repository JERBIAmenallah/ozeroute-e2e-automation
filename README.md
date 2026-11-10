# Ozeroute QA — Système d'Automatisation E2E Modulaire, Audits & Remédiations

> **Projet de Stage d'Immersion en Entreprise — ESPRIT (2025 - 2026)**  
> **Élève-Ingénieur :** Amenallah JERBI (`201JMT0157`) — Spécialisation Informatique  
> **Entreprise d'Accueil :** REM4U SARL (Tunis)  
> **Plateforme Cible :** [Ozeroute](https://www.ozeroute.com) (Mobilité & Transferts Aéroportuaires)  
> **Encadrant Technique :** Wael Jlassi (Pôle Technique REM4U)  
> **Lien du Dépôt :** [https://github.com/JERBIAmenallah/ozeroute-e2e-automation](https://github.com/JERBIAmenallah/ozeroute-e2e-automation)

---

## 1. Contexte & Problématique Métier

Dans le cadre de la fiabilisation du tunnel de vente de la plateforme **Ozeroute**, ce projet d'ingénierie implémente une solution industrielle de validation continue et d'audit automatisé basée sur **Playwright** et **Node.js**.

La plateforme présentait initialement une couverture de validation exclusivement manuelle, générant des risques critiques de régressions lors des déploiements continus et limitant le taux de conversion sur le tunnel d'achat.

Pour répondre à cette problématique, la solution développée repose sur une architecture **Data-Driven Testing** couplée au pattern **Page Object Model (POM)**, enrichie de modules d'interception réseau, de tests API REST, de télémétrie de performance et d'intégration continue sous **GitHub Actions** et **Docker**.

---

## 2. Correspondance avec le Rapport de Stage

Ce dépôt constitue le livrable technique complet formalisé dans le **Rapport de Stage d'Immersion** :

| Chapitre du Rapport | Composant Technique dans le Dépôt | Description & Objectif |
| :--- | :--- | :--- |
| **Chapitre 1 & 2.1** | `tests/api.test.js`, `benchmark.js` | Couverture des modules de la plateforme : Transferts (`/`), International (`/en`), Chauffeur Horaire (`/mise-a-disposition`), Visites (`/excursions`) et Suivi Client (`mytrip.ozeroute.com`). |
| **Chapitre 2.1 & 3.1** | `pages/`, `config/scenarios.json` | Spécification et automatisation des 4 parcours nominaux E2E jusqu'au Checkout `/booking` (Transfert Privé CDG + modale *Bagages Transportés*, Deep Link BVA-Disneyland, Navette + sélection Terminal, Multilingue `/en`). |
| **Chapitre 2.2** | `runner.js` (`audit_faille_metier_0km`) | Détection et capture de la faille logique métier : trajet 0 km Orly-Orly facturé à 31,25 € (`Berline Eco`). |
| **Chapitre 2.3** | `runner.js` (`audit_responsive_960px`) | Audit d'ergonomie et non-régression responsive à 960px sur le bandeau supérieur de recherche. |
| **Chapitre 2.4** | `runner.js` (`audit_console_elfsight`) | Surveillance console et vérification de la section Preuve Sociale / Avis Google Reviews. |
| **Chapitre 2.5** | `runner.js` (`audit_reseau_promo_404`) | Gestion multi-passagers (Adultes/Enfant/Bébé), vérification des modules `/mise-a-disposition` et `/excursions`, et interception des requêtes HTTP 404 sur `/v1/common/promo`. |
| **Chapitre 2.6** | `runner.js` (`audit_validation_typo_ui`) | Détection du défaut de qualité UI en production (*"Faut avoir au moin un adulte"*). |
| **Chapitre 3.3** | `pages/BasePage.js`, `config/ozeroute.config.js` | Neutralisation d'Axeptio, désactivation propre de la modale promo asynchrone (`ozr_promo_popup_minimized`) sans altérer le Virtual DOM React, et résilience face au blocage de Stripe Radar (`r.stripe.com`). |
| **Chapitre 3.4 & 3.5** | `benchmark.js`, `reports/rapport_console.txt` | Moteur de télémétrie et de benchmark de performance (TTFB, DOMContentLoaded, volumétrie réseau). |
| **Chapitre 3.6** | `.github/workflows/playwright.yml`, `Dockerfile` | Pipeline d'Intégration Continue (CI/CD) automatisée sous GitHub Actions et conteneurisation Docker. |
| **Chapitre 4.2** | `remediation/validationSchema.js` | Implémentation du schéma de validation Zod/Yup pour interdire les trajets aberrants < 1 km. |
| **Chapitre 4.3** | `remediation/responsive-patch.css` | Patch CSS Flexbox résolvant l'écrasement des composants sur breakpoint tablette 960px. |
| **Chapitre 4.4** | `remediation/reviews-service.js` | Architecture de secours avec cache ISR pour éliminer la dépendance bloquante au widget tiers. |

---

## 3. Architecture du Projet

```text
├── .github/
│   └── workflows/
│       └── playwright.yml      # Pipeline CI/CD GitHub Actions (exécute tests, API, benchmark)
├── config/
│   ├── ozeroute.config.js      # Configuration globale (viewports, cookies Axeptio, règles réseau)
│   └── scenarios.json          # Référentiel Data-Driven (10 scénarios : nominaux & audits d'anomalies)
├── pages/                      # Pattern Page Object Model (POM)
│   ├── BasePage.js             # Méthodes communes (navigation, cookies, neutralisation des modales)
│   ├── HomePage.js             # Formulaire d'accueil (adresses, dates, passagers, validation)
│   ├── BookingPage.js          # Cartes de véhicules, stepper et inspection responsive à 960px
│   └── CheckoutPage.js         # Tunnel de checkout, récapitulatif et intégration Stripe
├── remediation/                # Solutions logicielles correctives (Chapitre 4 du rapport)
│   ├── validationSchema.js     # Validateur Zod/Yup anti-0km et cohérence des itinéraires
│   ├── responsive-patch.css    # Correctif CSS Flexbox pour les résolutions intermédiaires
│   └── reviews-service.js      # Service résilient avec cache ISR pour les avis clients
├── tests/
│   └── api.test.js             # Suite de tests d'intégration API REST (endpoints backend)
├── utils/
│   ├── logger.js               # Journalisation horodatée console et fichier (execution.log)
│   └── reporter.js             # Générateur du rapport HTML interactif et synthèse JSON
├── reports/                    # Artefacts d'exécution générés automatiquement
│   ├── report.html             # Dashboard interactif avec statuts, durées et screenshots
│   ├── summary.json            # Métriques brutes de test au format JSON
│   ├── rapport_console.txt     # Bilan de télémétrie de performance et temps de chargement
│   └── execution.log           # Trace d'exécution détaillée
├── screenshots/                # Captures d'écran et preuves d'audit certifiées
├── runner.js                   # Moteur d'orchestration Master Playwright Data-Driven
├── benchmark.js                # Moteur de télémétrie de performance et Web Vitals
├── Dockerfile                  # Image Docker officielle Playwright pour exécution hermétique
├── docker-compose.yml          # Orchestration multi-conteneurs
└── package.json                # Dépendances npm et scripts de lancement
```

---

## 4. Prérequis et Installation

- **Node.js :** Version 18.0 ou supérieure recommandée
- **Navigateur :** Microsoft Edge ou Chromium natif
- *(Optionnel)* **Docker & Docker-Compose :** Pour l'exécution en conteneur isolé

```bash
# 1. Cloner le projet
git clone https://github.com/JERBIAmenallah/ozeroute-e2e-automation.git
cd ozeroute-e2e-automation

# 2. Installer les dépendances
npm install

# 3. Installer les navigateurs Playwright (si non préinstallés)
npx playwright install chromium
```

---

## 5. Commandes d'Exécution

Le projet propose des scripts prêts à l'emploi via `package.json` :

```bash
# 1. Exécuter l'intégralité de la suite de tests E2E et audits d'anomalies
npm test

# 2. Exécuter uniquement le parcours nominal (Paris Gare de Lyon -> CDG)
npm run test:nominal

# 3. Exécuter le test d'accès direct référencé (Google / Deep Link)
npm run test:deeplink

# 4. Exécuter le parcours Aller-Retour avec date de reprise
npm run test:roundtrip

# 5. Exécuter le parcours internationalisé en anglais (/en)
npm run test:multilang

# 6. Exécuter l'audit de reproduction de la faille métier 0 km (Orly -> Orly)
npm run test:anomalies

# 7. Exécuter les tests d'intégration des endpoints API REST
npm run test:api

# 8. Lancer le moteur de télémétrie et de benchmark de performance
npm run benchmark

# 9. Ouvrir le rapport HTML interactif généré
npm run report:open
```

### Exécution ciblée via le Runner :

```bash
# Lancer un scénario spécifique par son ID
node runner.js --scenario=audit_responsive_960px
node runner.js --scenario=resilience_stripe_radar
```

---

## 6. Exécution Conteneurisée (Docker)

Pour garantir une exécution hermétique identique à l'environnement de production :

```bash
# Construire et exécuter la suite dans un conteneur Playwright
docker-compose up --build
```

Les rapports et captures d'écran sont automatiquement synchronisés dans les dossiers locaux `./reports` et `./screenshots`.

---

## 7. Pipeline CI/CD (GitHub Actions)

Le workflow `.github/workflows/playwright.yml` est déclenché automatiquement à chaque `push` et `pull_request` sur la branche `main` :
1. Mise en place de l'environnement Node.js 20 et cache des dépendances.
2. Installation des dépendances système et du navigateur Chromium.
3. Exécution de la suite E2E complète (`runner.js --all`).
4. Exécution des tests d'intégration API (`tests/api.test.js`).
5. Exécution du benchmark de performance (`benchmark.js`).
6. Archivage automatique des rapports HTML et captures d'écran en tant qu'artefacts téléchargeables (rétention 14 jours).

---

## 8. Synthèse des Résultats & Télémétrie

À chaque exécution :
- Un **dashboard visuel interactif** est mis à jour dans [`reports/report.html`](./reports/report.html).
- Une **synthèse JSON complète** est générée dans [`reports/summary.json`](./reports/summary.json).
- Les **temps de réponse et Core Web Vitals** sont consignés dans [`reports/rapport_console.txt`](./reports/rapport_console.txt).
