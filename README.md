# 🚀 Crée ton drone du futur !

Borne interactive pour la **Journée des Familles 2026 — Naval Group**. L'enfant choisit un animal marin, le milieu où opère son drone (air, surface, profondeurs) et un super pouvoir (ou l'invente lui-même), dessine son drone au feutre sur un tableau Velleda, le montre à la webcam… et pendant qu'un sous-marin d'exploration part au centre d'essais sous-marin, une IA (Replicate) transforme le croquis en illustration. Le drone est révélé avec le titre **MON SUPER DRONE**, un QR code de téléchargement et un envoi e-mail optionnel.

```
Accueil → Animal marin → Milieu → Pouvoir (liste ou champ libre) → Résumé → Dessin Velleda → Photo webcam
  → mini-aventure sous-marine (pendant la génération) → Révélation → QR / e-mail → enfant suivant
```

---

## 1. Démarrage rapide

Prérequis : **Node.js ≥ 20.9**, une webcam, Chrome ou Edge récent.

```bash
npm install
cp .env.example .env.local      # puis compléter (voir §3)
npm run dev                     # http://localhost:3000
```

**Sans `REPLICATE_API_TOKEN`, l'app démarre en mode *mock*** : tout le parcours fonctionne, l'image « générée » est un montage du croquis (étiqueté « mode test »). Pratique pour répéter l'animation ou tester la borne sans réseau.

Pour activer la vraie génération, renseigner dans `.env.local` :

```env
REPLICATE_API_TOKEN=r8_...
REPLICATE_MODEL=prunaai/p-image-edit
```

### Lancer la borne (jour de l'événement)

```bash
npm run build
npm start                       # ou : npm run kiosk (build + écoute sur toutes les interfaces)
```

Puis ouvrir Chrome en mode kiosque :

```bash
google-chrome --kiosk --app=http://localhost:3000 \
  --autoplay-policy=no-user-gesture-required \
  --use-fake-ui-for-media-stream        # accepte automatiquement la caméra (sinon : cliquer « Autoriser » une fois)
```

- La caméra exige un **contexte sécurisé** : `http://localhost` convient ; depuis une autre machine il faut du HTTPS.
- Menu animateur : **maintenir ~0,7 s** le bouton ⚙ en haut à gauche (ou touche **Échap**) → étape précédente, recommencer, régénérer l'image, plein écran.
- Bouton 🔊/🔇 en haut à droite. L'expérience ne dépend jamais du son.

---

## 2. Tests

```bash
npm test            # tests unitaires (vitest) — 41 tests
npm run lint        # vérification TypeScript
npm run build       # build de production
```

Fonctions critiques couvertes : pouvoir inventé (nettoyage, caractères autorisés, mots refusés, intégration au prompt), machine d'état de session (double clic, retry, reset, e-mail, liens obsolètes), machine d'état de la scène (résultat rapide / lent / en retard), prompt builder (toutes les combinaisons), adaptateurs de modèles, pipeline Replicate simulé (retry sur 5xx, pas de retry sur 4xx, arrêt après N essais), validation d'image (signature binaire), limiteur de débit, validation e-mail, géométrie de capture.

---

## 3. Configuration

Tout est dans `.env.local` (voir `.env.example`, commenté). Les valeurs sont relues au chargement de la page : **modifier puis redémarrer suffit, sans rebuild**.

| Besoin | Variables |
|---|---|
| Modèle IA | `REPLICATE_MODEL`, `REPLICATE_ASPECT_RATIO`, `REPLICATE_EXTRA_INPUT` |
| Durées | `SCENE_MIN_DURATION_MS` (6,5 s), `GENERATION_TIMEOUT_MS` (60 s), `RESULT_IDLE_TIMEOUT_MS` (2 min) |
| Caméra | `CAMERA_MIRROR`, `CAMERA_ROTATION`, `CAMERA_COUNTDOWN`, `CAMERA_DEVICE_LABEL`, `CAPTURE_ASPECT` |
| QR code | `STORAGE_PROVIDER`, `SHARE_TTL_HOURS`, `PUBLIC_BASE_URL` + identifiants du fournisseur |
| E-mail | `EMAIL_PROVIDER`, `EMAIL_FROM` + clé du fournisseur |
| Outils de test | `DEV_TOOLS` |

### Contenu de l'animation (sans toucher au moteur)

| Fichier | Contenu |
|---|---|
| `src/config/animals.ts` | animaux marins : requin, dauphin, baleine, tortue marine (libellé, illustration, couleur, **fragment de prompt**) |
| `src/config/movements.ts` | milieux : voler au-dessus des mers, naviguer sur les vagues, plonger dans les profondeurs |
| `src/config/powers.ts` | pouvoirs proposés + carte « Invente ton pouvoir » (champ libre, 3 à 60 caractères) |
| `src/config/moderation.ts` | liste de mots refusés dans le champ libre (à compléter) |
| `src/config/branding.ts` | logo, emblème, nom de l'événement, couleurs de la charte |
| `src/config/texts.ts` | tous les textes : questions, messages du sous-marin, erreurs, e-mail… |
| `public/illustrations/*.svg` | illustrations des cartes (remplaçables par celles d'un graphiste) |

### Identité visuelle

- **Logo** : `public/logo.png` — affiché sur l'accueil (plaque blanche avec « Journée des Familles — 2026 »), dans le bandeau blanc de chaque écran du parcours, en filigrane pendant la scène sous-marine et dans le bandeau de l'image finale exportée.
- **Emblème** : `public/images.png`, détouré automatiquement en `public/brand/emblem.png` (fond transparent). Il figure sur le kiosque du sous-marin, sur la capsule remise au sous-marin, sur la façade du centre d'essais et sur le plan de l'accueil. Si l'emblème change, régénérer le PNG transparent (ou fournir directement un PNG/SVG transparent au même chemin).
- **Nom de l'événement** : « Journée des Familles 2026 » par défaut (`branding.ts`), modifiable par `EVENT_NAME`. L'année finale est mise en valeur automatiquement.
- Charte : bleu marine `#002A8F`, rouge `#EF002F`, blanc, fonds « grands fonds » avec grille de plan technique, police Montserrat (embarquée, fonctionne hors ligne).

### Pouvoir inventé (champ libre)

La 6ᵉ carte « Invente ton pouvoir » ouvre un clavier tactile AZERTY (accents, espace). Le texte est validé côté client **et** serveur : 3 à 60 caractères, lettres/chiffres/ponctuation simple, refus des mots de `moderation.ts` (comparaison mot à mot, sans accents). Dans le prompt, il est cité entre guillemets et recadré : « interprète-le comme un effet magique spectaculaire, bienveillant, non violent, adapté aux enfants ». Le texte libre n'est jamais écrit dans les journaux. Le filtre reste volontairement simple : l'animateur garde la main (menu ⚙ → étape précédente / recommencer).

Ajouter un animal = ajouter une entrée dans `animals.ts` (+ une illustration, sinon l'emoji est affiché). Validation serveur, prompt, résumé et sous-titre suivent automatiquement.

---

## 4. Architecture

```
Navigateur (borne)                               Serveur Next.js (Node, instance unique)
─────────────────                               ─────────────────────────────────────
Kiosk (état central : reducer pur)
 ├─ écrans (ChoiceScreen, CameraCapture…)
 ├─ useGenerationController ── POST /api/generate ──► startGeneration() ─► generateDrone()
 │    (idempotent, polling,     GET  /api/generation/:id      │                 ├─ prompts.ts (prompt builder)
 │     préchargement image)     DELETE (annulation au reset)  │                 ├─ models.ts (adaptateurs)
 ├─ UnderwaterLoader (SVG)                                    │                 └─ replicate.ts (API HTTP)
 │    sceneMachine : la remontée n'attend QUE le résultat     └─ store.ts (mémoire, expiration)
 ├─ useShareController ── compose (canvas) ─► POST /api/generation/:id/share ─► storage/ (local|r2|supabase|blob)
 └─ EmailForm ─────────────────────────────► POST /api/email ─► email/ (resend|sendgrid|smtp|log)
```

```
src/
  app/            page, layout, styles, routes API
  components/     Kiosk, WelcomeScreen, ChoiceScreen, ChoiceCard, SummaryScreen, DrawingInstructions,
                  CameraCapture, UnderwaterLoader/{Submarine,Ocean,Laboratory,Fish,Bubbles,LoadingMessages},
                  DroneReveal, QrCode, EmailForm, OnScreenKeyboard, ErrorScreen, AnimatorMenu, DevPanel…
  config/         animaux, déplacements, pouvoirs, textes
  lib/session/    machine d'état globale (§43)
  lib/scene/      machine d'état de la mini-scène (§16–22)
  lib/generation/ generateDrone, prompts, models, replicate, mock, store, runner
  lib/storage/    fournisseurs de stockage (QR code)
  lib/email/      fournisseurs d'e-mail + gabarit
  lib/server/     configuration, validation d'image, rate limit, métriques
  lib/client/     API, capture webcam, composition finale, sons, hooks
scripts/benchmark.ts
```

### Choix techniques importants

1. **Next.js 16 (App Router) + React 19 + TypeScript, CSS pur.** Front et API dans un seul processus : un `npm start` suffit sur la borne. Pas de framework CSS : les animations sont écrites à la main (`transform`/`opacity`).
2. **Génération asynchrone dans le processus Node.** `POST /api/generate` renvoie immédiatement un `generationId` ; la génération continue en tâche de fond (création Replicate avec `Prefer: wait` puis polling) ; le navigateur interroge `GET /api/generation/:id`. Plus simple et plus robuste qu'un webhook pour une borne (pas d'URL publique requise).
   ⚠️ Conséquence : **une seule instance** (borne, VPS, conteneur). Pas de serverless multi-instances sans remplacer `lib/generation/store.ts` par un stockage partagé (Redis/KV).
3. **Couche d'abstraction modèle.** `generateDrone({ sketchImage, animal, movement, power })` est l'unique point d'entrée. Les différences entre modèles (champ image `images[]`, `input_image`, `img_cond_path`, `image_input[]`…) sont isolées dans `models.ts`. Changer de modèle = changer `REPLICATE_MODEL`.
4. **Croquis envoyé en data URI** (recommandé par Replicate sous 1 Mo) : la capture est recadrée au guide, réduite à 1024 px et encodée en JPEG sous ~900 Ko. Aucun stockage intermédiaire du croquis.
5. **La timeline n'est pas la source de vérité.** `sceneMachine.ts` (fonction pure testée) enchaîne départ → plongée → labo → boucle d'attente infinie ; la remontée ne démarre que si l'image est générée **et préchargée**, et après la durée minimale (résultat très rapide). Aucun `setTimeout(10000)`.
6. **Titre ajouté par l'application.** « MON SUPER DRONE » n'est jamais demandé au modèle (le prompt interdit texte/logos). La composition exportable (cadre, titre, caractéristiques, nom d'événement) est dessinée par le navigateur sur un canvas avec la police de l'interface, puis envoyée au serveur pour le QR code et l'e-mail. En cas d'échec, l'image brute est utilisée.
7. **Robustesse :** identifiant de requête idempotent (double clic / renvoi réseau), réponses étiquetées par tentative (une réponse obsolète est ignorée), retry serveur contrôlé (5xx/429, jamais sur 4xx), tolérance aux micro-coupures pendant le polling, timeout configurable, annulation Replicate au reset, verrou d'entrée de 450 ms à chaque changement d'écran, retour automatique à l'accueil, webcam coupée au démontage, timers et animations nettoyés.
8. **Illustrations et scène 100 % SVG intégrées** : démarrage instantané, aucune ressource réseau, lisible à distance, `prefers-reduced-motion` respecté.
9. **Sons synthétisés (WebAudio)** : aucun fichier ; remplaçables par de vrais sons dans `lib/client/sound.ts` sans toucher aux composants.

---

## 5. Prompt builder

`src/lib/generation/prompts.ts` — construit côté serveur, jamais visible à l'écran.

- Principe : **le dessin de l'enfant reste la source de la forme.** Le prompt demande une *transformation* du croquis (silhouette, proportions, idées créatives conservées ; fond du tableau, reflets et mains ignorés).
- Les choix sont injectés sous forme **sémantique** via le champ `prompt` de la config (ex. requin → *« inspired by the speed, power and streamlined hydrodynamic shapes of a shark… »*), jamais la valeur technique. Un pouvoir inventé est cité et recadré (voir §3).
- Style commun « drone naval futuriste » (rendu 3D stylisé haut de gamme, blanc / bleu marine / rouge signal, détails d'ingénierie navale, adapté aux familles, **sans armes**) pour que toutes les créations appartiennent au même univers ; **no text, no letters, no logo, no flag, no watermark** (le logo est ajouté par l'application, pas par l'IA).
- Deux variantes : `instruction` (Kontext, Nano Banana) et `reference` (P-Image-Edit, qui désigne l'entrée par « image 1 »), choisies par l'adaptateur du modèle.

---

## 6. Choisir le modèle : benchmark (§35)

Modèles préconfigurés : `prunaai/p-image-edit` (défaut, < 1–2 s annoncées), `black-forest-labs/flux-kontext-pro`, `prunaai/flux-kontext-dev`, `google/nano-banana`. Un autre modèle d'édition fonctionne via l'adaptateur générique (`REPLICATE_IMAGE_FIELD`).

1. Photographier ~10 vrais croquis Velleda (simples → détaillés) dans `bench-sketches/`.
2. Lancer :
   ```bash
   npm run benchmark -- --sketches ./bench-sketches \
     --models prunaai/p-image-edit,black-forest-labs/flux-kontext-pro --runs 1
   ```
3. Ouvrir `bench-results/<date>/report.html` : grille croquis → résultats, **médiane / P95 / taux d'échec** par modèle, notation 1–5 (reconnaissance du dessin, silhouette, caractéristiques, esthétique, artefacts) exportable en CSV.

Critère principal : **l'enfant doit reconnaître SON dessin.** Le coût/image se lit sur la page du modèle Replicate.

Pendant les tests sur la borne, le panneau 🛠 (mode dev) permet aussi de changer de modèle à la volée avec le même dessin.

---

## 7. QR code & stockage

Le QR code est généré **localement dans le navigateur** (librairie `qrcode`) à partir de l'URL renvoyée par le backend. Identifiant aléatoire long (`drone-<20 caractères>.jpg`), mention « Lien valable 48 h ».

| `STORAGE_PROVIDER` | Mise en place | Suppression automatique |
|---|---|---|
| `r2` (recommandé) | Bucket R2 + jeton API « Object Read & Write » → `R2_*`. Soit domaine public (`R2_PUBLIC_URL`), soit bucket privé → URL pré-signée expirante. | **Règle de cycle de vie** du bucket : *Delete objects after 2 days*, préfixe `drones/` (tableau de bord R2 → Settings → Object lifecycle rules). |
| `supabase` | Bucket **privé** `drones` + clé `service_role`. URL signée expirant après `SHARE_TTL_HOURS`. | Nettoyage automatique par l'app (au plus 1×/h) des dossiers journaliers expirés. |
| `vercel-blob` | `BLOB_READ_WRITE_TOKEN`. | Nettoyage automatique par l'app (1×/h). |
| `local` | Images servies par la borne (`/api/files/…`). Mettre `PUBLIC_BASE_URL` sur une adresse joignable par le téléphone (IP locale sur le même Wi-Fi, ou tunnel HTTPS). Sans adresse joignable, pas de QR. | Fichiers expirés supprimés par l'app. |
| `none` | Pas de QR ; seule l'invitation à photographier l'écran reste. | — |

L'invitation « 📸 Tu peux aussi photographier ton drone » est toujours affichée (plan B sans réseau).

---

## 8. E-mail (option secondaire)

Bouton discret sur l'écran résultat, uniquement si `EMAIL_PROVIDER` ≠ `none`. Saisie via un clavier AZERTY tactile intégré (raccourcis `@gmail.com`, `.fr`…), validation client + serveur, envoi par le backend avec l'image finale en pièce jointe. L'adresse n'est **ni stockée ni journalisée**. En cas d'échec : « Ton drone est bien créé ! L'envoi n'a pas fonctionné. On peut réessayer. » (l'image n'est pas perdue).

Fournisseurs : `resend`, `sendgrid`, `smtp` (`SMTP_URL`), `log` (simulation pour les tests).

---

## 9. Vie privée / données

- Aucun compte, aucun nom, aucune date de naissance ; e-mail demandé seulement à la fin, optionnel, considéré comme celui d'un parent.
- Webcam active **uniquement** sur l'écran photo, flux coupé en quittant l'écran ; jamais d'audio (`microphone=()` dans `Permissions-Policy`).
- Croquis : conservé en mémoire le temps de la génération puis **effacé** ; enregistrements de session expirés après `SESSION_RETENTION_MINUTES` (60 min). Rien n'est écrit sur disque, sauf l'image finale avec le fournisseur `local`.
- Replicate supprime les entrées/sorties des prédictions API après 1 h (politique Replicate à vérifier au moment du déploiement).
- Liens de téléchargement non devinables, supprimés après 24–48 h.
- Journaux : identifiants techniques et durées uniquement (pas d'image, d'e-mail ni d'IP).
- Au reset, aucune donnée de la session précédente ne reste à l'écran.

> Les mentions d'information et la politique de conservation doivent être validées avant un déploiement public, selon le contexte de l'événement.

---

## 10. Mode développement / test

Actif par défaut avec `npm run dev`, ou via `DEV_TOOLS=true`. Bouton 🛠 en bas à droite :

- réponse simulée : **2 s / 8 s / 15 s / erreur** (ou réelle) ;
- choix du modèle Replicate à la volée ;
- **croquis d'exemple** → aperçu, ou → génération directe (saute le parcours) ;
- « 🛠 image locale » sur l'écran caméra : utiliser un fichier au lieu de la webcam ;
- **rejouer seulement l'animation** sous-marine ;
- affichage des **timings** (phase, durée de scène, latence de génération) ;
- statistiques serveur (`/api/stats`) : générations, taux d'échec, retries, latence API et totale (médiane / P95), e-mails.

Instrumentation (§36) : chaque génération journalise en JSON `generation_requested`, `replicate_started`, `replicate_completed`, `reveal_started` (+ `capture_confirmed_at` transmis par le client), `email_sent`, avec latence API, latence totale et nombre de retries.

---

## 11. Déploiement

**Recommandé : la borne elle-même** (PC/laptop + webcam) : `npm run build && npm start`, Chrome en mode kiosque sur `http://localhost:3000`. Le QR code passe par R2/Supabase (ou `local` + `PUBLIC_BASE_URL` sur le Wi-Fi de l'événement).

**Serveur distant (instance unique)** : VPS, Render, Railway, Fly.io… avec HTTPS (obligatoire pour la caméra hors localhost) :

```bash
docker build -t drone-du-futur .
docker run -p 3000:3000 --env-file .env.local drone-du-futur
```

Ne pas déployer sur une plateforme serverless multi-instances sans adapter `lib/generation/store.ts` (voir §4).

Checklist avant l'événement :
- [ ] `REPLICATE_API_TOKEN` + modèle choisi via le benchmark, crédit Replicate suffisant ;
- [ ] stockage QR configuré et testé avec un vrai téléphone ; règle de cycle de vie active ;
- [ ] `DEV_TOOLS=false` ;
- [ ] cadrage du tableau testé sur place (lumière, reflets, `CAMERA_ROTATION`/`CAMERA_MIRROR`) ;
- [ ] police emoji installée sur la borne (Linux : paquet `fonts-noto-color-emoji`) ;
- [ ] test longue durée : 30+ passages d'affilée, vérifier `/api/stats` en mode dev.

---

## 12. Limites connues / à valider sur le terrain

- La génération réelle n'a pas pu être testée ici faute de token : le pipeline Replicate est couvert par des tests avec API simulée et les schémas d'entrée des modèles ont été vérifiés sur Replicate ; **faire un premier essai réel puis le benchmark** avant de figer le modèle et le prompt.
- Le recadrage est un guide fixe (pas de détection automatique du tableau) ; à faire évoluer si le cadrage s'avère difficile pour les enfants.
- Registre des générations en mémoire : un redémarrage du serveur pendant une génération fait apparaître l'écran « Oups », où RÉESSAYER relance avec la même photo.
