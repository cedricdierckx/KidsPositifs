# 🧭 FamiTeam — Coordination des agents & chantiers

Document vivant, à lire **avant toute intervention** sur ce dépôt. Il répond à
un constat concret : plusieurs sessions Claude Code ont travaillé sur la
branche `dev` **au même moment**, sans se voir (nouvelles familles/tournantes,
onglet Croissance, dons, blagues ont été poussés en parallèle, à quelques
minutes d'intervalle, le 25-26 juillet 2026). Le git a fusionné proprement
cette fois — mais rien ne le garantit la prochaine fois.

## 1. Protocole pour tout agent qui intervient ici

1. **Se resynchroniser d'abord** : `git fetch origin dev && git rebase origin/dev`
   avant de commencer, **et juste avant chaque `git push`** (un autre agent a
   pu pousser entre-temps).
2. **Lire ce fichier** — en particulier le tableau des chantiers (§3) — avant
   de choisir quoi faire, pour éviter de refaire un travail déjà en cours
   ailleurs ou déjà fait.
3. **Annoncer son chantier** : avant de commencer un chantier de plus de
   quelques minutes, éditer sa ligne dans le tableau (§3) en mettant le statut
   à `🟡 en cours` et pousser CE seul changement en premier (commit dédié,
   minute). Les autres agents le verront au prochain `rebase`.
4. **Committer petit et souvent**, un chantier cohérent = un commit (convention
   déjà en vigueur, cf. `ARCHITECTURE.md` §4). Ne jamais mélanger deux
   chantiers sans rapport dans un même commit : ça complique la relecture et
   la coordination.
5. **Tout changement de `supabase/schema.sql`** : vérifié sur un cluster
   PostgreSQL local éphémère avant commit (idempotence, garde-fous,
   permissions), jamais exécuté directement contre la production. Voir les
   commits `632d3ad`, `146af5e`, `ce522a6` pour la méthode.
6. **Ne jamais forcer un push** (`--force`) sur `dev` ou `main`. En cas de
   conflit réel (rare si chacun respecte §3), rebaser, résoudre, puis pousser
   normalement.
7. **En fin de chantier**, repasser son statut à `✅ fait (commit xxxxxxx)`
   dans le tableau, dans le même commit que le travail si possible.
8. **Si un chantier est déjà `🟡 en cours` par un autre agent**, ne pas le
   reprendre : en choisir un autre, ou attendre.

## 2. Contrainte qui prime sur tout le reste

Le fondateur est **notaire** ; l'incompatibilité avec une activité
commerciale n'est pas tranchée (voir `PLAN-COMMERCIAL.md` §0.1, chantier
*Cadre déontologique*, certitude 45 % sur son application exacte). Tant que
la Chambre n'a pas répondu :

> ⛔ **Aucun agent ne construit de nouveau mécanisme de monétisation**
> (abonnement, palier payant, vente B2B) au-delà du **suivi des dons** déjà
> en place (table `donations`, webhook Stripe). Cela **corrige et remplace**
> la piste « Freemium réel » suggérée dans une analyse antérieure
> (dossier « développement commercial », 25/07/2026, avant que cette
> contrainte ne soit formalisée) — elle est donc retirée du catalogue ci-dessous.

## 3. Catalogue des chantiers techniques, priorisés

Ce tableau couvre les chantiers **exécutables par un agent** (code, contenu,
documentation). Les chantiers de relation humaine (contacter une école,
écrire à la Chambre, tenir le rituel hebdomadaire) vivent dans
`PLAN-COMMERCIAL.md` / l'onglet **Admin → Croissance** : ce sont des actions
du fondateur, aucun modèle Claude ne s'y applique (§4 les liste pour mémoire).

Priorité : **P0** bloquant/fondation · **P1** haute valeur · **P2** utile ·
**P3** optionnel/plus tard. Modèle : recommandation au sens de la charge de
raisonnement requise, pas de préférence stylistique — voir §5 pour la règle
de choix.

| # | Chantier | Priorité | Modèle | Statut |
|---|---|---|---|---|
| 1 | Ce document (protocole + catalogue) | P0 | Sonnet 5 | ✅ fait (ce commit) |
| 2 | Rafraîchir `ARCHITECTURE.md` (phases A/B/E réellement faites) | P0 | Sonnet 5 | ✅ fait (ce commit) |
| 3 | E-mail de bienvenue automatique à la création d'une famille (`c_auto_1`) | P1 | Sonnet 5 | à faire |
| 4 | Rapport mensuel par e-mail à l'admin (`c_auto_3`) | P1 | Sonnet 5 | à faire |
| 5 | Réponses types (canned replies) dans l'onglet Retours (`c_auto_5`) | P1 | Sonnet 5 | à faire |
| 6 | FAQ publique (`c_auto_4`) | P1 | Sonnet 5 | à faire |
| 7 | Corpus de blagues éprouvées et libres de droits (remplace le corpus désactivé) | P1 | Sonnet 5* | à faire |
| 8 | SEO de base de la page publique — titres, meta description, Open Graph, sitemap (`c_preuve_5`) | P1 | Sonnet 5 | à faire |
| 9 | Relance d'activation J+3 automatique, si aucune mission validée (`c_auto_2`) | P2 | Opus 5 | à faire |
| 10 | Étendre le banc d'essai (`test/`) à `js/ui.js` (au moins les fonctions pures : `montantLisible`, `octetsLisibles`, `miniGraphBarres`…) | P2 | Sonnet 5 | à faire |
| 11 | Captures d'écran + promesse en une phrase pour la page publique (`c_preuve_1`, `c_preuve_2`) | P2 | Sonnet 5 | à faire (contenu final = décision fondateur) |
| 12 | Phase C — découpage `ui.js` en modules ES | P3 | Opus 5 | à faire |
| 13 | Phase F — build/lint/CI | P3 | Sonnet 5 | à faire |
| 14 | Découper `schema.sql` en migrations numérotées (si le fichier continue de grossir) | P3 | Sonnet 5 | à faire |

*\* Chantier 7 : certitude ≈ 60 % seulement sur le caractère réellement
« libre de droits » de toute liste compilée par un agent — aucun modèle ne
peut le certifier avec certitude absolue. Recommandation : préférer des
devinettes/blagues traditionnelles et anonymes (domaine public avéré),
écarter tout ce qui est attribuable à un humoriste ou une source
contemporaine identifiable, et prévoir une relecture humaine avant de
cocher la case « Contenu blagues » (Admin → Contenu, `app_config.blagues_actives`
— voir `blaguesActivees()` dans `js/app.js`, ancien commutateur figé
`BLAGUES_ACTIVEES`).*

### Pourquoi Opus 5 pour les chantiers 9 et 12

- **#9 (relance J+3)** : nécessite un mécanisme de déclenchement différé
  (cron/Edge Function ou Routine planifiée), la bonne condition d'exclusion
  (« aucune mission validée »), l'anti-doublon d'envoi, et touche à l'envoi
  réel d'e-mails à des familles — erreurs coûteuses (spam perçu, envoi en
  double). Les chantiers 3, 4, 5, 6, 8 sont mécaniques ou à faible impact
  (un seul déclencheur simple, ou un seul destinataire admin, ou du contenu
  statique) : Sonnet 5 suffit.
- **#12 (découpage `ui.js`)** : fichier de ~4000 lignes, très nombreux points
  d'appel croisés (`ui.js` ↔ `app.js` ↔ `auth.js`), risque de régression
  visuelle subtile non couverte par la suite de tests actuelle (qui ne charge
  pas `ui.js`, cf. chantier #10). Un refactor de cette ampleur mérite le
  raisonnement le plus prudent disponible.

## 4. Chantiers non-agents (pour mémoire, fondateur uniquement)

Issus de `PLAN-COMMERCIAL.md` / `js/croissance.js` — suivis dans **Admin →
Croissance**, pas dans ce tableau : interroger la Chambre des notaires,
trancher la forme juridique, contacter écoles/crèches/professionnels/presse,
tenir le rituel hebdomadaire d'une heure, fixer le créneau, écrire le plan de
sortie. Un agent peut **préparer** le matériel (dépliant, e-mail type,
dossier de presse — déjà fait dans `js/croissance.js`) mais **jamais
l'envoyer ni le signer** à la place du fondateur.

## 5. Règle de choix du modèle (rappel)

- **Opus 5** : schéma SQL/RLS, tout ce qui touche à la sécurité des données,
  logique avec beaucoup de cas particuliers, refactors à large surface.
- **Sonnet 5** : interface, contenu, documentation, i18n, tests mécaniques,
  edge functions simples à un seul déclencheur.
- Dans le doute, préférer Sonnet 5 et **vérifier davantage** (tests locaux,
  relecture) plutôt que d'escalader systématiquement vers Opus 5 — cf. les
  retours d'efficacité déjà consignés dans `PLAN-ADMIN.md` §9.

## 6. Documents liés

- `ARCHITECTURE.md` — architecture technique et phases d'ingénierie.
- `PLAN-ADMIN.md` — espace Admin v2 (lots A→G) : **terminé**, conservé pour
  mémoire/historique des décisions.
- `PLAN-COMMERCIAL.md` + `js/croissance.js` — analyse de marché et plan de
  développement (chantiers humains, suivi dans l'app).
- `MIGRATION.md` — guide de migration vers d'autres serveurs.
