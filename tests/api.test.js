const assert = require('assert/strict');
const config = require('../config/ozeroute.config');

function futureDateTime(daysAhead = 5, time = '14:00') {
  const d = new Date(Date.now() + daysAhead * 86400000);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${time}`;
}

async function runApiTests() {
  console.log('\n==================================================');
  console.log('  TESTS API & DISPONIBILITÉ - OZEROUTE');
  console.log('==================================================\n');

  let hardFailures = 0;
  const anomalies = [];

  async function testStep(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
    } catch (err) {
      hardFailures++;
      console.error(`[FAIL] ${name} -> ${err.message}`);
    }
  }

  // 1. Disponibilité des pages + contrôle des headers de sécurité
  const pages = [
    { name: 'Accueil FR', url: `${config.baseUrl}/`, expectSecurityHeaders: true },
    { name: 'Accueil EN', url: `${config.baseUrl}/en`, expectSecurityHeaders: true },
    { name: 'Excursions', url: `${config.baseUrl}/excursions`, expectSecurityHeaders: true },
    { name: 'Mise à disposition', url: `${config.baseUrl}/mise-a-disposition`, expectSecurityHeaders: true },
    { name: 'Mon Trajet (mytrip)', url: config.myTripUrl, expectSecurityHeaders: false },
    { name: 'Portail Partenaires', url: config.partnerUrl, expectSecurityHeaders: false }
  ];

  for (const p of pages) {
    await testStep(`GET ${p.name} (${p.url})`, async () => {
      const res = await fetch(p.url, { redirect: 'follow' });
      assert.strictEqual(res.status, 200, `Statut HTTP inattendu : ${res.status}`);

      const xfo = res.headers.get('x-frame-options');
      const csp = res.headers.get('content-security-policy');
      const hsts = res.headers.get('strict-transport-security');

      if (p.expectSecurityHeaders) {
        assert.ok(xfo && hsts, `Headers manquants sur ${p.url}`);
      } else if (!xfo || !csp || !hsts) {
        anomalies.push(`Headers de sécurité absents sur ${p.url} (XFO=${xfo || 'absent'}, CSP=${csp ? 'ok' : 'absent'}, HSTS=${hsts ? 'ok' : 'absent'})`);
      }
    });
  }

  // 2. Test CORS sur api.ozeroute.com
  await testStep('CORS API (api.ozeroute.com/v1/activity_sites)', async () => {
    const res = await fetch(`${config.apiUrl}/v1/activity_sites?locale=fr`, {
      headers: { Origin: 'https://evil-external-site.com' }
    });
    assert.strictEqual(res.status, 200, `Statut HTTP ${res.status}`);
    const acao = res.headers.get('access-control-allow-origin');
    const acac = res.headers.get('access-control-allow-credentials');
    if (acao === 'https://evil-external-site.com' && acac === 'true') {
      anomalies.push('CORS permissif sur api.ozeroute.com : Origin arbitraire reflété avec Allow-Credentials=true');
    }
  });

  // 3. Promotions actives
  await testStep('GET /v1/common/promo/list?locale=fr', async () => {
    const res = await fetch(`${config.apiUrl}/v1/common/promo/list?locale=fr`);
    assert.strictEqual(res.status, 200, `Statut HTTP ${res.status}`);
    const data = await res.json();
    assert.ok(Array.isArray(data), 'La réponse JSON doit être un tableau');
  });

  // 4. Vérification référence commande sur Mon Trajet
  await testStep('POST /v1/common/orders/exists (référence inexistante)', async () => {
    const res = await fetch(`${config.apiUrl}/v1/common/orders/exists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'OZR-2026-TEST' })
    });
    assert.strictEqual(res.status, 200, `Statut HTTP ${res.status}`);
    const json = await res.json();
    assert.strictEqual(json.exist, false, `Réponse inattendue : ${JSON.stringify(json)}`);
  });

  // 5. Devis Navettes Économiques (Beauvais -> Disneyland Paris)
  const bva = {
    address: '60000 Tillé',
    name: 'Aéroport de Paris-Beauvais',
    place_id: 'ChIJr4nP5m9X5kcR3b8j1L5yK8Q',
    lat: 49.4544677,
    lng: 2.1115111,
    cp: '60000'
  };
  const dlp = {
    address: '77777 Chessy',
    name: 'Disneyland Paris',
    place_id: 'ChIJVVVVVVU55kcR1t7p8r-k1lQ',
    lat: 48.8673858,
    lng: 2.783593,
    cp: '77777'
  };

  await testStep('POST /v1/common/shuttles (Beauvais -> Disneyland, 2 adultes)', async () => {
    const res = await fetch(`${config.apiUrl}/v1/common/shuttles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provision: false,
        locale: 'fr',
        affiliate_id: '',
        campaign_code: '',
        passengers: [
          { type: { code: 'adult' }, number: 2 },
          { type: { code: 'infant' }, number: 0 },
          { type: { code: 'baby' }, number: 0 }
        ],
        dateTime: futureDateTime(5, '12:00'),
        from: bva,
        to: dlp
      })
    });
    assert.strictEqual(res.status, 200, `Statut HTTP ${res.status}`);
    const json = await res.json();
    assert.ok(Array.isArray(json.shuttle) && json.shuttle.length > 0, 'Aucune navette retournée');
    const firstPrice = json.shuttle[0]?.price?.total?.value;
    assert.ok(typeof firstPrice === 'number' && firstPrice > 0, `Tarif navette invalide : ${firstPrice}`);
  });

  // 6. Devis Transfert Privé nominal (Gare de Lyon -> Paris CDG)
  const gdl = {
    address: 'Pl. Louis-Armand, 75012 Paris',
    name: 'Gare de Lyon',
    place_id: 'ChIJS78AIBty5kcRZLsIMcKhPAA',
    lat: 48.8443038,
    lng: 2.3743773,
    cp: '75012'
  };
  const cdg = {
    address: '95700 Roissy-en-France',
    name: 'Paris Charles de Gaulle Airport',
    place_id: 'ChIJW89MjgM-5kcRLKZbL5jgKwQ',
    lat: 49.0078597,
    lng: 2.5507715,
    cp: ''
  };

  await testStep('POST /v1/common/privates (Gare de Lyon -> CDG, nominal)', async () => {
    const res = await fetch(`${config.apiUrl}/v1/common/privates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provision: false,
        locale: 'fr',
        affiliate_id: '',
        campaign_code: '',
        passengers: [
          { type: { code: 'adult' }, number: 2 },
          { type: { code: 'infant' }, number: 0 },
          { type: { code: 'baby' }, number: 0 }
        ],
        dateTime: futureDateTime(5, '14:00'),
        from: gdl,
        to: cdg
      })
    });
    assert.strictEqual(res.status, 200, `Statut HTTP ${res.status}`);
    const json = await res.json();
    assert.ok(Array.isArray(json.vtc) && json.vtc.length > 0, 'Aucun véhicule VTC retourné');
    const firstPrice = json.vtc[0]?.price?.total?.value;
    assert.ok(typeof firstPrice === 'number' && firstPrice > 0, `Tarif VTC invalide : ${firstPrice}`);
  });

  // 7. Mise à disposition (provision=true) : contrôle grille 11H vs 12H
  await testStep('POST /v1/common/privates (provision=true, contrôle 11H vs 12H)', async () => {
    const res = await fetch(`${config.apiUrl}/v1/common/privates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provision: true,
        locale: 'fr',
        affiliate_id: '',
        campaign_code: '',
        passengers: [{ type: { code: 'adult' }, number: 1 }],
        dateTime: futureDateTime(5, '14:00'),
        from: gdl,
        to: {
          address: '75007 Paris',
          name: 'Tour Eiffel',
          place_id: 'ChIJLU7jZClu5kcR4PcOOO6p3I0',
          lat: 48.8583701,
          lng: 2.2944813,
          cp: '75007'
        }
      })
    });
    assert.strictEqual(res.status, 200, `Statut HTTP ${res.status}`);
    const json = await res.json();
    assert.ok(Array.isArray(json.provision) && json.provision.length > 0, 'Offres mise à disposition vides');
    const brokenVehicles = json.provision
      .filter(o => o.prices && o.prices['11H'] && o.prices['11H'] === o.prices['12H'])
      .map(o => `${o.vehicle?.type} (${o.prices['11H']}€=${o.prices['12H']}€)`);
    if (brokenVehicles.length > 0) {
      anomalies.push(`Tarif Mise à disposition identique 11H=12H sur ${brokenVehicles.length} véhicule(s) : ${brokenVehicles.join(', ')}`);
    }
  });

  // 8. Test négatif métier : trajet identique Orly -> Orly (0 km)
  await testStep('POST /v1/common/privates (test négatif Orly -> Orly 0 km)', async () => {
    const orly = {
      address: '94390 Orly',
      name: 'Aéroport de Paris-Orly',
      place_id: 'ChIJd3k5K-lx5kcRkP2r2vZ8CwQ',
      lat: 48.7262433,
      lng: 2.3652472,
      cp: '94390'
    };
    const res = await fetch(`${config.apiUrl}/v1/common/privates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provision: false,
        locale: 'fr',
        affiliate_id: '',
        campaign_code: '',
        passengers: [{ type: { code: 'adult' }, number: 1 }],
        dateTime: futureDateTime(4, '14:00'),
        from: orly,
        to: orly
      })
    });
    assert.ok(res.status < 500, `Erreur serveur 5xx : ${res.status}`);
    const json = await res.json();
    if (res.status === 200 && Array.isArray(json.vtc) && json.vtc.length > 0) {
      const p = json.vtc[0]?.price?.total?.value;
      anomalies.push(`Trajet Orly -> Orly (0 km) accepté en 200 OK avec tarif ${p} €`);
    }
  });

  // 9. Test négatif payload incomplet : contrôle fuite message d'erreur PHP
  await testStep('POST /v1/common/privates (payload incomplet -> 4xx attendu)', async () => {
    const res = await fetch(`${config.apiUrl}/v1/common/privates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provision: false, locale: 'fr' })
    });
    assert.ok(res.status >= 400 && res.status < 500, `Code HTTP attendu 4xx, reçu ${res.status}`);
    const txt = await res.text();
    if (/Undefined array key|SQLSTATE|Stack trace/i.test(txt)) {
      anomalies.push(`Message d'erreur interne exposé sur 422 : ${txt.slice(0, 120)}`);
    }
  });

  console.log('\n--------------------------------------------------');
  console.log(`Anomalies détectées (${anomalies.length}) :`);
  anomalies.forEach((a, i) => console.log(`  [BUG ${i + 1}] ${a}`));
  console.log('--------------------------------------------------');

  if (hardFailures > 0) {
    console.error(`\n[RÉSULTAT] ${hardFailures} vérification(s) API en échec.\n`);
    process.exit(1);
  }
  console.log('\n[RÉSULTAT] Toutes les vérifications API sont terminées sans erreur critique d\'exécution.\n');
}

runApiTests().catch(err => {
  console.error(err);
  process.exit(1);
});
