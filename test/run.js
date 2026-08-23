/* =====================================================================
 * FamiTeam — Suite de tests de non-régression (Phase A)
 * ---------------------------------------------------------------------
 * Exécution : `node test/run.js`  (aucune dépendance externe).
 * Couvre : migrations (normaliser), garde-fous (etatNonVide / lierEtat),
 * crédit/décrédit de mission, plan « jours suivants », et écosystème
 * (prérequis, coûts, badges).
 * ===================================================================== */

const assert = require("assert");
const { construireContexte } = require("./harness");

let reussites = 0, echecs = 0;
const cas = [];
function test(nom, fn) { cas.push({ nom, fn }); }

// Petit enfant de test, isolé, avec toutes les structures attendues.
function enfantNeuf(api) {
  const e = api.etatVierge();
  return e.enfants[Object.keys(e.enfants)[0]];
}
function missionFamille(api) { return api.MISSIONS.find(m => m.cat === "famille"); }
function missionPlanete(api) { return api.MISSIONS.find(m => m.cat === "planete"); }
// Décale une date AAAA-MM-JJ de `n` jours (n négatif = dans le passé).
function decalerJour(cle, n) {
  const d = new Date(cle + "T00:00:00");
  d.setDate(d.getDate() + n);
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), j = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${j}`;
}

/* ---------- Garde-fous & migrations ---------- */
test("etatNonVide distingue un état vide d'un état peuplé", () => {
  const { api } = construireContexte();
  assert.strictEqual(api.etatNonVide(null), false);
  assert.strictEqual(api.etatNonVide({}), false);
  assert.strictEqual(api.etatNonVide({ enfants: {} }), false);
  assert.strictEqual(api.etatNonVide(api.etatVierge()), true);
});

test("lierEtat lie l'état à la famille active (anti inter-familles)", () => {
  const { api } = construireContexte();
  api.familleId = "famille-A";
  const e = api.etatVierge();
  api.lierEtat(e);
  assert.strictEqual(api.familleEtat, "famille-A");
  assert.strictEqual(api.etat, e);
});

test("normaliser complète un état minimal sans rien perdre", () => {
  const { api } = construireContexte();
  const brut = { enfants: { x: { prenom: "Zoé", coeurs: 7 } } };
  const n = api.normaliser(brut);
  assert.strictEqual(n.enfants.x.prenom, "Zoé");
  assert.strictEqual(n.enfants.x.coeurs, 7);
  assert.deepStrictEqual(Object.keys(n.enfants.x.ecosysteme).sort(), ["carnivores", "herbivores", "plantes"]);
  assert.strictEqual(n.enfants.x.gouttesTotal, 0);
  assert.ok(Array.isArray(n.enfants.x.enAttente));
  assert.ok(Array.isArray(n.enfants.x.badges));
  assert.strictEqual(n.version, api.ETAT_VERSION);
});

test("normaliser migre l'ancien format d'année de naissance", () => {
  const { api } = construireContexte();
  const n = api.normaliser({ enfants: { x: { naissance: 2018 } } });
  assert.strictEqual(n.enfants.x.naissance, "2018-01-01");
});

test("normaliser sur null renvoie un état vierge valide", () => {
  const { api } = construireContexte();
  const n = api.normaliser(null);
  assert.ok(api.etatNonVide(n));
  assert.strictEqual(n.version, api.ETAT_VERSION);
});

/* ---------- Validation de schéma (Phase B) ---------- */
test("etatValide accepte un état vierge et un état normalisé", () => {
  const { api } = construireContexte();
  assert.strictEqual(api.etatValide(api.etatVierge()).ok, true);
  assert.strictEqual(api.etatValide(api.normaliser({ enfants: { x: { prenom: "Z" } } })).ok, true);
});

test("etatValide rejette un état vide ou non-objet", () => {
  const { api } = construireContexte();
  assert.strictEqual(api.etatValide(null).ok, false);
  assert.strictEqual(api.etatValide({}).ok, false);
  assert.strictEqual(api.etatValide({ enfants: {} }).ok, false);
});

test("etatValide rejette des monnaies corrompues", () => {
  const { api } = construireContexte();
  const e = api.etatVierge();
  const id = Object.keys(e.enfants)[0];
  e.enfants[id].coeurs = -5;
  assert.strictEqual(api.etatValide(e).ok, false);
  const e2 = api.etatVierge();
  e2.enfants[Object.keys(e2.enfants)[0]].gouttes = NaN;
  assert.strictEqual(api.etatValide(e2).ok, false);
});

test("etatValide rejette des structures essentielles du mauvais type", () => {
  const { api } = construireContexte();
  const e = api.etatVierge();
  const id = Object.keys(e.enfants)[0];
  e.enfants[id].badges = "oops";
  assert.strictEqual(api.etatValide(e).ok, false);
});

/* ---------- Couche de données isolée : garde-fous d'écriture (Phase D) ---------- */
test("Store.ecritureAutorisee autorise un état lié, peuplé et valide", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  assert.strictEqual(api.Store.ecritureAutorisee().ok, true);
});

test("Store.ecritureAutorisee bloque un état d'une autre famille", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());   // familleEtat = f1
  api.familleId = "f2";             // on bascule de famille sans relier
  assert.strictEqual(api.Store.ecritureAutorisee().ok, false);
});

test("Store.ecritureAutorisee bloque un état vide", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat({ enfants: {} });
  assert.strictEqual(api.Store.ecritureAutorisee().ok, false);
});

test("Store.ecritureAutorisee bloque un état au schéma corrompu", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  const e = api.etatVierge();
  e.enfants[Object.keys(e.enfants)[0]].coeurs = -1;
  api.lierEtat(e);
  assert.strictEqual(api.Store.ecritureAutorisee().ok, false);
});

/* ---------- Synchro : conflit entre appareils hors ligne (garde-fou anti-écrasement) ----------
 * Deux appareils hors ligne modifient chacun leur propre copie (gouttes,
 * cœurs...), puis retrouvent une connexion : sans garde-fou, celui qui écrit
 * en second écrase entièrement l'autre, en silence — aucune goutte ni cœur
 * ne se fusionne jamais, c'est le bloc entier de la famille qui est remplacé. */
// Un vrai appel réseau rend la main à la boucle d'événements : sans cette
// pause, deux `sauver()` lancés ensemble s'exécuteraient l'un après l'autre
// dans le banc, et le test de chevauchement ne testerait rien.
const pauseReseau = () => new Promise(r => setImmediate(r));

function clientFactice(serveur) {
  const client = {
    enPanneLecture: false, enPanneEcriture: false,
    appels: { lectures: 0, ecritures: [] },
    from() {
      return {
        select() {
          return { eq() { return { async maybeSingle() {
            await pauseReseau();
            client.appels.lectures++;
            if (client.enPanneLecture) return { data: null, error: new Error("hors ligne") };
            // Copie profonde : un vrai aller-retour réseau ne renvoie jamais
            // la même référence mémoire que ce que l'appelant modifie ensuite.
            const copie = serveur.row ? JSON.parse(JSON.stringify(serveur.row)) : null;
            return { data: copie, error: null };
          } }; } };
        },
        async upsert(payload) {
          // La charge utile est figée AVANT la latence, comme le fait le vrai
          // client (le corps de la requête est sérialisé au moment de l'appel).
          // La figer après rendrait le banc plus sévère que la réalité.
          const envoye = JSON.parse(JSON.stringify(payload.data));
          await pauseReseau();
          if (client.enPanneEcriture) return { error: new Error("échec réseau") };
          client.appels.ecritures.push(payload);
          serveur.row = { data: envoye };
          // Crochet : simule l'utilisateur qui agit PENDANT l'aller-retour
          // réseau (un enfant qui coche la mission suivante).
          if (client.pendantEcriture) client.pendantEcriture();
          return { error: null };
        }
      };
    }
  };
  return client;
}

test("Store.sauver refuse d'écraser un état modifié par un autre appareil hors ligne", async () => {
  const { contexte, api } = construireContexte();
  const appelsToast = [];
  contexte.toast = (msg, type) => appelsToast.push({ msg, type });

  api.familleId = "f1";
  const local = api.etatVierge();
  local.maj = 1000;
  api.lierEtat(local);

  const serveur = { row: { data: { ...local, maj: 1000 } } };
  const client = clientFactice(serveur);
  api.Store.init(client);
  await api.Store.charger();   // établit la version serveur connue (1000)

  // Un AUTRE appareil, lui aussi hors ligne, a entretemps poussé sa propre
  // version (2000) — simulé directement côté « serveur », sans passer par
  // ce Store-ci (exactement ce qui se passerait avec deux téléphones).
  serveur.row = { data: { ...api.etatVierge(), maj: 2000 } };

  // Cet appareil-ci ajoute une goutte pendant qu'il était hors ligne, puis
  // tente de sauvegarder en retrouvant la connexion.
  const idEnfant = Object.keys(api.etat.enfants)[0];
  api.etat.enfants[idEnfant].gouttes += 1;
  api.etat.maj = 1500;

  const avant = client.appels.ecritures.length;
  await api.Store.sauver();

  assert.strictEqual(client.appels.ecritures.length, avant,
    "aucune écriture ne doit partir : le serveur a changé sous nos pieds");
  assert.strictEqual(serveur.row.data.maj, 2000, "la version de l'autre appareil doit rester intacte");
  assert.strictEqual(appelsToast.length, 1, "la famille doit être prévenue");
  assert.strictEqual(appelsToast[0].msg, api.I18N.fr["sync.conflit"]);
});

test("Store.sauver écrit normalement quand personne d'autre n'a modifié l'état", async () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  const local = api.etatVierge();
  local.maj = 1000;
  api.lierEtat(local);

  const serveur = { row: { data: { ...local, maj: 1000 } } };
  const client = clientFactice(serveur);
  api.Store.init(client);
  await api.Store.charger();

  api.etat.maj = 1200;
  await api.Store.sauver();
  assert.strictEqual(client.appels.ecritures.length, 1, "l'écriture doit partir");
  assert.strictEqual(serveur.row.data.maj, 1200);

  // Deuxième sauvegarde consécutive : ne doit pas être bloquée comme un faux
  // conflit — Store doit avoir retenu la version qu'il vient d'écrire.
  api.etat.maj = 1300;
  await api.Store.sauver();
  assert.strictEqual(client.appels.ecritures.length, 2, "la deuxième écriture doit partir aussi");
});

/* ---------- L'app et le site montraient deux états différents ----------
 * Constaté sur un téléphone : l'app affichait les missions du jour cochées,
 * le site (même famille, même enfant) les affichait vides. Deux causes
 * distinctes, testées ici séparément. */
test("horloges décalées : l'appareil en avance reçoit quand même ce que l'autre a coché", async () => {
  const { api } = construireContexte();
  api.familleId = "f1";

  // Cet appareil est à jour avec le serveur : rien n'attend d'être envoyé.
  const local = api.etatVierge();
  local.maj = 5000;                       // son horloge avance (5000)
  api.lierEtat(local);
  const serveur = { row: { data: JSON.parse(JSON.stringify(local)) } };
  const client = clientFactice(serveur);
  api.Store.init(client);
  await api.Store.charger();

  // L'autre appareil coche une mission. Son horloge, elle, retarde : il
  // écrit 4000 — un horodatage ANTÉRIEUR, alors que son contenu est le plus
  // récent. L'ancienne règle (« adopter seulement si maj distante > la
  // nôtre ») ne prenait alors jamais rien : l'écart devenait permanent.
  const autre = api.etatVierge();
  autre.maj = 4000;
  const idEnfant = Object.keys(autre.enfants)[0];
  autre.enfants[idEnfant].gouttes = 7;
  serveur.row = { data: autre };

  await api.Store.tirer();
  assert.strictEqual(api.etat.enfants[idEnfant].gouttes, 7,
    "sans rien à envoyer, le serveur fait foi — même horodaté avant nous");
});

test("modification non envoyée : tirer() ne l'écrase pas au profit du serveur", async () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  const local = api.etatVierge();
  local.maj = 1000;
  api.lierEtat(local);
  const serveur = { row: { data: JSON.parse(JSON.stringify(local)) } };
  const client = clientFactice(serveur);
  api.Store.init(client);
  await api.Store.charger();

  // Un geste local encore non synchronisé (l'enfant vient de cocher).
  const idEnfant = Object.keys(api.etat.enfants)[0];
  api.etat.enfants[idEnfant].gouttes = 3;
  api.etat.maj = 1500;
  // Le serveur, lui, porte une version PLUS ANCIENNE que la nôtre.
  const ancien = api.etatVierge();
  ancien.maj = 900;
  serveur.row = { data: ancien };

  await api.Store.tirer();
  assert.strictEqual(api.etat.enfants[idEnfant].gouttes, 3,
    "un geste non encore envoyé ne doit jamais être effacé par une lecture");
  assert.strictEqual(api.etat.maj, 1500, "notre version doit rester en place");
});

test("reprise : revenir au premier plan relit l'état et rouvre le canal temps réel", async () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  const local = api.etatVierge();
  local.maj = 1000;
  api.lierEtat(local);
  const serveur = { row: { data: JSON.parse(JSON.stringify(local)) } };
  const client = clientFactice(serveur);
  // Un canal temps réel gelé par la mise en veille ne rejoue rien : la
  // reprise doit en rouvrir un, sinon l'app reste sourde indéfiniment.
  let abonnements = 0;
  client.channel = () => ({ on() { return this; }, subscribe() { abonnements++; return this; } });
  client.removeChannel = () => {};
  api.Store.init(client);
  await api.Store.charger();

  const autre = api.etatVierge();
  autre.maj = 2000;
  const idEnfant = Object.keys(autre.enfants)[0];
  autre.enfants[idEnfant].coeurs = 4;
  serveur.row = { data: autre };

  await api.Store.reprendre();
  assert.strictEqual(api.etat.enfants[idEnfant].coeurs, 4, "la reprise doit relire l'état");
  assert.strictEqual(abonnements, 1, "la reprise doit rouvrir le canal temps réel");

  // Verrou : plusieurs signaux de reprise arrivent souvent coup sur coup
  // (visibilité, focus, plugin natif). On ne rouvre pas trois canaux.
  await api.Store.reprendre();
  assert.strictEqual(abonnements, 1, "deux reprises rapprochées ne font qu'une reconnexion");
});

test("reprise : l'app installée ne dépend pas du seul événement de visibilité", () => {
  const fs = require("fs"), path = require("path");
  const auth = fs.readFileSync(path.join(__dirname, "..", "js/auth.js"), "utf8");
  // Android gèle la WebView : selon les versions, visibilitychange n'est pas
  // émis au réveil. Le plugin App, lui, le dit toujours.
  assert.ok(/addListener\("appStateChange"/.test(auth),
    "le réveil natif doit être écouté, pas seulement la visibilité du document");
  ["visibilitychange", "focus", "pageshow"].forEach(ev =>
    assert.ok(new RegExp('"' + ev + '"').test(auth), "signal de reprise absent : " + ev));
  assert.ok(/Store\.reprendre\(\)/.test(auth),
    "le retour au premier plan doit passer par Store.reprendre (relecture + canal)");
  // L'écouteur reçoit un Event : le passer directement à une fonction qui
  // prendrait un drapeau « forcer » contournerait le filtre de visibilité.
  assert.ok(/function auRetourVisible\(\) \{ if \(!document\.hidden\) auRetour\(\); \}/.test(auth),
    "l'enveloppe de visibilité doit rester nommée et explicite");
});

test("conflit réel : la version la plus récente gagne, l'autre reste récupérable", async () => {
  // Ancien comportement : l'écriture était annulée, le repère restait faux,
  // l'appareil répétait l'avertissement à chaque geste et cessait de
  // synchroniser jusqu'au rechargement — en renvoyant le parent, en pleine
  // soirée, vers un écran derrière le code PIN pour arbitrer lui-même.
  // Désormais on tranche pour lui, sans rien perdre.
  const { contexte, api } = construireContexte();
  const appelsToast = [];
  contexte.toast = (msg, type) => appelsToast.push({ msg, type });

  api.familleId = "f1";
  const local = api.etatVierge();
  local.maj = 1000;
  api.lierEtat(local);
  const serveur = { row: { data: { ...local, maj: 1000 } } };
  const client = clientFactice(serveur);
  api.Store.init(client);
  await api.Store.charger();

  // L'autre appareil est en AVANCE (2000 > 1500).
  const avance = api.etatVierge();
  avance.maj = 2000;
  const idA = Object.keys(avance.enfants)[0];
  avance.enfants[idA].gouttes = 42;
  serveur.row = { data: avance };

  const idEnfant = Object.keys(api.etat.enfants)[0];
  api.etat.enfants[idEnfant].gouttes += 1;
  api.etat.maj = 1500;

  const avant = client.appels.ecritures.length;
  await api.Store.sauver();

  assert.strictEqual(client.appels.ecritures.length, avant,
    "on n'écrase pas l'appareil en avance");
  assert.strictEqual(api.etat.maj, 2000, "sa version doit être adoptée, pas seulement signalée");
  assert.strictEqual(api.etat.enfants[idA].gouttes, 42, "ses compteurs doivent être repris");
  // Et la nôtre n'est pas perdue : elle est déposée sur cet appareil, où
  // l'écran Récupération la retrouve sans qu'on ait rien à brancher.
  const sauvegardes = api.listerSauvegardesLocales().filter(x => x.maj === 1500);
  assert.strictEqual(sauvegardes.length, 1, "la version locale doit être mise à l'abri");

  // Et surtout : l'appareil n'est PAS bloqué. Le geste suivant repart.
  api.etat.maj = 3000;
  await api.Store.sauver();
  assert.strictEqual(client.appels.ecritures.length, avant + 1,
    "la sauvegarde suivante doit passer : plus de blocage jusqu'au rechargement");
});

test("conflit réel : l'avertissement se dit une fois, pas à chaque geste", async () => {
  const { contexte, api } = construireContexte();
  const appelsToast = [];
  contexte.toast = (msg, type) => appelsToast.push({ msg, type });

  api.familleId = "f1";
  const local = api.etatVierge();
  local.maj = 1000;
  api.lierEtat(local);
  const serveur = { row: { data: { ...local, maj: 1000 } } };
  const client = clientFactice(serveur);
  api.Store.init(client);
  await api.Store.charger();

  // Notre version est la plus récente : on écrit, celle du serveur part dans
  // l'historique côté base. Trois gestes de suite, un seul message.
  for (const [majServeur, majLocale] of [[900, 1500], [1600, 2000], [2100, 2500]]) {
    serveur.row = { data: { ...api.etatVierge(), maj: majServeur } };
    api.etat.maj = majLocale;
    await api.Store.sauver();
  }
  assert.strictEqual(appelsToast.length, 1,
    "un seul avertissement par chargement, sinon c'est du bruit");
  assert.strictEqual(appelsToast[0].msg, api.I18N.fr["sync.conflit"]);
  // Le message ne doit plus demander au parent d'aller vérifier des compteurs.
  Object.keys(api.LANGUES).forEach(lg => {
    const m = api.I18N[lg]["sync.conflit"];
    assert.ok(!/vérifier les compteurs|check the counters|tellers te controleren|Zähler zu prüfen/.test(m),
      "le message ne doit plus faire arbitrer le parent (" + lg + ")");
  });
});

test("Store.sauver ne se déclare pas en conflit avec lui-même", async () => {
  // Le cas réellement rencontré par une famille à UN SEUL appareil : l'envoi
  // est différé de 700 ms et `sauver()` avance `etat.maj` à chaque geste, si
  // bien qu'un enfant qui coche deux missions d'affilée fait bouger `etat.maj`
  // PENDANT l'aller-retour réseau. Si Store retient alors la valeur courante
  // plutôt que celle qu'il vient réellement d'écrire, il se croit en conflit
  // avec lui-même à la sauvegarde suivante.
  const { contexte, api } = construireContexte();
  const appelsToast = [];
  contexte.toast = (msg, type) => appelsToast.push({ msg, type });

  api.familleId = "f1";
  const local = api.etatVierge();
  local.maj = 1000;
  api.lierEtat(local);
  const serveur = { row: { data: { ...local, maj: 1000 } } };
  const client = clientFactice(serveur);
  api.Store.init(client);
  await api.Store.charger();

  api.etat.maj = 1200;
  client.pendantEcriture = () => { api.etat.maj = 1300; };   // l'enfant coche encore
  await api.Store.sauver();
  assert.strictEqual(serveur.row.data.maj, 1200, "le serveur reçoit la version envoyée");

  // Sauvegarde suivante, même appareil, personne d'autre n'a écrit.
  client.pendantEcriture = null;
  api.etat.maj = 1400;
  await api.Store.sauver();
  assert.strictEqual(appelsToast.length, 0,
    "aucun avertissement ne doit s'afficher : cet appareil est seul");
  assert.strictEqual(client.appels.ecritures.length, 2, "la deuxième écriture doit partir");
  assert.strictEqual(serveur.row.data.maj, 1400);
});

test("Store.sauver ne laisse pas deux écritures se chevaucher", async () => {
  // Deux `sauver()` en vol en même temps produisaient le même symptôme : celle
  // qui se termine en dernier n'est pas forcément celle qui a écrit en dernier,
  // et le repère de version se retrouvait en arrière du serveur.
  const { contexte, api } = construireContexte();
  const appelsToast = [];
  contexte.toast = (msg, type) => appelsToast.push({ msg, type });

  api.familleId = "f1";
  const local = api.etatVierge();
  local.maj = 1000;
  api.lierEtat(local);
  const serveur = { row: { data: { ...local, maj: 1000 } } };
  const client = clientFactice(serveur);
  api.Store.init(client);
  await api.Store.charger();

  api.etat.maj = 1200;
  const a = api.Store.sauver();
  api.etat.maj = 1300;              // second geste avant que le premier ait fini
  const b = api.Store.sauver();
  await Promise.all([a, b]);

  assert.strictEqual(appelsToast.length, 0, "aucun conflit : c'est le même appareil");
  // L'état le plus récent doit avoir atteint le serveur.
  assert.strictEqual(serveur.row.data.maj, 1300, "la dernière version doit être celle du serveur");

  // Et la sauvegarde d'après doit encore passer.
  api.etat.maj = 1400;
  await api.Store.sauver();
  assert.strictEqual(appelsToast.length, 0);
  assert.strictEqual(serveur.row.data.maj, 1400);
});

test("Store.sauver retente l'écriture directe si la vérification anti-conflit échoue (hors ligne)", async () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  const local = api.etatVierge();
  local.maj = 1000;
  api.lierEtat(local);

  const serveur = { row: { data: { ...local, maj: 1000 } } };
  const client = clientFactice(serveur);
  api.Store.init(client);
  await api.Store.charger();

  client.enPanneLecture = true;   // la vérification elle-même échoue (hors ligne)
  api.etat.maj = 1400;
  await api.Store.sauver();
  assert.strictEqual(client.appels.ecritures.length, 1,
    "sans pouvoir vérifier, on retente l'écriture directe comme avant");
});

/* ---------- Humour (touches bon enfant, désactivables) ---------- */
test("humour: activé par défaut, messageVide renvoie une blague", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  assert.strictEqual(api.humourActif(), true);
  const m = api.messageVide("NEUTRE");
  assert.ok(api.MESSAGES_VIDES.includes(m), "doit venir du corpus d'humour");
});

test("humour: désactivé, messageVide renvoie le texte neutre et blagueDuJour reste dispo", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  const e = api.etatVierge();
  e.reglages.humour = false;
  api.lierEtat(e);
  assert.strictEqual(api.humourActif(), false);
  assert.strictEqual(api.messageVide("NEUTRE"), "NEUTRE");
  const b = api.blagueDuJour();          // la blague existe indépendamment du réglage
  assert.ok(b && b.q && b.r);
  assert.strictEqual(typeof b.idx, "number");
});

test("blague: l'avis (j'aime/bof) se pose, bascule et s'enlève au re-clic", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  const idx = api.blagueDuJour().idx;
  assert.strictEqual(api.avisBlague(idx), null);
  api.definirAvisBlague(idx, "up");
  assert.strictEqual(api.avisBlague(idx), "up");
  api.definirAvisBlague(idx, "down");   // change d'avis
  assert.strictEqual(api.avisBlague(idx), "down");
  api.definirAvisBlague(idx, "down");   // re-clic = on enlève
  assert.strictEqual(api.avisBlague(idx), null);
});

test("blagues: liste par langue + surcharge admin via configApp", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  // Chaque langue a sa propre liste par défaut, non vide.
  ["fr", "en", "nl", "de"].forEach(lg => {
    assert.ok(Array.isArray(api.BLAGUES_DEFAUT[lg]) && api.BLAGUES_DEFAUT[lg].length > 0);
    assert.ok(api.blaguesDe(lg).length > 0);
  });
  // Surcharge admin : la liste effective suit configApp["blagues_<lang>"].
  api.configApp = { blagues_fr: JSON.stringify([{ q: "Q?", r: "R!" }]) };
  assert.strictEqual(api.blaguesDe("fr").length, 1);
  assert.strictEqual(api.blaguesDe("fr")[0].q, "Q?");
  // La blague du jour est tirée de la langue courante.
  api.langue = "fr";
  const b = api.blagueDuJour();
  assert.strictEqual(b.q, "Q?");
});

test("blagues : désactivées globalement (corpus en révision), même famille humour=true", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  assert.strictEqual(api.humourActif(), true);       // le réglage famille est actif...
  assert.strictEqual(api.BLAGUES_ACTIVEES, false);   // ...mais le corpus est coupé globalement...
  assert.strictEqual(api.blagueDuJourVisible(), null); // ...donc rien à afficher sur l'accueil.
  // blagueDuJour() (logique de sélection pure) reste disponible pour plus
  // tard, une fois un corpus éprouvé et libre de droits en place.
  assert.ok(api.blagueDuJour());
});

/* ---------- Compliment du jour (espace parent) ---------- */
test("compliment: une série de 3+ jours consécutifs est détectée et félicitée", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  const enf = enfantNeuf(api);
  const m = missionFamille(api);
  const aujourdhui = api.aujourdHui();
  [0, -1, -2].forEach(dec => api.modifierHistorique(enf, decalerJour(aujourdhui, dec), m, +1));
  assert.strictEqual(api.streakMission(enf, m.id, aujourdhui), 3);
  const c = api.complimentDuJour(enf);
  assert.strictEqual(c.type, "serie");
  assert.ok(c.texte.includes(enf.prenom));
});

test("compliment: la série s'interrompt si un jour est manqué", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  const enf = enfantNeuf(api);
  const m = missionFamille(api);
  const aujourdhui = api.aujourdHui();
  api.modifierHistorique(enf, decalerJour(aujourdhui, 0), m, +1);
  // -1 manqué volontairement
  api.modifierHistorique(enf, decalerJour(aujourdhui, -2), m, +1);
  assert.strictEqual(api.streakMission(enf, m.id, aujourdhui), 1);
});

test("compliment: progression cette semaine vs la semaine précédente", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  const enf = enfantNeuf(api);
  const m = missionFamille(api);
  const aujourdhui = api.aujourdHui();
  // Cette semaine (0..-6) : 3 fois. Semaine précédente (-7..-13) : 1 fois.
  [0, -2, -4].forEach(dec => api.modifierHistorique(enf, decalerJour(aujourdhui, dec), m, +1));
  api.modifierHistorique(enf, decalerJour(aujourdhui, -9), m, +1);
  assert.strictEqual(api.comptageMissionPeriode(enf, m.id, aujourdhui, 7), 3);
  assert.strictEqual(api.comptageMissionPeriode(enf, m.id, decalerJour(aujourdhui, -7), 7), 1);
  const c = api.complimentDuJour(enf);
  assert.strictEqual(c.type, "progres");
});

test("compliment: repli sur un message de bienvenue pour un enfant sans historique", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  const enf = enfantNeuf(api);
  const c = api.complimentDuJour(enf);
  assert.strictEqual(c.type, "bienvenue");
  assert.ok(c.texte.includes(enf.prenom));
});

/* ---------- Planification des missions ---------- */
test("planification: weekend uniquement filtre les jours de semaine", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  const m = missionFamille(api);
  const enf = api.etat.enfants[Object.keys(api.etat.enfants)[0]];
  api.definirPlanifMission(m.id, "jours", [0, 6]);   // dimanche + samedi
  // 2026-06-20 = samedi (actif), 2026-06-22 = lundi (inactif)
  assert.strictEqual(api.missionPlanifieeActive(m, enf, "2026-06-20"), true);
  assert.strictEqual(api.missionPlanifieeActive(m, enf, "2026-06-22"), false);
});

test("planification: plage de dates et enfant ciblé", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  const m = missionPlanete(api);
  const ids = Object.keys(api.etat.enfants);
  const enfA = api.etat.enfants[ids[0]];
  const enfB = api.etat.enfants[ids[1]];
  api.definirPlanifMission(m.id, "du", "2026-06-10");
  api.definirPlanifMission(m.id, "au", "2026-06-30");
  api.definirPlanifMission(m.id, "enfants", [enfA.id]);
  assert.strictEqual(api.missionPlanifieeActive(m, enfA, "2026-06-15"), true);
  assert.strictEqual(api.missionPlanifieeActive(m, enfA, "2026-07-01"), false); // hors plage
  assert.strictEqual(api.missionPlanifieeActive(m, enfB, "2026-06-15"), false); // autre enfant
});

/* ---------- Semaine papier : encodage ---------- */
test("encodage détaillé : modifierHistorique crédite un jour précis", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  const enf = api.etat.enfants[Object.keys(api.etat.enfants)[0]];
  const m = missionFamille(api);
  const c0 = enf.coeurs;
  api.modifierHistorique(enf, "2026-06-15", m, +1);
  assert.strictEqual((enf.journal["2026-06-15"] || {})[m.id], 1);
  assert.strictEqual(enf.coeurs, c0 + m.points);
});

test("encodage express : ajusterMonnaie ajoute les totaux de la semaine", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  const enf = api.etat.enfants[Object.keys(api.etat.enfants)[0]];
  api.ajusterMonnaie(enf, "coeurs", 12);
  api.ajusterMonnaie(enf, "gouttes", 7);
  assert.strictEqual(enf.coeurs, 12);
  assert.strictEqual(enf.gouttes, 7);
});

test("comportement par jour : cyclerAutoEvalJour parcourt bien→moyen→mauvais→vide", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  const enf = api.etat.enfants[Object.keys(api.etat.enfants)[0]];
  const j = "2026-06-16";
  api.cyclerAutoEvalJour(enf, j); assert.strictEqual(enf.autoEval[j], "bien");
  api.cyclerAutoEvalJour(enf, j); assert.strictEqual(enf.autoEval[j], "moyen");
  api.cyclerAutoEvalJour(enf, j); assert.strictEqual(enf.autoEval[j], "mauvais");
  api.cyclerAutoEvalJour(enf, j); assert.strictEqual(enf.autoEval[j], undefined);
});

/* ---------- i18n : parité des traductions de l'espace admin (lots A→F) ---------- */
test("i18n : les clés admin/stats/retours/sys existent dans les 4 langues", () => {
  const { api } = construireContexte();
  const langues = Object.keys(api.LANGUES);              // fr, en, nl, de
  assert.deepStrictEqual(langues.sort(), ["de", "en", "fr", "nl"]);
  const prefixes = ["admin.", "stats.", "retours.", "sys."];
  // Référence : toutes les clés françaises de ces namespaces.
  const clesRef = Object.keys(api.I18N.fr).filter(k => prefixes.some(p => k.startsWith(p)));
  assert.ok(clesRef.length > 30, "attendu de nombreuses clés admin/stats/retours/sys");
  const manquantes = [];
  langues.forEach(lg => {
    clesRef.forEach(k => {
      const v = api.I18N[lg][k];
      if (typeof v !== "string" || v.length === 0) manquantes.push(lg + " → " + k);
    });
  });
  assert.strictEqual(manquantes.length, 0,
    "traductions manquantes : " + manquantes.slice(0, 10).join(", "));
});

test("i18n : les placeholders {var} sont cohérents entre langues (namespaces admin)", () => {
  const { api } = construireContexte();
  const langues = Object.keys(api.LANGUES);
  const prefixes = ["admin.", "stats.", "retours.", "sys."];
  const clesRef = Object.keys(api.I18N.fr).filter(k => prefixes.some(p => k.startsWith(p)));
  const jeton = s => (String(s).match(/\{[a-zA-Z0-9_]+\}/g) || []).sort();
  const ecarts = [];
  clesRef.forEach(k => {
    const ref = jeton(api.I18N.fr[k]);
    langues.forEach(lg => {
      if (lg === "fr") return;
      const v = api.I18N[lg][k];
      if (typeof v === "string" && JSON.stringify(jeton(v)) !== JSON.stringify(ref)) {
        ecarts.push(lg + " → " + k);
      }
    });
  });
  assert.strictEqual(ecarts.length, 0, "placeholders divergents : " + ecarts.slice(0, 10).join(", "));
});

test("i18n : mode d'emploi « Oups » et premiers pas traduits dans les 4 langues", () => {
  const { api } = construireContexte();
  const langues = Object.keys(api.LANGUES);
  const prefixes = ["rep.", "pp.", "regl.", "grp."];
  const cles = Object.keys(api.I18N.fr).filter(k => prefixes.some(p => k.startsWith(p)));
  assert.ok(cles.includes("rep.aide.titre") && cles.includes("rep.etape1"),
    "le mode d'emploi parents doit être traduit (clés rep.*)");
  assert.ok(cles.includes("pp.e1_t") && cles.includes("grp.reglages"),
    "les premiers pas et les onglets doivent être traduits (pp.*, grp.*)");
  const jeton = s => (String(s).match(/\{[a-zA-Z0-9_]+\}/g) || []).sort();
  const soucis = [];
  cles.forEach(k => {
    langues.forEach(lg => {
      const v = api.I18N[lg][k];
      if (typeof v !== "string" || !v.length) { soucis.push(lg + " → " + k + " (manquant)"); return; }
      if (lg !== "fr" && JSON.stringify(jeton(v)) !== JSON.stringify(jeton(api.I18N.fr[k]))) {
        soucis.push(lg + " → " + k + " (placeholder)");
      }
    });
  });
  assert.strictEqual(soucis.length, 0, soucis.slice(0, 10).join(", "));
});

/* ---------- Tournantes : qui, quand, jusqu'à quand ---------- */
function rotationTest(api, extra) {
  return Object.assign({
    id: "rot-test", missions: ["m1"], enfants: ["a", "b", "c"],
    periode: "semaine", debut: "2026-07-06", joursOff: []      // lundi 6 juillet
  }, extra || {});
}

test("tournantes : bornes de la période courante (semaine)", () => {
  const { api } = construireContexte();
  const rot = rotationTest(api);
  const p = api.periodeRotation(rot, "2026-07-09");            // jeudi de la 1ʳᵉ semaine
  assert.strictEqual(p.index, 0);
  assert.strictEqual(p.debut, "2026-07-06");
  assert.strictEqual(p.fin, "2026-07-12");                     // dimanche inclus
  // Le lendemain du dimanche ouvre la période suivante.
  const p2 = api.periodeRotation(rot, "2026-07-13");
  assert.strictEqual(p2.index, 1);
  assert.strictEqual(p2.debut, "2026-07-13");
  assert.strictEqual(p2.fin, "2026-07-19");
});

test("tournantes : la période d'un jour dure un jour", () => {
  const { api } = construireContexte();
  const rot = rotationTest(api, { periode: "jour" });
  const p = api.periodeRotation(rot, "2026-07-09");
  assert.strictEqual(p.debut, "2026-07-09");
  assert.strictEqual(p.fin, "2026-07-09");
  assert.strictEqual(p.index, 3);
});

test("tournantes : l'aperçu déroule les tours dans l'ordre, sans trou", () => {
  const { api } = construireContexte();
  const rot = rotationTest(api);
  const suite = api.apercuRotation(rot, "2026-07-09", 4);
  assert.strictEqual(suite.map(x => x.enfant).join(","), "a,b,c,a");
  assert.strictEqual(suite.map(x => x.debut).join(","),
    "2026-07-06,2026-07-13,2026-07-20,2026-07-27");
  // Chaque période commence le lendemain de la fin de la précédente.
  for (let i = 1; i < suite.length; i++) {
    const veille = new Date(suite[i].debut + "T00:00:00");
    veille.setDate(veille.getDate() - 1);
    assert.strictEqual(veille.toISOString().slice(0, 10), suite[i - 1].fin);
  }
  // L'aperçu est cohérent avec la fonction qui désigne l'enfant de garde.
  suite.forEach(p => assert.strictEqual(api.enfantDeGardeRotation(rot, p.debut), p.enfant));
});

test("tournantes : le prochain tour d'un enfant tombe après la période en cours", () => {
  const { api } = construireContexte();
  const rot = rotationTest(api);
  // Semaine de « a » : son prochain tour est dans 3 périodes.
  const suivantA = api.prochainTourRotation(rot, "a", "2026-07-09");
  assert.strictEqual(suivantA.dans, 3);
  assert.strictEqual(suivantA.debut, "2026-07-27");
  // Pour « b », c'est la semaine prochaine.
  const suivantB = api.prochainTourRotation(rot, "b", "2026-07-09");
  assert.strictEqual(suivantB.dans, 1);
  assert.strictEqual(suivantB.debut, "2026-07-13");
  // Un enfant hors tournante n'a pas de tour.
  assert.strictEqual(api.prochainTourRotation(rot, "z", "2026-07-09"), null);
});

test("tournantes : un seul enfant garde la tâche à chaque période", () => {
  const { api } = construireContexte();
  const rot = rotationTest(api, { enfants: ["a"] });
  const suite = api.apercuRotation(rot, "2026-07-09", 3);
  assert.strictEqual(suite.map(x => x.enfant).join(","), "a,a,a");
  // « Prochain tour » reste défini : la période suivante.
  assert.strictEqual(api.prochainTourRotation(rot, "a", "2026-07-09").dans, 1);
});

test("tournantes : avant la date de début, on reste sur la première période", () => {
  const { api } = construireContexte();
  const rot = rotationTest(api);
  const p = api.periodeRotation(rot, "2026-06-01");
  assert.strictEqual(p.index, 0);
  assert.strictEqual(api.enfantDeGardeRotation(rot, "2026-06-01"), "a");
});

// Reproduit le cas signalé par un utilisateur : deux tournantes quotidiennes
// distinctes, l'une qui QUITTE l'enfant demain, l'autre qui LUI ARRIVE demain.
// Le rappel « et demain, ce sera à toi » ne doit se déclencher (et nommer la
// bonne tâche) que pour la seconde, jamais pour la première.
test("tournantes : le rappel « demain » distingue la tournante qui arrive de celle qui part", () => {
  const { api } = construireContexte();
  const rangerJouets = rotationTest(api, {
    id: "rot-jouets", missions: ["m1"], enfants: ["maria", "jojo"],
    periode: "jour", debut: "2026-07-26"
  });
  const debarrasser = rotationTest(api, {
    id: "rot-debarras", missions: ["m2"], enfants: ["capu", "maria"],
    periode: "jour", debut: "2026-07-26"
  });
  const auj = "2026-07-26", dem = "2026-07-27";

  // Aujourd'hui : Maria a « ranger les jouets », pas « débarrasser ».
  assert.strictEqual(api.enfantDeGardeRotation(rangerJouets, auj), "maria");
  assert.strictEqual(api.enfantDeGardeRotation(debarrasser, auj), "capu");
  // Demain : « ranger les jouets » passe à Jojo (Maria ne le garde PAS)...
  assert.strictEqual(api.enfantDeGardeRotation(rangerJouets, dem), "jojo");
  // ...mais « débarrasser la table » lui arrive.
  assert.strictEqual(api.enfantDeGardeRotation(debarrasser, dem), "maria");

  // Le prédicat du rappel (même logique que blocTournanteEnfant, js/ui.js) :
  // une tournante compte pour le rappel seulement si elle devient la sienne
  // demain ET n'était pas déjà la sienne aujourd'hui.
  const compteDansLeRappel = (rot) =>
    !api.jourOffRotation(rot, dem) && api.enfantDeGardeRotation(rot, dem) === "maria"
      && api.enfantDeGardeRotation(rot, auj) !== "maria";
  assert.strictEqual(compteDansLeRappel(rangerJouets), false, "elle la quitte, ne doit pas apparaître");
  assert.strictEqual(compteDansLeRappel(debarrasser), true, "elle lui arrive, doit apparaître");
});

/* ---------- Parrainage : coefficient viral & bon moment ---------- */
test("parrainage : la carte débloquée porte bien sa date, base du « bon moment »", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  const enf = api.etat.enfants[Object.keys(api.etat.enfants)[0]];
  const carte = api.cartesSurprises()[0];
  assert.strictEqual(carte.debloquee, false);
  assert.strictEqual(carte.debloqueeLe, null);
  // On finance la carte jusqu'au bout : elle se débloque et se date.
  enf.coeurs = carte.cout + 5;
  api.donnerCarte(carte.id, carte.cout);
  const apres = api.trouverCarteSurprise(carte.id);
  assert.strictEqual(apres.debloquee, true);
  assert.strictEqual(apres.debloqueeLe, api.aujourdHui(), "la date de déblocage est celle du jour");
});

test("parrainage : la proposition ne se répète pas si le parent la referme", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  // Le drapeau vit dans les réglages, donc il est synchronisé entre appareils
  // et survit à un rechargement : la proposition ne revient jamais.
  assert.strictEqual(!!api.etat.reglages.parrainProposeVu, false);
  api.etat.reglages.parrainProposeVu = true;
  const n = api.normaliser(JSON.parse(JSON.stringify(api.etat)));
  assert.strictEqual(n.reglages.parrainProposeVu, true, "normaliser ne doit pas perdre ce choix");
});

/* ---------- Page publique : preuves et intégrité des ressources ---------- */
test("page publique : les captures d'écran référencées existent bien", () => {
  const fs = require("fs"), path = require("path");
  const racine = path.join(__dirname, "..");
  const auth = fs.readFileSync(path.join(racine, "js", "auth.js"), "utf8");
  const refs = Array.from(new Set((auth.match(/images\/[a-z0-9-]+\.png/g) || [])));
  assert.ok(refs.length >= 3, "la page publique doit montrer au moins trois captures");
  refs.forEach(r => assert.ok(fs.existsSync(path.join(racine, r)), "capture manquante : " + r));
});

test("page publique : promesse et principe traduits dans les 4 langues", () => {
  const { api } = construireContexte();
  const cles = ["auth.hero_sous", "auth.shot1", "auth.shot2", "auth.shot3",
                "auth.shot1_alt", "auth.shot2_alt", "auth.shot3_alt",
                "auth.principe_titre", "auth.principe_1", "auth.principe_2", "auth.principe_faq"];
  const manquantes = [];
  Object.keys(api.LANGUES).forEach(lg => cles.forEach(k => {
    const v = api.I18N[lg][k];
    if (typeof v !== "string" || !v.length) manquantes.push(lg + " → " + k);
  }));
  assert.strictEqual(manquantes.length, 0, manquantes.slice(0, 8).join(", "));
  // Les textes alternatifs décrivent l'image : ils ne doivent pas être vides ni identiques au titre.
  Object.keys(api.LANGUES).forEach(lg => {
    [1, 2, 3].forEach(i => assert.notStrictEqual(api.I18N[lg]["auth.shot" + i], api.I18N[lg]["auth.shot" + i + "_alt"]));
  });
});

/* ---------- Plan de développement commercial (onglet Admin « Croissance ») ---------- */
test("croissance : chantiers bien formés, identifiants uniques, phases connues", () => {
  const { api } = construireContexte();
  const phases = api.CROISSANCE_PHASES.map(p => p.id);
  assert.ok(phases.length >= 4, "au moins 4 phases");
  const vus = new Set();
  api.CROISSANCE_CHANTIERS.forEach(ch => {
    assert.ok(ch.id && ch.titre && ch.but && ch.kpi, "chantier incomplet : " + ch.id);
    assert.ok(phases.includes(ch.phase), "phase inconnue pour " + ch.id);
    assert.ok(Array.isArray(ch.etapes) && ch.etapes.length >= 3, "trop peu d'étapes : " + ch.id);
    assert.ok(!vus.has(ch.id), "identifiant de chantier en double : " + ch.id);
    vus.add(ch.id);
    ch.etapes.forEach(e => {
      assert.ok(e.id && e.titre, "étape incomplète dans " + ch.id);
      assert.ok(!vus.has(e.id), "identifiant d'étape en double : " + e.id);
      vus.add(e.id);
    });
  });
  // Chaque phase porte au moins un chantier (sinon l'onglet affiche du vide).
  phases.forEach(p => assert.ok(api.chantiersDePhase(p).length > 0, "phase vide : " + p));
});

test("croissance : périmètre déclaré et durées chiffrées sur chaque étape", () => {
  const { api } = construireContexte();
  const perimetres = ["coeur", "plus_tard", "hors"];
  api.CROISSANCE_CHANTIERS.forEach(ch => {
    assert.ok(perimetres.includes(ch.perimetre), "périmètre inconnu pour " + ch.id);
    ch.etapes.forEach(e => {
      assert.strictEqual(typeof e.min, "number", "durée manquante : " + e.id);
      assert.ok(e.min >= 0 && e.min <= 60, "durée hors bornes (0-60 min) : " + e.id);
    });
  });
  // Il doit rester du travail « cœur » : sinon le plan ne sert à rien.
  assert.ok(api.CROISSANCE_CHANTIERS.some(ch => ch.perimetre === "coeur"), "aucun chantier au cœur du plan");
  // Aucune étape ne peut dépasser la séance hebdomadaire d'une heure.
  const trop = api.CROISSANCE_CHANTIERS.filter(ch => ch.perimetre === "coeur")
    .flatMap(ch => ch.etapes).filter(e => (e.min || 0) > 60);
  assert.strictEqual(trop.length, 0, "étape plus longue qu'une séance : " + trop.map(e => e.id).join(", "));
});

test("croissance : un chantier récurrent se re-décoche au mois suivant", () => {
  const { api } = construireContexte();
  const rec = api.CROISSANCE_CHANTIERS.filter(ch => ch.recurrent === "mois");
  assert.ok(rec.length >= 1, "il doit exister au moins un chantier récurrent (revue des idées)");
  const ch = rec[0];
  const e = ch.etapes[0];
  // La clé d'avancement porte le mois : juillet et août ne se mélangent pas.
  const kJuillet = api.cleEtapeCroissance(ch, e, "2026-07");
  const kAout = api.cleEtapeCroissance(ch, e, "2026-08");
  assert.strictEqual(kJuillet, e.id + "@2026-07");
  assert.notStrictEqual(kJuillet, kAout);
  // Un chantier normal garde une clé stable, sans période.
  const normal = api.CROISSANCE_CHANTIERS.find(c => !c.recurrent);
  assert.strictEqual(api.cleEtapeCroissance(normal, normal.etapes[0], "2026-07"), normal.etapes[0].id);
});

test("croissance : la séance de la semaine tient dans le budget d'une heure", () => {
  const { api } = construireContexte();
  const faites = new Set();
  const estFaite = (e) => faites.has(e.id) || !!e.fait;
  // Trois semaines de suite : chaque séance tient dans l'heure et progresse.
  for (let semaine = 0; semaine < 3; semaine++) {
    const choix = api.seanceDeLaSemaine(estFaite, 60);
    assert.ok(choix.length > 0, "séance vide en semaine " + (semaine + 1));
    const total = choix.reduce((s, x) => s + (x.etape.min || 15), 0);
    assert.ok(total <= 60, `séance de ${total} min en semaine ${semaine + 1}`);
    choix.forEach(x => {
      assert.strictEqual(x.chantier.perimetre, "coeur", "étape hors périmètre proposée : " + x.etape.id);
      faites.add(x.etape.id);
    });
  }
  // Une fois tout fait, la séance est vide (et non en boucle infinie).
  api.CROISSANCE_CHANTIERS.forEach(ch => ch.etapes.forEach(e => faites.add(e.id)));
  assert.strictEqual(api.seanceDeLaSemaine(estFaite, 60).length, 0, "séance non vide alors que tout est fait");
});

test("croissance : chaque e-mail référencé existe et est complet", () => {
  const { api } = construireContexte();
  const ids = new Set();
  api.CROISSANCE_MAILS.forEach(m => {
    assert.ok(m.id && m.titre && m.dest && m.quand && m.sujet && m.corps, "e-mail incomplet : " + m.id);
    assert.ok(!ids.has(m.id), "identifiant d'e-mail en double : " + m.id);
    ids.add(m.id);
  });
  const references = [];
  api.CROISSANCE_CHANTIERS.forEach(ch => ch.etapes.forEach(e => { if (e.mail) references.push([ch.id, e.mail]); }));
  references.forEach(([chantier, mail]) =>
    assert.ok(api.mailCroissance(mail), `e-mail « ${mail} » référencé par ${chantier} mais introuvable`));
  assert.ok(references.length >= 10, "le plan doit s'appuyer sur ses modèles d'e-mails");
});

test("auto-évaluation enfant : sans mode révision, enregistre à aujourd'hui", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  const enf = api.etat.enfants[Object.keys(api.etat.enfants)[0]];
  api.etat.enfantActif = enf.id;
  api.definirAutoEval("bien");
  assert.strictEqual(enf.autoEval[api.aujourdHui()], "bien");
});

test("auto-évaluation enfant : en mode révision, enregistre au jour affiché (pas aujourd'hui)", () => {
  const { contexte, api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  const enf = api.etat.enfants[Object.keys(api.etat.enfants)[0]];
  api.etat.enfantActif = enf.id;
  // Simule le mode révision : le jour affiché est un jour antérieur.
  const jourPasse = decalerJour(api.aujourdHui(), -3);
  contexte.jourAffiche = () => jourPasse;
  api.definirAutoEval("moyen");
  assert.strictEqual(enf.autoEval[jourPasse], "moyen");        // consigné au bon jour
  assert.strictEqual(enf.autoEval[api.aujourdHui()], undefined); // et surtout pas à aujourd'hui
  // Re-toucher la même valeur annule l'évaluation de ce jour.
  api.definirAutoEval("moyen");
  assert.strictEqual(enf.autoEval[jourPasse], undefined);
});

/* ---------- Crédit / décrédit de mission ---------- */
test("crediterMission ajoute points et journal (catégorie famille = cœurs)", () => {
  const { api } = construireContexte();
  const enf = enfantNeuf(api);
  const m = missionFamille(api);
  api.crediterMission(enf, m, "2026-06-16");
  assert.strictEqual(enf.coeurs, m.points);
  assert.strictEqual(enf.coeursTotal, m.points);
  assert.strictEqual(enf.journal["2026-06-16"][m.id], 1);
});

test("crediterMission catégorie planète crédite les gouttes", () => {
  const { api } = construireContexte();
  const enf = enfantNeuf(api);
  const m = missionPlanete(api);
  api.crediterMission(enf, m, "2026-06-16");
  assert.strictEqual(enf.gouttes, m.points);
  assert.strictEqual(enf.gouttesTotal, m.points);
  assert.strictEqual(enf.coeurs, 0);
});

test("décréditer annule le crédit et nettoie le journal", () => {
  const { api } = construireContexte();
  const enf = enfantNeuf(api);
  const m = missionFamille(api);
  api.crediterMission(enf, m, "2026-06-16");
  api.decrediterMission(enf, m, "2026-06-16");
  assert.strictEqual(enf.coeurs, 0);
  assert.strictEqual(enf.coeursTotal, 0);
  assert.strictEqual(enf.journal["2026-06-16"], undefined);
});

test("décréditer ne descend jamais sous zéro", () => {
  const { api } = construireContexte();
  const enf = enfantNeuf(api);
  const m = missionFamille(api);
  api.decrediterMission(enf, m, "2026-06-16"); // rien à retirer
  assert.strictEqual(enf.coeurs, 0);
  assert.strictEqual(enf.coeursTotal, 0);
});

/* ---------- Personnalisation par enfant ---------- */
test("points par enfant : override pris en compte au crédit", () => {
  const { api } = construireContexte();
  api.familleId = "f"; api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  const m = missionFamille(api);
  api.definirPersoMission(enf, m.id, "points", 9);
  assert.strictEqual(api.pointsMission(enf, m), 9);
  const c0 = enf.coeurs;
  api.crediterMission(enf, m, "2026-06-16");
  assert.strictEqual(enf.coeurs, c0 + 9);
});

test("mission désactivée pour un enfant n'apparaît plus dans ses missions actives", () => {
  const { api } = construireContexte();
  api.familleId = "f"; api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  const ids0 = api.idsDefaut(enf);
  const cible = ids0[0];
  const m = api.trouverMission(cible);
  api.definirPersoMission(enf, cible, "actif", false);
  assert.strictEqual(api.missionActivePourEnfant(enf, cible), false);
  const actives = api.missionsActives(enf, m.cat, "2026-06-16").map(x => x.id);
  assert.ok(!actives.includes(cible));
});

test("coût d'espèce par enfant : override pris en compte", () => {
  const { api } = construireContexte();
  api.familleId = "f"; api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  const sp = api.spInfo("herbe").sp;
  assert.strictEqual(api.coutEspece(enf, sp), sp.cout);
  api.definirPersoEspece(enf, "herbe", "cout", 1);
  assert.strictEqual(api.coutEspece(enf, sp), 1);
  assert.strictEqual(api.especeActivePourEnfant(enf, "herbe"), true);
  api.definirPersoEspece(enf, "herbe", "actif", false);
  assert.strictEqual(api.especeActivePourEnfant(enf, "herbe"), false);
});

/* ---------- Budget de tâches par âge (≈ 3 min/jour) ---------- */
test("la sélection par défaut respecte le budget de tâches selon l'âge", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  const a = api.age(enf);
  const attendu = api.tachesConseillees(a);
  const ids = api.idsDefaut(enf);
  // On ne dépasse pas le budget conseillé (peut être un peu moins si peu de missions pour l'âge).
  assert.ok(ids.length <= attendu, `${ids.length} ≤ ${attendu}`);
  assert.ok(ids.length >= 2, "au moins quelques tâches proposées");
});

test("tachesConseillees augmente avec l'âge", () => {
  const { api } = construireContexte();
  assert.ok(api.tachesConseillees(3) <= api.tachesConseillees(6));
  assert.ok(api.tachesConseillees(6) <= api.tachesConseillees(10));
});

/* ---------- Tableau de bord science ---------- */
test("scienceConf renvoie les défauts sans override", () => {
  const { api } = construireContexte();
  api.familleId = "f"; api.lierEtat(api.etatVierge());
  assert.strictEqual(api.budgetMinJour(), 3);
  assert.ok(api.tachesConseillees(3) === 8);
});

test("un override science (app_config) ajuste le budget et l'âge des missions", () => {
  const { api } = construireContexte();
  api.familleId = "f"; api.lierEtat(api.etatVierge());
  const m = api.MISSIONS.find(x => x.cat === "famille");
  api.configApp = { science: JSON.stringify({
    budgetMinJour: 5,
    tachesParAge: [{ max: 3, n: 1 }, { max: 99, n: 8 }],
    ageMission: { [m.id]: 9 }
  }) };
  assert.strictEqual(api.budgetMinJour(), 5);
  assert.strictEqual(api.tachesConseillees(3), 1);
  assert.strictEqual(api.tachesConseillees(10), 8);
  assert.strictEqual(api.ageMinMission(m), 9);
});

/* ---------- Tournantes de tâches ---------- */
test("tournante hebdo : alterne l'enfant de garde et masque la tâche aux autres", () => {
  const { api } = construireContexte();
  api.familleId = "f"; api.lierEtat(api.etatVierge());
  const ids = Object.keys(api.etat.enfants);
  const eA = api.etat.enfants[ids[0]], eB = api.etat.enfants[ids[1]];
  const m = api.MISSIONS.find(x => x.id === "table_mettre");
  const lundi = "2026-06-15"; // un lundi
  api.ajouterRotation([m.id], [eA.id, eB.id], "semaine", lundi);
  const rot = api.etat.rotations[0];
  // Semaine 0 -> A de garde ; semaine 1 -> B
  assert.strictEqual(api.enfantDeGardeRotation(rot, "2026-06-17"), eA.id);
  assert.strictEqual(api.enfantDeGardeRotation(rot, "2026-06-23"), eB.id);
  // La tâche n'est permise qu'à l'enfant de garde
  assert.strictEqual(api.rotationPermet(eA, m.id, "2026-06-17"), true);
  assert.strictEqual(api.rotationPermet(eB, m.id, "2026-06-17"), false);
  // Forçage : c'est dans les missions du jour de A, pas de B
  assert.ok(api.missionsTournanteDuJour(eA, "2026-06-17").some(x => x.id === m.id));
  assert.ok(!api.missionsTournanteDuJour(eB, "2026-06-17").some(x => x.id === m.id));
});

test("tournante : jours off + un seul enfant", () => {
  const { api } = construireContexte();
  api.familleId = "f"; api.lierEtat(api.etatVierge());
  const eA = api.etat.enfants[Object.keys(api.etat.enfants)[0]];
  const m = api.MISSIONS.find(x => x.id === "table_debarr");
  // Un seul enfant, off le week-end (sam=6, dim=0)
  api.ajouterRotation([m.id], [eA.id], "semaine", "2026-06-15", [6, 0]);
  const rot = api.etat.rotations[0];
  assert.strictEqual(api.jourOffRotation(rot, "2026-06-20"), true);  // samedi
  assert.strictEqual(api.jourOffRotation(rot, "2026-06-17"), false); // mercredi
  // En semaine : actif ; le week-end : masqué
  assert.ok(api.missionsTournanteDuJour(eA, "2026-06-17").some(x => x.id === m.id));
  assert.ok(!api.missionsTournanteDuJour(eA, "2026-06-20").some(x => x.id === m.id));
});

test("tournante : la tâche de demain revient à l'enfant de garde du lendemain", () => {
  const { api } = construireContexte();
  api.familleId = "f"; api.lierEtat(api.etatVierge());
  const ids = Object.keys(api.etat.enfants);
  const eA = api.etat.enfants[ids[0]], eB = api.etat.enfants[ids[1]];
  const m = api.MISSIONS.find(x => x.id === "table_mettre");
  // Rotation quotidienne démarrant le 2026-06-15 : J0=A, J1=B, J2=A...
  api.ajouterRotation([m.id], [eA.id, eB.id], "jour", "2026-06-15");
  assert.strictEqual(api.demain("2026-06-15"), "2026-06-16");
  // Le 15, c'est A de garde ; demain (le 16) ce sera B
  assert.ok(api.missionsTournanteDuJour(eB, api.demain("2026-06-15")).some(x => x.id === m.id));
  assert.ok(!api.missionsTournanteDuJour(eA, api.demain("2026-06-15")).some(x => x.id === m.id));
});

/* ---------- Sélection groupée ---------- */
test("selectionGroupee applique le mode à tous les enfants", () => {
  const { api } = construireContexte();
  api.familleId = "f"; api.lierEtat(api.etatVierge());
  const jour = api.aujourdHui ? api.aujourdHui() : null;
  // « tous » : chaque enfant a toutes les missions
  api.selectionGroupee("tous");
  const tout = api.MISSIONS.length;
  Object.values(api.etat.enfants).forEach(enf => {
    const plan = api.planEffectif(enf, "2999-01-01"); // un jour très postérieur
    assert.strictEqual(plan.length, tout);
  });
  // « aucun » : plan vide
  api.selectionGroupee("aucun");
  Object.values(api.etat.enfants).forEach(enf => {
    assert.strictEqual(api.planEffectif(enf, "2999-01-01").length, 0);
  });
});

/* ---------- Plan « jours suivants » ---------- */
test("basculerPlan retire une mission pour ce jour ET les suivants", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  const etat = api.etatVierge();
  api.lierEtat(etat);
  const enf = api.enfantActif();
  const cible = api.idsDefaut(enf)[0];
  api.basculerPlan(enf, "2026-06-16", cible);
  const plan = api.planEffectif(enf, "2026-06-20");
  assert.ok(!plan.includes(cible), "la mission retirée ne doit plus apparaître les jours suivants");
});

test("le choix parental fait foi, même au-delà de l'âge conseillé", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  const trop = api.MISSIONS.find(m => m.ageMin > api.age(enf));
  if (!trop) return; // catalogue sans mission plus âgée
  assert.ok(!api.idsDefaut(enf).includes(trop.id), "non cochée par défaut (hors âge)");
  api.basculerPlan(enf, "2026-06-16", trop.id);
  const actives = api.missionsActives(enf, trop.cat, "2026-06-16").map(m => m.id);
  assert.ok(actives.includes(trop.id), "activable par les parents au-delà de l'âge");
});

test("planEffectif prend le modèle le plus récent <= jour", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  enf.planJour = { "2026-06-10": ["a"], "2026-06-15": ["a", "b"] };
  assert.deepStrictEqual(api.planEffectif(enf, "2026-06-12"), ["a"]);
  assert.deepStrictEqual(api.planEffectif(enf, "2026-06-16"), ["a", "b"]);
  assert.strictEqual(api.planEffectif(enf, "2026-06-01"), null);
});

/* ---------- Écosystème : prérequis, coûts ---------- */
test("prereqManquants liste ce qui manque pour une espèce", () => {
  const { api } = construireContexte();
  const enf = enfantNeuf(api);
  // Cherche une espèce ayant des prérequis.
  let avecPrereq = null, tierTrouve = null;
  for (const t of api.TIERS_ECO) {
    const sp = t.especes.find(s => s.prereq && Object.keys(s.prereq).length);
    if (sp) { avecPrereq = sp; tierTrouve = t; break; }
  }
  assert.ok(avecPrereq, "le jeu doit contenir au moins une espèce à prérequis");
  const manquants = api.prereqManquants(enf, avecPrereq);
  assert.ok(manquants.length > 0);
  assert.strictEqual(api.especeDebloquee(enf, avecPrereq), false);
});

test("creerEspece refuse sans les gouttes nécessaires", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  // Espèce de base (sans prérequis) du premier tier.
  const tier = api.TIERS_ECO[0];
  const sp = tier.especes.find(s => !s.prereq || !Object.keys(s.prereq).length);
  enf.gouttes = 0;
  api.creerEspece(tier, sp);
  assert.strictEqual(api.nbEspece(enf, sp.id), 0, "aucune création sans gouttes");
});

test("creerEspece dépense les gouttes et ajoute l'être vivant", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  const tier = api.TIERS_ECO[0];
  const sp = tier.especes.find(s => !s.prereq || !Object.keys(s.prereq).length);
  enf.gouttes = sp.cout + 5;
  api.creerEspece(tier, sp);
  assert.strictEqual(api.nbEspece(enf, sp.id), 1);
  assert.strictEqual(enf.gouttes, 5);
});

/* ---------- Cartes surprises (objectifs d'équipe) ---------- */
test("un état vierge contient les cartes surprises par défaut (sans progression)", () => {
  const { api } = construireContexte();
  const cartes = api.etatVierge().cartesSurprises;
  assert.ok(Array.isArray(cartes) && cartes.length >= 3);
  assert.strictEqual(cartes[0].recolte, 0);
  assert.strictEqual(cartes[0].debloquee, false);
});

test("normaliser seede les cartes surprises pour une famille existante", () => {
  const { api } = construireContexte();
  const n = api.normaliser({ enfants: { x: { prenom: "Z" } } });
  assert.ok(Array.isArray(n.cartesSurprises) && n.cartesSurprises.length >= 3);
});

test("le prix par défaut des cartes = nb d'enfants × 50/200/1000", () => {
  const { api } = construireContexte();
  // Famille de 2 enfants.
  const n = api.normaliser({ enfants: { a: { prenom: "A" }, b: { prenom: "B" } } });
  const couts = n.cartesSurprises.map(c => c.cout);
  assert.strictEqual(couts[0], 100);
  assert.strictEqual(couts[1], 400);
  assert.strictEqual(couts[2], 2000);
});

test("migration douce : un ancien prix par défaut non utilisé est recalculé", () => {
  const { api } = construireContexte();
  const brut = { enfants: { a: { prenom: "A" }, b: { prenom: "B" } },
    cartesSurprises: [{ id: "cs_cine", emoji: "🍿", titre: "x", activite: "y", cout: 15, recolte: 0, dons: {}, debloquee: false }] };
  const n = api.normaliser(brut);
  assert.strictEqual(n.cartesSurprises[0].cout, 100); // 2 enfants × 50
});

test("migration douce : un prix personnalisé ou entamé n'est PAS recalculé", () => {
  const { api } = construireContexte();
  const brut = { enfants: { a: { prenom: "A" } },
    cartesSurprises: [{ id: "cs_cine", emoji: "🍿", titre: "x", activite: "y", cout: 99, recolte: 0, dons: {}, debloquee: false }] };
  assert.strictEqual(api.normaliser(brut).cartesSurprises[0].cout, 99);
});

test("donnerCarte dépense les cœurs et fait progresser la récolte commune", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  enf.coeurs = 10;
  const carte = api.cartesSurprises()[0];
  api.donnerCarte(carte.id, 4);
  assert.strictEqual(enf.coeurs, 6);
  assert.strictEqual(api.trouverCarteSurprise(carte.id).recolte, 4);
  assert.strictEqual(api.trouverCarteSurprise(carte.id).dons[enf.id], 4);
});

test("donnerCarte cumule les dépenses collectives (donsTotal)", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  enf.coeurs = 10;
  api.donnerCarte(api.cartesSurprises()[0].id, 4);
  assert.strictEqual(enf.donsTotal, 4);
});

test("acheterOption cumule les dépenses individuelles (avatarTotal)", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  enf.coeurs = 10;
  api.acheterOption("chapeau", { id: "couronne", cout: 6 });
  assert.strictEqual(enf.avatarTotal, 6);
});

test("donnerCarte ne dépense pas le total cumulé (coeursTotal)", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  enf.coeurs = 10; enf.coeursTotal = 20;
  api.donnerCarte(api.cartesSurprises()[0].id, 5);
  assert.strictEqual(enf.coeursTotal, 20);
});

test("donnerCarte refuse au-delà des cœurs disponibles", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  enf.coeurs = 2;
  const carte = api.cartesSurprises()[0];
  api.donnerCarte(carte.id, 5);
  assert.strictEqual(enf.coeurs, 2);
  assert.strictEqual(api.trouverCarteSurprise(carte.id).recolte, 0);
});

test("donnerCarte plafonne au prix et débloque la carte", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  const carte = api.cartesSurprises()[0];
  enf.coeurs = carte.cout + 10;
  api.donnerCarte(carte.id, carte.cout + 10);   // on essaie de trop donner
  const c = api.trouverCarteSurprise(carte.id);
  assert.strictEqual(c.recolte, carte.cout);    // plafonné au prix
  assert.strictEqual(c.debloquee, true);
  assert.strictEqual(enf.coeurs, 10);           // seul le nécessaire a été pris
});

test("plusieurs enfants contribuent à la même carte (collaboration)", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  const etat = api.etatVierge();
  api.lierEtat(etat);
  const ids = Object.keys(etat.enfants);
  const carte = api.cartesSurprises()[0];
  etat.enfants[ids[0]].coeurs = 5;
  etat.enfants[ids[1]].coeurs = 5;
  etat.enfantActif = ids[0]; api.donnerCarte(carte.id, 5);
  etat.enfantActif = ids[1]; api.donnerCarte(carte.id, 3);
  const c = api.trouverCarteSurprise(carte.id);
  assert.strictEqual(c.recolte, 8);
  assert.strictEqual(c.dons[ids[0]], 5);
  assert.strictEqual(c.dons[ids[1]], 3);
});

test("les parents peuvent ajouter, modifier et supprimer une carte", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const avant = api.cartesSurprises().length;
  api.ajouterCarteSurprise("🎲", "Soirée jeux", "On sort les jeux de société", 12);
  assert.strictEqual(api.cartesSurprises().length, avant + 1);
  const ajoutee = api.cartesSurprises()[api.cartesSurprises().length - 1];
  assert.strictEqual(ajoutee.cout, 12);
  api.modifierCarteSurprise(ajoutee.id, "cout", 20);
  assert.strictEqual(api.trouverCarteSurprise(ajoutee.id).cout, 20);
  api.supprimerCarteSurprise(ajoutee.id);
  assert.strictEqual(api.cartesSurprises().length, avant);
});

test("les cartes sont en mode mystère (revele=false) par défaut", () => {
  const { api } = construireContexte();
  assert.strictEqual(api.etatVierge().cartesSurprises[0].revele, false);
});

test("on peut rendre une carte visible (revele) puis la remasquer", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const id = api.cartesSurprises()[0].id;
  api.modifierCarteSurprise(id, "revele", true);
  assert.strictEqual(api.trouverCarteSurprise(id).revele, true);
  api.modifierCarteSurprise(id, "revele", false);
  assert.strictEqual(api.trouverCarteSurprise(id).revele, false);
});

test("ajouterCarteSurprise respecte le paramètre revele", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  api.ajouterCarteSurprise("🎲", "Soirée jeux", "desc", 12, true);
  const c = api.cartesSurprises()[api.cartesSurprises().length - 1];
  assert.strictEqual(c.revele, true);
});

test("deplacerCarteSurprise change l'ordre des cartes", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const ids = api.cartesSurprises().map(c => c.id);
  api.deplacerCarteSurprise(ids[0], 1);        // descendre la 1ʳᵉ
  assert.strictEqual(api.cartesSurprises()[0].id, ids[1]);
  assert.strictEqual(api.cartesSurprises()[1].id, ids[0]);
  api.deplacerCarteSurprise(ids[0], -1);       // la remonter
  assert.strictEqual(api.cartesSurprises()[0].id, ids[0]);
});

test("deplacerCarteSurprise ignore les déplacements hors limites", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const ids = api.cartesSurprises().map(c => c.id);
  api.deplacerCarteSurprise(ids[0], -1);       // déjà en haut : pas de changement
  assert.strictEqual(api.cartesSurprises()[0].id, ids[0]);
});

test("reinitCarteSurprise remet la carte à zéro pour la rejouer", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  const carte = api.cartesSurprises()[0];
  enf.coeurs = carte.cout;
  api.donnerCarte(carte.id, carte.cout);
  assert.strictEqual(api.trouverCarteSurprise(carte.id).debloquee, true);
  api.reinitCarteSurprise(carte.id);
  const c = api.trouverCarteSurprise(carte.id);
  assert.strictEqual(c.recolte, 0);
  assert.strictEqual(c.debloquee, false);
  assert.deepStrictEqual(Object.keys(c.dons), []);
});

/* ---------- Défis réparation (toggle 1 h) ---------- */
test("un défi réparation crédite puis s'annule (toggle) dans l'heure", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  const d = api.DEFIS_REPARATION[0];
  const avant = enf.coeurs;
  api.defiReparation(d);
  assert.strictEqual(enf.coeurs, avant + d.bonus);
  assert.strictEqual(api.reparationActive(enf, d.id), true);
  api.defiReparation(d);   // 2e clic dans l'heure = annulation
  assert.strictEqual(enf.coeurs, avant);
  assert.strictEqual(api.reparationActive(enf, d.id), false);
});

test("après une heure, le défi réparation est de nouveau disponible", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  const d = api.DEFIS_REPARATION[0];
  api.defiReparation(d);                 // crédite (bonus une 1re fois)
  enf.reparations[d.id] = Date.now() - 2 * 60 * 60 * 1000;  // simulate 2 h plus tard
  assert.strictEqual(api.reparationActive(enf, d.id), false);
  const avant = enf.coeurs;
  api.defiReparation(d);                 // re-crédite de nouveaux points
  assert.strictEqual(enf.coeurs, avant + d.bonus);
});

/* ---------- Badges ---------- */
test("verifierBadges attribue le badge cœur dès 10 cœurs cumulés", () => {
  const { api } = construireContexte();
  const enf = enfantNeuf(api);
  enf.coeursTotal = 12;
  api.verifierBadges(enf);
  assert.ok(enf.badges.find(b => b.id === "coeur10"));
});

test("verifierBadges ne redonne pas un badge retiré par un parent", () => {
  const { api } = construireContexte();
  const enf = enfantNeuf(api);
  enf.coeursTotal = 60;
  enf.badgesRetires = ["coeur50"];
  api.verifierBadges(enf);
  assert.ok(!enf.badges.find(b => b.id === "coeur50"), "un badge retiré ne revient pas");
});

/* ---------- Avatar ---------- */
test("acheterOption refuse sans assez de cœurs et n'équipe pas", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  enf.coeurs = 0;
  const avant = enf.avatar.chapeau;
  api.acheterOption("chapeau", { id: "couronne", cout: 99 });
  assert.strictEqual(enf.coeurs, 0);
  assert.ok(!enf.debloque.includes("chapeau:couronne"));
  assert.strictEqual(enf.avatar.chapeau, avant);
});

test("acheterOption débloque, dépense puis équipe avec assez de cœurs", () => {
  const { api } = construireContexte();
  api.familleId = "f";
  api.lierEtat(api.etatVierge());
  const enf = api.enfantActif();
  enf.coeurs = 10;
  api.acheterOption("chapeau", { id: "couronne", cout: 6 });
  assert.strictEqual(enf.coeurs, 4);
  assert.ok(enf.debloque.includes("chapeau:couronne"));
  assert.strictEqual(enf.avatar.chapeau, "couronne");
});

/* ---------- Liste d'attente : vagues d'invitation ---------- */
// Extrait une fonction nommée d'un fichier source et l'évalue avec un contexte
// donné. Permet de tester la logique pure de js/auth.js, que le harnais ne
// charge pas (auth.js dépend du réseau et du DOM).
function fonctionDeSource(fichier, nom, contexte) {
  const fs = require("fs"), path = require("path"), vm = require("vm");
  const src = fs.readFileSync(path.join(__dirname, "..", fichier), "utf8");
  const debut = src.indexOf("function " + nom + "(");
  assert.notStrictEqual(debut, -1, "fonction introuvable : " + nom);
  // On avance jusqu'à l'accolade fermante correspondante.
  let i = src.indexOf("{", debut), profondeur = 0, fin = -1;
  for (let j = i; j < src.length; j++) {
    if (src[j] === "{") profondeur++;
    else if (src[j] === "}") { profondeur--; if (!profondeur) { fin = j + 1; break; } }
  }
  assert.notStrictEqual(fin, -1, "corps non délimité : " + nom);
  const ctx = vm.createContext(Object.assign({}, contexte));
  vm.runInContext(src.slice(debut, fin) + "\n;__f = " + nom + ";", ctx);
  return ctx.__f;
}

test("vagues : le mode d'inscription se pilote depuis la configuration", () => {
  const faire = (cfg) => fonctionDeSource("js/auth.js", "inscriptionsOuvertes",
    { configApp: cfg, INSCRIPTIONS_OUVERTES: true })();
  assert.strictEqual(faire({ inscriptions: "vagues" }), false, "« vagues » ferme les inscriptions");
  assert.strictEqual(faire({ inscriptions: "ouvertes" }), true, "« ouvertes » les rouvre");
  // Repli : sans réglage, rien ne change pour les familles existantes.
  assert.strictEqual(faire({}), true, "sans réglage, on garde la valeur de repli");
  assert.strictEqual(faire({ inscriptions: "  vagues  " }), false, "les espaces ne doivent pas tromper");
});

test("vagues : la taille d'une vague est bornée et retombe sur 20", () => {
  const taille = (cfg) => fonctionDeSource("js/auth.js", "tailleVague", { configApp: cfg })();
  assert.strictEqual(taille({}), 20, "défaut : 20 familles par mois");
  assert.strictEqual(taille({ vague_taille: "5" }), 5);
  assert.strictEqual(taille({ vague_taille: "0" }), 20, "0 n'a pas de sens : on reprend 20");
  assert.strictEqual(taille({ vague_taille: "-3" }), 20);
  assert.strictEqual(taille({ vague_taille: "abc" }), 20);
  assert.strictEqual(taille({ vague_taille: "9999" }), 200, "plafond : 200");
});

test("vagues : les modèles d'e-mail n'attendent que le lien fourni par le code", () => {
  const { api } = construireContexte();
  const fs = require("fs"), path = require("path");
  const auth = fs.readFileSync(path.join(__dirname, "..", "js", "auth.js"), "utf8");
  ["m_waitlist_invit", "m_waitlist_relance"].forEach(id => {
    const m = api.mailCroissance(id);
    assert.ok(m, "modèle absent : " + id);
    const mentions = Array.from(new Set(
      ((m.corps + " " + m.sujet).match(/\{(\w+)\}/g) || []).map(x => x.slice(1, -1))));
    // Chaque mention doit être alimentée : sinon l'e-mail partirait avec un trou.
    mentions.forEach(k => assert.strictEqual(k, "lien_invitation",
      `${id} attend {${k}}, que le code ne fournit pas`));
    assert.ok(mentions.includes("lien_invitation"), id + " doit porter le lien personnel");
  });
  // Le code passe bien cette valeur pour les deux envois.
  assert.strictEqual((auth.match(/lien_invitation: lienVague\(cand\.token\)/g) || []).length, 2,
    "les deux envois de vague doivent fournir le lien personnel");
});

test("vagues : un jeton de vague suffit à autoriser la création d'une famille", () => {
  const autorisee = (stock, ouvertes) => fonctionDeSource("js/auth.js", "inscriptionAutorisee", {
    inscriptionsOuvertes: () => ouvertes,
    INVITE_KEY: "i", PARRAIN_KEY: "p", PARRAIN_CODE_KEY: "pc", VAGUE_KEY: "v",
    localStorage: { getItem: (k) => (k in stock ? stock[k] : null) }
  })();
  assert.strictEqual(autorisee({}, false), false, "inscriptions fermées, aucun jeton : refus");
  assert.strictEqual(autorisee({ v: "abc" }, false), true, "jeton de vague : accepté");
  assert.strictEqual(autorisee({ i: "abc" }, false), true, "invitation : toujours acceptée");
  assert.strictEqual(autorisee({ p: "abc" }, false), true, "parrainage : toujours accepté");
  assert.strictEqual(autorisee({ pc: "K7M2QX" }, false), true, "code permanent : accepté");
  assert.strictEqual(autorisee({}, true), true, "inscriptions ouvertes : tout le monde entre");
});

test("vagues : le chantier « Liste d'attente » est fait, sauf la décision d'ouvrir", () => {
  const { api } = construireContexte();
  const ch = api.CROISSANCE_CHANTIERS.find(x => x.id === "c_waitlist");
  assert.ok(ch, "chantier c_waitlist introuvable");
  const restantes = ch.etapes.filter(e => !e.fait);
  assert.strictEqual(restantes.length, 1, "une seule étape doit rester");
  assert.strictEqual(restantes[0].id, "c_waitlist_5",
    "la seule étape restante est la décision d'ouverture publique, qui revient au fondateur");
  // Plus aucune étape ne demande d'appeler les familles : le projet reste discret.
  ch.etapes.forEach(e => assert.strictEqual(/^appeler/i.test(e.titre.trim()), false,
    "une étape demande encore d'appeler : " + e.id));
  const ecoute = ch.etapes.find(e => e.id === "c_waitlist_4");
  assert.ok(/pas d'appel/i.test(ecoute.detail),
    "l'étape d'écoute doit dire explicitement qu'il n'y a pas d'appel à passer");
});

test("vagues : libellés de l'onglet traduits dans les 4 langues", () => {
  const { api } = construireContexte();
  const cles = ["vag.titre", "vag.sous", "vag.switch", "vag.mode_ouvert", "vag.mode_vagues",
                "vag.taille", "vag.taille_aide", "vag.kpi_invites", "vag.kpi_taux",
                "vag.kpi_taux_p", "vag.kpi_attente", "vag.critere_ok", "vag.critere_non",
                "vag.rien_a_inviter", "vag.prochaine", "vag.jours", "vag.envoyer",
                "vag.confirm", "vag.relances", "vag.relancer"];
  const manquantes = [];
  Object.keys(api.LANGUES).forEach(lg => cles.forEach(k => {
    const v = api.I18N[lg][k];
    if (typeof v !== "string" || !v.length) manquantes.push(lg + " → " + k);
  }));
  assert.strictEqual(manquantes.length, 0, manquantes.slice(0, 8).join(", "));
  // Les textes à variable doivent conserver leur mention dans chaque langue.
  Object.keys(api.LANGUES).forEach(lg => {
    assert.ok(api.I18N[lg]["vag.taille_aide"].includes("{n}"), lg + " : {n} perdu");
    assert.ok(api.I18N[lg]["vag.critere_ok"].includes("{taux}"), lg + " : {taux} perdu");
    assert.ok(api.I18N[lg]["vag.envoyer"].includes("{n}"), lg + " : {n} perdu");
  });
});

/* ---------- Conformité & retours : aucune perte, aucune donnée superflue ---------- */
test("minimisation : l'emoji d'enfant n'est plus conservé dans l'état", () => {
  const { api } = construireContexte();
  const e = api.etatVierge();
  Object.values(e.enfants).forEach(enf => assert.strictEqual("emoji" in enf, false,
    "un enfant tout neuf ne doit plus porter d'emoji"));
  // Un ancien état qui en contenait un doit le perdre à la normalisation.
  const ancien = JSON.parse(JSON.stringify(e));
  const id = Object.keys(ancien.enfants)[0];
  ancien.enfants[id].emoji = "🧒";
  const n = api.normaliser(ancien);
  assert.strictEqual("emoji" in n.enfants[id], false,
    "normaliser doit supprimer l'emoji hérité, pas le conserver");
});

test("minimisation : seuls le mois et l'année de naissance sont stockés", () => {
  const fs = require("fs"), path = require("path");
  const ui = fs.readFileSync(path.join(__dirname, "..", "js", "ui.js"), "utf8");
  // Le champ est de type « month » et on ne recompose jamais un jour réel.
  assert.ok(/iDate\.type = "month"/.test(ui), "la date de naissance doit être un champ mois");
  assert.ok(/majEnfant\(enf\.id, "naissance", v \? v \+ "-01"/.test(ui),
    "le jour stocké doit toujours être 01, jamais une vraie date");
});

test("retours : un message non envoyé est mis en file locale, jamais perdu", () => {
  const fs = require("fs"), path = require("path");
  const ui = fs.readFileSync(path.join(__dirname, "..", "js", "ui.js"), "utf8");
  assert.ok(/if \(!ok\) fileRetoursEcrire\(fileRetours\(\)\.concat\(\[retour\]\)\)/.test(ui),
    "un échec d'enregistrement doit alimenter la file locale");
  const auth = fs.readFileSync(path.join(__dirname, "..", "js", "auth.js"), "utf8");
  assert.ok(/viderFileRetours\(\)/.test(auth),
    "la file locale doit être rejouée à l'ouverture de l'app");
  // Le module doit être ouvert à toutes les familles : un retour qu'on ne peut
  // pas donner est un retour perdu.
  assert.strictEqual(/estEarlyAdopter\(\)\) c\.appendChild\(blocFeedback\(\)\)/.test(ui), false,
    "le module de retours ne doit plus être réservé aux early adopters");
});

test("retours : la revue reprend tout ce qui n'est pas marqué « traité »", () => {
  const fs = require("fs"), path = require("path");
  const ui = fs.readFileSync(path.join(__dirname, "..", "js", "ui.js"), "utf8");
  assert.ok(/\(f\.status \|\| "nouveau"\) !== "traite"/.test(ui),
    "un retour seulement « lu » doit revenir à la revue suivante");
  assert.strictEqual(/liste = \(adminRetoursCache \|\| \[\]\)\.filter\(f => \(f\.status \|\| "nouveau"\) === "nouveau"\)/.test(ui), false,
    "la consigne ne doit plus se limiter aux retours « nouveaux »");
});

test("portabilité : l'export contient le compte, la famille et les retours", () => {
  const fs = require("fs"), path = require("path");
  const app = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8");
  ["compte", "famille", "retours", "etat"].forEach(k =>
    assert.ok(new RegExp("\\b" + k + "\\b").test(app.slice(app.indexOf("async function exporter"))),
      "l'export doit contenir « " + k + " »"));
  assert.ok(/sb\.rpc\("mes_retours"\)/.test(app), "l'export doit joindre les retours du parent");
});

test("portabilité : une sauvegarde ancienne comme récente reste restaurable", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  const etatSeul = JSON.parse(JSON.stringify(api.etat));
  // Ancien format : l'état à la racine du fichier.
  assert.strictEqual(api.restaurerSauvegarde(JSON.stringify(etatSeul)), true,
    "les fichiers exportés avant la mise en conformité doivent rester lisibles");
  // Nouveau format : l'état sous la clé « etat », à côté du compte et des retours.
  const complet = { exporte_le: "2026-07-26T00:00:00Z", compte: { email: "x@y.be" },
                    famille: { nom: "Test" }, retours: [], etat: etatSeul };
  assert.strictEqual(api.restaurerSauvegarde(JSON.stringify(complet)), true,
    "le nouvel export complet doit être restaurable");
  // Un fichier sans aucun enfant reste refusé.
  assert.strictEqual(api.restaurerSauvegarde(JSON.stringify({ etat: { enfants: {} } })), false);
});

test("conformité : le registre des traitements couvre l'essentiel", () => {
  const fs = require("fs"), path = require("path");
  const f = path.join(__dirname, "..", "REGISTRE-TRAITEMENTS.md");
  assert.ok(fs.existsSync(f), "REGISTRE-TRAITEMENTS.md doit exister");
  const r = fs.readFileSync(f, "utf8");
  ["Responsable du traitement", "Base légale", "Sous-traitants", "Conservation",
   "Supabase", "Vercel", "OVH", "72 heures"].forEach(k =>
    assert.ok(r.includes(k), "le registre doit mentionner « " + k + " »"));
});

test("accessibilité : les boutons-icônes portent un nom accessible", () => {
  const { api } = construireContexte();
  const fs = require("fs"), path = require("path");
  const ui = fs.readFileSync(path.join(__dirname, "..", "js", "ui.js"), "utf8");
  // Aucun bouton fait d'un seul symbole ne doit rester sans aria-label.
  const motif = /el\("button", "[^"]*", "([^a-zA-Z0-9"]{1,4})"\);(?!\s*\w+\.setAttribute\("aria-label")/g;
  const orphelins = [];
  let m;
  while ((m = motif.exec(ui))) orphelins.push(m[1]);
  assert.strictEqual(orphelins.length, 0,
    "boutons-icônes sans nom accessible : " + orphelins.join(" "));
  // Et les libellés existent dans les quatre langues.
  const cles = ["a11y.supprimer", "a11y.modifier", "a11y.precedent", "a11y.suivant",
                "a11y.ajouter_un", "a11y.retirer_un", "a11y.valider"];
  Object.keys(api.LANGUES).forEach(lg => cles.forEach(k =>
    assert.ok(typeof api.I18N[lg][k] === "string" && api.I18N[lg][k].length,
      "manque " + lg + " → " + k)));
});

/* ---------- Modèle non marchand : coût, plafond, promesses ---------- */
test("plafond : la valeur par défaut est 800 familles et se règle par configuration", () => {
  const plafond = (cfg) => fonctionDeSource("js/auth.js", "plafondFamilles", { configApp: cfg })();
  assert.strictEqual(plafond({}), 800, "défaut : 800 familles");
  assert.strictEqual(plafond({ plafond_familles: "1500" }), 1500);
  assert.strictEqual(plafond({ plafond_familles: "0" }), 800, "0 n'a pas de sens");
  assert.strictEqual(plafond({ plafond_familles: "abc" }), 800);
});

test("plafond : la protection s'applique même quand les e-mails sont coupés", () => {
  const fs = require("fs"), path = require("path");
  const auth = fs.readFileSync(path.join(__dirname, "..", "js", "auth.js"), "utf8");
  const debut = auth.indexOf("async function declencherEnvoisAuto");
  assert.notStrictEqual(debut, -1, "declencherEnvoisAuto introuvable");
  const corps = auth.slice(debut, auth.indexOf("\n}", auth.indexOf("catch", debut)));
  const posPlafond = corps.indexOf("appliquerPlafond(");
  const posGarde = corps.indexOf("mailsAutoArmes(");
  assert.ok(posPlafond > -1, "le plafond doit être vérifié au démarrage");
  assert.ok(posGarde > -1, "la garde des envois doit exister");
  assert.ok(posPlafond < posGarde,
    "le plafond est une protection, pas une communication : il doit s'appliquer avant toute garde liée aux e-mails");
  // Une pause suspend tout, y compris le basculement de plafond.
  const posPause = corps.indexOf("enVacances()");
  assert.ok(posPause > -1 && posPause < posPlafond,
    "le mode vacances doit court-circuiter avant le reste");
});

test("coût : le total annuel est cohérent avec le détail affiché", () => {
  const fs = require("fs"), path = require("path");
  const ui = fs.readFileSync(path.join(__dirname, "..", "js", "ui.js"), "utf8");
  const bloc = ui.slice(ui.indexOf("const COUT_ANNUEL"), ui.indexOf("function coutAnnuelCents"));
  const montants = (bloc.match(/montant:\s*(\d+)/g) || []).map(s => parseInt(s.split(":")[1], 10));
  assert.strictEqual(montants.length, 4, "quatre postes de frais attendus");
  assert.strictEqual(montants.reduce((a, b) => a + b, 0), 2700,
    "le total doit valoir 27 € (1500 + 1200 + 0 + 0 centimes)");
});

test("modèle : gratuité présente, cadre des dons et préavis sont publiés", () => {
  const fs = require("fs"), path = require("path");
  const racine = path.join(__dirname, "..");
  const legal = fs.readFileSync(path.join(racine, "mentions-legales.html"), "utf8");
  ["Gratuité", "sans contrepartie", "Plafond d'utilisateurs",
   "Continuité et fin du service", "deux mois"].forEach(k =>
    assert.ok(legal.includes(k), "les mentions légales doivent couvrir « " + k + " »"));
  // Doctrine : on décrit l'état présent, on ne promet pas l'avenir. Ce qui
  // protège vraiment les familles n'est pas une promesse — c'est le préavis
  // et l'export permanent, qui eux doivent rester écrits.
  assert.ok(/aucun engagement/i.test(legal),
    "les mentions légales doivent dire qu'aucun engagement n'est pris sur l'avenir");
  const faqTxt = fs.readFileSync(path.join(racine, "faq.html"), "utf8");
  [["mentions légales", legal], ["FAQ", faqTxt]].forEach(([nom, txt]) =>
    assert.ok(!/gratuit[^.]{0,40}le restera|promesse de gratuité/i.test(txt),
      "promesse de gratuité future résiduelle dans : " + nom));
  const faq = fs.readFileSync(path.join(racine, "faq.html"), "utf8");
  ["À quoi servent les dons", "liste d'attente", 'id="dons"'].forEach(k =>
    assert.ok(faq.includes(k), "la FAQ doit couvrir « " + k + " »"));
  // Le bouton de don doit renvoyer vers cette explication.
  const ui = fs.readFileSync(path.join(racine, "js", "ui.js"), "utf8");
  assert.ok(ui.includes('faq.html#dons'), "le bloc de don doit pointer vers l'explication");
});

test("modèle : libellés de coût et de plafond traduits dans les 4 langues", () => {
  const { api } = construireContexte();
  const cles = ["cout.titre", "cout.sous", "cout.total", "cout.gratuit", "cout.dons",
                "cout.couverture", "cout.couverture_p", "cout.plafond", "cout.plafond_p",
                "cout.base_pleine", "cout.base_pleine_p", "cout.plafond_libre",
                "cout.plafond_atteint", "cout.plafond_reglage", "cout.plafond_aide",
                "cout.equilibre_ok", "cout.equilibre_non", "cap.bascule",
                "don.transparence", "don.en_savoir"];
  const manquantes = [];
  Object.keys(api.LANGUES).forEach(lg => cles.forEach(k => {
    const v = api.I18N[lg][k];
    if (typeof v !== "string" || !v.length) manquantes.push(lg + " → " + k);
  }));
  assert.strictEqual(manquantes.length, 0, manquantes.slice(0, 8).join(", "));
  Object.keys(api.LANGUES).forEach(lg => {
    assert.ok(api.I18N[lg]["cout.plafond_libre"].includes("{reste}"), lg + " : {reste} perdu");
    assert.ok(api.I18N[lg]["cout.base_pleine_p"].includes("{u}"), lg + " : {u} perdu");
  });
});

/* ---------- Décisions & avertissements ---------- */
test("décisions : chacune est bien formée et porte une seule recommandation", () => {
  const { api } = construireContexte();
  const vus = new Set();
  assert.ok(api.CROISSANCE_DECISIONS.length >= 3, "au moins trois décisions");
  api.CROISSANCE_DECISIONS.forEach(d => {
    assert.ok(d.id && d.titre && d.contexte, "décision incomplète : " + d.id);
    assert.ok(!vus.has(d.id), "identifiant en double : " + d.id);
    vus.add(d.id);
    assert.strictEqual(typeof d.declencheur, "function", d.id + " doit porter un déclencheur");
    assert.ok(d.options.length >= 2, d.id + " doit offrir plusieurs réponses possibles");
    const reco = d.options.filter(o => o.recommande);
    assert.strictEqual(reco.length, 1, d.id + " doit avoir exactement une option recommandée");
    d.options.forEach(o => {
      assert.ok(o.id && o.titre && o.detail, "option incomplète dans " + d.id);
      assert.ok(!vus.has(d.id + ":" + o.id), "option en double : " + d.id + ":" + o.id);
      vus.add(d.id + ":" + o.id);
    });
    assert.strictEqual(api.optionRecommandee(d).id, reco[0].id);
  });
});

test("décisions : rien ne s'affiche tant que la situation ne l'appelle pas", () => {
  const { api } = construireContexte();
  // Projet tout neuf, tout va bien : aucune décision ne doit s'imposer.
  const calme = { familles: 1, plafond: 800, plafondAtteint: false, partBase: 3,
                  envoisArmes: true, inscriptionsOuvertes: true, tauxVague: 0,
                  tauxActivation: 0, donsCents: 0, coutCents: 2700 };
  assert.strictEqual(api.decisionsEnAttente(calme, {}).length, 0,
    "aucune décision ne doit apparaître sans raison");
});

test("décisions : chaque situation ouvre bien la question attendue", () => {
  const { api } = construireContexte();
  const base = { familles: 10, plafond: 800, plafondAtteint: false, partBase: 3,
                 envoisArmes: true, inscriptionsOuvertes: true, tauxVague: 0,
                 tauxActivation: 0, donsCents: 0, coutCents: 2700 };
  const ids = (ctx) => api.decisionsEnAttente(ctx, {}).map(d => d.id);

  assert.ok(ids(Object.assign({}, base, { envoisArmes: false })).includes("d_envois"),
    "envois coupés et familles présentes : on doit proposer de les armer");
  assert.ok(ids(Object.assign({}, base, { plafondAtteint: true })).includes("d_plafond"),
    "plafond atteint : la question doit s'ouvrir");
  assert.ok(ids(Object.assign({}, base, { partBase: 75 })).includes("d_base"),
    "base à 75 % : la question doit s'ouvrir");
  assert.ok(ids(Object.assign({}, base, { donsCents: 5000 })).includes("d_dons"),
    "dons supérieurs aux frais : la question doit s'ouvrir");
  assert.ok(ids(Object.assign({}, base,
      { inscriptionsOuvertes: false, tauxVague: 45, tauxActivation: 60 })).includes("d_ouverture"),
    "les deux critères atteints : on doit proposer d'ouvrir");
  // Les critères à moitié atteints ne suffisent pas.
  assert.strictEqual(ids(Object.assign({}, base,
      { inscriptionsOuvertes: false, tauxVague: 45, tauxActivation: 20 })).includes("d_ouverture"), false,
    "activation insuffisante : on ne propose pas d'ouvrir");
});

test("décisions : une décision tranchée ne revient plus", () => {
  const { api } = construireContexte();
  const ctx = { familles: 10, plafond: 800, plafondAtteint: true, partBase: 3,
                envoisArmes: true, inscriptionsOuvertes: true, tauxVague: 0,
                tauxActivation: 0, donsCents: 0, coutCents: 2700 };
  assert.ok(api.decisionsEnAttente(ctx, {}).map(d => d.id).includes("d_plafond"));
  assert.strictEqual(api.decisionsEnAttente(ctx, { d_plafond: "rester" }).map(d => d.id).includes("d_plafond"),
    false, "une fois tranchée, la question ne doit plus se poser");
});

test("avertissements : un même changement ne peut donner qu'un seul e-mail", () => {
  const fs = require("fs"), path = require("path");
  const auth = fs.readFileSync(path.join(__dirname, "..", "js", "auth.js"), "utf8");
  const bloc = auth.slice(auth.indexOf("async function notifierAdmin"));
  // Le verrou est en base, pas en localStorage : il tient entre appareils.
  assert.ok(/changement_noter/.test(bloc), "le changement doit être noté en base");
  assert.ok(/if \(!nouveau\) return false/.test(bloc),
    "un changement déjà noté ne doit pas redonner lieu à un e-mail");
  assert.ok(/changement_notifie/.test(bloc), "l'envoi réussi doit être marqué");
  // L'e-mail porte le lien vers la page des décisions.
  assert.ok(/lienCroissance\(\)/.test(bloc), "l'e-mail doit pointer vers la page Croissance");
  assert.ok(/recommandé/.test(bloc), "l'e-mail doit signaler l'option recommandée");
  // Une pause suspend aussi les avertissements.
  assert.ok(/enVacances\(\)/.test(bloc), "le mode vacances doit suspendre les avertissements");
});

test("pause : le mode vacances s'ouvre et se referme sur une date", () => {
  const enVac = (cfg) => fonctionDeSource("js/auth.js", "enVacances", { configApp: cfg })();
  const hier = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const demain = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const auj = new Date().toISOString().slice(0, 10);
  assert.strictEqual(enVac({}), false, "sans date, pas de pause");
  assert.strictEqual(enVac({ vacances_jusqua: "" }), false);
  assert.strictEqual(enVac({ vacances_jusqua: demain }), true, "date future : en pause");
  assert.strictEqual(enVac({ vacances_jusqua: auj }), true, "le dernier jour est inclus");
  assert.strictEqual(enVac({ vacances_jusqua: hier }), false, "date passée : la pause est finie");
});

test("avertissements : libellés traduits dans les 4 langues", () => {
  const { api } = construireContexte();
  const cles = ["dec.titre", "dec.sous", "dec.aucune", "dec.recommande", "dec.confirm",
                "dec.enregistree", "dec.prises", "dec.revenir", "dec.revenir_confirm",
                "dec.journal", "dec.journal_sous", "dec.chg_notifie", "dec.chg_non_notifie",
                "pause.titre", "pause.sous", "pause.notifs", "pause.notifs_on",
                "pause.notifs_off", "pause.jusqua", "pause.active", "pause.inactive"];
  const manquantes = [];
  Object.keys(api.LANGUES).forEach(lg => cles.forEach(k => {
    const v = api.I18N[lg][k];
    if (typeof v !== "string" || !v.length) manquantes.push(lg + " → " + k);
  }));
  assert.strictEqual(manquantes.length, 0, manquantes.slice(0, 8).join(", "));
  Object.keys(api.LANGUES).forEach(lg => {
    assert.ok(api.I18N[lg]["dec.confirm"].includes("{choix}"), lg + " : {choix} perdu");
    assert.ok(api.I18N[lg]["pause.active"].includes("{jour}"), lg + " : {jour} perdu");
    assert.ok(api.I18N[lg]["dec.prises"].includes("{n}"), lg + " : {n} perdu");
  });
});

/* ---------- Aucun envoi hors production ---------- */
test("production : les quatre domaines officiels, et eux seuls", () => {
  const estProd = (hote, cfg, natif) => fonctionDeSource("js/auth.js", "estProduction", {
    location: { hostname: hote },
    HOTES_PRODUCTION: ["famiteam.com", "fami.team"],
    estAppNative: () => !!natif,
    hotesProduction: fonctionDeSource("js/auth.js", "hotesProduction", {
      configApp: cfg || {}, window: { KP_CONFIG: {} },
      HOTES_PRODUCTION: ["famiteam.com", "fami.team"]
    })
  })();
  ["famiteam.com", "www.famiteam.com", "fami.team", "www.fami.team"].forEach(h =>
    assert.strictEqual(estProd(h), true, "doit être la production : " + h));
  // Tout le reste est un aperçu : rien ne doit en partir.
  ["kidspositifs-git-dev-cedric.vercel.app", "kidspositifs-abc123.vercel.app",
   "localhost", "127.0.0.1", "", "dev.famiteam.com", "preview.fami.team",
   "famiteam.com.attaquant.net", "fami.team.evil.net", "notfamiteam.com",
   "famiteam.be"].forEach(h =>
    assert.strictEqual(estProd(h), false, "doit être considéré comme un aperçu : " + h));
  // La liste reste surchargeable si un domaine s'ajoute ou disparaît.
  assert.strictEqual(estProd("nouveau.be", { hote_prod: "nouveau.be, fami.team" }), true);
  assert.strictEqual(estProd("www.nouveau.be", { hote_prod: "nouveau.be, fami.team" }), true);
  assert.strictEqual(estProd("fami.team", { hote_prod: "nouveau.be, fami.team" }), true);
  assert.strictEqual(estProd("famiteam.com", { hote_prod: "nouveau.be, fami.team" }), false,
    "un domaine retiré de la liste ne doit plus compter comme production");
  // Un « www. » écrit dans la configuration ne doit pas casser la comparaison.
  assert.strictEqual(estProd("nouveau.be", { hote_prod: "www.nouveau.be" }), true);
  // Dans l'app native, il n'existe pas d'« aperçu » : le binaire installé
  // EST la production, quel que soit l'hôte (ou son absence) rapporté par
  // la WebView.
  assert.strictEqual(estProd("localhost", {}, true), true,
    "l'app native doit toujours être considérée comme la production");
  assert.strictEqual(estProd("", {}, true), true,
    "même sans hôte, l'app native doit être considérée comme la production");
});

test("production : le point de sortie des e-mails bloque par défaut", () => {
  const fs = require("fs"), path = require("path");
  const ui = fs.readFileSync(path.join(__dirname, "..", "js", "ui.js"), "utf8");
  const bloc = ui.slice(ui.indexOf("async function envoyerMailFn"));
  const corps = bloc.slice(0, bloc.indexOf("\n}"));
  assert.ok(/!payload\.interactif[\s\S]*?!estProduction\(\)/.test(corps),
    "hors production, seul un envoi interactif doit passer");
  assert.ok(corps.indexOf("bloque: true") < corps.indexOf("fetch("),
    "le blocage doit précéder l'appel réseau, pas le suivre");
});

test("production : les envois automatiques sortent avant de poser leurs verrous", () => {
  const fs = require("fs"), path = require("path");
  const auth = fs.readFileSync(path.join(__dirname, "..", "js", "auth.js"), "utf8");

  // notifierAdmin : sortir APRÈS avoir noté le changement condamnerait la
  // production à ne jamais le signaler (le verrou serait déjà consommé).
  const notif = auth.slice(auth.indexOf("async function notifierAdmin"));
  const corpsNotif = notif.slice(0, notif.indexOf("\n}"));
  assert.ok(corpsNotif.indexOf("!estProduction()") < corpsNotif.indexOf("changement_noter"),
    "le contrôle de production doit précéder la pose du verrou");

  // declencherEnvoisAuto : idem, avant le marqueur du jour et avant le plafond.
  const decl = auth.slice(auth.indexOf("async function declencherEnvoisAuto"));
  const corpsDecl = decl.slice(0, decl.indexOf("\n}", decl.indexOf("catch")));
  const posProd = corpsDecl.indexOf("!estProduction()");
  assert.ok(posProd > -1, "declencherEnvoisAuto doit vérifier la production");
  assert.ok(posProd < corpsDecl.indexOf("localStorage.setItem"),
    "sortir avant de marquer le jour, sinon la production perdrait son tour");
  assert.ok(posProd < corpsDecl.indexOf("appliquerPlafond("),
    "un aperçu ne doit pas fermer les inscriptions réelles");

  // Le plafond et les envois aux familles portent chacun leur propre garde.
  ["async function appliquerPlafond", "async function envoyerMailAuto"].forEach(sig => {
    const f = auth.slice(auth.indexOf(sig));
    assert.ok(/!estProduction\(\)/.test(f.slice(0, f.indexOf("\n}"))),
      sig + " doit refuser de s'exécuter hors production");
  });
});

test("production : les envois déclenchés par un clic restent possibles en aperçu", () => {
  const fs = require("fs"), path = require("path");
  const ui = fs.readFileSync(path.join(__dirname, "..", "js", "ui.js"), "utf8");
  // Exactement deux envois interactifs : le code PIN et le test d'envoi admin.
  // On ne compte que les lignes de code, pas le commentaire qui documente la règle.
  const marques = ui.split("\n").filter(l =>
    /interactif:\s*true/.test(l) && !/^\s*\*/.test(l)).length;
  assert.strictEqual(marques, 2,
    "seuls le code PIN et le test d'envoi doivent être marqués interactifs");
  assert.ok(/t\("pin\.reset_corps"[\s\S]{0,120}interactif: true/.test(ui),
    "le code PIN doit rester envoyable hors production");
  assert.ok(/mailtest_corps[\s\S]{0,120}interactif: true/.test(ui),
    "le test d'envoi doit rester utilisable hors production");
});

test("production : le bandeau d'aperçu est traduit dans les 4 langues", () => {
  const { api } = construireContexte();
  Object.keys(api.LANGUES).forEach(lg => {
    ["apercu.titre", "apercu.detail"].forEach(k =>
      assert.ok(typeof api.I18N[lg][k] === "string" && api.I18N[lg][k].length,
        "manque " + lg + " → " + k));
    assert.ok(api.I18N[lg]["apercu.detail"].includes("{hote}"), lg + " : {hote} perdu");
  });
});

/* ---------- Encodeur QR (Arbre des familles) ----------
 * Référence : la matrice ci-dessous a été produite par notre encodeur PUIS
 * vérifiée module par module contre `segno` (implémentation Python
 * indépendante), et le SVG correspondant a été décodé sans erreur par
 * OpenCV après rendu dans un navigateur sans affichage. Le cas retenu
 * (53 caractères) sature les 55 mots de données : aucun octet de bourrage
 * n'intervient, donc la comparaison ne laisse aucune latitude d'encodage.
 * Chaque ligne de 29 modules est écrite sur 8 chiffres hexadécimaux. */
const QR_TEMOIN = "1fd6db7f,10424941,1754925d,1756db5d,175db65d,10449241,1fd5557f,00024900," +
  "1e5b6d9d,0f16db75,0c524966,15b49251,15cadb2f,1e21b6c3,1354920b,0235248a,0f4db699,08ab6dae," +
  "124d24d0,0606493c,0ee76df4,0012db15,1fc24b56,10409113,174ad9fc,175db593,175c93a9,105d27da,1fd5b73a";

function qrEmpreinte(m) {
  return m.map(l => { let v = 0n; l.forEach(b => { v = (v << 1n) | BigInt(b); }); return v.toString(16).padStart(8, "0"); }).join(",");
}

test("QR : la matrice reproduit la référence vérifiée (segno + décodage OpenCV)", () => {
  const { api } = construireContexte();
  const m = api.qrMatrice("x".repeat(53), 3);
  assert.ok(m, "matrice absente");
  assert.strictEqual(m.length, 29, "la version 3 fait 29 modules de côté");
  assert.strictEqual(qrEmpreinte(m), QR_TEMOIN, "la matrice QR a changé : elle n'est plus celle qui a été validée");
});

test("QR : motifs de service conformes (repères, synchronisation, module sombre)", () => {
  const { api } = construireContexte();
  const m = api.qrMatrice("https://famiteam.com/?p=K7M2QX");
  // Les trois repères d'angle : centre sombre, anneau clair.
  [[0, 0], [0, 22], [22, 0]].forEach(([r, c]) => {
    assert.strictEqual(m[r + 3][c + 3], 1, `centre du repère (${r},${c})`);
    assert.strictEqual(m[r + 1][c + 1], 0, `anneau du repère (${r},${c})`);
  });
  // Séparateurs : la ligne 7 et la colonne 7 du repère haut-gauche sont claires.
  for (let i = 0; i <= 7; i++) { assert.strictEqual(m[7][i], 0); assert.strictEqual(m[i][7], 0); }
  // Synchronisation : alternance sur la ligne 6 et la colonne 6.
  for (let i = 8; i <= 20; i++) {
    assert.strictEqual(m[6][i], i % 2 === 0 ? 1 : 0, "ligne 6, colonne " + i);
    assert.strictEqual(m[i][6], i % 2 === 0 ? 1 : 0, "colonne 6, ligne " + i);
  }
  assert.strictEqual(m[21][8], 1, "le module toujours sombre doit rester sombre");
  assert.strictEqual(m[22][22], 1, "centre du motif d'alignement");
  // Aucune case ne doit rester indéterminée.
  m.forEach((l, i) => l.forEach((v, j) => assert.ok(v === 0 || v === 1, `module (${i},${j}) = ${v}`)));
});

test("QR : capacité respectée et repli propre au-delà", () => {
  const { api } = construireContexte();
  assert.strictEqual(api.QR_CAPACITE, 53);
  assert.ok(api.qrMatrice("x".repeat(53)), "53 caractères doivent tenir");
  assert.strictEqual(api.qrMatrice("x".repeat(54)), null, "54 caractères doivent être refusés");
  assert.strictEqual(api.qrSvg("x".repeat(54)), null, "le SVG doit valoir null plutôt que d'être tronqué");
});

test("QR : le SVG porte la zone de silence normalisée et reste autonome", () => {
  const { api } = construireContexte();
  const svg = api.qrSvg("https://famiteam.com/?p=K7M2QX", { classe: "arbre-qr" });
  assert.ok(svg.startsWith("<svg "), "doit être un SVG");
  assert.ok(svg.includes('viewBox="0 0 37 37"'), "29 modules + 4 de marge de chaque côté");
  assert.ok(svg.includes('class="arbre-qr"'), "classe transmise");
  assert.ok(!/https?:\/\/(?!www\.w3\.org)/.test(svg.replace(/\?p=[^"]*/g, "")),
    "aucune ressource externe ne doit être chargée");
  assert.ok(svg.includes('fill="#fff"') && svg.includes('fill="#000"'),
    "contraste maximal exigé par les lecteurs bon marché");
});

test("Arbre des familles : les libellés existent dans les 4 langues", () => {
  const { api } = construireContexte();
  const cles = ["arbre.titre", "arbre.modale_titre", "arbre.modale_note", "arbre.code_label",
    "arbre.qr_note", "arbre.partage", "arbre.attente", "arbre.indispo",
    "arbre.regenerer", "arbre.regenerer_conf", "arbre.regenere", "common.fermer"];
  Object.keys(api.LANGUES).forEach(lg => cles.forEach(k =>
    assert.ok(typeof api.I18N[lg][k] === "string" && api.I18N[lg][k].length, "manque " + lg + " → " + k)));
});

test("Arbre des familles : le quota hebdomadaire n'est plus annoncé nulle part", () => {
  const { api } = construireContexte();
  // Les parrainages sont illimités : promettre « 3 par semaine » serait faux.
  Object.keys(api.LANGUES).forEach(lg =>
    assert.ok(!/3 familles par semaine|3 families per week|3 families per week|3 Familien pro Woche/.test(api.I18N[lg]["parr.note"] || ""),
      lg + " : le quota de 3/semaine subsiste dans parr.note"));
});

/* ---------- Arbre des familles : paliers d'effort ---------- */
test("paliers : atteignables par tous, jamais perdus, et sans rang comparatif", () => {
  const { api } = construireContexte();
  assert.strictEqual(api.arbrePalier(0), 0, "aucune famille : aucun palier");
  assert.strictEqual(api.arbrePalier(1), 1);
  assert.strictEqual(api.arbrePalier(2), 1, "entre deux seuils, le palier reste acquis");
  assert.strictEqual(api.arbrePalier(3), 2);
  assert.strictEqual(api.arbrePalier(4), 2);
  assert.strictEqual(api.arbrePalier(5), 3);
  assert.strictEqual(api.arbrePalier(9), 3);
  assert.strictEqual(api.arbrePalier(10), 4);
  assert.strictEqual(api.arbrePalier(999), 4, "le dernier palier ne se dépasse pas");
  // Un palier ne se perd jamais : la fonction est monotone croissante.
  let precedent = 0;
  for (let n = 0; n <= 30; n++) { const p = api.arbrePalier(n); assert.ok(p >= precedent, "recul en " + n); precedent = p; }
});

test("paliers : le palier suivant indique un écart avec soi, pas avec les autres", () => {
  const { api } = construireContexte();
  assert.strictEqual(api.arbrePalierSuivant(0).seuil, 1);
  assert.strictEqual(api.arbrePalierSuivant(1).seuil, 3);
  assert.strictEqual(api.arbrePalierSuivant(4).seuil, 5);
  assert.strictEqual(api.arbrePalierSuivant(9).seuil, 10);
  assert.strictEqual(api.arbrePalierSuivant(10), null, "au dernier palier, plus rien à viser");
  // Les seuils sont strictement croissants et chacun porte un emoji.
  let s = 0;
  api.ARBRE_PALIERS.forEach(p => {
    assert.ok(p.seuil > s, "seuils non croissants"); s = p.seuil;
    assert.ok(typeof p.emoji === "string" && p.emoji.length, "emoji manquant au palier " + p.rang);
  });
});

test("Arbre des familles : bilan et jauge traduits dans les 4 langues", () => {
  const { api } = construireContexte();
  const cles = ["arbre.p1", "arbre.p2", "arbre.p3", "arbre.p4", "arbre.palier_atteint",
    "arbre.palier_aucun", "arbre.compte", "arbre.compte_detail", "arbre.manque",
    "arbre.tout_atteint", "arbre.ensemble", "arbre.ensemble_note",
    "arbre.enfant_zero", "arbre.enfant_une", "arbre.enfant_n"];
  Object.keys(api.LANGUES).forEach(lg => cles.forEach(k =>
    assert.ok(typeof api.I18N[lg][k] === "string" && api.I18N[lg][k].length, "manque " + lg + " → " + k)));
  // Les paramètres attendus par le code doivent survivre à la traduction.
  Object.keys(api.LANGUES).forEach(lg => {
    assert.ok(api.I18N[lg]["arbre.manque"].includes("{n}") && api.I18N[lg]["arbre.manque"].includes("{nom}"),
      lg + " : paramètres perdus dans arbre.manque");
    assert.ok(api.I18N[lg]["arbre.ensemble"].includes("{n}") && api.I18N[lg]["arbre.ensemble"].includes("{jalon}"),
      lg + " : paramètres perdus dans arbre.ensemble");
    assert.ok(api.I18N[lg]["arbre.compte_detail"].includes("{arrivees}") && api.I18N[lg]["arbre.compte_detail"].includes("{vivantes}"),
      lg + " : paramètres perdus dans arbre.compte_detail");
  });
});

test("Arbre des familles : l'enfant n'est jamais récompensé pour un parrainage", () => {
  const fs = require("fs");
  const path = require("path");
  const racine = path.join(__dirname, "..");
  const ui = fs.readFileSync(path.join(racine, "js/ui.js"), "utf8");
  const data = fs.readFileSync(path.join(racine, "js/data.js"), "utf8");
  const app = fs.readFileSync(path.join(racine, "js/app.js"), "utf8");
  // Aucun badge, aucune espèce, aucune monnaie ne doit dépendre d'un filleul.
  // On borne l'extrait au catalogue lui-même, sinon on teste tout le fichier.
  const debut = data.indexOf("const BADGES_CATALOGUE");
  const catalogue = data.slice(debut, data.indexOf("\n];", debut));
  assert.ok(debut > -1 && catalogue.length > 200, "catalogue de badges introuvable");
  assert.ok(!/(filleul|parrain|installees)/i.test(catalogue),
    "aucun badge d'enfant ne doit dépendre d'un parrainage");
  assert.ok(!/verifierBadges[\s\S]{0,2000}(filleul|parrain|installees)/i.test(app),
    "l'attribution des badges ne doit jamais lire un compteur de parrainage");
  // Le bloc enfant doit rester contemplatif : pas de bouton de partage.
  // Bornage sur la fin réelle de la fonction, sinon l'extrait déborde sur la
  // suivante (qui, elle, a parfaitement le droit de parler de parrainage).
  const debutBloc = ui.indexOf("function blocArbreEnfant");
  const finBloc = ui.indexOf("\n}", debutBloc);
  const bloc = ui.slice(debutBloc, finBloc);
  assert.ok(debutBloc > -1 && bloc.includes("arbreSvgFamilles"), "bloc enfant introuvable");
  assert.ok(!/modaleParrainage|creerParrainage|codeParrainage/.test(bloc),
    "le bloc enfant ne doit proposer aucun geste de parrainage");
});

/* ---------- Le 7ᵉ jour : détecter la famille convaincue ---------- */
// Fabrique un état où la famille a été active aux jours indiqués (décalages
// négatifs par rapport à `fin`).
function familleActiveLesJours(api, fin, decalages) {
  const e = api.etatVierge();
  const enf = e.enfants[Object.keys(e.enfants)[0]];
  enf.journal = {};
  decalages.forEach(d => { enf.journal[decalerJour(fin, d)] = { table_mettre: 1 }; });
  api.etat = e;
  return enf;
}

test("7e jour : la famille convaincue exige 5 jours actifs ET 7 jours d'ancienneté", () => {
  const { api } = construireContexte();
  const fin = api.aujourdHui();
  assert.strictEqual(api.ARBRE_J7_JOURS_ACTIFS, 5);
  assert.strictEqual(api.ARBRE_J7_ANCIENNETE, 7);

  // Cinq jours actifs mais tous récents : l'ancienneté manque.
  familleActiveLesJours(api, fin, [0, -1, -2, -3, -4]);
  assert.strictEqual(api.familleConvaincue(fin), false, "5 jours mais installée depuis 5 jours : trop tôt");

  // Cinq jours actifs répartis sur sept : convaincue.
  familleActiveLesJours(api, fin, [0, -1, -3, -5, -6]);
  assert.strictEqual(api.familleConvaincue(fin), true, "5 jours sur 7 : convaincue");

  // Quatre jours seulement, ancienneté suffisante : pas encore.
  familleActiveLesJours(api, fin, [0, -2, -4, -6]);
  assert.strictEqual(api.familleConvaincue(fin), false, "4 jours actifs : insuffisant");

  // Une famille ancienne mais inactive cette semaine : pas convaincue.
  familleActiveLesJours(api, fin, [-20, -21, -22, -23, -24]);
  assert.strictEqual(api.familleConvaincue(fin), false, "active il y a trois semaines, pas cette semaine");

  // État vierge : jamais convaincue (et jamais d'erreur).
  api.etat = api.etatVierge();
  assert.strictEqual(api.familleConvaincue(fin), false, "état vierge");
});

test("7e jour : les jours actifs se comptent au niveau de la FAMILLE", () => {
  const { api } = construireContexte();
  const fin = api.aujourdHui();
  const e = api.etatVierge();
  const ids = Object.keys(e.enfants);
  // Deux enfants actifs des jours différents : la famille cumule les deux.
  e.enfants[ids[0]].journal = { [decalerJour(fin, 0)]: { table_mettre: 1 }, [decalerJour(fin, -1)]: { table_mettre: 1 } };
  if (ids[1]) e.enfants[ids[1]].journal = { [decalerJour(fin, -2)]: { table_mettre: 1 }, [decalerJour(fin, -3)]: { table_mettre: 1 } };
  api.etat = e;
  const attendu = ids[1] ? 4 : 2;
  assert.strictEqual(api.joursActifsFamille(fin, 7), attendu, "les jours des frères et sœurs s'additionnent");
  // Un journal à zéro ne compte pas comme un jour actif.
  e.enfants[ids[0]].journal[decalerJour(fin, -4)] = { table_mettre: 0 };
  api.etat = e;
  assert.strictEqual(api.joursActifsFamille(fin, 7), attendu, "une case à zéro n'est pas une activité");
});

test("7e jour : la carte demande UNE famille, jamais le maximum", () => {
  const { api } = construireContexte();
  Object.keys(api.LANGUES).forEach(lg => {
    ["arbre.j7_titre", "arbre.j7_texte", "arbre.j7_bouton"].forEach(k =>
      assert.ok(typeof api.I18N[lg][k] === "string" && api.I18N[lg][k].length, "manque " + lg + " → " + k));
    assert.ok(api.I18N[lg]["arbre.j7_texte"].includes("{app}"), lg + " : {app} perdu");
    // Le vocabulaire du « maximum » est proscrit : il fait fuir.
    assert.ok(!/maximum|le plus de|as many as possible|zoveel mogelijk|so viele wie möglich/i.test(api.I18N[lg]["arbre.j7_texte"]),
      lg + " : la carte réclame un maximum de familles au lieu d'une seule");
  });
});

test("7e jour : le chantier de l'Arbre est déclaré, avec son e-mail", () => {
  const { api } = construireContexte();
  const ch = api.CROISSANCE_CHANTIERS.find(x => x.id === "c_parrainage");
  assert.ok(ch, "chantier introuvable");
  ["c_arbre_1", "c_arbre_1b", "c_arbre_2", "c_arbre_3"].forEach(id =>
    assert.ok(ch.etapes.some(e => e.id === id), "étape manquante : " + id));
  const j7 = ch.etapes.find(e => e.id === "c_arbre_3");
  assert.strictEqual(j7.mail, "m_parrainage_actif");
  assert.ok(api.mailCroissance("m_parrainage_actif"), "modèle d'e-mail m_parrainage_actif absent");
  // Le modèle ne doit plus promettre de quota, et doit parler du code.
  const m = api.mailCroissance("m_parrainage_actif");
  assert.ok(!/par semaine|per week|pro Woche/i.test(m.corps), "quota hebdomadaire ressuscité");
  assert.ok(/\{prenom\}/.test(m.corps) && /\{lien\}/.test(m.corps), "paramètres du modèle perdus");
  // L'ancien modèle non plus ne doit plus annoncer trois familles par semaine.
  assert.ok(!/Trois familles par semaine/i.test(api.mailCroissance("m_parrainage").corps),
    "m_parrainage annonce encore un quota");
});

/* ---------- La carte d'ami & la mission de générosité ---------- */
test("carte d'ami : la mission de générosité porte sur le geste, pas sur l'app", () => {
  const { api } = construireContexte();
  const mi = api.MISSIONS.find(m => m.id === "faire_decouvrir");
  assert.ok(mi, "mission faire_decouvrir absente");
  assert.strictEqual(mi.cat, "famille", "la générosité relève des Cœurs 💛");
  assert.strictEqual(mi.ageMin, 4);
  assert.ok(mi.points > 0 && mi.points <= 3, "des points ordinaires, ni prime ni bonus");
  // Le libellé ne doit nommer NI l'app NI le parrainage : la mission se valide
  // sur le geste, même si personne ne s'inscrit jamais.
  const libelles = [mi.titre].concat(Object.keys(api.LANGUES)
    .map(lg => api.I18N[lg]["mission.faire_decouvrir"]).filter(Boolean));
  assert.ok(libelles.length >= 4, "traductions manquantes pour la mission");
  libelles.forEach(l => assert.ok(!/famiteam|parrain|invit|filleul/i.test(l),
    "le libellé instrumentalise l'enfant : " + l));
});

test("carte d'ami : libellés complets dans les 4 langues, paramètres préservés", () => {
  const { api } = construireContexte();
  const cles = ["cami.titre", "cami.bouton", "cami.mode_emploi", "cami.moi",
    "cami.invite", "cami.colorier", "cami.parents_titre", "cami.parents_texte", "cami.imprimer"];
  Object.keys(api.LANGUES).forEach(lg => {
    cles.forEach(k => assert.ok(typeof api.I18N[lg][k] === "string" && api.I18N[lg][k].length, "manque " + lg + " → " + k));
    assert.ok(api.I18N[lg]["cami.moi"].includes("{prenom}"), lg + " : {prenom} perdu");
    assert.ok(api.I18N[lg]["cami.bouton"].includes("{prenom}"), lg + " : {prenom} perdu (bouton)");
    assert.ok(api.I18N[lg]["cami.invite"].includes("{app}"), lg + " : {app} perdu");
    assert.ok(api.I18N[lg]["cami.parents_texte"].includes("{app}"), lg + " : {app} perdu (parents)");
  });
});

test("carte d'ami : le QR reste lisible — 4 px par module à l'écran, 30 mm au papier", () => {
  const fs = require("fs");
  const css = fs.readFileSync(require("path").join(__dirname, "..", "css/style.css"), "utf8");
  const { api } = construireContexte();
  const modules = api.QR_TAILLE + 8;                       // 29 modules + 2×4 de marge
  const ecran = /\.carte-ami-qr\{width:(\d+)px/.exec(css);
  assert.ok(ecran, "règle .carte-ami-qr introuvable");
  assert.ok(parseInt(ecran[1], 10) / modules >= 4,
    `${ecran[1]} px pour ${modules} modules : moins de 4 px par module, illisible par un téléphone`);
  const papier = /\.carte-ami-qr\{width:(\d+)mm/.exec(css);
  assert.ok(papier, "taille d'impression du QR non fixée");
  assert.ok(parseInt(papier[1], 10) >= 25, "un QR imprimé sous 25 mm ne se scanne pas de façon fiable");
});

test("dépliant : le QR reste lisible lui aussi, à l'écran comme au papier", () => {
  const fs = require("fs");
  const css = fs.readFileSync(require("path").join(__dirname, "..", "css/style.css"), "utf8");
  const { api } = construireContexte();
  const modules = api.QR_TAILLE + 8;
  const ecran = /\.depliant-qr\{width:(\d+)px/.exec(css);
  assert.ok(ecran, "règle .depliant-qr introuvable");
  assert.ok(parseInt(ecran[1], 10) / modules >= 4,
    `${ecran[1]} px pour ${modules} modules : moins de 4 px par module`);
  const papier = /\.depliant-qr\{width:(\d+)mm/.exec(css);
  assert.ok(papier && parseInt(papier[1], 10) >= 25, "le QR du dépliant doit faire au moins 25 mm au papier");
});

test("impression : seuls les documents destinés au papier s'impriment", () => {
  const fs = require("fs");
  const path = require("path");
  const css = fs.readFileSync(path.join(__dirname, "..", "css/style.css"), "utf8");
  const ui = fs.readFileSync(path.join(__dirname, "..", "js/ui.js"), "utf8");
  assert.ok(/@media print\s*\{/.test(css), "aucune feuille d'impression");
  const bloc = css.slice(css.indexOf("@media print"));
  // L'application elle-même n'a aucun sens sur papier : son cadre est masqué.
  ["\\.navbar", "#contenu", "\\.haut-fixe", "\\.gros-bouton", "\\.modale-fermer"].forEach(sel =>
    assert.ok(new RegExp(sel).test(bloc), "l'impression ne masque pas " + sel));
  // Les couleurs doivent être conservées : un QR en niveaux de gris se scanne mal.
  assert.ok(/print-color-adjust:\s*exact/.test(bloc), "les couleurs ne sont pas forcées à l'impression");
  // Le mécanisme est partagé, et chaque document imprimable se déclare.
  assert.ok(/\.impression-cible/.test(bloc), "aucune cible d'impression générique");
  assert.ok(/function imprimerCible/.test(ui), "l'impression n'est pas mutualisée");
  ["carte-ami-page", "depliant-page"].forEach(cls =>
    assert.ok(new RegExp(cls + '[^"`]*impression-cible|impression-cible[^"`]*' + cls).test(ui),
      cls + " ne se déclare pas comme cible d'impression"));
});

/* ---------- Le tableau d'honneur ---------- */
test("tableau d'honneur : libellés complets et paramètres préservés (4 langues)", () => {
  const { api } = construireContexte();
  const cles = ["hon.titre", "hon.annee", "hon.tout", "hon.pas_encore", "hon.vide", "hon.mien",
    "hon.ma_place", "hon.inscrite", "hon.non_inscrite", "hon.consentement", "hon.pseudo_ph",
    "hon.pseudo_requis", "hon.rejoindre", "hon.retirer", "hon.retirer_conf", "hon.retiree", "hon.inscrite_ok"];
  Object.keys(api.LANGUES).forEach(lg => {
    cles.forEach(k => assert.ok(typeof api.I18N[lg][k] === "string" && api.I18N[lg][k].length, "manque " + lg + " → " + k));
    assert.ok(api.I18N[lg]["hon.pas_encore"].includes("{n}") && api.I18N[lg]["hon.pas_encore"].includes("{actuel}"),
      lg + " : paramètres perdus dans hon.pas_encore");
    assert.ok(api.I18N[lg]["hon.ma_place"].includes("{rang}"), lg + " : {rang} perdu");
    assert.ok(api.I18N[lg]["hon.mien"].includes("{n}"), lg + " : {n} perdu");
  });
});

test("tableau d'honneur : le consentement est annoncé, et son étendue exacte", () => {
  const { api } = construireContexte();
  // Le texte doit dire les trois choses qui protègent la famille : nom
  // d'équipe seul, jamais le nom de famille, jamais le prénom d'un enfant.
  const attendus = {
    fr: [/nom d'équipe/i, /jamais votre nom de famille/i, /jamais le prénom/i, /retirer à tout moment/i],
    en: [/team name/i, /never your family name/i, /never a child's first name/i, /withdraw at any time/i],
    nl: [/teamnaam/i, /nooit je familienaam/i, /nooit de voornaam/i, /elk moment terugtrekken/i],
    de: [/Teamname/i, /niemals dein Familienname/i, /niemals der Vorname/i, /jederzeit zurückziehen/i]
  };
  Object.keys(attendus).forEach(lg => {
    const txt = api.I18N[lg]["hon.consentement"];
    attendus[lg].forEach(re => assert.ok(re.test(txt), lg + " : promesse manquante — " + re));
  });
});

test("tableau d'honneur : le vocabulaire du podium est proscrit", () => {
  const { api } = construireContexte();
  Object.keys(api.LANGUES).forEach(lg => {
    // « Merci », pas « meilleures familles » ; aucun classement de progression.
    ["hon.titre", "hon.ma_place", "hon.mien", "hon.vide"].forEach(k => {
      const v = api.I18N[lg][k];
      assert.ok(!/meilleur|gagnant|champion|best famil|winner|beste famil|winnaar|Sieger|Gewinner/i.test(v),
        lg + " → " + k + " : vocabulaire de compétition — « " + v + " »");
      assert.ok(!/places? gagnée|places? up|▲|↑/i.test(v), lg + " → " + k + " : progression de rang affichée");
    });
  });
});

test("tableau d'honneur : le code n'expose jamais le nom réel de la famille", () => {
  const fs = require("fs");
  const path = require("path");
  const sql = fs.readFileSync(path.join(__dirname, "..", "supabase/schema.sql"), "utf8");
  const debut = sql.indexOf("create or replace function public.classement_parrainages");
  const fin = sql.indexOf("$$;", debut);
  const fn = sql.slice(debut, fin);
  assert.ok(debut > -1 && fn.length > 400, "fonction classement_parrainages introuvable");
  // Le tableau ne doit sélectionner que le pseudonyme.
  assert.ok(/classement_pseudo/.test(fn), "le pseudonyme n'est pas utilisé");
  assert.ok(!/\bf\.name\b/.test(fn), "families.name apparaît dans le classement");
  assert.ok(/f\.classement_optin/.test(fn), "le consentement n'est pas filtré");
  // Le rang ne doit être calculé que sous condition de consentement.
  assert.ok(/classement_optin[\s\S]{0,200}mon_rang|mon_rang[\s\S]{0,400}classement_optin/.test(fn),
    "le rang semble calculé sans vérifier le consentement");
  // Le seuil doit être réglable sans redéploiement.
  assert.ok(/app_config[\s\S]{0,120}classement_seuil/.test(fn), "seuil non réglable depuis app_config");
});

/* ---------- Conformité documentaire ----------
 * Le § 1.3 du plan impose que le registre des traitements et la politique de
 * confidentialité soient à jour DANS LE MÊME LOT que la mise en service. Ces
 * tests empêchent la dérive : le code ne peut pas avancer sans les documents. */
test("conformité : le tableau d'honneur figure au registre des traitements", () => {
  const fs = require("fs");
  const path = require("path");
  const r = fs.readFileSync(path.join(__dirname, "..", "REGISTRE-TRAITEMENTS.md"), "utf8");
  assert.ok(/###\s*T6\b/.test(r), "aucun traitement T6 déclaré");
  const t6 = r.slice(r.indexOf("### T6"), r.indexOf("## 3. Sous-traitants"));
  assert.ok(/art\.\s*6\.1\.a/.test(t6), "la base légale (consentement) n'est pas citée");
  assert.ok(/art\.\s*7\.3/.test(t6), "le droit de retrait (art. 7.3) n'est pas cité");
  assert.ok(/nom d'équipe/i.test(t6), "le pseudonyme n'est pas décrit");
  assert.ok(/families\.name|nom de la famille/i.test(t6), "les données NON publiées ne sont pas listées");
  assert.ok(/prénom d'un enfant/i.test(t6), "l'exclusion des prénoms d'enfants n'est pas écrite");
});

test("conformité : la politique de confidentialité décrit le tableau et le code", () => {
  const fs = require("fs");
  const path = require("path");
  const c = fs.readFileSync(path.join(__dirname, "..", "confidentialite.html"), "utf8");
  assert.ok(/tableau d'honneur/i.test(c), "le tableau d'honneur n'est pas mentionné");
  // Le consentement se donne par deux chemins depuis que le nom de code du mode
  // Défi vaut inscription. Ce qui doit rester écrit, c'est qu'il y a
  // consentement, qu'il n'est jamais implicite, et par quels gestes il se donne.
  assert.ok(/consentement/i.test(c), "le consentement n'est pas annoncé");
  assert.ok(/jamais par défaut/i.test(c), "il faut dire que le tableau n'est jamais rempli par défaut");
  assert.ok(/nom de code/i.test(c) && /mode Défi/i.test(c),
    "le second chemin de consentement (le nom de code du mode Défi) doit être décrit");
  assert.ok(/code\s*<\/strong>|code permanent/i.test(c), "le code de parrainage n'est pas mentionné");
  assert.ok(/jamais le prénom d'un\s*\n?\s*<strong>enfant|jamais le prénom d'un\s+enfant|prénom d'un\s*\n?\s*enfant/i.test(c.replace(/<\/?strong>/g, "")),
    "l'exclusion des prénoms d'enfants n'est pas promise");
  assert.ok(/en un clic/i.test(c), "la révocabilité en un clic n'est pas annoncée");
  // La promesse la plus importante : rien ne récompense un enfant pour une inscription.
  assert.ok(/Aucune récompense destinée à un enfant/i.test(c),
    "la politique ne dit pas que rien ne récompense un enfant pour une inscription");
});

test("conformité : la FAQ ne promet plus trois parrainages par semaine", () => {
  const fs = require("fs");
  const path = require("path");
  const f = fs.readFileSync(path.join(__dirname, "..", "faq.html"), "utf8");
  assert.ok(!/trois familles amies par semaine/i.test(f), "le quota hebdomadaire subsiste dans la FAQ");
  assert.ok(/code permanent/i.test(f), "la FAQ ne décrit pas le code permanent");
  assert.ok(/Arbre des familles/.test(f), "la FAQ n'explique pas l'Arbre des familles");
  assert.ok(/trois jours d'utilisation/i.test(f), "la FAQ n'explique pas quand une famille compte");
});

test("base : toute fonction de l'Arbre fixe son search_path", () => {
  const fs = require("fs");
  const path = require("path");
  const sql = fs.readFileSync(path.join(__dirname, "..", "supabase/schema.sql"), "utf8");
  const fonctions = ["referral_code_famille", "regenerer_referral_code", "referral_info_par_code",
    "claim_referral_code", "gen_referral_code", "arbre_jours_actifs", "parrainage_bilan",
    "parrainage_jauge", "definir_classement_optin", "classement_parrainages",
    "admin_parrainages_actifs_a_relancer", "admin_entonnoir", "admin_familles_endormies",
    "arene_creer", "arene_apercu", "arene_rejoindre", "arene_quitter", "arene_classement",
    "arene_mes_arenes"];
  fonctions.forEach(nom => {
    const i = sql.indexOf("function public." + nom + "(");
    assert.ok(i > -1, "fonction absente du schéma : " + nom);
    // L'en-tête va jusqu'au corps ($$) : search_path doit y être fixé.
    const entete = sql.slice(i, sql.indexOf("$$", i));
    assert.ok(/set search_path\s*=\s*public/.test(entete),
      nom + " : search_path mutable (signalé par l'analyseur Supabase)");
  });
});

test("base : chaque fonction de l'Arbre porte sa propre garde d'accès", () => {
  const fs = require("fs");
  const path = require("path");
  const sql = fs.readFileSync(path.join(__dirname, "..", "supabase/schema.sql"), "utf8");
  // Les droits d'exécution sont ouverts à PUBLIC par défaut dans PostgreSQL, et
  // c'est le motif de tout le schéma : la garde interne est donc la SEULE
  // barrière. Aucune fonction touchant à des données ne peut en être dépourvue.
  const gardes = {
    referral_code_famille: /is_family_member|is_admin/,
    regenerer_referral_code: /is_family_member|is_admin/,
    claim_referral_code: /is_family_member/,
    parrainage_bilan: /is_family_member|is_admin/,
    parrainage_jauge: /auth\.uid\(\) is null/,
    definir_classement_optin: /is_family_member|is_admin/,
    classement_parrainages: /auth\.uid\(\) is null/,
    admin_parrainages_actifs_a_relancer: /is_admin/,
    admin_entonnoir: /is_admin/,
    admin_familles_endormies: /is_admin/,
    arene_creer: /is_family_member/,
    arene_rejoindre: /is_family_member/,
    arene_quitter: /is_family_member/,
    arene_classement: /is_family_member/,
    arene_mes_arenes: /is_family_member/
  };
  Object.keys(gardes).forEach(nom => {
    const i = sql.indexOf("function public." + nom + "(");
    const fin = sql.indexOf("$$;", i);
    const corps = sql.slice(i, fin);
    assert.ok(gardes[nom].test(corps), nom + " : aucune garde d'accès détectée");
  });
});

/* ---------- Activation & rétention : entonnoir et réveil ---------- */
test("activation : l'entonnoir est traduit dans les 4 langues, paramètres préservés", () => {
  const { api } = construireContexte();
  const cles = ["ent.titre", "ent.inscrites", "ent.avec_enfant", "ent.un_usage",
    "ent.trois_usages", "ent.dix_usages", "ent.actives_30j", "ent.perte", "ent.endormies"];
  Object.keys(api.LANGUES).forEach(lg => {
    cles.forEach(k => assert.ok(typeof api.I18N[lg][k] === "string" && api.I18N[lg][k].length, "manque " + lg + " → " + k));
    assert.ok(api.I18N[lg]["ent.perte"].includes("{n}"), lg + " : {n} perdu dans ent.perte");
    assert.ok(api.I18N[lg]["ent.endormies"].includes("{n}"), lg + " : {n} perdu dans ent.endormies");
  });
});

test("activation : le réveil est automatisable — aucune variable à écrire à la main", () => {
  const { api } = construireContexte();
  const m = api.mailCroissance("m_reactivation");
  assert.ok(m, "modèle m_reactivation absent");
  // Un modèle qui exige une phrase écrite à la main ne part jamais tout seul.
  assert.ok(!/\{enfant\}/.test(m.corps), "{enfant} ferait circuler un prénom d'enfant dans l'admin");
  assert.ok(!/\{nouveautes\}/.test(m.corps), "{nouveautes} empêche tout envoi automatique");
  const variables = (m.corps.match(/\{[a-z_]+\}/g) || []);
  variables.forEach(v => assert.ok(["{prenom}", "{lien}"].includes(v),
    "variable non fournie par l'envoi automatique : " + v));
  // La promesse faite dans le corps doit correspondre au comportement réel.
  assert.ok(/trimestre/i.test(m.corps), "la cadence promise n'est pas écrite");
  assert.ok(/six mois/i.test(m.corps), "l'arrêt après six mois n'est pas promis");
});

test("activation : la borne de six mois est bien dans la requête, pas seulement promise", () => {
  const fs = require("fs");
  const path = require("path");
  const sql = fs.readFileSync(path.join(__dirname, "..", "supabase/schema.sql"), "utf8");
  const i = sql.indexOf("function public.admin_familles_endormies");
  const fn = sql.slice(i, sql.indexOf("$$;", i));
  assert.ok(i > -1, "fonction absente");
  assert.ok(/current_date - 180/.test(fn), "aucune borne supérieure : on relancerait indéfiniment");
  assert.ok(/current_date - 30/.test(fn), "aucun seuil de sommeil");
  // L'idempotence doit porter le trimestre, sinon on envoie en boucle.
  assert.ok(/to_char\(now\(\), 'Q'\)|'T' \|\| to_char/.test(fn), "la clé ne porte pas le trimestre");
  assert.ok(/mails_auto[\s\S]{0,160}reactivation/.test(fn), "aucun verrou d'envoi");
});

test("activation : le chantier déclare l'entonnoir et le réveil comme faits", () => {
  const { api } = construireContexte();
  const ch = api.CROISSANCE_CHANTIERS.find(x => x.id === "c_activation");
  assert.ok(ch, "chantier c_activation introuvable");
  const ent = ch.etapes.find(e => e.id === "c_activation_2b");
  assert.ok(ent && ent.fait, "l'étape de mesure de l'entonnoir n'est pas déclarée faite");
  const rev = ch.etapes.find(e => e.id === "c_activation_4");
  assert.ok(rev && rev.fait, "le réveil trimestriel n'est pas déclaré fait");
  assert.strictEqual(rev.mail, "m_reactivation");
});

test("dépliant : il tient sur une A5, et ne porte aucun code de famille", () => {
  const fs = require("fs");
  const path = require("path");
  const css = fs.readFileSync(path.join(__dirname, "..", "css/style.css"), "utf8");
  const ui = fs.readFileSync(path.join(__dirname, "..", "js/ui.js"), "utf8");
  // A5 = 148 mm ; moins 2 × 12 mm de marge, il reste 124 mm utiles.
  const large = /impression \.depliant-page\{[^}]*max-width:(\d+)mm/.exec(css);
  assert.ok(large, "largeur d'impression du dépliant non fixée");
  assert.ok(parseInt(large[1], 10) <= 124,
    `${large[1]} mm dépasse les 124 mm utiles d'une A5 : le dépliant déborderait`);
  // Une feuille distribuée à vingt-cinq familles n'est pas un parrainage : elle
  // ne doit donc porter aucun code de famille, seulement un lien marqué ?src=.
  const debut = ui.indexOf("function modaleDepliant");
  const bloc = ui.slice(debut, ui.indexOf("\n}", ui.indexOf("dep-imprimer", debut)));
  assert.ok(debut > -1 && bloc.length > 200, "modaleDepliant introuvable");
  assert.ok(!/codeParrainage|lienDepuisCode|referral/.test(bloc),
    "le dépliant porte un code de famille : ce serait attribuer 25 parrainages à une seule");
  assert.ok(/lienDepliant/.test(bloc), "le dépliant n'utilise pas de lien marqué");
  assert.ok(/\?src=/.test(ui.slice(ui.indexOf("function lienDepliant"), ui.indexOf("function lienDepliant") + 500)),
    "le lien du dépliant ne porte pas de marqueur d'origine");
});

test("dépliant : le nom d'école est assaini et borné à la capacité du QR", () => {
  const fs = require("fs");
  const ui = fs.readFileSync(require("path").join(__dirname, "..", "js/ui.js"), "utf8");
  const d = ui.indexOf("function normaliserSourceDepliant");
  const src = ui.slice(ui.indexOf("const DEPLIANT_HOTE"), ui.indexOf("function modaleDepliant"));
  const f = new Function(src + "; return { normaliserSourceDepliant, lienDepliant, DEPLIANT_SRC_MAX, DEPLIANT_HOTE };")();
  assert.ok(d > -1, "fonction absente");
  assert.strictEqual(f.normaliserSourceDepliant("École Sainte-Marie"), "ecole-sainte-marie");
  assert.strictEqual(f.normaliserSourceDepliant("  Saint-Josse (2e) "), "saint-josse-2e");
  assert.strictEqual(f.normaliserSourceDepliant(""), "");
  assert.ok(f.normaliserSourceDepliant("a".repeat(60)).length <= f.DEPLIANT_SRC_MAX,
    "un nom trop long ferait dépasser la capacité du QR");
  // Le lien complet doit tenir dans la capacité de l'encodeur, même au maximum.
  const { api } = construireContexte();
  const lienMax = f.lienDepliant("z".repeat(60));
  assert.ok(lienMax.length <= api.QR_CAPACITE,
    `lien de ${lienMax.length} caractères pour une capacité de ${api.QR_CAPACITE} : le QR serait refusé`);
  assert.ok(api.qrSvg(lienMax), "le QR du dépliant doit être produit même au nom le plus long");
  // Un papier ne doit jamais porter l'URL d'un aperçu de déploiement : le lien
  // est ancré sur un domaine officiel, indépendamment de l'origine courante.
  assert.ok(/^https:\/\/(fami\.team|famiteam\.com)\//.test(f.DEPLIANT_HOTE),
    "le dépliant doit pointer vers un domaine officiel : " + f.DEPLIANT_HOTE);
  const ui2 = fs.readFileSync(require("path").join(__dirname, "..", "js/ui.js"), "utf8");
  const corps = ui2.slice(ui2.indexOf("function lienDepliant"), ui2.indexOf("function modaleDepliant"));
  assert.ok(!/location/.test(corps),
    "lienDepliant dépend de location : imprimé depuis un aperçu, le dépliant porterait une URL d'aperçu");
});

/* ---------- « Le Défi » : arènes privées (page secrète) ---------- */
function apiDefi() {
  const fs = require("fs");
  const path = require("path");
  const src = fs.readFileSync(path.join(__dirname, "..", "js/defi.js"), "utf8");
  // On charge la table de traductions, le moteur tD() et les rangs.
  const debut = src.indexOf("const DEFI_LANGUES");
  const fin = src.indexOf("/* ---------- Démarrage");
  const bloc = src.slice(debut, fin)
    .replace(/localStorage/g, "({ getItem: () => null, setItem: () => {} })")
    .replace(/document\.documentElement/g, "null");
  return new Function("navigator",
    bloc + "; return { DEFI_RANGS, rangDe, rangSuivant, DEFI_I18N, DEFI_LANGUES, tD, definirLangueDefi, langueInitiale, DEFI_HAUTS_FAITS, DEFI_HOTE_APP, lienFamille, resteDetail,"
         + " DEFI_PALIERS_ARENE, palierArene, palierAreneSuivant, serieEnCours, grilleJours, jourCle, saisonCourante };"
  )({ language: "fr" });
}

test("défi : les rangs sont croissants, jamais perdus, et bornés", () => {
  const d = apiDefi();
  let s = -1;
  d.DEFI_RANGS.forEach(r => {
    assert.ok(r.seuil > s, "seuils non croissants"); s = r.seuil;
    assert.ok(r.cle && r.emoji, "rang incomplet");
  });
  assert.strictEqual(d.rangDe(0).cle, "r1");
  assert.strictEqual(d.rangDe(99).cle, "r1");
  assert.strictEqual(d.rangDe(100).cle, "r2");
  assert.strictEqual(d.rangDe(999).cle, "r4");
  assert.strictEqual(d.rangDe(1000).cle, "r5");
  assert.strictEqual(d.rangDe(2000).cle, "r6");
  assert.strictEqual(d.rangDe(4000).cle, "r7");
  const dernier = d.DEFI_RANGS[d.DEFI_RANGS.length - 1];
  assert.strictEqual(d.rangSuivant(dernier.seuil), null, "au dernier rang, plus rien à viser");
  // L'échelle doit dépasser ce qu'une saison permet : un plafond atteignable en
  // quelques semaines cesse de tirer dès qu'il est touché.
  assert.ok(dernier.seuil >= 2000, "l'échelle des rangs s'arrête trop tôt");
  // Monotonie : un score qui monte ne fait jamais reculer le rang.
  let precedent = 0;
  for (let n = 0; n <= 5000; n += 7) {
    const r = d.DEFI_RANGS.indexOf(d.rangDe(n));
    assert.ok(r >= precedent, "recul de rang en " + n); precedent = r;
  }
});

test("défi : la série en cours se rompt sur un jour manqué, pas sur l'heure", () => {
  const d = apiDefi();
  // Aucune prise : aucune série.
  assert.strictEqual(d.serieEnCours([], "2026-08-08"), 0);
  assert.strictEqual(d.serieEnCours(null, "2026-08-08"), 0);
  // Trois jours consécutifs jusqu'à aujourd'hui.
  assert.strictEqual(d.serieEnCours(["2026-08-06", "2026-08-07", "2026-08-08"], "2026-08-08"), 3);
  // La série court encore si le dernier jour marqué est hier : on ne casse pas
  // une série parce qu'il n'est que dix heures du matin.
  assert.strictEqual(d.serieEnCours(["2026-08-06", "2026-08-07"], "2026-08-08"), 2);
  // Deux jours de silence : rompue.
  assert.strictEqual(d.serieEnCours(["2026-08-05", "2026-08-06"], "2026-08-08"), 0);
  // Un trou au milieu ne compte que la partie récente.
  assert.strictEqual(d.serieEnCours(["2026-08-01", "2026-08-02", "2026-08-07", "2026-08-08"], "2026-08-08"), 2);
  // Les doublons et le désordre ne faussent rien.
  assert.strictEqual(d.serieEnCours(["2026-08-08", "2026-08-07", "2026-08-08"], "2026-08-08"), 2);
  // Franchissement de mois.
  assert.strictEqual(d.serieEnCours(["2026-07-31", "2026-08-01"], "2026-08-01"), 2);
});

test("défi : la grille des jours couvre la bonne fenêtre", () => {
  const d = apiDefi();
  const g = d.grilleJours(["2026-08-08", "2026-08-02"], 14, "2026-08-08");
  assert.strictEqual(g.length, 14);
  assert.strictEqual(g[13].cle, "2026-08-08", "la dernière case doit être aujourd'hui");
  assert.strictEqual(g[0].cle, "2026-07-26", "la fenêtre doit remonter de 13 jours");
  assert.strictEqual(g.filter(c => c.marque).length, 2);
  assert.strictEqual(g[13].aujourdhui, true);
  assert.strictEqual(g.filter(c => c.aujourdhui).length, 1);
});

test("défi : l'objectif collectif progresse par paliers croissants", () => {
  const d = apiDefi();
  let s = -1;
  d.DEFI_PALIERS_ARENE.forEach(p => {
    assert.ok(p.seuil > s, "paliers non croissants"); s = p.seuil;
    assert.ok(p.cle && p.emoji, "palier incomplet");
  });
  assert.strictEqual(d.palierArene(0), null, "sans famille, aucun palier");
  assert.strictEqual(d.palierArene(4), null);
  assert.strictEqual(d.palierArene(5).cle, "pa1");
  assert.strictEqual(d.palierArene(999).cle, "pa5");
  assert.strictEqual(d.palierAreneSuivant(0).cle, "pa1");
  assert.strictEqual(d.palierAreneSuivant(999), null, "au dernier palier, plus rien à viser");
  // Chaque palier et chaque rang doit être traduit dans les quatre langues.
  Object.keys(d.DEFI_LANGUES).forEach(lg => {
    d.DEFI_PALIERS_ARENE.forEach(p =>
      assert.ok(d.DEFI_I18N[lg][p.cle], `${p.cle} manquant en ${lg}`));
    d.DEFI_RANGS.forEach(r =>
      assert.ok(d.DEFI_I18N[lg][r.cle], `${r.cle} manquant en ${lg}`));
  });
});

test("défi : chaque haut fait a un nom, une description et une condition", () => {
  const d = apiDefi();
  const vide = { points: 0, vivantes: 0, en_route: 0, jours: 0, meilleur_jour: 0 };
  d.DEFI_HAUTS_FAITS.forEach(f => {
    Object.keys(d.DEFI_LANGUES).forEach(lg => {
      assert.ok(d.DEFI_I18N[lg][f.cle], `${f.cle} manquant en ${lg}`);
      assert.ok(d.DEFI_I18N[lg][f.cle + "_d"], `${f.cle}_d manquant en ${lg}`);
    });
    // Une équipe qui n'a rien fait ne doit décrocher aucun haut fait.
    assert.strictEqual(!!f.test(vide, -1, [vide], { serie: 0, part: 0 }), false,
      "haut fait acquis sans rien avoir fait : " + f.cle);
  });
  // Et une équipe exemplaire doit tous les décrocher : sinon l'un d'eux est
  // inatteignable, ce qui décourage au lieu de tirer.
  const parfaite = { points: 900, vivantes: 9, en_route: 0, jours: 6, meilleur_jour: 3, premier_sang: true };
  d.DEFI_HAUTS_FAITS.forEach(f =>
    assert.ok(f.test(parfaite, 0, [parfaite], { serie: 4, part: 80 }),
      "haut fait inatteignable : " + f.cle));
});

test("défi : les quatre langues sont complètes et gardent leurs paramètres", () => {
  const d = apiDefi();
  const langues = Object.keys(d.DEFI_LANGUES);
  assert.deepStrictEqual(langues.sort(), ["de", "en", "fr", "nl"], "les 4 langues de l'app sont attendues");
  const clesFr = Object.keys(d.DEFI_I18N.fr);
  assert.ok(clesFr.length > 40, "table de traduction anormalement courte");
  langues.forEach(lg => {
    assert.ok(d.DEFI_I18N[lg], "langue absente : " + lg);
    clesFr.forEach(k => {
      const v = d.DEFI_I18N[lg][k];
      assert.ok(typeof v === "string" && v.length, "manque " + lg + " → " + k);
    });
    // Aucune clé en trop : une clé orpheline est une traduction jamais affichée.
    Object.keys(d.DEFI_I18N[lg]).forEach(k =>
      assert.ok(clesFr.includes(k), lg + " → " + k + " n'existe pas en français"));
  });
  // Les paramètres doivent survivre à la traduction, sinon le texte ment.
  const attendus = {
    "ouverte_par": ["{hote}"], "regle": ["{app}"], "intro": ["{app}"],
    "relever_note": ["{app}"], "classe": ["{rang}", "{total}"],
    "encore": ["{n}", "{emoji}", "{nom}"], "attente": ["{n}", "{f}"]
  };
  langues.forEach(lg => Object.keys(attendus).forEach(k =>
    attendus[k].forEach(v => assert.ok(d.DEFI_I18N[lg][k].includes(v),
      lg + " → " + k + " : paramètre " + v + " perdu"))));
});

test("défi : le moteur de traduction bascule et retombe proprement", () => {
  const d = apiDefi();
  d.definirLangueDefi("nl");
  assert.ok(/wint/.test(d.tD("regle")), "la bascule en néerlandais n'a pas pris");
  assert.ok(d.tD("regle").includes("FamiTeam"), "{app} n'est pas substitué");
  assert.ok(!/\{app\}|\{hote\}|\{n\}/.test(d.tD("attente", { n: 75, f: 1 })),
    "des accolades subsistent dans le texte rendu");
  d.definirLangueDefi("de");
  assert.strictEqual(d.tD("r5"), "Legende");
  // Une clé inconnue ne doit jamais casser l'écran : elle se rend telle quelle.
  assert.strictEqual(d.tD("cle_qui_nexiste_pas"), "cle_qui_nexiste_pas");
  d.definirLangueDefi("fr");
});

test("défi : un seul lien d'invitation, celui de la famille dans l'application", () => {
  const d = apiDefi();
  const { api } = construireContexte();
  // Le lien de recrutement N'EST PAS un lien de la page secrète : c'est celui
  // de la famille dans l'app. Une seule adresse à connaître, et chaque
  // inscription qu'elle produit compte dans toutes les arènes en cours.
  const lien = d.lienFamille("RY94M38");
  assert.ok(/^https:\/\/(fami\.team|famiteam\.com)\/\?p=RY94M38$/.test(lien),
    "le lien de recrutement doit être celui de l'application : " + lien);
  assert.ok(!/defi/.test(lien), "le lien de recrutement ne doit pas mener à la page secrète");
  assert.ok(lien.length <= api.QR_CAPACITE, "le lien doit tenir dans le QR");
  assert.ok(api.qrSvg(lien), "le QR doit être produit");
  // Et le code applicatif ne doit plus fabriquer de lien de recrutement hybride.
  const fs = require("fs");
  const src = fs.readFileSync(require("path").join(__dirname, "..", "js/defi.js"), "utf8");
  const f = src.slice(src.indexOf("async function chargerLienRecrutement"));
  assert.ok(/lienFamille\(/.test(f.slice(0, 900)), "le bloc d'invitation n'utilise pas le lien de la famille");
  assert.ok(!/"\?a=" \+ encodeURIComponent\(codeArene\)/.test(f), "un lien hybride subsiste");
});

test("défi : les hauts faits découlent des compteurs réels", () => {
  const d = apiDefi();
  assert.ok(d.DEFI_HAUTS_FAITS.length >= 5, "trop peu de hauts faits");
  d.DEFI_HAUTS_FAITS.forEach(f => {
    assert.ok(f.cle && f.emoji && typeof f.test === "function", "haut fait incomplet : " + f.cle);
    // Chaque haut fait doit avoir son libellé ET son explication, en 4 langues.
    Object.keys(d.DEFI_LANGUES).forEach(lg => {
      assert.ok(d.DEFI_I18N[lg][f.cle], "manque " + lg + " → " + f.cle);
      assert.ok(d.DEFI_I18N[lg][f.cle + "_d"], "manque " + lg + " → " + f.cle + "_d");
    });
  });
  const par = (c) => d.DEFI_HAUTS_FAITS.find(f => f.cle === c);
  const vide = { points: 0, vivantes: 0, en_route: 0, jours: 0, meilleur_jour: 0 };
  // Une équipe qui n'a rien fait ne décroche rien.
  d.DEFI_HAUTS_FAITS.forEach(f => assert.strictEqual(!!f.test(vide, 3, []), false,
    "haut fait décroché sans rien faire : " + f.cle));
  assert.strictEqual(!!par("hf_double").test({ meilleur_jour: 2 }), true);
  assert.strictEqual(!!par("hf_double").test({ meilleur_jour: 1 }), false);
  assert.strictEqual(!!par("hf_triple").test({ meilleur_jour: 3 }), true);
  assert.strictEqual(!!par("hf_regulier").test({ jours: 3 }), true);
  assert.strictEqual(!!par("hf_sansfaute").test({ vivantes: 3, en_route: 0 }), true);
  assert.strictEqual(!!par("hf_sansfaute").test({ vivantes: 3, en_route: 1 }), false,
    "« sans faute » ne doit pas s'obtenir avec des familles en attente");
  assert.strictEqual(!!par("hf_leader").test({ points: 10 }, 0), true);
  assert.strictEqual(!!par("hf_leader").test({ points: 0 }, 0), false,
    "on n'est pas « en tête » avec zéro point");
});

test("défi : le compte à rebours passe en urgence sous 48 heures", () => {
  const d = apiDefi();
  const dans = (h) => new Date(Date.now() + h * 3600 * 1000).toISOString();
  assert.strictEqual(d.resteDetail(dans(-1)), null, "une arène finie n'a plus de compte à rebours");
  const large = d.resteDetail(dans(100));
  assert.strictEqual(large.jours, 4);
  assert.strictEqual(large.urgent, false);
  const court = d.resteDetail(dans(40));
  assert.strictEqual(court.jours, 1);
  assert.strictEqual(court.heures, 16);
  assert.strictEqual(court.urgent, true, "sous 48 h, l'urgence doit s'allumer");
});

test("défi : l'écart et le compte à rebours gardent leurs paramètres (4 langues)", () => {
  const d = apiDefi();
  const attendus = {
    "ecart_devant": ["{n}", "{pseudo}"], "ecart_tete": ["{n}", "{pseudo}"],
    "reste_jh": ["{j}", "{h}"], "amene_d2": ["{app}"]
  };
  Object.keys(d.DEFI_LANGUES).forEach(lg => Object.keys(attendus).forEach(k => {
    assert.ok(d.DEFI_I18N[lg][k], "manque " + lg + " → " + k);
    attendus[k].forEach(v => assert.ok(d.DEFI_I18N[lg][k].includes(v),
      lg + " → " + k + " : paramètre " + v + " perdu"));
  }));
});

test("défi : la page reste secrète — noindex, robots, absente du plan du site", () => {
  const fs = require("fs");
  const path = require("path");
  const R = (f) => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
  const page = R("defi.html");
  assert.ok(/name="robots"\s+content="noindex, nofollow"/.test(page), "la page n'est pas en noindex");
  const robots = R("robots.txt");
  assert.ok(/Disallow:\s*\/defi\b/.test(robots) && /Disallow:\s*\/defi\.html/.test(robots),
    "defi.html n'est pas exclu de robots.txt");
  assert.ok(!/defi/.test(R("sitemap.xml")), "defi.html apparaît dans le plan du site");
  // Et surtout : aucune page publique ne doit y renvoyer.
  ["index.html", "faq.html", "confidentialite.html", "mentions-legales.html"].forEach(f => {
    assert.ok(!/defi\.html/.test(R(f)), f + " contient un lien vers la page secrète");
  });
  assert.ok(!/defi\.html/.test(R("js/ui.js")), "l'application renvoie vers la page secrète");
});

test("défi : le classement ne divulgue ni nom de famille ni identifiant interne", () => {
  const fs = require("fs");
  const path = require("path");
  const sql = fs.readFileSync(path.join(__dirname, "..", "supabase/schema.sql"), "utf8");
  const i = sql.indexOf("function public.arene_classement");
  const fn = sql.slice(i, sql.indexOf("$$;", i));
  assert.ok(i > -1 && fn.length > 400, "arene_classement introuvable");
  assert.ok(/m\.pseudo/.test(fn), "le pseudonyme n'est pas utilisé");
  assert.ok(!/f\.name|families\.name/.test(fn), "un nom de famille apparaît dans le classement");
  // family_id ne doit pas figurer dans l'objet renvoyé (le drapeau « moi » suffit).
  const projection = fn.slice(fn.indexOf("select m.pseudo"), fn.indexOf("from arene_membres"));
  assert.ok(!/as family_id|m\.family_id,/.test(projection),
    "l'identifiant interne des autres familles est renvoyé");
  // Le stock antérieur ne compte pas : la fenêtre de l'arène est appliquée.
  assert.ok(/accepted_at between a\.created_at and a\.fin_le/.test(fn),
    "les parrainages antérieurs à l'arène compteraient");
  // Aucun enfant n'entre dans le calcul.
  assert.ok(!/enfants|family_state/.test(fn), "des données d'enfant entrent dans le score");
});

test("défi : l'aperçu public ne montre que le strict nécessaire", () => {
  const fs = require("fs");
  const path = require("path");
  const sql = fs.readFileSync(path.join(__dirname, "..", "supabase/schema.sql"), "utf8");
  const i = sql.indexOf("function public.arene_apercu");
  const fn = sql.slice(i, sql.indexOf("$$;", i));
  assert.ok(i > -1, "arene_apercu introuvable");
  // Ouvert à anon : c'est ce que voit l'ami avant d'avoir un compte.
  assert.ok(/grant execute on function public\.arene_apercu\(text\)\s+to anon/.test(sql),
    "l'aperçu doit être lisible sans compte");
  assert.ok(!/f\.name|families\.name|auth\.users|email/.test(fn),
    "l'aperçu expose un nom de famille ou une adresse");
  assert.ok(/m\.pseudo/.test(fn), "l'hôte doit être désigné par son pseudonyme");
});

test("défi : le lien envoyé aux amis tient dans le QR et ne dépend pas de l'origine", () => {
  const fs = require("fs");
  const path = require("path");
  const src = fs.readFileSync(path.join(__dirname, "..", "js/defi.js"), "utf8");
  const base = /const DEFI_BASE = "([^"]+)"/.exec(src);
  assert.ok(base, "DEFI_BASE introuvable");
  assert.ok(/^https:\/\/(fami\.team|famiteam\.com)\//.test(base[1]),
    "les liens du défi doivent pointer vers un domaine officiel : " + base[1]);
  // Codes d'arène et de parrainage : 7 caractères chacun.
  const lienMax = base[1] + "?a=" + "X".repeat(7) + "&p=" + "Y".repeat(7);
  const { api } = construireContexte();
  assert.ok(lienMax.length <= api.QR_CAPACITE,
    `lien de ${lienMax.length} caractères pour une capacité de ${api.QR_CAPACITE}`);
  assert.ok(api.qrSvg(lienMax), "le QR du défi doit être produit");
  // lienArene ne doit pas lire location : un lien envoyé doit rester valable.
  const f = src.slice(src.indexOf("function lienArene"), src.indexOf("function lienArene") + 160);
  assert.ok(!/location/.test(f), "lienArene dépend de location");
});

/* ---------- Bandeau dodo : synchronisation avec l'horloge système ---------- */

// Fige l'horloge du contexte à une heure locale donnée, puis appelle `fn`.
function aLHeure(contexte, hh, mm, ss, fn) {
  const VraieDate = contexte.Date;
  const fige = new VraieDate(2026, 0, 15, hh, mm, ss === undefined ? 0 : ss, 0);
  class DateFigee extends VraieDate {
    constructor(...a) { if (a.length === 0) super(fige.getTime()); else super(...a); }
    static now() { return fige.getTime(); }
  }
  contexte.Date = DateFigee;
  try { return fn(); } finally { contexte.Date = VraieDate; }
}

test("dodo : une heure de coucher en :00 n'est plus décalée d'une demi-heure", () => {
  const { api } = construireContexte();
  // Le raccourci `parseInt(x) || defaut` lisait 0 comme « absent » : "20:00"
  // devenait 20:30 et "00:30" devenait 19:30.
  assert.strictEqual(api.minutesCoucher("20:00"), 20 * 60);
  assert.strictEqual(api.minutesCoucher("19:00"), 19 * 60);
  assert.strictEqual(api.minutesCoucher("00:30"), 30);
  assert.strictEqual(api.minutesCoucher("21:15"), 21 * 60 + 15);
  assert.strictEqual(api.minutesCoucher("07:05"), 7 * 60 + 5);
});

test("dodo : une heure de coucher illisible retombe sur 19:30", () => {
  const { api } = construireContexte();
  [undefined, null, "", "abc", "25:00", "19:70", "19h30", "19:3"].forEach(v => {
    assert.strictEqual(api.minutesCoucher(v), api.DODO_DEFAUT, "valeur refusée : " + v);
  });
});

test("dodo : la bascule orange → nuit tombe à l'heure pile", () => {
  const { api, contexte } = construireContexte();
  const enf = { heureCoucher: "20:00" };
  // Une minute avant : encore le soir.
  aLHeure(contexte, 19, 59, 0, () => {
    assert.strictEqual(api.momentDodo(enf).classe, "dodo-soir");
  });
  // Une seconde avant : toujours le soir — mais tout juste.
  aLHeure(contexte, 19, 59, 59, () => {
    assert.strictEqual(api.momentDodo(enf).classe, "dodo-soir");
  });
  // À la seconde pile, et après : la nuit.
  aLHeure(contexte, 20, 0, 0, () => {
    const m = api.momentDodo(enf);
    assert.strictEqual(m.classe, "dodo-nuit");
    assert.strictEqual(m.progress, 100);
  });
  aLHeure(contexte, 20, 3, 0, () => {
    assert.strictEqual(api.momentDodo(enf).classe, "dodo-nuit", "orange 3 minutes après le coucher");
  });
});

test("dodo : les trois ambiances suivent la fenêtre de deux heures", () => {
  const { api, contexte } = construireContexte();
  const enf = { heureCoucher: "20:00" };
  aLHeure(contexte, 17, 0, 0, () => {   // 3 h avant : plein jour
    const m = api.momentDodo(enf);
    assert.strictEqual(m.classe, "dodo-jour");
    assert.strictEqual(m.progress, 0);
  });
  aLHeure(contexte, 17, 59, 59, () => { // juste avant la fenêtre : encore le jour
    assert.strictEqual(api.momentDodo(enf).classe, "dodo-jour");
  });
  aLHeure(contexte, 18, 0, 0, () => {   // pile 2 h avant : la fenêtre s'ouvre à zéro
    const m = api.momentDodo(enf);
    assert.strictEqual(m.classe, "dodo-soir");
    assert.strictEqual(m.progress, 0);
  });
  aLHeure(contexte, 19, 0, 0, () => {   // 1 h avant : mi-parcours
    const m = api.momentDodo(enf);
    assert.strictEqual(m.classe, "dodo-soir");
    assert.strictEqual(m.progress, 50);
  });
});

test("dodo : le rafraîchissement est calé sur l'horloge, pas sur un intervalle libre", () => {
  const fs = require("fs");
  const path = require("path");
  const src = fs.readFileSync(path.join(__dirname, "..", "js/ui.js"), "utf8");
  assert.ok(!/setInterval\(\s*majDodo/.test(src),
    "majDodo ne doit plus tourner sur un setInterval libre (dérive + gel en arrière-plan)");
  assert.ok(/function planifierDodo\(\)/.test(src), "planifierDodo introuvable");
  assert.ok(/60000 - \(now\.getSeconds\(\) \* 1000 \+ now\.getMilliseconds\(\)\)/.test(src),
    "le prochain tick doit viser la minute pleine suivante");
  // Un téléphone en veille suspend les minuteurs : il faut recalculer au retour.
  ["visibilitychange", "focus", "pageshow"].forEach(ev => {
    assert.ok(new RegExp('addEventListener\\("' + ev + '"').test(src),
      "reprise non gérée : " + ev);
  });
});

/* ---------- Module de soutien (dons) ---------- */

test("dons : le module reste visible pour l'administrateur, même early adopter", () => {
  const fs = require("fs");
  const path = require("path");
  const src = fs.readFileSync(path.join(__dirname, "..", "js/auth.js"), "utf8");
  const f = src.slice(src.indexOf("function donDisponible()"));
  const corps = f.slice(0, f.indexOf("\n}"));
  const iAdmin = corps.indexOf("estAdmin");
  const iEarly = corps.indexOf("estEarlyAdopter()");
  assert.ok(iAdmin > -1 && iEarly > -1, "tests attendus absents de donDisponible");
  assert.ok(iAdmin < iEarly,
    "estAdmin doit être testé AVANT estEarlyAdopter : l'éditeur figure dans la liste " +
    "des early adopters et le bloc lui resterait invisible");
});

test("dons : les 4 langues énoncent la gratuité ET l'absence de publicité", () => {
  const { api } = construireContexte();
  const pub = { fr: /publicité/i, en: /ad-free|advertis/i, nl: /reclame/i, de: /werbefrei|werbung/i };
  const gratuit = { fr: /gratuite/i, en: /free/i, nl: /gratis/i, de: /kostenlos/i };
  Object.keys(api.LANGUES).forEach(lg => {
    const g = api.I18N[lg]["don.gratuit"];
    assert.ok(g, "don.gratuit manquant en " + lg);
    assert.ok(gratuit[lg].test(g), "gratuité non énoncée en " + lg + " : " + g);
    assert.ok(pub[lg].test(g), "absence de publicité non énoncée en " + lg + " : " + g);
  });
});

test("dons : le bloc d'appel au don ne se prononce pas sur l'avenir", () => {
  const { api } = construireContexte();
  // Une promesse de gratuité future a sa place dans les mentions légales, pas
  // dans un bloc d'appel au don : elle y sonnerait comme un argument de vente.
  const futur = {
    fr: /restera|resteront|toujours gratuit/i,
    en: /will stay|will remain|always be free/i,
    nl: /blijft gratis|blijven gratis|altijd gratis/i,
    de: /bleibt es|bleibt kostenlos|immer kostenlos/i,
  };
  Object.keys(api.LANGUES).forEach(lg => {
    ["don.gratuit", "don.texte", "don.merci", "don.transparence"].forEach(cle => {
      const v = api.I18N[lg][cle] || "";
      assert.ok(!futur[lg].test(v), `${cle} (${lg}) se prononce sur l'avenir : ${v}`);
    });
  });
});

// Les e-mails sortants engagent autant que les mentions légales — davantage,
// même : une fois envoyés, ils ne se corrigent plus. Deux promesses d'avenir
// s'y étaient maintenues après le nettoyage des pages publiques.
test("modèle : aucun e-mail sortant ne promet la gratuité future", () => {
  const { api } = construireContexte();
  const futur = /le restera|resteront|toujours gratuit|à vie|sans modèle payant prévu|pas de version payante|jamais payant|la gratuité pour les familles/i;
  const fautifs = [];
  api.CROISSANCE_MAILS.forEach(m => {
    [m.sujet, m.corps].forEach(txt => {
      const f = futur.exec(txt || "");
      if (f) fautifs.push(`${m.id} → « ${f[0]} »`);
    });
  });
  assert.strictEqual(fautifs.length, 0, "promesse d'avenir dans : " + fautifs.join(" ; "));
});

// Un don récurrent qui ne peut pas être résilié depuis l'app n'est pas
// acceptable : le chemin d'arrêt doit exister, être traduit, et être documenté.
test("dons : le soutien mensuel peut être arrêté depuis l'application", () => {
  const fs = require("fs"), path = require("path");
  const racine = path.join(__dirname, "..");
  const { api } = construireContexte();
  Object.keys(api.LANGUES).forEach(lg => {
    ["don.gerer", "admin.don_portail", "admin.don_portail_aide"].forEach(k =>
      assert.ok(api.I18N[lg][k], `${k} manquant en ${lg}`));
  });
  const ui = fs.readFileSync(path.join(racine, "js/ui.js"), "utf8");
  assert.ok(/cfg\.don_portail_url/.test(ui), "le bloc de don doit exposer le portail client");
  assert.ok(/\["don_portail_url", t\("admin\.don_portail"\)\]/.test(ui),
    "le portail doit être réglable depuis l'espace admin");
  const faq = fs.readFileSync(path.join(racine, "faq.html"), "utf8");
  assert.ok(faq.includes('id="arreter-don"'), "la FAQ doit expliquer comment arrêter un don mensuel");
});

/* ---------- Espace parents : onglet Soutien & cartes repliables ---------- */

test("parents : le soutien a son onglet, et n'encombre plus « Aujourd'hui »", () => {
  const fs = require("fs"), path = require("path");
  const ui = fs.readFileSync(path.join(__dirname, "..", "js/ui.js"), "utf8");
  // L'onglet n'existe que si le don est proposé à cette famille.
  assert.ok(/const soutien = \(typeof donDisponible/.test(ui),
    "la présence de l'onglet doit dépendre de donDisponible");
  assert.strictEqual((ui.match(/if \(soutien\) ids\.push\("soutien"\);/g) || []).length, 2,
    "l'onglet doit exister dans les deux modes (simplifié et expert)");
  assert.ok(/soutien: "grp\.soutien"/.test(ui), "libellé d'onglet non déclaré");
  assert.ok(/sectionVisible\("soutien"\)/.test(ui), "le contenu de l'onglet n'est pas rendu");
  // blocDon ne doit plus être appelé qu'à un seul endroit : son onglet.
  assert.strictEqual((ui.match(/c\.appendChild\(blocDon\(\)\)/g) || []).length, 1,
    "blocDon doit être rendu une seule fois, dans son propre onglet");
  const { api } = construireContexte();
  Object.keys(api.LANGUES).forEach(lg =>
    assert.ok(api.I18N[lg]["grp.soutien"], "grp.soutien manquant en " + lg));
});

test("parents : les cartes longues sont repliables et retiennent leur état", () => {
  const fs = require("fs"), path = require("path");
  const ui = fs.readFileSync(path.join(__dirname, "..", "js/ui.js"), "utf8");
  assert.ok(/function carteRepliable\(sec, cle, ouvertParDefaut\)/.test(ui), "carteRepliable absente");
  // <details>/<summary> : pliage natif, accessible au clavier sans script.
  assert.ok(/el\("details", "carte-pli"\)/.test(ui) && /el\("summary", "carte-pli-t"\)/.test(ui),
    "le pli doit reposer sur <details>/<summary>");
  // rendre() reconstruit tout : sans mémoire, la carte se refermerait à chaque clic.
  assert.ok(/plisParent\.set\(cle, det\.open\)/.test(ui),
    "l'état d'ouverture doit être mémorisé");
  assert.ok(/det\.open = plisParent\.has\(cle\)/.test(ui),
    "l'état mémorisé doit être restitué au rendu suivant");
  // Le <h2> est déplacé dans le <summary> : le titre reste un titre.
  assert.ok(/som\.appendChild\(titre\)/.test(ui), "la sémantique de titre doit être conservée");
  [["blocSelectionGroupee\\(\\)", "selection"], ["blocTournantes\\(\\)", "tournantes"],
   ["blocMissionsDuJour\\(enfantActif\\(\\)\\)", "missions"],
   ["blocCorrections\\(enfantActif\\(\\)\\)", "corrections"],
   ["blocJournalActions\\(\\)", "journal"]].forEach(([bloc, cle]) => {
    assert.ok(new RegExp(`carteRepliable\\(${bloc}, "${cle}"`).test(ui),
      "carte longue non repliée : " + cle);
  });
  // Chaque clé de pli doit être unique, sinon deux cartes partagent leur état.
  // Exception : une carte présente dans les DEUX branches de mode (simplifié
  // et expert) apparaît deux fois dans la source alors qu'une seule est
  // rendue. Partager la clé est alors voulu — la préférence du parent
  // survit au changement de mode. Toute autre répétition est un défaut.
  const DEUX_MODES = ["missions", "journal", "rituel"];
  const cles = (ui.match(/carteRepliable\([^,]+, "([a-z]+)"/g) || [])
    .map(m => /"([a-z]+)"$/.exec(m)[1]);
  const doublons = cles.filter((c, i) => cles.indexOf(c) !== i && DEUX_MODES.indexOf(c) < 0);
  assert.strictEqual(doublons.length, 0, "clés de pli partagées : " + doublons.join(", "));
  // Et une clé exemptée doit vraiment apparaître deux fois : sinon
  // l'exemption masque une carte qu'on a oublié de rendre dans un mode.
  DEUX_MODES.forEach(c => assert.strictEqual(cles.filter(x => x === c).length, 2,
    "carte absente d'un des deux modes parents : " + c));
  const css = fs.readFileSync(path.join(__dirname, "..", "css/style.css"), "utf8");
  ["carte-pli", "carte-pli-t", "carte-pli-c"].forEach(c =>
    assert.ok(css.includes("." + c), "style manquant : ." + c));
});

test("parents : sous-plis et découpe des cartes de l'espace parents", () => {
  const fs = require("fs"), path = require("path");
  const ui = fs.readFileSync(path.join(__dirname, "..", "js/ui.js"), "utf8");
  const { api } = construireContexte();

  // 1. Famille / Planète ouvertes d'emblée : « Missions proposées » étant déjà
  //    repliée, un second pli fermé imposait deux gestes avant la 1ʳᵉ case.
  assert.ok(/blocPliable\(`\$\{cat\.emoji\}[^`]*`, true, "mdj-"/.test(ui),
    "les catégories de missions doivent être dépliées par défaut");

  // 2. « Famille » et « Invitations » : deux cartes, deux titres.
  Object.keys(api.LANGUES).forEach(lg =>
    assert.ok(api.I18N[lg]["fam.inv_titre"], "fam.inv_titre manquant en " + lg));
  const sf = ui.slice(ui.indexOf("function sectionsFamille"));
  const corps = sf.slice(0, sf.indexOf("// Bilan : ce que la famille"));
  assert.ok(/t\("fam\.inv_titre"\)/.test(corps), "la carte Invitations n'a pas de titre");
  assert.strictEqual((corps.match(/el\("section", "carte"\)/g) || []).length, 3,
    "l'onglet Famille doit porter trois cartes : Arbre, Invitations, nom de famille");
  // Le lien créé doit s'afficher dans SA carte — et, celle-ci étant repliable,
  // à l'intérieur du pli plutôt que sous un titre fermé.
  assert.ok(/montrerLienInvitation\(invit\.querySelector\("\.carte-pli-c"\) \|\| invit, lien\)/.test(corps),
    "le lien d'invitation doit s'afficher dans le corps déplié de la carte Invitations");
  // Ordre d'affichage : l'Arbre d'abord, puis Invitations, puis le nom de famille.
  const ordre = ["c.appendChild(par);",
                 'c.appendChild(carteRepliable(invit, "fam-invitations", false));',
                 'c.appendChild(carteRepliable(fam, "fam-nom", false));'];
  let pos = -1;
  ordre.forEach(frag => {
    const i = ui.indexOf(frag);
    assert.ok(i > pos, "ordre des cartes de l'onglet Famille rompu : " + frag);
    pos = i;
  });

  // 3. Bibliothèque d'idées : repliée par défaut, mémoire partagée.
  assert.ok(/<details class="csp-idees pliable">/.test(ui), "les idées doivent être un dépliant");
  assert.ok(/<h3 class="csp-idees-titre">/.test(ui), "le titre des idées doit rester un <h3>");
  assert.ok(/memoriserPli\(sec\.querySelector\("details\.csp-idees"\), "cs-idees", false\)/.test(ui),
    "les idées doivent être repliées par défaut et retenir leur état");

  // 4. Mémoire de pli : une seule implémentation, tolérante à un sélecteur vide.
  assert.ok(/function memoriserPli\(det, cle, ouvertParDefaut\) \{\s*if \(!det\) return det;/.test(ui),
    "memoriserPli doit se garder d'un élément absent");
  assert.ok(/memoriserPli\(d, cle, ouvert\);/.test(ui),
    "blocPliable doit réutiliser memoriserPli plutôt que dupliquer la logique");
});

test("arbre : la carte explique ce qu'est l'Arbre, sans rang ni comparaison", () => {
  const fs = require("fs"), path = require("path");
  const ui = fs.readFileSync(path.join(__dirname, "..", "js/ui.js"), "utf8");
  assert.ok(/t\("arbre\.explication", \{ app: APP_NOM \}\)/.test(ui),
    "l'explication doit être affichée dans la carte de l'Arbre");
  const { api } = construireContexte();
  Object.keys(api.LANGUES).forEach(lg => {
    const v = api.I18N[lg]["arbre.explication"];
    assert.ok(v, "arbre.explication manquante en " + lg);
    assert.ok(v.includes("{app}"), "le nom de l'app doit être interpolé (" + lg + ")");
    // Doctrine PLAN-PARRAINAGE § 1.1 : jamais un rang, jamais un écart entre familles.
    assert.ok(!/classement|rang|podium|ranking|leaderboard|klassement|rangliste/i.test(v),
      "l'explication ne doit évoquer aucun classement (" + lg + ") : " + v);
  });
});

test("carte d'ami : elle peut être imprimée ou partagée", () => {
  const fs = require("fs"), path = require("path");
  const ui = fs.readFileSync(path.join(__dirname, "..", "js/ui.js"), "utf8");
  const { api } = construireContexte();
  Object.keys(api.LANGUES).forEach(lg =>
    ["cami.partager", "cami.partage_titre", "cami.partage_texte", "cami.imprimer"].forEach(k =>
      assert.ok(api.I18N[lg][k], `${k} manquant en ${lg}`)));
  assert.ok(/id="carte-partager"/.test(ui) && /id="carte-imprimer"/.test(ui),
    "les deux boutons doivent exister");
  // Le partage ne doit pas être proposé avant que le code ne soit connu.
  assert.ok(/bPartager\.disabled = true;/.test(ui) && /bPartager\.disabled = false;/.test(ui),
    "le bouton de partage doit attendre le code");
  const f = ui.slice(ui.indexOf("async function partagerCarteAmi"));
  const corps = f.slice(0, f.indexOf("\n}\n"));
  assert.ok(/navigator\.share/.test(corps), "le sélecteur natif doit être utilisé quand il existe");
  assert.ok(/AbortError/.test(corps), "un partage annulé ne doit pas être traité comme une erreur");
  assert.ok(/navigator\.clipboard/.test(corps), "un repli presse-papiers est nécessaire sur ordinateur");
  // Les boutons ne doivent pas finir sur la feuille imprimée.
  const css = fs.readFileSync(path.join(__dirname, "..", "css/style.css"), "utf8");
  assert.ok(/body\.impression \.carte-ami-actions\{display:none\}/.test(css),
    "les boutons doivent être masqués à l'impression");
});

/* ---------- Rendez-vous d'une carte surprise gagnée ---------- */

// Prépare une carte débloquée dans l'état courant et la renvoie.
function carteGagnee(api, id) {
  api.lierEtat(api.etatVierge());
  const c = api.cartesSurprises()[0];
  c.debloquee = true; c.recolte = c.cout;
  if (id) c.id = id;
  return c;
}

test("carte surprise : on ne planifie que ce qui est gagné, et la date est validée", () => {
  const { api } = construireContexte();
  api.lierEtat(api.etatVierge());
  const enCours = api.cartesSurprises()[0];
  assert.strictEqual(api.definirDateCarte(enCours.id, "2026-09-12"), false,
    "une carte non débloquée ne se planifie pas");
  const c = carteGagnee(api);
  ["12/09/2026", "2026-9-12", "hier", "2026-09-12T10:00"].forEach(mauvaise =>
    assert.strictEqual(api.definirDateCarte(c.id, mauvaise), false, "date acceptée à tort : " + mauvaise));
  assert.strictEqual(api.definirDateCarte(c.id, "2026-09-12", "16h30"), false, "heure acceptée à tort");
  assert.strictEqual(api.definirDateCarte(c.id, "2026-09-12", "16:30"), true);
  assert.strictEqual(c.prevueLe, "2026-09-12");
  assert.strictEqual(c.prevueHeure, "16:30");
  // Effacer la date efface l'heure : une heure sans jour ne veut rien dire.
  assert.strictEqual(api.definirDateCarte(c.id, "", "16:30"), true);
  assert.strictEqual(c.prevueLe, null);
  assert.strictEqual(c.prevueHeure, null);
});

test("carte surprise : le décompte compte en jours, pas en heures", () => {
  const { api } = construireContexte();
  const c = carteGagnee(api);
  assert.strictEqual(api.joursAvantCarte(c), null, "sans date, pas de décompte");
  api.definirDateCarte(c.id, "2026-09-12");
  assert.strictEqual(api.joursAvantCarte(c, "2026-09-12"), 0, "le jour même");
  assert.strictEqual(api.joursAvantCarte(c, "2026-09-11"), 1, "la veille");
  assert.strictEqual(api.joursAvantCarte(c, "2026-09-09"), 3);
  assert.strictEqual(api.joursAvantCarte(c, "2026-09-15"), -3, "après coup");
  // Le passage à l'heure d'hiver ne doit pas décaler le compte d'un jour.
  const h = carteGagnee(api, "cs_hiver");
  api.definirDateCarte(h.id, "2026-11-02");
  assert.strictEqual(api.joursAvantCarte(h, "2026-10-24"), 9, "changement d'heure : décompte faussé");
});

test("carte surprise : le fichier d'agenda est un iCalendar valide", () => {
  const { api } = construireContexte();
  const c = carteGagnee(api);
  assert.strictEqual(api.icsCarteSurprise(c, "Ciné", "Un film"), null, "sans date, pas d'événement");

  // Journée entière : DTEND est exclusif, donc le lendemain.
  api.definirDateCarte(c.id, "2026-09-12");
  const jour = api.icsCarteSurprise(c, "Soirée ciné", "On choisit un film", new Date(Date.UTC(2026, 7, 8, 6, 0, 0)));
  assert.ok(jour.startsWith("BEGIN:VCALENDAR\r\n"), "en-tête absent");
  assert.ok(jour.endsWith("END:VCALENDAR\r\n"), "fin de fichier absente");
  assert.ok(jour.includes("DTSTART;VALUE=DATE:20260912"), "DTSTART journée entière incorrect");
  assert.ok(jour.includes("DTEND;VALUE=DATE:20260913"), "DTEND doit être le lendemain (borne exclusive)");
  assert.ok(jour.includes("DTSTAMP:20260808T060000Z"), "DTSTAMP doit être en UTC");
  assert.ok(/\r\n/.test(jour) && !/[^\r]\n/.test(jour), "les fins de ligne doivent toutes être CRLF");

  // Avec une heure : événement local flottant de deux heures, sans « Z ».
  api.definirDateCarte(c.id, "2026-09-12", "16:30");
  const heure = api.icsCarteSurprise(c, "Soirée ciné", "On choisit un film");
  assert.ok(heure.includes("DTSTART:20260912T163000"), "DTSTART horaire incorrect");
  assert.ok(heure.includes("DTEND:20260912T183000"), "l'événement doit durer deux heures");
  assert.ok(!/DTSTART:[0-9T]+Z/.test(heure), "l'heure locale ne doit pas être marquée UTC");

  // Séparateurs iCalendar échappés (RFC 5545 § 3.3.11).
  const e = api.icsEchapper("Ciné, pop-corn; couverture\nchaude \\o/");
  assert.strictEqual(e, "Ciné\\, pop-corn\\; couverture\\nchaude \\\\o/");

  // Repli des lignes longues à 75 octets, emojis compris.
  const pliee = api.icsPlier("SUMMARY:🎬 " + "a".repeat(120));
  pliee.split("\r\n").forEach(l =>
    assert.ok(Buffer.byteLength(l, "utf8") <= 75, "ligne trop longue : " + Buffer.byteLength(l, "utf8")));
  pliee.split("\r\n").slice(1).forEach(l =>
    assert.ok(l.startsWith(" "), "une ligne repliée doit commencer par une espace"));
});

test("carte surprise : les familles existantes reçoivent les champs de rendez-vous", () => {
  const { api } = construireContexte();
  const ancien = api.etatVierge();
  // Une carte d'avant la fonctionnalité : ni prevueLe, ni prevueHeure.
  ancien.cartesSurprises = [{ id: "cs_vieux", emoji: "🎁", titre: "X", activite: "Y",
    cout: 100, recolte: 100, dons: {}, debloquee: true, faite: false, revele: true }];
  const n = api.normaliser(ancien);
  assert.strictEqual(n.cartesSurprises[0].prevueLe, null);
  assert.strictEqual(n.cartesSurprises[0].prevueHeure, null);
  assert.strictEqual(n.cartesSurprises[0].recolte, 100, "la progression ne doit pas être perdue");
  // Une valeur corrompue est ramenée à « pas de rendez-vous », jamais conservée.
  ancien.cartesSurprises[0].prevueLe = "n'importe quoi";
  assert.strictEqual(api.normaliser(ancien).cartesSurprises[0].prevueLe, null);
});

test("carte surprise : l'interface propose date, agenda et décompte", () => {
  const fs = require("fs"), path = require("path");
  const ui = fs.readFileSync(path.join(__dirname, "..", "js/ui.js"), "utf8");
  const { api } = construireContexte();
  Object.keys(api.LANGUES).forEach(lg =>
    ["cs.rdv_titre", "cs.rdv_agenda", "cs.rdv_dans", "cs.rdv_demain",
     "cs.rdv_aujourdhui", "cs.rdv_passe", "cs.rdv_note"].forEach(k =>
      assert.ok(api.I18N[lg][k], `${k} manquant en ${lg}`)));
  assert.ok(/\{n\}/.test(api.I18N.fr["cs.rdv_dans"]), "le nombre de dodos doit être interpolé");
  // Le rendez-vous ne s'affiche que sur une carte gagnée et pas encore faite.
  assert.ok(/c\.debloquee && !c\.faite \? blocRendezVousCarte\(c\) : ""/.test(ui),
    "le bloc rendez-vous doit être réservé aux cartes gagnées non faites");
  assert.ok(/data-ics="\$\{c\.id\}"\$\{c\.prevueLe \? "" : " disabled"\}/.test(ui),
    "l'export agenda doit être désactivé tant qu'aucune date n'est fixée");
  assert.ok(/text\/calendar;charset=utf-8/.test(ui), "le type MIME iCalendar est requis");
  assert.ok(/URL\.revokeObjectURL/.test(ui), "l'URL temporaire doit être libérée");
  // Côté enfant : le décompte remplace l'invitation générique.
  assert.ok(/joursAvantCarte\(c\)/.test(ui) && /texteDecompteCarte\(jRdv\)/.test(ui),
    "le décompte doit apparaître sur la carte de l'enfant");
});

test("parents : la famille n'a plus de cadre, la boîte à idées descend", () => {
  const fs = require("fs"), path = require("path");
  const ui = fs.readFileSync(path.join(__dirname, "..", "js/ui.js"), "utf8");
  // Mode simplifié : plus de dépliant englobant autour des trois cartes.
  assert.ok(!/dep\(t\("regl\.famille"\)/.test(ui),
    "le cadre « Famille et invitations » ne doit plus envelopper les trois cartes");
  assert.ok(/^\s+sectionsFamille\(c\);$/m.test(ui),
    "sectionsFamille doit être appelée directement en mode simplifié");
  // La boîte à idées n'ouvre plus l'onglet « Mon compte ».
  const sc = ui.slice(ui.indexOf("function sectionsCompte"));
  const corps = sc.slice(0, sc.indexOf("\n}\n"));
  const iRecup = corps.indexOf("blocRecuperation()");
  const iFeed = corps.lastIndexOf("blocFeedback()");
  assert.ok(iRecup > -1 && iFeed > iRecup,
    "la boîte à idées doit venir après la récupération de données, pas en tête d'onglet");
});

test("carte d'ami : le partage produit une image, avec le lien en légende", () => {
  const fs = require("fs"), path = require("path");
  const ui = fs.readFileSync(path.join(__dirname, "..", "js/ui.js"), "utf8");
  const { api } = construireContexte();
  Object.keys(api.LANGUES).forEach(lg =>
    assert.ok(api.I18N[lg]["cami.partage_ordi"], "cami.partage_ordi manquant en " + lg));

  const img = ui.slice(ui.indexOf("function imageCarteAmi"));
  const corpsImg = img.slice(0, img.indexOf("\n}\n"));
  // Le QR vient de notre propre encodeur : net à n'importe quelle taille, et
  // aucune dépendance à une image externe qui échouerait en silence.
  assert.ok(/qrMatrice\(lien\)/.test(corpsImg), "le QR doit être dessiné depuis qrMatrice");
  assert.ok(/cv\.toBlob/.test(corpsImg), "l'image doit être produite en PNG");
  assert.ok(/catch \(e\) \{ return null; \}/.test(corpsImg),
    "un échec de dessin doit se solder par null, pas par une exception");
  // La hauteur suit le contenu : sans QR ou avec un prénom long, ni trou ni débordement.
  assert.ok(/cv\.height = Math\.round\(hauteur\)/.test(corpsImg),
    "la hauteur de l'image doit s'ajuster au contenu");

  const par = ui.slice(ui.indexOf("async function partagerCarteAmi"));
  const corpsPar = par.slice(0, par.indexOf("\n}\n"));
  assert.ok(/navigator\.canShare\(\{ files: \[fichier\] \}\)/.test(corpsPar),
    "le partage de fichier doit être testé avant d'être tenté");
  // Beaucoup d'applications ignorent « url » quand un fichier est joint :
  // le lien doit donc figurer dans le texte, sinon l'invitation part sans lui.
  assert.ok(/files: \[fichier\][^}]*text: texte \+ " " \+ lien/.test(corpsPar),
    "le lien doit accompagner l'image dans le texte du partage");
  assert.ok(/telechargerBlob\(blob/.test(corpsPar), "sur ordinateur, l'image doit être téléchargée");
  assert.strictEqual((corpsPar.match(/AbortError/g) || []).length, 2,
    "chaque tentative de partage doit traiter l'annulation");
  // Une seule mécanique de téléchargement, partagée avec l'export agenda —
  // qui l'atteint maintenant par envoyerVersAgenda (voir le test dédié).
  assert.strictEqual((ui.match(/function telechargerBlob\(/g) || []).length, 1,
    "telechargerBlob ne doit être défini qu'une fois");
});

/* ---------- Liens sortants : jamais l'adresse du déploiement courant ---------- */

test("liens : tout ce qui part vers l'extérieur vise le domaine public", () => {
  const fs = require("fs"), path = require("path");
  const auth = fs.readFileSync(path.join(__dirname, "..", "js/auth.js"), "utf8");
  const { api } = construireContexte();

  const hote = /const HOTE_PUBLIC = "(https:\/\/[^"]+)"/.exec(auth);
  assert.ok(hote, "HOTE_PUBLIC introuvable");
  assert.ok(!/\/$/.test(hote[1]), "HOTE_PUBLIC ne doit pas finir par une barre oblique");

  // Le lien d'invitation doit tenir dans un QR : sur un déploiement de
  // préaperçu, location.origin faisait 75 caractères et le QR n'était plus
  // produit du tout — la carte affichait « null » à sa place.
  const lien = hote[1] + "/?p=" + "X".repeat(7);
  assert.ok(lien.length <= api.QR_CAPACITE,
    `lien de ${lien.length} caractères pour une capacité de ${api.QR_CAPACITE}`);
  assert.ok(api.qrSvg(lien), "le QR du lien d'invitation doit être produit");

  // Aucune fonction produisant un lien destiné à un tiers ne lit location.
  [["lienDepuisCode", "?p="], ["creerInvitation", "?invite="],
   ["creerParrainage", "?parrain="], ["lienVague", "?vague="]].forEach(([nom, motif]) => {
    const i = auth.indexOf("function " + nom);
    assert.ok(i > -1, nom + " introuvable");
    const corps = auth.slice(i, auth.indexOf("\n}", i));
    assert.ok(corps.includes(motif), nom + " ne produit plus " + motif);
    assert.ok(!/location\.(origin|pathname)/.test(corps),
      nom + " ne doit pas dépendre du déploiement courant");
  });
  // Les e-mails aux familles non plus.
  assert.ok(!/lien: location\.origin/.test(auth),
    "les e-mails aux familles ne doivent pas porter l'adresse du déploiement courant");
  // Les redirections d'authentification, elles, DOIVENT y rester sur le web —
  // mais dans l'app native, où il n'existe pas de « déploiement en cours »,
  // elles doivent basculer vers l'hôte public (urlRetourAuth, Capacitor).
  const i2 = auth.indexOf("function urlRetourAuth");
  assert.ok(i2 > -1, "urlRetourAuth introuvable");
  const urlRetour = auth.slice(i2, auth.indexOf("\n}", i2));
  assert.ok(/location\.origin \+ location\.pathname/.test(urlRetour),
    "la redirection d'authentification doit revenir sur le déploiement en cours (web)");
  assert.ok(/estAppNative\(\)\s*\?\s*HOTE_PUBLIC/.test(urlRetour),
    "dans l'app native, la redirection d'authentification doit viser l'hôte public");
  ["emailRedirectTo: urlRetourAuth()", "redirectTo: urlRetourAuth()"].forEach(motif =>
    assert.ok(auth.includes(motif), motif + " introuvable — un flux d'authentification a été oublié"));
});

test("analyserJetonsAuthDepuisUrl extrait les jetons du lien d'authentification (app native)", () => {
  const analyser = fonctionDeSource("js/auth.js", "analyserJetonsAuthDepuisUrl", { URLSearchParams });

  // Un lien d'invitation/parrainage ordinaire (?invite=, ?p=...) n'a pas de
  // fragment #  : il ne doit surtout pas être pris pour un lien d'auth.
  assert.strictEqual(analyser("https://fami.team/?invite=ABC"), null);
  assert.strictEqual(analyser(""), null);
  assert.strictEqual(analyser(undefined), null);
  // Fragment présent mais sans les deux jetons : rien à faire.
  assert.strictEqual(analyser("https://fami.team/#type=recovery"), null);

  // Comparaison champ par champ : l'objet est construit dans le sandbox vm de
  // fonctionDeSource, un realm distinct — deepStrictEqual y verrait à tort des
  // prototypes différents malgré une structure identique.
  const lien = "https://fami.team/#access_token=AAA&refresh_token=BBB&type=magiclink&expires_in=3600";
  const r = analyser(lien);
  assert.strictEqual(r.access_token, "AAA");
  assert.strictEqual(r.refresh_token, "BBB");
  assert.strictEqual(r.type, "magiclink");

  // Mot de passe oublié : le type "recovery" doit être préservé pour que
  // l'appelant sache qu'il faut proposer un nouveau mot de passe.
  const reset = "https://fami.team/#access_token=CCC&refresh_token=DDD&type=recovery";
  assert.strictEqual(analyser(reset).type, "recovery");
});

test("QR : un carré impossible à produire ne s'écrit jamais « null »", () => {
  const fs = require("fs"), path = require("path");
  const ui = fs.readFileSync(path.join(__dirname, "..", "js/ui.js"), "utf8");
  const { api } = construireContexte();
  assert.strictEqual(api.qrSvg("x".repeat(api.QR_CAPACITE + 1)), null,
    "au-delà de la capacité, qrSvg doit renvoyer null");
  // Chaque interpolation de qrSvg doit passer par un repli, sans quoi le mot
  // « null » s'affiche au milieu de la carte, sous les yeux de l'enfant.
  const appels = ui.match(/const qr = \(typeof qrSvg === "function"[^;]+;/g) || [];
  assert.ok(appels.length >= 3, "appels à qrSvg introuvables");
  // Deux formes acceptables : un repli immédiat (« || … ») ou un null explicite,
  // qui oblige alors l'appelant à tester la variable avant de l'interpoler.
  appels.forEach(a => assert.ok(/\|\|/.test(a) || /: null;$/.test(a.trim()),
    "appel à qrSvg sans repli : " + a.slice(0, 90)));
  // Et le null explicite doit effectivement être testé à l'usage.
  const nbNull = (ui.match(/\$\{qr \? /g) || []).length;
  assert.ok(nbNull >= 2, "les qrSvg pouvant valoir null doivent être testés avant interpolation");
  Object.keys(api.LANGUES).forEach(lg =>
    assert.ok(api.I18N[lg]["cami.sans_qr"], "cami.sans_qr manquant en " + lg));
});

test("carte surprise : la date se fixe depuis la vue famille, derrière le code parent", () => {
  const fs = require("fs"), path = require("path");
  const ui = fs.readFileSync(path.join(__dirname, "..", "js/ui.js"), "utf8");
  const { api } = construireContexte();
  Object.keys(api.LANGUES).forEach(lg =>
    ["cs.rdv_planifier", "cs.rdv_modifier", "cs.rdv_pin"].forEach(k =>
      assert.ok(api.I18N[lg][k], `${k} manquant en ${lg}`)));
  assert.ok(/data-plan="\$\{c\.id\}"/.test(ui), "le bouton de planification doit être sur la carte");
  const f = ui.slice(ui.indexOf("function planifierCarteSurprise"));
  const corps = f.slice(0, f.indexOf("\n}\n"));
  assert.ok(/etat\.reglages\.codeParent/.test(corps) && /demanderPin\(/.test(corps),
    "la planification doit passer par le code parent quand il existe");
  assert.ok(/modeParents \|\| !\(etat\.reglages && etat\.reglages\.codeParent\)/.test(corps),
    "un parent déjà identifié, ou une famille sans code, ne doit pas être bloqué");
});

test("arbre : les enfants aussi savent ce qu'est cet arbre", () => {
  const fs = require("fs"), path = require("path");
  const ui = fs.readFileSync(path.join(__dirname, "..", "js/ui.js"), "utf8");
  const { api } = construireContexte();
  assert.ok(/t\("arbre\.enfant_expli", \{ app: APP_NOM \}\)/.test(ui),
    "l'explication enfant doit être affichée");
  Object.keys(api.LANGUES).forEach(lg => {
    const v = api.I18N[lg]["arbre.enfant_expli"];
    assert.ok(v, "arbre.enfant_expli manquante en " + lg);
    assert.ok(v.includes("{app}"), "le nom de l'app doit être interpolé (" + lg + ")");
    assert.ok(!/classement|rang|gagn|win|rank|klassement|rangliste/i.test(v),
      "l'explication enfant ne doit rien promettre à gagner (" + lg + ") : " + v);
  });
});

test("défi : la porte explique, rassure, et demande un nom de code", () => {
  const fs = require("fs"), path = require("path");
  const src = fs.readFileSync(path.join(__dirname, "..", "js/defi.js"), "utf8");
  const d = apiDefi();

  // Elle ne s'ouvre qu'une fois, et jamais devant un invité arrivé par un lien
  // d'arène : on ne fait pas patienter quelqu'un sur un formulaire.
  assert.ok(/if \(!pseudoMemorise\(\) && !enAttente\) return ecranPorte/.test(src),
    "la porte doit être conditionnée au nom de code ET à l'absence d'arène en attente");
  assert.ok(/const CLE_PSEUDO = "kp_defi_pseudo"/.test(src), "le nom de code doit être mémorisé");

  const cles = ["porte_kicker", "porte_titre", "porte_intro", "porte_r1", "porte_r2", "porte_r3",
                "cloison_t", "cloison_1", "cloison_2", "cloison_3",
                "porte_pseudo_t", "porte_pseudo_d", "porte_pseudo_ph", "porte_entrer",
                "porte_manque", "porte_bienvenue", "changer_pseudo"];
  Object.keys(d.DEFI_LANGUES).forEach(lg =>
    cles.forEach(k => assert.ok(d.DEFI_I18N[lg][k], `${k} manquant en ${lg}`)));

  // La promesse de cloison doit nommer l'application et parler des enfants :
  // c'est la seule inquiétude sérieuse d'un parent devant cette page.
  Object.keys(d.DEFI_LANGUES).forEach(lg => {
    assert.ok(d.DEFI_I18N[lg]["cloison_1"].includes("{app}"),
      "la cloison doit nommer l'application (" + lg + ")");
    assert.ok(/enfant|child|kind/i.test(d.DEFI_I18N[lg]["cloison_2"]),
      "la cloison doit parler des enfants (" + lg + ")");
  });
  assert.ok(d.DEFI_I18N.fr["porte_bienvenue"].includes("{pseudo}"), "{pseudo} perdu");
  assert.ok(d.DEFI_I18N.fr["changer_pseudo"].includes("{pseudo}"), "{pseudo} perdu");
});

test("défi : la page dit à qui elle s'adresse, et remercie", () => {
  const fs = require("fs"), path = require("path");
  const src = fs.readFileSync(path.join(__dirname, "..", "js/defi.js"), "utf8");
  const d = apiDefi();
  // Le bloc est sur la porte — donc lu avant d'entrer — et le merci se répète
  // au pied du tableau, où l'on vient précisément compter ce qu'on a apporté.
  assert.ok(/tD\("contrib_t"\)[\s\S]{0,400}tD\("contrib_merci"/.test(src),
    "le bloc « contributeurs » doit figurer sur la porte");
  assert.ok(/defi-merci-pied[\s\S]{0,80}tD\("top_merci"/.test(src),
    "le merci doit figurer au pied du tableau");
  ["contrib_t", "contrib_d", "contrib_merci", "top_merci"].forEach(k =>
    Object.keys(d.DEFI_LANGUES).forEach(lg =>
      assert.ok(d.DEFI_I18N[lg][k], `${k} manquant en ${lg}`)));
  Object.keys(d.DEFI_LANGUES).forEach(lg => {
    ["contrib_d", "contrib_merci"].forEach(k =>
      assert.ok(d.DEFI_I18N[lg][k].includes("{app}"),
        `le nom de l'application doit être interpolé (${lg} → ${k})`));
    // Un remerciement doit remercier : la formule ne doit pas se perdre en route.
    assert.ok(/merci|thank|dank|danke/i.test(d.DEFI_I18N[lg]["contrib_merci"]),
      "le remerciement a disparu en " + lg);
    assert.ok(/contributeur|contributor|bijdrager|mitwirkend/i.test(d.DEFI_I18N[lg]["contrib_d"]),
      "la mention des contributeurs a disparu en " + lg);
  });
});

test("défi : le tableau mondial respecte le consentement et le seuil", () => {
  const fs = require("fs"), path = require("path");
  const src = fs.readFileSync(path.join(__dirname, "..", "js/defi.js"), "utf8");
  const d = apiDefi();

  // La saison est l'année civile : un mois ne laisse pas le temps d'amener
  // plusieurs familles, et le tableau repartait de zéro avant d'avoir pris.
  assert.strictEqual(d.saisonCourante(), String(new Date().getFullYear()),
    "la saison doit être l'année en cours : " + d.saisonCourante());
  const auth = fs.readFileSync(path.join(__dirname, "..", "js/auth.js"), "utf8");
  const f = auth.slice(auth.indexOf("function saisonCourante"));
  assert.ok(/getFullYear\(\)/.test(f.slice(0, f.indexOf("\n}"))) &&
            !/getMonth\(\)/.test(f.slice(0, f.indexOf("\n}"))),
    "le tableau d'honneur de l'application doit suivre la même saison");
  // Le filtre de la base compare un PRÉFIXE : une saison de 4 caractères
  // couvre l'année entière. Un LIKE aurait laissé passer un « % » du client.
  const sql = fs.readFileSync(path.join(__dirname, "..", "supabase/schema.sql"), "utf8");
  assert.ok(/left\(to_char\(r\.accepted_at, 'YYYY-MM'\), length\(p_saison\)\) = p_saison/.test(sql),
    "le filtre de saison doit comparer un préfixe");
  assert.ok(!/to_char\(r\.accepted_at, 'YYYY-MM'\) = p_saison/.test(sql),
    "l'ancien filtre mensuel strict subsiste");

  // Il réutilise le classement déjà tenu en base — pas un second classement.
  assert.ok(/sb\.rpc\("classement_parrainages", \{ p_saison: saison \}\)/.test(src),
    "le tableau doit s'appuyer sur classement_parrainages");
  // Le rang ne s'affiche que si la base en a renvoyé un : une famille non
  // consentante voit le tableau sans recevoir de rang — « 47ᵉ sur 52 » ne se dit pas.
  assert.ok(/d\.mon_rang \? tD\("top_mon_rang"/.test(src),
    "le rang doit venir de la base, jamais être recalculé côté page");
  // Le tableau ne se scelle plus : il porte le nombre de familles qu'il
  // contient, et grandit jusqu'à dix. Un tableau caché n'attire personne.
  assert.ok(/const plein = Math\.min\(10, top\.length\)/.test(src),
    "le titre doit suivre le nombre de familles inscrites, plafonné à dix");
  assert.ok(/plein > 0 \? tD\("top_titre_n", \{ n: plein \}\)/.test(src),
    "le titre doit être le Top N");
  assert.ok(/plein < 10 \? [\s\S]{0,80}top_grandit/.test(src),
    "sous dix familles, le tableau doit dire qu'il grandit");
  assert.ok(!/top_ferme_t|defi-scelle/.test(src), "il ne doit plus rester de tableau scellé");
  // L'inscription se fait par le choix du nom de code, à la porte, et nulle part
  // ailleurs : plus de case à cocher séparée. Mais elle reste un GESTE, et
  // l'écran doit le dire — sans quoi le consentement ne serait plus éclairé.
  assert.ok(/definir_classement_optin[\s\S]{0,140}p_optin: true/.test(src),
    "le nom de code doit inscrire au tableau");
  const porte = src.slice(src.indexOf("function ecranPorte"));
  assert.ok(/definir_classement_optin/.test(porte.slice(0, porte.indexOf("\n}\n"))),
    "l'inscription doit partir de la porte");
  const d2 = apiDefi();
  Object.keys(d2.DEFI_LANGUES).forEach(lg =>
    assert.ok(/tableau|board|bord|tafel/i.test(d2.DEFI_I18N[lg]["porte_pseudo_d"]),
      "la porte doit annoncer que le nom de code figure au tableau (" + lg + ")"));
  // Et l'on doit pouvoir en sortir, en un clic, avec confirmation.
  assert.ok(/p_optin: false/.test(src), "on doit pouvoir en sortir");
  assert.ok(/confirm\(tD\("top_sortir_conf"\)\)/.test(src), "la sortie doit être confirmée");

  const cles = ["top_bouton", "top_accroche", "top_titre", "top_titre_n", "top_sous", "top_saison",
                "top_h", "top_regle", "top_grandit", "top_premiere_t", "top_premiere_d",
                "top_chargement", "top_indispo", "top_mon_rang", "top_sans_rang", "top_mes_familles",
                "top_inscrit_note", "top_hors_note", "top_retire_note", "top_revenir",
                "top_inscrit", "top_sortir", "top_sortir_conf", "top_sorti"];
  Object.keys(d.DEFI_LANGUES).forEach(lg =>
    cles.forEach(k => assert.ok(d.DEFI_I18N[lg][k], `${k} manquant en ${lg}`)));
  Object.keys(d.DEFI_LANGUES).forEach(lg => {
    assert.ok(d.DEFI_I18N[lg]["top_titre_n"].includes("{n}"), "{n} perdu dans le titre (" + lg + ")");
    assert.ok(d.DEFI_I18N[lg]["top_grandit"].includes("{reste}"), "{reste} perdu en " + lg);
    assert.ok(d.DEFI_I18N[lg]["top_mon_rang"].includes("{n}"), "{n} perdu en " + lg);
  });
});

test("défi : l'adresse /challenge mène à la page, sans l'exposer", () => {
  const fs = require("fs"), path = require("path");
  const r = path.join(__dirname, "..");
  // /challenge est un FICHIER, pas une réécriture. Avec cleanUrls, une
  // réécriture vers /defi.html visait une route qui n'existe plus — Vercel
  // renvoyait 404. Un fichier statique, lui, ne peut pas manquer.
  assert.ok(fs.existsSync(path.join(r, "challenge.html")), "challenge.html absent");
  const vercel = JSON.parse(fs.readFileSync(path.join(r, "vercel.json"), "utf8"));
  assert.strictEqual(vercel.cleanUrls, true, "cleanUrls est ce qui sert challenge.html sous /challenge");
  assert.ok(!(vercel.rewrites || []).some(x => /challenge/.test(x.source || "")),
    "plus de réécriture pour /challenge : le fichier suffit");

  // Les deux coquilles doivent rester identiques — mêmes ressources, même
  // version de cache — sinon l'une des deux adresses servira du code périmé.
  const lire = (f) => fs.readFileSync(path.join(r, f), "utf8");
  const ressources = (html) => [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1])
    .filter(u => /\.(js|css)(\?|$)/.test(u));
  const rDefi = ressources(lire("defi.html")), rChal = ressources(lire("challenge.html"));
  assert.ok(rDefi.length >= 4, "ressources introuvables dans defi.html");
  assert.deepStrictEqual(rChal, rDefi, "les deux adresses ne chargent pas les mêmes fichiers");
  // Chemins absolus : servies sous deux adresses, elles ne peuvent pas être relatives.
  rDefi.forEach(u => assert.ok(/^(https?:)?\/\//.test(u) || u.startsWith("/"),
    "chemin relatif : se résoudrait différemment selon l'adresse — " + u));
  // La seconde adresse doit être aussi discrète que la première.
  assert.ok(/name="robots" content="noindex, nofollow"/.test(lire("challenge.html")),
    "challenge.html doit porter noindex");

  // La nouvelle adresse doit être exclue de l'indexation comme l'ancienne.
  const robots = fs.readFileSync(path.join(r, "robots.txt"), "utf8");
  ["/defi", "/defi.html", "/challenge", "/challenge.html"].forEach(u =>
    assert.ok(new RegExp("^Disallow: " + u + "$", "m").test(robots),
      "adresse non exclue de l'indexation : " + u));
  const sitemap = fs.readFileSync(path.join(r, "sitemap.xml"), "utf8");
  assert.ok(!/challenge|defi/.test(sitemap), "la page ne doit pas entrer au plan du site");
});

test("défi : le tableau de bord dit aussi ce qui ne flatte pas", () => {
  const fs = require("fs"), path = require("path");
  const r = path.join(__dirname, "..");
  const src = fs.readFileSync(path.join(r, "js/defi.js"), "utf8");
  const sql = fs.readFileSync(path.join(r, "supabase/schema.sql"), "utf8");
  const d = apiDefi();

  // La fonction n'expose que des nombres, et reste fermée aux non-connectés.
  const i = sql.indexOf("function public.stats_transparence");
  assert.ok(i > -1, "stats_transparence absente du schéma");
  const corps = sql.slice(i, sql.indexOf("end; $$;", i));
  assert.ok(/auth\.uid\(\) is null then raise exception/.test(corps),
    "le tableau de bord doit rester fermé aux non-connectés");
  assert.ok(/set search_path = public/.test(corps), "search_path non fixé");
  ["count(*)", "count(distinct family_id)"].forEach(x =>
    assert.ok(corps.includes(x), "agrégat manquant : " + x));
  // Aucune identité ne doit sortir : ni nom, ni e-mail, ni identifiant.
  assert.ok(!/f\.name|families\.name|email|classement_pseudo/.test(corps),
    "le tableau de bord ne doit renvoyer que des nombres");
  assert.ok(/grant execute on function public\.stats_transparence\(\)\s+to authenticated/.test(sql),
    "droit d'exécution non accordé aux familles connectées");

  // Les inscriptions ET l'activité : un tableau qui ne montrerait que les
  // arrivées flatterait sans rien dire de l'usage réel.
  assert.ok(/tr_familles/.test(src) && /tr_nouvelles/.test(src) && /tr_actives/.test(src),
    "les trois compteurs doivent être affichés");
  assert.ok(/actives_30j[\s\S]{0,60}\/ total/.test(src),
    "la part de familles encore actives doit être calculée");
  // Un échec de l'appel ne doit pas emporter l'accueil.
  assert.ok(/catch \(e\) \{ st = null; \}/.test(src),
    "l'accueil doit survivre à un tableau de bord indisponible");
  assert.ok(/if \(!st\) return "";/.test(src), "sans données, le bloc doit disparaître");

  const cles = ["tr_titre", "tr_sous", "tr_familles", "tr_nouvelles", "tr_actives",
                "tr_detail", "tr_jalon", "tr_fidele", "tr_note"];
  Object.keys(d.DEFI_LANGUES).forEach(lg =>
    cles.forEach(k => assert.ok(d.DEFI_I18N[lg][k], `${k} manquant en ${lg}`)));
  Object.keys(d.DEFI_LANGUES).forEach(lg => {
    ["{j}", "{m}", "{s7}"].forEach(v =>
      assert.ok(d.DEFI_I18N[lg]["tr_detail"].includes(v), `${v} perdu en ${lg}`));
    assert.ok(d.DEFI_I18N[lg]["tr_jalon"].includes("{n}"), "{n} perdu en " + lg);
    // La saison étant annuelle, plus aucune accroche ne doit parler du mois.
    assert.ok(!/ce mois-ci|this month|deze maand|diesen Monat/i.test(d.DEFI_I18N[lg]["top_accroche"]),
      "l'accroche du tableau parle encore du mois (" + lg + ")");
  });
});

test("carte surprise : une activité réalisée quitte le fil principal", () => {
  const fs = require("fs"), path = require("path");
  const ui = fs.readFileSync(path.join(__dirname, "..", "js/ui.js"), "utf8");
  const { api } = construireContexte();

  const f = ui.slice(ui.indexOf("function blocCartesSurprises(enf)"));
  const corps = f.slice(0, f.indexOf("\n}\n"));
  // Les cartes faites sortent de la boucle principale avant tout rendu.
  assert.ok(/if \(c\.faite\) \{ faites\.push\(\{ c, idx \}\); return; \}/.test(corps),
    "une carte faite doit quitter la liste principale");
  // Elles reviennent dans un tiroir, replié par défaut.
  assert.ok(/<details class="pliable cs-faites">/.test(corps), "le tiroir des faites est absent");
  assert.ok(/memoriserPli\(sec\.querySelector\("details\.cs-faites"\), "cs-faites", false\)/.test(corps),
    "le tiroir doit être fermé par défaut et retenir son état");
  // Réduites à une ligne : ni jauge, ni bouton, ni description.
  const deb = corps.indexOf('<details class="pliable cs-faites">');
  const tiroir = corps.slice(deb, corps.indexOf("</div></details>", deb));
  ["cs-jauge", "cs-faite-btn", "cs-plan-btn", "cs-activite"].forEach(x =>
    assert.ok(!tiroir.includes(x), "le tiroir ne doit contenir que des lignes : " + x));
  // Plus aucun test mort sur c.faite dans la carte principale.
  const principale = corps.slice(0, corps.indexOf('<details class="pliable cs-faites">'));
  assert.ok(!/!c\.faite/.test(principale),
    "les tests sur c.faite de la carte principale sont devenus inutiles");
  Object.keys(api.LANGUES).forEach(lg => {
    const v = api.I18N[lg]["cs.faites_titre"];
    assert.ok(v, "cs.faites_titre manquant en " + lg);
    assert.ok(v.includes("{n}"), "le compte doit être interpolé (" + lg + ")");
  });
});

test("réparation : six gestes, tous traduits, et un accès direct sous code parent", () => {
  const fs = require("fs"), path = require("path");
  const r = path.join(__dirname, "..");
  const ui = fs.readFileSync(path.join(r, "js/ui.js"), "utf8");
  const css = fs.readFileSync(path.join(r, "css/style.css"), "utf8");
  const { api } = construireContexte();

  // Six gestes, dont le nettoyage : les quatre premiers ne couvraient ni la
  // saleté, ni la réparation par les mots.
  assert.strictEqual(api.DEFIS_REPARATION.length, 6, "il doit y avoir six gestes de réparation");
  ["rep_nettoyer", "rep_redemander"].forEach(id =>
    assert.ok(api.DEFIS_REPARATION.some(d => d.id === id), "geste manquant : " + id));
  api.DEFIS_REPARATION.forEach(d => {
    assert.ok(d.emoji && d.titre && d.bonus >= 1, "geste incomplet : " + d.id);
    ["en", "nl", "de"].forEach(lg =>
      assert.ok(api.I18N[lg]["defi." + d.id], `defi.${d.id} manquant en ${lg}`));
  });

  // La pastille de l'en-tête, et la même porte que le mode rétroactif.
  assert.ok(/id="pastille-reparer"/.test(ui), "la pastille doit être dans l'en-tête");
  assert.ok(/bRep\.onclick = ouvrirReparationRapide/.test(ui), "la pastille n'est pas câblée");
  const f = ui.slice(ui.indexOf("function ouvrirReparationRapide"));
  const corps = f.slice(0, f.indexOf("\n}\n"));
  assert.ok(/modeParents \|\| !\(etat\.reglages && etat\.reglages\.codeParent\)/.test(corps),
    "un parent déjà identifié, ou une famille sans code, ne doit pas être bloqué");
  assert.ok(/demanderPin\(/.test(corps) && /etat\.reglages\.codeParent/.test(corps),
    "créditer une réparation doit passer par le code parent quand il existe");

  // La modale lit la MÊME liste que la carte de l'espace parents : deux listes
  // finiraient par diverger.
  const m = ui.slice(ui.indexOf("function modaleReparation"));
  assert.ok(/DEFIS_REPARATION\.forEach/.test(m.slice(0, m.indexOf("\n}\n"))),
    "la modale doit parcourir DEFIS_REPARATION");

  // Le logo réserve la place des pastilles : sans cela il les recouvrait dès
  // 360 px. C'est le retrait qui garantit l'absence de recouvrement, pas la
  // taille de police — donc c'est lui qu'on verrouille.
  assert.ok(/padding-left:96px; padding-right:56px/.test(css),
    "le logo doit réserver la place des pastilles et du minuteur");
  assert.ok(/\.logo\{[^}]*overflow:hidden/.test(css.replace(/\s+/g, " ")),
    "le logo doit être tronqué plutôt que de déborder");
  Object.keys(api.LANGUES).forEach(lg =>
    ["rep.pastille", "rep.pin_titre"].forEach(k =>
      assert.ok(api.I18N[lg][k], `${k} manquant en ${lg}`)));

  // Le tutoriel — l'intro du mode démo — doit présenter la pastille, et juste
  // après le minuteur : les deux pastilles de l'en-tête se suivent ainsi.
  const tuto = ui.slice(ui.indexOf("const etapes = ["), ui.indexOf("];", ui.indexOf("const etapes = [")));
  assert.ok(/sel: "#pastille-reparer"[^\n]*tuto\.rep_t/.test(tuto),
    "le tutoriel doit comporter une étape sur la pastille de réparation");
  assert.ok(tuto.indexOf("#timer-btn") < tuto.indexOf("#pastille-reparer"),
    "l'étape réparation doit venir après celle du minuteur");
  Object.keys(api.LANGUES).forEach(lg => {
    ["tuto.rep_t", "tuto.rep_d"].forEach(k =>
      assert.ok(api.I18N[lg][k], `${k} manquant en ${lg}`));
    // Le parti pris central doit être énoncé là, sinon l'étape ne sert à rien.
    // Un motif par langue plutôt qu'une alternative fourre-tout : « ever »
    // aurait aussi accepté « every », et « nie » n'importe quel mot en -nie-.
    const promesse = { fr: /jamais retiré/i, en: /never|taken away/i,
                       nl: /nooit een punt/i, de: /nie ein Punkt/i };
    assert.ok(promesse[lg].test(api.I18N[lg]["tuto.rep_d"]),
      "l'étape doit dire qu'aucun point n'est jamais retiré (" + lg + ")");
  });
});

test("cartes : le nom « surprise » a disparu de tout ce que voient les familles", () => {
  const fs = require("fs"), path = require("path");
  const r = path.join(__dirname, "..");
  const { api } = construireContexte();

  // Aucune chaîne AFFICHÉE ne doit plus porter l'ancien nom : une carte peut
  // rester mystère, mais la fonctionnalité s'appelle « cartes FamiTeam ».
  const motifs = { fr: /cartes? surprises?/i, en: /surprise cards?/i,
                   nl: /verrassingskaart/i, de: /Überraschungskarte/i };
  const fautifs = [];
  Object.keys(api.LANGUES).forEach(lg => {
    Object.keys(api.I18N[lg]).forEach(k => {
      const v = api.I18N[lg][k];
      if (typeof v === "string" && motifs[lg].test(v)) fautifs.push(lg + " → " + k);
    });
  });
  assert.strictEqual(fautifs.length, 0, "ancien nom encore affiché : " + fautifs.join(", "));
  Object.keys(api.LANGUES).forEach(lg =>
    assert.ok(/FamiTeam/.test(api.I18N[lg]["cs.titre"]), "cs.titre non renommé en " + lg));

  // Les titres de badges viennent des données, non de l'i18n : même exigence.
  api.BADGES_CATALOGUE.forEach(b => assert.ok(!/carte surprise/i.test(b.comment || ""),
    "badge encore libellé « carte surprise » : " + b.id));

  // Le nom TECHNIQUE reste intact : c'est la clé du JSON d'état de chaque
  // famille. La renommer aurait effacé la progression de tout le monde.
  const app = fs.readFileSync(path.join(r, "js/app.js"), "utf8");
  assert.ok(/etat\.cartesSurprises/.test(app),
    "la clé de données cartesSurprises ne doit PAS être renommée");
  const e = api.etatVierge();
  assert.ok(Array.isArray(e.cartesSurprises), "l'état doit continuer de porter cartesSurprises");

  // Et le tutoriel les présente désormais, avant l'avatar.
  const ui = fs.readFileSync(path.join(r, "js/ui.js"), "utf8");
  const tuto = ui.slice(ui.indexOf("const etapes = ["), ui.indexOf("];", ui.indexOf("const etapes = [")));
  assert.ok(/data-vue="famille"[^\n]*tuto\.cartes_t/.test(tuto),
    "le tutoriel doit présenter les cartes FamiTeam");
  assert.ok(tuto.indexOf('data-vue="famille"') < tuto.indexOf('data-vue="avatar"'),
    "l'étape doit suivre l'ordre de la barre de navigation");
  Object.keys(api.LANGUES).forEach(lg =>
    ["tuto.cartes_t", "tuto.cartes_d"].forEach(k =>
      assert.ok(api.I18N[lg][k], `${k} manquant en ${lg}`)));
});

/* La raison d'arrêt la plus citée par les familles amies est le refus de
 * l'écran pour un jeune enfant. Le mode sans écran existait déjà, mais il
 * n'était nommé nulle part avant l'inscription : le parent partait sans
 * jamais apprendre qu'il existait. La réponse doit donc se lire à la porte —
 * page de connexion et FAQ — et pas seulement au fond de l'espace parents. */
test("écrans : le mode sans écran est annoncé avant l'inscription", () => {
  const { api } = construireContexte();
  const fs = require("fs"), path = require("path"), r = path.join(__dirname, "..");
  // Cinquième promesse sur la page de connexion, traduite partout.
  Object.keys(api.LANGUES).forEach(lg =>
    ["auth.feat5_t", "auth.feat5_d"].forEach(k =>
      assert.ok(api.I18N[lg][k], `${k} manquant en ${lg}`)));

  // Elle doit parler de papier ou d'absence d'écran, pas d'autre chose.
  const motifs = {
    fr: /écran|papier|feuille/i, en: /screen|paper|sheet/i,
    nl: /scherm|papier|blad/i, de: /Bildschirm|Papier|Blatt/i
  };
  Object.keys(api.LANGUES).forEach(lg => {
    const txt = api.I18N[lg]["auth.feat5_t"] + " " + api.I18N[lg]["auth.feat5_d"];
    assert.ok(motifs[lg].test(txt), "promesse hors sujet en " + lg);
    assert.ok(/3/.test(txt), "les 3 minutes par jour doivent être chiffrées en " + lg);
  });

  // Et elle est réellement affichée : une clé traduite que personne ne rend
  // ne sert à rien. C'est exactement l'erreur que ce test doit empêcher.
  const auth = fs.readFileSync(path.join(r, "js/auth.js"), "utf8");
  const bloc = auth.slice(auth.indexOf("const features = ["), auth.indexOf("].map(", auth.indexOf("const features = [")));
  assert.ok(/auth\.feat5_t/.test(bloc) && /auth\.feat5_d/.test(bloc),
    "la promesse sans écran doit figurer dans la liste rendue");

  // La FAQ répond à l'objection telle qu'un parent la formule, et cite le
  // mode papier ainsi que l'absence de notification.
  const faq = fs.readFileSync(path.join(r, "faq.html"), "utf8");
  const q = faq.slice(faq.indexOf("<h2>Je ne veux pas d'écran"));
  assert.ok(q.length > 0, "la FAQ doit poser la question du refus de l'écran");
  const rep = q.slice(0, q.indexOf("<h2>", 4));
  assert.ok(/feuille de la semaine/.test(rep), "la réponse doit citer la feuille papier");
  assert.ok(/notification/i.test(rep), "la réponse doit dire qu'il n'y a aucune notification");
  assert.ok(/[Tt]rois minutes|3 minutes/.test(rep), "la réponse doit chiffrer le temps d'écran");
});

/* Le rendez-vous du soir. L'application ne notifiera jamais : le rappel est
 * délégué à l'agenda du parent. Ce qui doit donc être garanti, c'est que le
 * fichier produit prévienne réellement (VALARM), qu'il ne dérive pas au
 * changement d'heure, et qu'aucune heure absurde ne le rende illisible. */
test("rendez-vous du soir : l'heure hors plage est refusée, pas encodée", () => {
  const { api } = construireContexte();
  // HEURE_ISO ne contrôle que la forme. C'est ce piège qui produisait un
  // DTEND « NaNNaNNaN », donc un fichier rejeté en bloc par l'appareil.
  assert.strictEqual(api.heureValide("25:00"), false);
  assert.strictEqual(api.heureValide("19:99"), false);
  assert.strictEqual(api.heureValide("7:30"), false, "la forme à un chiffre n'est pas la nôtre");
  assert.strictEqual(api.heureValide("00:00"), true);
  assert.strictEqual(api.heureValide("23:59"), true);
  assert.strictEqual(api.icsRituelSoir("quotidien", "25:00", "x", "y"), null);
  assert.strictEqual(api.icsRituelSoir("quotidien", "19:99", "x", "y"), null);
  assert.strictEqual(api.icsRituelSoir("toutes_les_heures", "19:00", "x", "y"), null);

  // Même exigence pour la carte planifiée, qui partageait le défaut.
  const carte = { id: "c1", titre: "T", prevueLe: "2026-09-01", prevueHeure: "26:00" };
  const ics = api.icsCarteSurprise(carte, "T", "A", new Date(2026, 7, 20, 12, 0, 0));
  assert.ok(!/NaN/.test(ics), "une heure hors plage ne doit jamais produire NaN");
});

test("rendez-vous du soir : le fichier prévient vraiment, et ne dérive pas", () => {
  const { api } = construireContexte();
  const ref = new Date(2026, 7, 20, 14, 5, 0);          // jeudi 20 août, 14h05
  const ics = api.icsRituelSoir("quotidien", "19:00", "Titre", "Corps", ref);

  // Sans alarme, l'événement s'affiche mais ne rappelle rien : tout l'objet
  // de la fonction disparaîtrait sans que cela se voie.
  assert.ok(/BEGIN:VALARM/.test(ics) && /ACTION:DISPLAY/.test(ics) && /TRIGGER:/.test(ics),
    "il faut une alarme, sinon le rendez-vous ne prévient personne");
  // Heure locale flottante : un DTSTART en UTC dériverait d'une heure à
  // chaque changement d'heure, deux fois par an.
  assert.ok(/\r\nDTSTART:20260820T190000\r\n/.test(ics), "DTSTART doit être local et flottant");
  assert.ok(!/DTSTART[^\r\n]*Z/.test(ics), "DTSTART ne doit porter aucun fuseau");
  assert.ok(/\r\nDTEND:20260820T190500\r\n/.test(ics), "la durée doit être de 5 minutes");
  // Le parent n'est pas « occupé » : sinon il passe indisponible au bureau.
  assert.ok(/TRANSP:TRANSPARENT/.test(ics));
  assert.ok(/^BEGIN:VCALENDAR/.test(ics) && /END:VCALENDAR\r\n$/.test(ics));
  // Rien de personnel dans l'identifiant, et réimporter met à jour.
  assert.ok(/UID:rituel-quotidien-1900-2026-08-20@fami\.team/.test(ics));

  // Les quatre rythmes, et l'hebdomadaire qui déduit son jour du premier
  // rendez-vous plutôt que de le redemander au parent.
  assert.ok(/RRULE:FREQ=DAILY\r\n/.test(api.icsRituelSoir("quotidien", "19:00", "a", "b", ref)));
  assert.ok(/RRULE:FREQ=DAILY;INTERVAL=2/.test(api.icsRituelSoir("deux_jours", "19:00", "a", "b", ref)));
  assert.ok(/RRULE:FREQ=DAILY;INTERVAL=3/.test(api.icsRituelSoir("trois_jours", "19:00", "a", "b", ref)));
  assert.strictEqual(api.rituelRrule("hebdo", "2026-08-20"), "RRULE:FREQ=WEEKLY;BYDAY=TH");
  assert.strictEqual(api.rituelRrule("hebdo", "2026-08-23"), "RRULE:FREQ=WEEKLY;BYDAY=SU");
  api.RITUEL_RYTHMES.forEach(r =>
    assert.ok(api.icsRituelSoir(r, "19:00", "a", "b", ref), "rythme non produit : " + r));
});

test("rendez-vous du soir : le premier rappel ne tombe jamais dans le passé", () => {
  const { api } = construireContexte();
  const ref = new Date(2026, 7, 20, 14, 5, 0);
  // Heure déjà passée aujourd'hui → on commence demain, sinon le tout premier
  // rappel ne sonnerait pas et le parent croirait la fonction cassée.
  assert.strictEqual(api.debutRituel("10:00", ref), "2026-08-21");
  assert.strictEqual(api.debutRituel("22:00", ref), "2026-08-20");
  assert.strictEqual(api.debutRituel("14:05", ref), "2026-08-21", "à la minute près, c'est passé");

  // Heure conseillée : une demi-heure avant le coucher LE PLUS TÔT de la
  // fratrie — on ne propose pas un rituel que le cadet passerait au lit.
  assert.strictEqual(api.heureRituelConseillee(
    { enfants: { a: { heureCoucher: "20:00" }, b: { heureCoucher: "19:15" } } }), "18:45");
  assert.strictEqual(api.heureRituelConseillee({ enfants: {} }),
    api.hhmm(api.DODO_DEFAUT - api.RITUEL_AVANT_DODO));
  // Un coucher très tôt ne doit pas produire une heure négative.
  assert.ok(api.heureValide(api.heureRituelConseillee(
    { enfants: { a: { heureCoucher: "00:10" } } })), "heure de repli invalide");
});

test("rendez-vous du soir : l'app promet l'absence de notification, pas l'inverse", () => {
  const { api } = construireContexte();
  const fs = require("fs"), path = require("path"), r = path.join(__dirname, "..");
  const cles = ["rituel.titre", "rituel.intro", "rituel.rythme", "rituel.heure",
    "rituel.conseil", "rituel.ajouter", "rituel.ok", "rituel.echec", "rituel.resume",
    "rituel.jamais", "rituel.note", "rituel.sujet", "rituel.corps"]
    .concat(api.RITUEL_RYTHMES.map(x => "rituel.r_" + x));
  Object.keys(api.LANGUES).forEach(lg =>
    cles.forEach(k => assert.ok(api.I18N[lg][k], `${k} manquant en ${lg}`)));

  // L'introduction doit NIER la notification. C'est le seul argument qui
  // rassure un parent méfiant, et une traduction distraite l'inverserait.
  const nie = { fr: /jamais de notification/i, en: /never send you a notification/i,
    nl: /nooit een melding/i, de: /niemals eine Benachrichtigung/i };
  Object.keys(api.LANGUES).forEach(lg =>
    assert.ok(nie[lg].test(api.I18N[lg]["rituel.intro"]),
      "l'intro doit nier la notification en " + lg));

  // La carte existe dans les deux modes parents, et se replie une fois réglée.
  const ui = fs.readFileSync(path.join(r, "js/ui.js"), "utf8");
  const appels = ui.match(/carteRepliable\(blocRituelSoir\(\), "rituel", !rituelReglage\(\)\)/g) || [];
  assert.strictEqual(appels.length, 2, "il faut la carte en mode simplifié ET en mode expert");
  // Un `<select>` dans un `.champ` doit être mis en forme comme un `input`,
  // sinon il reste collé à son libellé alors que le champ voisin s'aligne.
  const css = fs.readFileSync(path.join(r, "css/style.css"), "utf8");
  assert.ok(/\.champ select\{[^}]*width:100%/.test(css), "le menu déroulant doit occuper la ligne");
});

test("parents : l'action principale a partout la même taille", () => {
  const fs = require("fs"), path = require("path");
  const css = fs.readFileSync(path.join(__dirname, "..", "css/style.css"), "utf8");
  // `.gros-bouton` est taillé pour un doigt de quatre ans (20px / 18px). Il
  // est juste sur les écrans enfants et faisait de chaque carte parent un
  // pavé, à côté de `.btn-secondaire` deux fois plus discret.
  const regle = /#contenu\[data-vue="reglages"\] \.gros-bouton\{([^}]*)\}/.exec(css);
  assert.ok(regle, "l'action principale doit être ramenée à la mesure parent");
  assert.ok(/padding:14px/.test(regle[1]) && /font-size:15px/.test(regle[1]),
    "elle doit prendre la mesure de .btn-secondaire");
  // Elle ne doit surtout PAS toucher largeur ni marges : plusieurs cartes
  // rangent leurs boutons côte à côte et règlent cela elles-mêmes ; les
  // écraser d'ici désalignerait ces rangées d'un bouton sur deux.
  assert.ok(!/width|margin/.test(regle[1]),
    "la règle ne doit régler que la taille, pas la largeur ni les marges");
  // La portée doit rester l'espace parent : sur les écrans enfants, le gros
  // bouton est une cible tactile, pas une maladresse.
  const ui = fs.readFileSync(path.join(__dirname, "..", "js/ui.js"), "utf8");
  assert.ok(/c\.setAttribute\("data-vue", etat\.vue\)/.test(ui),
    "le sélecteur ci-dessus dépend de cet attribut : il doit continuer d'être posé");
});

test("parents : le bandeau d'en-tête tient sur deux lignes, pas sur quatre", () => {
  const fs = require("fs"), path = require("path"), r = path.join(__dirname, "..");
  const ui = fs.readFileSync(path.join(r, "js/ui.js"), "utf8");
  const css = fs.readFileSync(path.join(r, "css/style.css"), "utf8");

  // Le titre et la sortie partagent une ligne.
  assert.ok(/const entete = el\("div", "par-entete"\)/.test(ui));
  assert.ok(/el\("section", "carte par-banniere"\)/.test(ui),
    "la bannière a besoin de sa propre classe : voir la spécificité ci-dessous");
  // La pastille « activé » est ce qui empêchait la ligne unique, et elle ne
  // disait rien de neuf à côté d'un bouton « Quitter ».
  assert.ok(!/par\.actif\.badge/.test(ui), "la pastille d'état ne doit pas revenir");

  // Deux réglages que j'ai eu tort de croire acquis, tous deux invisibles à
  // la lecture et mesurés dans un navigateur :
  const h1 = /\.par-banniere \.par-entete h1\{([^}]*)\}/.exec(css);
  assert.ok(h1, "le sélecteur doit porter .par-banniere : à spécificité égale, "
    + "`.carte h1` (24px) est déclaré plus loin et l'emporte");
  assert.ok(/flex:0 1 auto/.test(h1[1]),
    "sans facteur de croissance : avec `flex:1 1 auto` le titre occupait toute "
    + "la ligne (mesuré : 298px sur 298) et renvoyait la sortie à la ligne suivante");
  assert.ok(/margin:0 0 0 auto/.test(
    /\.par-banniere \.par-entete \.btn-secondaire\{([^}]*)\}/.exec(css)[1]),
    "la sortie se pousse à droite d'elle-même");

  // Le libellé de langue partage la ligne des drapeaux au lieu d'en prendre une.
  assert.ok(/\.langue-choix\{display:contents\}/.test(css),
    "sans cela le groupe de drapeaux est insécable et « Langue » garde sa ligne");
});

/* La langue survit au rafraîchissement. Le défaut était discret : le choix
 * s'écrivait correctement dans le stockage local, et detecterLangue() savait
 * le relire — mais personne ne l'appelait, si bien que `langue` restait à sa
 * valeur initiale « fr » à chaque chargement. Un test de source n'aurait rien
 * vu : les deux moitiés du mécanisme existaient. On teste donc ce que
 * l'application LIT au démarrage, pas ce qu'elle écrit. */
test("langue : le choix survit au rafraîchissement", () => {
  // Une langue mémorisée est reprise, quelle que soit celle du navigateur.
  ["nl", "de", "en", "fr"].forEach(l => {
    const { api } = construireContexte({ stockage: { kp_langue: l }, langueNavigateur: "fr" });
    assert.strictEqual(api.langue, l, "langue mémorisée non reprise : " + l);
    // Et les textes suivent réellement, pas seulement la variable.
    assert.strictEqual(api.t("langue"), api.I18N[l]["langue"]);
  });

  // Rien en mémoire : on suit le navigateur. Un parent néerlandophone ne doit
  // pas atterrir en français à sa première visite.
  assert.strictEqual(construireContexte({ langueNavigateur: "nl" }).api.langue, "nl");
  assert.strictEqual(construireContexte({ langueNavigateur: "nl-BE" }).api.langue, "nl",
    "la région doit être ignorée");
  assert.strictEqual(construireContexte({ langueNavigateur: "de-AT" }).api.langue, "de");

  // Langue non traduite, ou valeur abîmée dans le stockage : repli sur le
  // français, sans jamais laisser `langue` dans un état non traduit.
  assert.strictEqual(construireContexte({ langueNavigateur: "es" }).api.langue, "fr");
  assert.strictEqual(construireContexte(
    { stockage: { kp_langue: "xx" }, langueNavigateur: "es" }).api.langue, "fr");
  assert.strictEqual(construireContexte(
    { stockage: { kp_langue: "xx" }, langueNavigateur: "de" }).api.langue, "de",
    "un stockage abîmé ne doit pas empêcher la détection");

  // La fonction doit rester branchée : c'est précisément ce qui manquait.
  const fs = require("fs"), path = require("path");
  const src = fs.readFileSync(path.join(__dirname, "..", "js/i18n.js"), "utf8");
  assert.ok(/let langue = detecterLangue\(\);/.test(src),
    "detecterLangue() doit initialiser `langue`, sinon elle est du code mort");
  assert.ok(/document\.documentElement\.lang = langue/.test(src),
    "<html lang> doit être posé dès le chargement, pas seulement au changement");
});

test("parents : noter le comportement est un geste d'expert, et il vient après l'éloge", () => {
  const fs = require("fs"), path = require("path");
  const ui = fs.readFileSync(path.join(__dirname, "..", "js/ui.js"), "utf8");

  // On isole la section « quotidien » et ses deux branches de mode.
  const debut = ui.indexOf('if (sectionVisible("quotidien")) {');
  assert.ok(debut > 0, "section quotidien introuvable");
  const simplifie = ui.indexOf("if (!exp) {", debut);
  const expert = ui.indexOf("} else {", simplifie);
  const finExpert = ui.indexOf('sectionVisible("papier")', expert);
  assert.ok(simplifie > 0 && expert > simplifie && finExpert > expert, "bornes des branches");
  const brSimple = ui.slice(simplifie, expert);
  const brExpert = ui.slice(expert, finExpert);

  const APPEL = 'blocEval(enfantActif(), "parent")';
  // Mode standard : la carte ne doit pas y être. Noter son enfant chaque soir
  // est un outil avancé, et le champ ne sert qu'aux statistiques.
  assert.ok(brSimple.indexOf(APPEL) < 0,
    "l'évaluation du comportement ne doit pas apparaître en mode standard");
  // Mode expert : présente, et APRÈS le compliment. On lit d'abord ce qu'on
  // peut dire à l'enfant, on note ensuite.
  const iEval = brExpert.indexOf(APPEL);
  const iCompliment = brExpert.indexOf("blocComplimentDuJour(enfantActif())");
  assert.ok(iEval > 0, "l'évaluation doit rester disponible en mode expert");
  assert.ok(iCompliment > 0 && iCompliment < iEval,
    "le compliment du jour doit précéder l'évaluation du comportement");
  // Une seule fois dans tout l'espace parent : deux cartes identiques à des
  // endroits différents est le genre de doublon qui passe inaperçu.
  assert.strictEqual((ui.match(/blocEval\(enfantActif\(\), "parent"\)/g) || []).length, 1);

  // L'auto-évaluation de l'ENFANT, elle, reste sur son écran : c'est elle qui
  // compte, et elle n'est pas concernée.
  assert.ok(/blocEval\(enf, "enfant"\)/.test(ui),
    "l'auto-évaluation de l'enfant ne doit pas avoir disparu au passage");
});

/* ---------- Accueil public : agencement ---------- */
test("accueil : on dit ce qu'est l'app avant de demander un compte", () => {
  const fs = require("fs"), path = require("path");
  const auth = fs.readFileSync(path.join(__dirname, "..", "js", "auth.js"), "utf8");
  const bloc = auth.slice(auth.indexOf("function ecranAuth"));
  const corps = bloc.slice(0, bloc.indexOf("</div>`;"));
  // « landing-cle » porte la réponse à l'objection principale (« on ne punit
  // jamais ») : elle doit rester AVANT le formulaire, c'est ce qui décide un
  // parent hésitant.
  const ordre = ["landing-langues", "landing-tete", "landing-cle",
                 "landing-form", "landing-corps"].map(c => corps.indexOf(c));
  ordre.forEach((p, i) => assert.ok(p > -1, "section absente : " + i));
  for (let i = 1; i < ordre.length; i++) {
    assert.ok(ordre[i - 1] < ordre[i],
      "l'ordre du document doit être langues → présentation → formulaire → détail");
  }
  // Une seule carte de formulaire : le déplacement ne doit pas l'avoir dupliquée.
  assert.strictEqual((corps.match(/id="b-principal"/g) || []).length, 1,
    "le formulaire ne doit apparaître qu'une fois");
  assert.strictEqual((corps.match(/class="landing-form"/g) || []).length, 1);
});

test("accueil : sur grand écran, le formulaire est en haut, pas centré", () => {
  const fs = require("fs"), path = require("path");
  const css = fs.readFileSync(path.join(__dirname, "..", "css", "style.css"), "utf8");
  const i = css.indexOf("@media(min-width:860px)");
  assert.notStrictEqual(i, -1, "la règle grand écran doit exister");
  const bloc = css.slice(i, css.indexOf(".hero-features{grid-template-columns:1fr 1fr}", i));
  // On isole la seule règle .landing de ce bloc : ailleurs, un
  // « align-items:center » est légitime (écran centré de réinitialisation).
  const dLanding = bloc.indexOf(".landing{");
  assert.notStrictEqual(dLanding, -1, ".landing doit être redéfini sur grand écran");
  const regleLanding = bloc.slice(dLanding, bloc.indexOf("}", dLanding));
  // « align-items:center » centrait le formulaire sur un héros très haut et le
  // rejetait sous la ligne de flottaison : la régression à ne pas refaire.
  assert.strictEqual(/align-items:\s*center/.test(regleLanding), false,
    "le formulaire ne doit plus être centré verticalement sur la hauteur du héros");
  assert.ok(/align-items:\s*start/.test(regleLanding), "les colonnes doivent s'aligner en haut");
  assert.ok(/grid-template-areas/.test(regleLanding), "la grille doit nommer ses zones");
  ["langues", "tete", "form", "corps"].forEach(z =>
    assert.ok(new RegExp("grid-area:\\s*" + z).test(bloc), "zone non placée : " + z));
});

test("accueil : la barre de langues reste compacte et accessible", () => {
  const fs = require("fs"), path = require("path");
  const auth = fs.readFileSync(path.join(__dirname, "..", "js", "auth.js"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "..", "css", "style.css"), "utf8");
  // Codes à deux lettres : quatre langues sur une ligne, même en 320 px.
  assert.ok(/lang-code">\$\{l\.toUpperCase\(\)\}/.test(auth),
    "les pastilles doivent porter le code de langue, pas le nom complet");
  // Le nom complet reste lisible par un lecteur d'écran et au survol.
  assert.ok(/aria-label="\$\{LANGUES\[l\]\}"/.test(auth), "aria-label manquant");
  assert.ok(/title="\$\{LANGUES\[l\]\}"/.test(auth), "title manquant");
  assert.ok(/aria-current="true"/.test(auth), "la langue active doit être annoncée");
  // La pastille compacte est une classe distincte : le sélecteur de langue de
  // l'app (Réglages) garde son propre style, plus grand.
  assert.ok(/\.lang-min\{/.test(css), "la classe compacte doit exister");
  assert.ok(/\.langue-btn\{/.test(css), "le sélecteur de l'app ne doit pas être supprimé");
  assert.ok(auth.indexOf('querySelectorAll(".lang-min")') > -1,
    "le gestionnaire de clic doit viser la nouvelle classe");
});

test("accueil : libellés de la barre et des liens traduits dans les 4 langues", () => {
  const { api } = construireContexte();
  const cles = ["auth.langues", "auth.lien_faq", "auth.lien_legal", "auth.lien_confid"];
  const manquantes = [];
  Object.keys(api.LANGUES).forEach(lg => cles.forEach(k => {
    const v = api.I18N[lg][k];
    if (typeof v !== "string" || !v.length) manquantes.push(lg + " → " + k);
  }));
  assert.strictEqual(manquantes.length, 0, manquantes.join(", "));
});

/* ---------- Minuteur d'écran : plafond de 6 h depuis le lancement ---------- */
const H = 60 * 60 * 1000;

test("minuteur : un lancement tout frais n'est jamais considéré comme dépassé", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  api.demarrerTimer();
  assert.strictEqual(api.timerEtat.actif, true);
  assert.ok(api.timerEtat.lance > 0, "le lancement doit être horodaté");
  assert.strictEqual(api.timerDepasseDelaiMax(), false);
  assert.strictEqual(api.verifierDelaiMaxTimer(), false, "rien ne doit être réinitialisé");
  assert.strictEqual(api.timerEtat.actif, true, "le minuteur doit rester actif");
});

test("minuteur : passé 6 h depuis le lancement, il se réinitialise entièrement", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  api.demarrerTimer();
  // On recule artificiellement l'horodatage de lancement de 6 h et 1 ms,
  // même si le compte à rebours interne (fin) est loin d'être écoulé.
  api.timerEtat = Object.assign({}, api.timerEtat, {
    lance: Date.now() - (6 * H + 1),
    fin: Date.now() + 999999999   // le minuteur a été rallongé : pas près de finir
  });
  assert.strictEqual(api.timerDepasseDelaiMax(), true);
  assert.strictEqual(api.verifierDelaiMaxTimer(), true);
  // Comparaison via JSON des deux côtés : timerVierge() s'exécute dans le
  // contexte vm et renvoie un objet d'un autre « réalm » que celui du test,
  // ce que deepStrictEqual distinguerait à tort (prototypes différents).
  assert.deepStrictEqual(JSON.parse(JSON.stringify(api.timerEtat)),
    JSON.parse(JSON.stringify(api.timerVierge())),
    "le minuteur doit revenir à un état totalement vierge");
});

test("minuteur : le plafond de 6 h s'applique aussi verrouillé ou en attente de choix", () => {
  const { api } = construireContexte();
  const ancien = Date.now() - (6 * H + 5000);
  // Verrouillé (temps écoulé, PIN requis) : plus « actif », mais bien engagé.
  api.timerEtat = Object.assign({}, api.timerVierge(), { verrouille: true, lance: ancien });
  assert.strictEqual(api.timerDepasseDelaiMax(), true, "un verrouillage oublié doit expirer aussi");
  assert.strictEqual(api.verifierDelaiMaxTimer(), true);
  // En attente du choix de l'enfant qui continue : ni actif, ni verrouillé.
  api.timerEtat = Object.assign({}, api.timerVierge(), { choix: true, lance: ancien });
  assert.strictEqual(api.timerDepasseDelaiMax(), true, "un choix resté sans réponse doit expirer aussi");
  assert.strictEqual(api.verifierDelaiMaxTimer(), true);
});

test("minuteur : un état vierge ou sans horodatage de lancement n'expire jamais de force", () => {
  const { api } = construireContexte();
  assert.strictEqual(api.timerDepasseDelaiMax(), false, "rien n'est engagé : rien à expirer");
  // Compatibilité : un minuteur enregistré avant l'ajout de ce plafond n'a pas
  // de champ « lance ». On ne doit pas le considérer comme expiré à tort.
  api.timerEtat = { actif: true, fin: Date.now() + 999999999, total: 999999999,
                    enfant: "e1", restes: {}, prep: 0, choix: false, verrouille: false };
  assert.strictEqual(api.timerDepasseDelaiMax(), false,
    "sans horodatage connu, impossible de dire qu'il a dépassé 6 h");
  assert.strictEqual(api.verifierDelaiMaxTimer(), false);
});

test("minuteur : rallonger le temps ou changer d'enfant ne repousse jamais l'horodatage de lancement", () => {
  const { api } = construireContexte();
  const e2 = api.etatVierge();
  const ids = Object.keys(e2.enfants);
  api.familleId = "f1";
  api.lierEtat(e2);
  api.demarrerTimer();
  const lanceInitial = api.timerEtat.lance;

  // Ajouter du temps au premier enfant : le lancement d'origine doit survivre.
  api.ajouterTempsEnfant(ids[0], 30 * 60 * 1000);
  assert.strictEqual(api.timerEtat.lance, lanceInitial,
    "ajouter du temps ne doit jamais repousser le plafond de 6 h");

  // Continuer avec un second enfant (flux « choix ») : toujours le même lancement.
  api.timerEtat.choix = true;
  api.continuerAvecEnfant(ids[1]);
  assert.strictEqual(api.timerEtat.lance, lanceInitial,
    "changer d'enfant ne doit pas repousser le plafond de 6 h");

  // Même chose pour le minuteur global.
  api.definirReglageTimer(10, "global");
  api.demarrerTimer();
  const lanceGlobal = api.timerEtat.lance;
  api.ajouterTempsGlobal(45 * 60 * 1000);
  assert.strictEqual(api.timerEtat.lance, lanceGlobal,
    "ajouter du temps au minuteur global ne doit pas repousser le plafond");
});

test("minuteur : ouvrir l'app le lendemain applique le plafond dès la lecture du cache", () => {
  const { api } = construireContexte();
  api.familleId = "f1";
  api.lierEtat(api.etatVierge());
  // Une session d'hier, rallongée plusieurs fois, encore techniquement active :
  // exactement le scénario signalé (« le lendemain, le mode timer est toujours
  // actif », même si le compte à rebours interne n'est pas écoulé).
  api.timerEtat = { actif: true, fin: Date.now() + 999999999, total: 999999999,
                    enfant: "e1", restes: {}, prep: 0, choix: false, verrouille: false,
                    lance: Date.now() - (20 * H) };
  api.ecrireTimer();
  api.timerEtat = api.timerVierge();   // simule un onglet fermé puis rouvert
  api.chargerTimer();                  // relit le cache, comme au démarrage de l'app
  assert.strictEqual(api.timerEtat.actif, false,
    "un minuteur vieux de 20 h ne doit plus être actif après rechargement");
  assert.strictEqual(api.timerEtat.lance, 0, "l'état doit être totalement vierge");
});

/* ---------- Applications Android & iOS : le manuel dans l'admin ---------- */
test("mobile : le manuel liste précisément ce qui revient au fondateur", () => {
  const { api } = construireContexte();
  const ch = api.CROISSANCE_CHANTIERS.find(x => x.id === "c_mobile");
  assert.ok(ch, "chantier c_mobile introuvable");
  // Comparaison via .join(",") : ch.etapes vient du contexte vm, un tableau
  // « d'un autre réalm » que deepStrictEqual distinguerait à tort d'un
  // tableau littéral de ce fichier, même à valeurs strictement identiques.
  const restantes = ch.etapes.filter(e => !e.fait).map(e => e.id).join(",");
  assert.strictEqual(restantes, "c_mobile_4,c_mobile_5,c_mobile_6,c_mobile_7",
    "les étapes restantes doivent être exactement les comptes, la capacité Xcode et la soumission");
  // Chaque étape restante dépend d'un compte, d'un paiement, ou d'un Mac —
  // rien que Claude Code ne pourrait faire à la place du fondateur.
  const comptes = ch.etapes.find(e => e.id === "c_mobile_4");
  assert.ok(/25 \$/.test(comptes.detail), "le coût du compte Google Play doit être chiffré");
  const apple = ch.etapes.find(e => e.id === "c_mobile_5");
  assert.ok(/99 \$/.test(apple.detail), "le coût du compte Apple Developer doit être chiffré");
  // Les étapes déjà faites ne doivent plus porter d'espace réservé à compléter.
  ch.etapes.filter(e => e.fait).forEach(e =>
    assert.strictEqual(/A_COMPLETER|TODO|XXX/.test(e.detail), false,
      "une étape marquée faite ne doit pas contenir un espace réservé : " + e.id));
});

/* ---------- L'agenda depuis l'app installée ----------
 * Le premier retour de terrain d'un téléphone équipé : « je n'arrive plus à
 * mettre le rendez-vous dans mon agenda ». La cause n'est pas le fichier —
 * il est valide, un test le vérifie déjà — mais la WebView, qui ignore
 * l'attribut `download` sans lever la moindre erreur. */
test("agenda : dans l'app, le .ics passe par le pont natif et jamais par un faux téléchargement", () => {
  const fs = require("fs"), path = require("path");
  const ui = fs.readFileSync(path.join(__dirname, "..", "js/ui.js"), "utf8");

  const env = ui.slice(ui.indexOf("async function envoyerVersAgenda"));
  const corps = env.slice(0, env.indexOf("\n}\n"));
  assert.ok(/greffonNatif\("Filesystem"\)/.test(corps),
    "la présence du pont natif doit décider de la voie empruntée");
  assert.ok(/ouvrirIcsNatif\(/.test(corps), "dans l'app, l'envoi doit passer par le pont natif");
  assert.ok(/telechargerBlob\(blob, nomFichier\)/.test(corps),
    "sur le web, le téléchargement reste la voie normale");
  // Dans l'app, retomber sur le téléchargement afficherait un succès pour une
  // action qui ne fait rien : la branche native doit sortir sans y toucher.
  const brancheNative = corps.slice(0, corps.indexOf("const blob"));
  assert.strictEqual(/telechargerBlob/.test(brancheNative), false,
    "l'app ne doit jamais retomber sur le téléchargement, qui y est muet");

  const nat = ui.slice(ui.indexOf("async function ouvrirIcsNatif"));
  const corpsNat = nat.slice(0, nat.indexOf("\n}\n"));
  assert.ok(/directory: "CACHE"/.test(corpsNat),
    "le fichier va dans le cache : le téléphone peut le vider, rien ne s'accumule");
  assert.ok(/contentType: "text\/calendar"/.test(corpsNat),
    "sans type MIME, l'appareil ne saurait pas que c'est un événement");
  assert.ok(/greffonNatif\("Share"\)/.test(corpsNat),
    "si aucune application ne sait ouvrir un .ics, la feuille de partage doit rester");

  // Les deux boutons « agenda » (carte surprise et rituel du soir) empruntent
  // le même chemin : une seule mécanique à corriger le jour où elle bouge.
  assert.strictEqual((ui.match(/await envoyerVersAgenda\(/g) || []).length, 2,
    "les deux boutons agenda doivent passer par envoyerVersAgenda");

  // Et le parent doit être prévenu dans les deux cas, dans les quatre langues.
  const { api } = construireContexte();
  Object.keys(api.LANGUES).forEach(lg =>
    ["cs.rdv_ouvert", "cs.rdv_fichier", "cs.rdv_echec", "rituel.ok_app"].forEach(cle =>
      assert.ok(api.I18N[lg][cle], cle + " manquant en " + lg)));
});

/* ---------- La bibliothèque Supabase est embarquée ----------
 * L'app installée est censée fonctionner hors ligne. Tant que ce script
 * venait d'un CDN, un téléphone sans réseau ne le recevait pas : `supabase`
 * restait indéfini et l'app affichait « Configuration requise » au lieu de
 * travailler sur son cache local. */
test("hors ligne : aucune page ne va chercher Supabase sur un CDN", () => {
  const fs = require("fs"), path = require("path");
  const racine = path.join(__dirname, "..");

  const vendorisee = path.join(racine, "js/vendor/supabase.js");
  assert.ok(fs.existsSync(vendorisee), "js/vendor/supabase.js doit être dans le dépôt");
  const lib = fs.readFileSync(vendorisee, "utf8");
  assert.ok(/^\/\* @supabase\/supabase-js v\d+\.\d+\.\d+ — licence MIT\./.test(lib),
    "le fichier embarqué doit dire sa version et sa licence");
  // C'est la variable globale que js/auth.js attend (`supabase.createClient`).
  assert.ok(/var supabase=/.test(lib), "le build embarqué doit être l'UMD, pas un module");

  // Le script de recopie garde l'opération reproductible : pas de fichier
  // tombé du ciel qu'on ne saurait plus régénérer.
  assert.ok(fs.existsSync(path.join(racine, "scripts/vendorer-supabase.mjs")),
    "le script de recopie doit exister");
  const pkg = JSON.parse(fs.readFileSync(path.join(racine, "package.json"), "utf8"));
  assert.ok(pkg.scripts["vendor:supabase"], "npm run vendor:supabase doit être déclaré");
  assert.ok((pkg.devDependencies || {})["@supabase/supabase-js"],
    "la source de la recopie doit être une dépendance, pas un téléchargement manuel");

  // Et surtout : plus une seule page ne dépend d'un domaine extérieur pour
  // démarrer. Le dossier www/ (copie générée) est ignoré, il n'est pas suivi.
  fs.readdirSync(racine).filter(n => n.endsWith(".html")).forEach(nom => {
    const html = fs.readFileSync(path.join(racine, nom), "utf8");
    assert.strictEqual(/<script[^>]+src="https?:/.test(html), false,
      nom + " charge encore un script depuis un domaine extérieur");
  });
  // Les pages qui parlent à Supabase doivent, elles, charger la copie locale.
  ["index.html", "defi.html", "challenge.html"].forEach(nom => {
    const html = fs.readFileSync(path.join(racine, nom), "utf8");
    assert.ok(/src="\/?js\/vendor\/supabase\.js/.test(html),
      nom + " doit charger la bibliothèque embarquée");
  });
});

/* ---------- L'écran de démarrage ----------
 * Deuxième retour du même téléphone : « au chargement c'est une page
 * blanche ». Le décor doit donc être dans la page AVANT les scripts. */
test("démarrage : l'attente montre un décor animé, jamais une page blanche", () => {
  const fs = require("fs"), path = require("path");
  const racine = path.join(__dirname, "..");
  const html = fs.readFileSync(path.join(racine, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(racine, "css/style.css"), "utf8");
  const js = fs.readFileSync(path.join(racine, "js/demarrage.js"), "utf8");

  assert.ok(/id="demarrage"/.test(html), "index.html doit porter l'écran de démarrage");
  // Écrit après les scripts, il ne s'afficherait qu'une fois ceux-ci exécutés
  // — c'est-à-dire trop tard, après la page blanche qu'il doit remplacer.
  assert.ok(html.indexOf('id="demarrage"') < html.indexOf("js/config.js"),
    "le décor doit précéder les scripts dans le <body>");
  assert.ok(/class="demarrage"/.test(html) && /\.demarrage\{/.test(css),
    "le décor doit être stylé, sinon il s'affiche brut");
  assert.ok(/prefers-reduced-motion/.test(css.slice(css.indexOf(".demarrage{"))),
    "un décor animé doit pouvoir s'immobiliser à la demande du système");

  ["fr", "en", "nl", "de"].forEach(lg =>
    assert.ok(new RegExp("\\n\\s*" + lg + ": \\[").test(js),
      "les phrases d'attente manquent en " + lg));
  assert.ok(/isConnected/.test(js),
    "le minuteur doit s'arrêter quand le premier écran a remplacé le décor");
  assert.ok(/location\.reload/.test(js),
    "après une attente anormale, le parent doit pouvoir reprendre la main");
});

/* Connexion par compte Google. Rien de reseau n'est testable ici : ce qui
 * compte est que le bouton ne puisse pas apparaitre avant d'etre utilisable,
 * et qu'une premiere connexion tierce ne laisse pas un parent croire qu'il a
 * perdu ses enfants. */
test("Google : le bouton n'existe pas tant que l'admin ne l'a pas allumé", () => {
  const { api } = construireContexte();
  const fs = require("fs"), path = require("path"), r = path.join(__dirname, "..");
  const auth = fs.readFileSync(path.join(r, "js/auth.js"), "utf8");

  assert.ok(/\$\{googleActif\(\) \? `/.test(auth),
    "le bouton doit être derrière l'interrupteur : sinon il s'affiche pour "
    + "toutes les familles avant que Google ne soit configuré");
  assert.ok(/configApp\.google_actif === "on"/.test(auth),
    "l'interrupteur se lit dans app_config, donc réglable sans redéploiement");
  const ui = fs.readFileSync(path.join(r, "js/ui.js"), "utf8");
  assert.ok(/adminDefinirConfig\("google_actif"/.test(ui),
    "l'admin doit pouvoir l'allumer et l'éteindre depuis l'application");
  // Et il doit être TROUVABLE. Placé d'abord au milieu de « Pause et
  // avertissements », dans l'onglet Croissance, il était introuvable : une
  // carte à lui, en tête de Config, là où on cherche un réglage.
  assert.ok(/function blocConnexionParents\(\)/.test(ui),
    "l'interrupteur doit avoir sa propre carte, pas être noyé dans une autre");
  assert.ok(/case "config":\s*\n\s*c\.appendChild\(blocConnexionParents\(\)\);/.test(ui),
    "cette carte doit être en tête de l'onglet Config");
  const pause = ui.slice(ui.indexOf("function blocSoutenabilite()"),
                         ui.indexOf("function blocSoutenabilite()") + 2200);
  assert.ok(pause.indexOf("google_actif") < 0,
    "la connexion Google n'a rien à faire dans la carte « Pause et avertissements »");

  ["auth.google", "auth.ou", "goog.echec", "goog.premiere_titre", "goog.premiere_texte",
   "goog.premiere_attente", "goog.premiere_continuer", "goog.premiere_email",
   "admin.google", "admin.google_on", "admin.google_off"].forEach(k =>
    Object.keys(api.LANGUES).forEach(lg =>
      assert.ok(api.I18N[lg][k], k + " manquant en " + lg)));
  // Règle de marque : le nom ne se traduit ni ne s'abrège.
  Object.keys(api.LANGUES).forEach(lg =>
    assert.ok(/Google/.test(api.I18N[lg]["auth.google"]),
      "le nom Google doit rester tel quel en " + lg));
});

test("Google : une première connexion tierce ne fait pas croire à un compte perdu", () => {
  const fs = require("fs"), path = require("path");
  const auth = fs.readFileSync(path.join(__dirname, "..", "js/auth.js"), "utf8");

  assert.ok(/fournisseurSession\(\) !== "email"[\s\S]{0,120}ecranPremiereFoisTiers\(\)/.test(auth),
    "une première connexion tierce sans famille doit passer par l'avertissement");
  assert.ok(/function ecranPremiereFoisTiers/.test(auth));
  assert.ok(/g-retour[\s\S]{0,260}auth\.signOut\(\)/.test(auth),
    "le retour à l'e-mail doit fermer la session tierce");
  assert.ok(/const ouvert = inscriptionAutorisee\(\);/.test(auth),
    "Google ne doit pas être une porte dérobée quand les inscriptions sont fermées");

  // Google refuse l'authentification en WebView : dans l'app, on sort.
  assert.ok(/if \(estAppNative\(\)\) options\.skipBrowserRedirect = true;/.test(auth));
  assert.ok(/function ouvrirDehors/.test(auth),
    "l'app native doit ouvrir le navigateur du système, pas sa propre vue");
  assert.ok(/prompt: "select_account"/.test(auth));
});

test("connexion : l'attente ne s'empile pas", () => {
  const fs = require("fs"), path = require("path"), r = path.join(__dirname, "..");
  const auth = fs.readFileSync(path.join(r, "js/auth.js"), "utf8");
  const html = fs.readFileSync(path.join(r, "index.html"), "utf8");

  // Statut d'admin, config et familles sont indépendants : les enchaîner
  // faisait quatre allers-retours en file avant le premier affichage — payés
  // deux fois dans le parcours Google, puisque la page est rechargée.
  const bloc = auth.slice(auth.indexOf("async function apresConnexion()"),
                          auth.indexOf("async function apresConnexion()") + 1400);
  assert.ok(/await Promise\.all\(\[/.test(bloc),
    "les lectures indépendantes doivent partir ensemble");
  ["is_admin", "configAppPrete()", "chargerFamilles()"].forEach(x =>
    assert.ok(bloc.indexOf(x) > 0, "doit faire partie du lot parallèle : " + x));
  // configAppPrete mémorise sa promesse : pas de seconde requête si le
  // démarrage l'a déjà lancée.
  assert.ok(/configAppPrete\(\)/.test(bloc) && !/await chargerConfigApp\(\)/.test(bloc),
    "réutiliser la requête en vol plutôt qu'en refaire une");
  // Et la liste des familles ne doit plus être rechargée juste après.
  assert.ok(!/\n  await chargerFamilles\(\);/.test(bloc),
    "chargerFamilles ne doit pas être appelé deux fois");

  // 1,2 Mo de JavaScript : au minimum, ne pas bloquer l'analyse du document.
  const balises = html.match(/<script[^>]*src="js\/[^"]*"/g) || [];
  assert.ok(balises.length >= 10, "les scripts de l'application doivent être trouvés");
  balises.forEach(b => assert.ok(/\sdefer\s/.test(b),
    "script non différé, il bloque le rendu : " + b));
});

/* ---------- Exécution ----------
 * `await fn()` : ne change rien pour un test synchrone (attendre une valeur
 * qui n'est pas une promesse est un no-op), et permet aux tests async
 * (synchro cloud simulée) de s'exécuter jusqu'au bout avant le test suivant. */
(async function executer() {
  for (const { nom, fn } of cas) {
    try { await fn(); reussites++; console.log(`  ✓ ${nom}`); }
    catch (e) { echecs++; console.log(`  ✗ ${nom}\n      ${e.message}`); }
  }
  console.log(`\n${reussites}/${cas.length} tests réussis` + (echecs ? `, ${echecs} échec(s)` : ""));
  process.exit(echecs ? 1 : 0);
})();
