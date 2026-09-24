# TASK --- « Crée ton drone du futur »

## 1. Objectif du projet

Créer une petite web-app interactive destinée à une animation pour
enfants. L'expérience guide l'enfant dans la création de son « drone du
futur » à travers quelques choix ludiques, lui demande ensuite de
dessiner son idée au feutre sur un tableau Velleda, photographie le
dessin avec une webcam, puis transforme ce croquis en une illustration
spectaculaire grâce à une API de génération d'images hébergée sur
Replicate.

L'application doit être pensée en priorité pour une utilisation
événementielle : interface plein écran, extrêmement simple, très
visuelle, utilisable sans clavier pendant le parcours enfant, rapide,
robuste et capable d'enchaîner de nombreuses sessions.

Objectif émotionnel : l'enfant doit reconnaître son dessin dans le
résultat et avoir l'impression que « sa » création a été transformée en
véritable drone futuriste.

Parcours cible :

Choix animal → choix du mode de déplacement → choix du pouvoir magique →
dessin Velleda → photo webcam → mini-aventure sous-marine pendant la
génération → révélation du drone → envoi éventuel par e-mail → nouvelle
session.

------------------------------------------------------------------------

## 2. Contraintes UX principales

-   Public : enfants, accompagnés éventuellement d'un animateur.
-   Usage principal : écran tactile, ordinateur ou borne avec webcam.
-   Interface plein écran et responsive.
-   Très peu de texte à lire.
-   Gros boutons et grandes illustrations/icônes.
-   Un seul choix important par écran.
-   Aucun élément technique visible : pas de nom de modèle, API, prompt,
    temps serveur, etc.
-   Pas de spinner de chargement classique pendant la génération.
-   Le temps de génération acceptable est d'environ 8 à 10 secondes.
-   Si la génération dure davantage, l'expérience doit rester vivante.
-   Prévoir un bouton discret de retour/recommencer accessible à
    l'animateur.
-   Empêcher les doubles clics/doubles soumissions.
-   Après une session terminée, pouvoir revenir rapidement à l'écran
    d'accueil pour l'enfant suivant.

------------------------------------------------------------------------

## 3. Parcours utilisateur

### Écran 0 --- Accueil

Titre principal :

> CRÉE TON DRONE DU FUTUR !

Sous-titre court et ludique.

CTA principal très visible :

> C'EST PARTI !

L'écran peut présenter une illustration de drone cartoon/futuriste et
annoncer en quelques mots :

> Imagine-le. Dessine-le. Donne-lui vie !

Le CTA démarre une nouvelle session et remet tout l'état précédent à
zéro.

------------------------------------------------------------------------

## 4. Question 1 --- Inspiration animale

Question :

> À quel animal ressemble ton drone ?

Choix initiaux :

-   Guépard --- rapide, agile
-   Éléphant --- énorme, puissant
-   Girafe --- grand, élancé
-   Tortue --- solide, tranquille

Chaque choix doit être représenté par une grande carte illustrée.

Les libellés descriptifs sont surtout destinés à orienter implicitement
le prompt de génération. L'enfant choisit l'animal, pas une liste de
caractéristiques techniques.

Donnée enregistrée dans l'état de session, par exemple :

``` ts
animal: "cheetah" | "elephant" | "giraffe" | "turtle"
```

Prévoir une architecture permettant d'ajouter facilement d'autres
animaux.

------------------------------------------------------------------------

## 5. Question 2 --- Mode de déplacement

Question :

> Que peut faire ton drone ?

Choix validés :

-   Voler comme un oiseau
-   Nager comme un poisson

Exemples d'état :

``` ts
movement: "fly" | "swim"
```

Le choix devra avoir un impact visible sur l'image finale : ailes,
hélices, nageoires, propulsion aquatique, etc., sans forcément copier
littéralement l'animal.

------------------------------------------------------------------------

## 6. Question 3 --- Pouvoir magique

Question :

> Quel est son SUPER POUVOIR ?

Première liste proposée :

-   🔥 Lance des flammes
-   🌈 Crée des arcs-en-ciel
-   ⚡ Lance des éclairs
-   🫥 Devient invisible

État :

``` ts
power: "fire" | "rainbow" | "lightning" | "invisibility"
```

Les pouvoirs doivent rester clairement fantastiques, joyeux et adaptés
aux enfants.

L'architecture doit permettre d'en ajouter ou modifier facilement via
une configuration plutôt que du code dupliqué.

------------------------------------------------------------------------

## 7. Résumé avant dessin

Option recommandée : afficher très brièvement les trois choix sous forme
d'une phrase amusante.

Exemple :

> Tu vas créer un drone inspiré du GUÉPARD, qui VOLE et qui peut lancer
> des ÉCLAIRS !

CTA :

> À TOI DE LE DESSINER !

Ne pas générer d'image à ce stade.

------------------------------------------------------------------------

## 8. Étape dessin Velleda

L'enfant dessine physiquement son drone sur un tableau Velleda.

L'application affiche des instructions extrêmement simples :

> Dessine maintenant ton drone sur le tableau !

Puis :

> Quand tu as fini, montre ton dessin à la caméra.

CTA :

> 📷 PRENDRE MON DESSIN EN PHOTO

Le dessin ne se fait donc pas dans l'application.

------------------------------------------------------------------------

## 9. Capture webcam

Utiliser `navigator.mediaDevices.getUserMedia()` côté navigateur.

### Interface

-   Grande preview vidéo.
-   Cadre/guide visuel central pour positionner le tableau.
-   Bouton de capture très large.
-   Après capture, afficher une preview figée.

Actions :

-   `REPRENDRE LA PHOTO`
-   `C'EST PARFAIT !`

### Traitement recommandé

Avant envoi au backend :

-   capturer une frame dans un canvas ;
-   conserver un ratio cohérent avec la génération finale ;
-   redimensionner l'image afin d'éviter l'envoi inutile d'une photo
    webcam très haute résolution ;
-   encoder en JPEG/WebP avec une qualité raisonnable ;
-   corriger éventuellement l'orientation ;
-   prévoir ultérieurement un recadrage automatique ou semi-automatique
    du tableau si nécessaire.

Ne pas appliquer un traitement agressif qui détruirait les traits du
feutre.

Le premier prototype peut simplement envoyer la capture correctement
cadrée.

### Permissions

Prévoir les états :

-   webcam disponible ;
-   permission refusée ;
-   aucune webcam ;
-   erreur de capture.

Afficher des messages simples destinés à l'animateur.

------------------------------------------------------------------------

## 10. Déclenchement de la génération

Après validation de la photo :

1.  verrouiller l'écran pour éviter une deuxième soumission ;
2.  envoyer au backend :
    -   image du dessin ;
    -   animal ;
    -   movement ;
    -   power ;
    -   éventuel identifiant de session ;
3.  le backend construit le prompt ;
4.  le backend appelle Replicate ;
5.  immédiatement après l'envoi, le frontend lance la mini-scène SVG
    d'attente ;
6.  lorsque le résultat Replicate est disponible, le frontend termine
    proprement la scène puis révèle l'image.

La clé Replicate ne doit JAMAIS être exposée côté client.

Variable serveur :

``` env
REPLICATE_API_TOKEN=...
```

------------------------------------------------------------------------

## 11. Modèle de génération

L'application doit utiliser Replicate via une couche d'abstraction afin
de pouvoir changer de modèle sans réécrire le parcours.

Le choix définitif du modèle doit rester configurable.

Le prototype doit permettre de tester notamment un modèle rapide d'image
editing tel que P-Image-Edit et/ou une alternative type FLUX Kontext.

Exemple :

``` env
REPLICATE_MODEL=...
```

Créer idéalement un module unique :

``` ts
generateDrone({
  sketchImage,
  animal,
  movement,
  power
})
```

Le reste de l'application ne doit pas dépendre du modèle utilisé.

Objectifs de sélection du modèle :

1.  fidélité au croquis ;
2.  qualité visuelle ;
3.  temps de réponse ;
4.  robustesse ;
5.  coût.

Temps cible de génération : idéalement \<= 10 secondes dans les
conditions réelles de l'événement.

------------------------------------------------------------------------

## 12. Construction du prompt image

Le prompt doit être généré côté serveur.

Principe fondamental :

**Le dessin de l'enfant doit rester la source de la forme du drone.**

Ne pas demander au modèle d'inventer un nouveau drone sans tenir compte
du croquis.

Base de prompt à optimiser lors des tests :

``` text
Transform this child's hand-drawn sketch into a spectacular friendly futuristic drone.

IMPORTANT:
Preserve the overall silhouette, proportions, major shapes and recognizable creative ideas from the child's original drawing.

Turn the sketch into a polished, colorful futuristic drone while keeping it clearly recognizable as the same creation.

The drone is inspired by a {ANIMAL}.
It can {MOVEMENT}.
Its magical superpower is {POWER}.

Friendly child-safe design.
Playful futuristic technology.
Expressive and exciting but not scary.
Beautiful colorful 3D cartoon illustration.
Hero composition.
Clean readable silhouette.
High visual impact.
No text, no letters, no logo, no watermark.
```

Le prompt devra être adapté au modèle choisi.

### Mapping sémantique

Ne pas injecter uniquement les valeurs techniques.

Exemple guépard :

``` text
inspired by the speed, agility and dynamic shapes of a cheetah
```

Éléphant :

``` text
inspired by the strength, large volumes and powerful presence of an elephant
```

Girafe :

``` text
inspired by the tall, elongated and playful proportions of a giraffe
```

Tortue :

``` text
inspired by the sturdy protective shapes and calm character of a turtle
```

Même principe pour déplacement et pouvoirs.

------------------------------------------------------------------------

## 13. Ne pas générer le titre dans l'image IA

Ne pas demander au modèle d'inscrire :

> MON SUPER DRONE

Les modèles d'image peuvent produire du texte incohérent.

Le titre sera ajouté par l'application au-dessus ou sur le résultat
généré.

Cela garantit :

-   orthographe parfaite ;
-   identité graphique constante ;
-   possibilité de changer le titre ;
-   possibilité d'ajouter éventuellement un prénom.

------------------------------------------------------------------------

# 14. Mini-scène SVG d'attente

## Objectif

Transformer les 8--10 secondes de calcul en partie intégrante de
l'expérience.

Aucun spinner technique.

Créer une petite aventure cartoon sous-marine entièrement en SVG/CSS/JS.

Avantages :

-   chargement immédiat ;
-   pas de vidéo lourde ;
-   responsive ;
-   animation contrôlable ;
-   durée adaptable à la réponse de Replicate ;
-   textes dynamiques ;
-   possibilité d'ajouter des easter eggs.

------------------------------------------------------------------------

## 15. Univers graphique de la scène

Style :

-   cartoon ;
-   très coloré ;
-   chaleureux ;
-   adapté aux enfants ;
-   formes arrondies ;
-   expressions faciales lisibles ;
-   aucune ambiance sombre/inquiétante malgré l'environnement
    sous-marin.

Personnage principal :

**petit sous-marin cartoon avec de grands yeux.**

Le sous-marin doit pouvoir :

-   cligner des yeux ;
-   regarder autour de lui ;
-   faire tourner son hélice ;
-   produire des bulles ;
-   s'incliner légèrement lors de la plongée/remontée.

Décor SVG principal :

-   surface de l'océan ;
-   rayons lumineux ;
-   bulles ;
-   poissons ;
-   algues/coraux simples ;
-   profondeur ;
-   laboratoire sous-marin ;
-   hublots ;
-   lumières ;
-   bras mécaniques ;
-   éventuellement pieuvre ou créature amicale.

Format recommandé : scène responsive 16:9.

------------------------------------------------------------------------

# 16. Timeline indicative de l'animation

La timeline n'est PAS la source de vérité pour la fin de la génération.

### Phase 1 --- 0 à \~2 s : départ

Sous-marin à la surface.

Yeux qui regardent l'enfant.

Petit clignement.

Message :

> 🤩 Super idée ! Construisons ton drone !

Le sous-marin démarre.

------------------------------------------------------------------------

### Phase 2 --- \~2 à 4 s : plongée

Le sous-marin plonge vers le fond.

Bulles.

Poissons qui traversent.

Caméra/viewport pouvant simuler une descente.

Message :

> 🌊 Nous plongeons vers notre labo secret...

------------------------------------------------------------------------

### Phase 3 --- \~4 à 7 s : laboratoire

Le sous-marin arrive devant/dans le laboratoire.

Bras mécaniques animés.

Voyants lumineux.

Petites étincelles cartoon.

Message 1 :

> 🔧 Assemblage de ton drone...

Puis :

> ✨ Installation de ton SUPER POUVOIR !

À ce stade, si Replicate travaille toujours, l'application entre dans
une boucle d'attente extensible.

------------------------------------------------------------------------

# 17. Boucle d'attente dynamique

Ne jamais faire dépendre la révélation d'un `setTimeout(10000)` fixe.

Créer une machine d'état.

Exemple :

``` ts
type GenerationState =
  | "starting"
  | "diving"
  | "laboratory"
  | "waiting"
  | "result-ready"
  | "surfacing"
  | "reveal"
  | "error";
```

Si le résultat n'est pas encore disponible après l'arrivée au labo,
faire tourner de petites animations non bloquantes.

Messages possibles à alterner :

> 🔩 On serre les derniers boulons !

> 🤖 Les robots travaillent à toute vitesse !

> ✨ Une pincée de magie...

> 🔧 Il manque juste une petite pièce !

> ⚡ Chargement du super pouvoir !

> 🐠 Même les poissons veulent voir ton drone !

Éviter d'afficher un faux pourcentage.

------------------------------------------------------------------------

# 18. Réaction lorsque Replicate termine

Le frontend doit recevoir/observer l'état de la génération.

Lorsque l'image est prête :

``` ts
generationState = "result-ready"
```

Ne pas couper brutalement l'animation.

Déclencher la séquence de retour.

Le laboratoire remet symboliquement au sous-marin une petite caisse /
capsule / objet lumineux pouvant porter un symbole simple comme une
étoile.

Puis :

``` ts
generationState = "surfacing"
```

------------------------------------------------------------------------

# 19. Remontée

Le sous-marin quitte le laboratoire et remonte rapidement.

Effets :

-   bulles plus nombreuses ;
-   inclinaison ;
-   poissons qui s'écartent ;
-   accélération visuelle ;
-   changement progressif de luminosité.

Message :

> 🚀 Vite ! Ton drone est prêt !

Puis arrivée à la surface.

Splash cartoon.

Flash/transition.

------------------------------------------------------------------------

# 20. Révélation

Transition vers l'image générée.

Effet recommandé :

-   flash ;
-   étoiles/confettis légers ;
-   zoom doux de l'image ;
-   apparition du titre.

Titre :

# MON SUPER DRONE

Sous-titre optionnel généré à partir des choix :

> Rapide comme un guépard • Vole dans le ciel • Pouvoir éclair ⚡

Ne pas encombrer l'image.

L'image du drone doit rester le héros de l'écran.

------------------------------------------------------------------------

# 21. Gestion d'une génération très rapide

Si Replicate répond en 2--4 secondes, ne pas révéler instantanément
l'image au milieu de la plongée.

Conserver une durée minimale d'expérience, par exemple environ 6
secondes.

Le résultat peut être gardé en mémoire pendant que la mini-scène atteint
un point de sortie naturel.

------------------------------------------------------------------------

# 22. Gestion d'une génération lente

Si Replicate dépasse 10 secondes :

-   rester dans le laboratoire ;
-   continuer les micro-animations ;
-   alterner les messages ;
-   ne pas afficher de message inquiétant.

Prévoir un timeout technique raisonnable, par exemple 45--60 secondes
configurable.

Après timeout :

> Oups ! Nos robots ont fait tomber une pièce ! 🤖🔧

Actions :

-   `RÉESSAYER`
-   bouton animateur pour revenir à l'accueil.

Ne pas perdre la photo ni les choix lors d'un simple retry.

------------------------------------------------------------------------

# 23. Écran résultat

Afficher :

-   image générée ;
-   titre `MON SUPER DRONE` ;
-   éventuellement résumé des pouvoirs ;
-   **QR code de téléchargement** (méthode principale) ;
-   invitation à photographier l'écran (repli) ;
-   bouton e-mail (optionnel, discret) ;
-   bouton nouvelle création.

CTA principal :

> 🚀 CRÉER UN AUTRE DRONE

CTA secondaire possible :

> ✉️ ENVOYER MON DRONE

Prévoir éventuellement un bouton animateur pour régénérer une image sans
refaire le parcours, mais ne pas le mettre trop en avant pour les
enfants.

------------------------------------------------------------------------

# 24. Composition de l'image finale

Idéalement créer une composition exportable comprenant :

-   illustration générée ;
-   cadre graphique ;
-   titre `MON SUPER DRONE` ;
-   éventuellement caractéristiques choisies ;
-   éventuellement logo de l'événement/client ultérieurement.

Le compositing peut être réalisé avec Canvas côté serveur ou client
selon l'architecture retenue.

Conserver une version haute qualité adaptée à l'envoi par e-mail.

------------------------------------------------------------------------

# 25. Récupération de l'image finale

## 25.1 Méthode principale : QR code vers un lien cloud

À la fin du parcours, l'enfant/le parent récupère l'image via un QR
code affiché sur l'écran résultat — sans saisie clavier, sans compte,
sans donnée personnelle.

Flux technique :

1.  le backend reçoit l'image générée par Replicate ;
2.  le backend l'upload sur un stockage cloud gratuit ;
3.  le backend renvoie `{ "imageUrl": "https://..." }` au frontend ;
4.  le frontend génère le QR code localement (librairie `qrcode` ou
    équivalent — génération gratuite et côté client) ;
5.  le parent scanne le QR avec son téléphone et télécharge l'image.

### Hébergement cloud (gratuit)

Options retenues, par ordre de préférence :

-   **Cloudflare R2** : 10 Go gratuits, zéro frais de bande passante,
    API S3-compatible, URLs publiques par fichier ;
-   **Supabase Storage** : 1 Go gratuit, API simple, URLs signées avec
    expiration intégrée ;
-   **Vercel Blob** : quota gratuit limité, pratique si l'app est déjà
    déployée sur Vercel.

Le fournisseur de stockage doit être abstrait/configurable (variable
d'environnement), comme le fournisseur d'e-mail. Ne pas coder le
fournisseur dans les composants UI.

Ne pas utiliser de services de fichiers temporaires anonymes
(tmpfiles, litterbox, transfer.sh...) : fiabilité insuffisante pour un
événement.

### Règles de sécurité et confidentialité du lien

-   identifiant aléatoire long et non devinable dans l'URL
    (ex. `/drone-f8k2n9x4.png`) ;
-   **suppression automatique de l'image après 24--48 h** (lifecycle
    rule du bucket ou URL signée expirante) ;
-   mention affichée au parent : « Lien valable 48 h ».

UX écran résultat :

> 📸 Scanne pour garder ton drone !

Coût pour un événement de quelques centaines d'enfants : 0 €.

## 25.2 Méthode de repli : photo de l'écran

Toujours afficher en complément une invitation simple :

> 📸 Tu peux aussi photographier ton drone avec un téléphone !

Cette méthode fonctionne dans 100 % des cas, sans réseau ni donnée
collectée. Elle sert de plan B si le cloud est indisponible.

## 25.3 Option secondaire : envoi par e-mail

L'e-mail devient une **option secondaire non obligatoire** (bouton
discret), pas une étape du parcours.

Si activé, proposer la saisie d'une adresse e-mail d'un
parent/accompagnateur à la fin uniquement.

Ne pas demander l'e-mail au début du parcours.

UX :

> Où devons-nous envoyer ton super drone ?

Champ email.

CTA :

> ENVOYER 🚀

Puis confirmation :

> C'est parti ! Ton drone s'envole vers ta boîte mail ! ✉️🚀

Prévoir validation de l'adresse.

L'envoi doit passer par le backend.

Le fournisseur d'e-mail doit être abstrait/configurable.

Exemples possibles : Resend, SendGrid, autre SMTP/API.

Ne pas coder le fournisseur profondément dans les composants UI.

------------------------------------------------------------------------

# 26. Vie privée / données

Le produit implique des enfants : appliquer une logique de minimisation
des données.

Principes :

-   ne demander aucun compte enfant ;
-   ne demander ni nom complet ni date de naissance ;
-   ne pas demander l'e-mail avant qu'il soit nécessaire ;
-   considérer l'e-mail comme celui du parent/accompagnateur ;
-   éviter de conserver les captures webcam plus longtemps que
    nécessaire ;
-   éviter toute capture audio ;
-   webcam active uniquement pendant l'étape de prise de photo ;
-   couper le flux webcam après validation/quand l'écran est quitté ;
-   prévoir une politique explicite de suppression des images
    temporaires ;
-   ne pas utiliser les photos/dessins pour d'autres finalités sans base
    appropriée ;
-   liens cloud de téléchargement : identifiant non devinable et
    suppression automatique des images après 24--48 h (voir §25.1).

Le comportement précis de stockage et les mentions d'information devront
être validés avant déploiement public selon le contexte de l'événement.

------------------------------------------------------------------------

# 27. Architecture technique proposée

Architecture possible :

``` text
Browser / kiosk
      |
      | HTTPS
      v
Web application
      |
      +---- Webcam API
      |
      +---- POST /api/generate
      |          |
      |          +---- Replicate API
      |
      +---- GET /api/generation/:id
      |
      +---- POST /api/email  (optionnel)
                 |
                 +---- Email provider

Stockage cloud (R2 / Supabase / Blob) :
le backend uploade l'image finale et renvoie une URL publique
temporaire ; le frontend l'affiche sous forme de QR code.
```

Une architecture React/Next.js est adaptée, mais l'agent peut proposer
une alternative légère si elle améliore clairement la simplicité du
déploiement.

Priorités :

-   maintenabilité ;
-   simplicité ;
-   robustesse événementielle ;
-   lancement facile en local/borne ;
-   secrets uniquement côté serveur.

------------------------------------------------------------------------

# 28. API interne suggérée

### POST `/api/generate`

Entrée :

``` json
{
  "image": "<upload-or-reference>",
  "animal": "cheetah",
  "movement": "fly",
  "power": "lightning"
}
```

Sortie asynchrone recommandée :

``` json
{
  "generationId": "..."
}
```

### GET `/api/generation/:id`

Pendant traitement :

``` json
{
  "status": "processing"
}
```

Terminé :

``` json
{
  "status": "succeeded",
  "imageUrl": "..."
}
```

Erreur :

``` json
{
  "status": "failed",
  "retryable": true
}
```

Selon les possibilités Replicate, webhook ou polling peuvent être
utilisés. L'implémentation doit privilégier robustesse et simplicité.

------------------------------------------------------------------------

# 29. État frontend

Exemple :

``` ts
interface DroneSession {
  animal?: Animal;
  movement?: Movement;
  power?: Power;

  capturedImage?: string;
  generationId?: string;
  generatedImage?: string;

  status:
    | "welcome"
    | "animal"
    | "movement"
    | "power"
    | "drawing"
    | "camera"
    | "preview"
    | "generating"
    | "result"
    | "email"
    | "complete"
    | "error";
}
```

Centraliser cet état.

Éviter que chaque écran gère indépendamment une partie critique de la
session.

------------------------------------------------------------------------

# 30. Configuration des choix

Mettre les choix dans une configuration structurée.

Exemple :

``` ts
const animals = [
  {
    id: "cheetah",
    label: "Guépard",
    emoji: "🐆",
    prompt: "speed, agility and dynamic shapes of a cheetah"
  }
];
```

Même logique pour `movements` et `powers`.

Cela permettra de changer facilement le contenu de l'animation sans
toucher au moteur.

------------------------------------------------------------------------

# 31. Design system

Direction :

-   cartoon moderne ;
-   couleurs vives ;
-   gros rayons de bordure ;
-   boutons tactiles ;
-   typographie très lisible ;
-   animations souples ;
-   pictogrammes immédiatement compréhensibles.

Prévoir :

-   composants `ChoiceCard` ;
-   `PrimaryButton` ;
-   `ProgressDots` ou indication très légère des étapes ;
-   `CameraCapture` ;
-   `UnderwaterLoader`;
-   `DroneReveal`;
-   `EmailForm`.

Éviter les menus traditionnels d'application.

------------------------------------------------------------------------

# 32. Son

Le MVP peut fonctionner sans son.

Architecture permettant cependant d'ajouter ensuite :

-   bulles ;
-   petit moteur du sous-marin ;
-   splash ;
-   son de révélation ;
-   petites étincelles.

Toujours prévoir un bouton mute.

Ne jamais dépendre du son pour comprendre l'expérience.

------------------------------------------------------------------------

# 33. Robustesse événementielle

L'application doit être pensée pour plusieurs dizaines/centaines de
passages.

Prévoir :

-   bouton de reset ;
-   retour automatique à l'accueil après une durée d'inactivité sur
    l'écran final ;
-   aucune donnée de session précédente visible après reset ;
-   récupération après erreur réseau ;
-   retry Replicate ;
-   webcam libérée entre les sessions ;
-   nettoyage des timers ;
-   nettoyage des animations ;
-   protection contre double génération ;
-   logs serveur minimaux utiles ;
-   messages utilisateur non techniques.

------------------------------------------------------------------------

# 34. Mode développement / test

Créer idéalement un mode développeur non visible en production.

Fonctions utiles :

-   utiliser une image de croquis locale au lieu de la webcam ;
-   sauter directement à l'étape génération ;
-   simuler une réponse Replicate de 2 s / 8 s / 15 s / erreur ;
-   rejouer uniquement l'animation SVG ;
-   afficher les timings ;
-   tester plusieurs modèles avec le même dessin/prompt.

Exemple :

``` env
DEV_TOOLS=true
```

------------------------------------------------------------------------

# 35. Benchmark modèles Replicate

Avant verrouillage du modèle final, effectuer un mini benchmark avec de
vrais dessins ressemblant à ceux qui seront produits pendant
l'animation.

Jeu recommandé :

-   10 croquis Velleda ;
-   formes très simples à plus détaillées ;
-   plusieurs choix animal/mouvement/pouvoir.

Comparer les modèles sur :

-   reconnaissance du dessin original ;
-   respect de la silhouette ;
-   intégration des caractéristiques ;
-   qualité esthétique ;
-   absence d'artefacts ;
-   temps médian ;
-   temps P95 ;
-   taux d'échec ;
-   coût/image.

Le critère principal n'est pas uniquement « la plus belle image ».

Le critère clé est :

> L'enfant doit pouvoir regarder le résultat et reconnaître SON dessin.

------------------------------------------------------------------------

# 36. Instrumentation

Mesurer au minimum :

``` text
capture_confirmed_at
generation_requested_at
replicate_started_at
replicate_completed_at
reveal_started_at
email_sent_at
```

En déduire :

-   latence API ;
-   latence totale ;
-   taux d'échec ;
-   nombre de retries.

Ne pas collecter de données personnelles inutiles dans les logs.

------------------------------------------------------------------------

# 37. Gestion des erreurs

### Webcam

Message convivial + possibilité pour l'animateur de réessayer.

### Réseau

Conserver localement l'état de la session suffisamment longtemps pour
permettre un retry.

### Replicate

Retry contrôlé, pas de boucle infinie.

### Résultat invalide

Permettre une régénération.

### E-mail

Si l'envoi échoue, ne pas perdre l'image finale.

Afficher :

> Ton drone est bien créé ! L'envoi n'a pas fonctionné. On peut
> réessayer.

------------------------------------------------------------------------

# 38. Sécurité

-   API token Replicate uniquement côté serveur.
-   Aucun secret dans le bundle frontend.
-   Variables `.env` non commitées.
-   Validation serveur des valeurs animal/movement/power.
-   Validation du type et de la taille de l'image.
-   Limite de taille des uploads.
-   Rate limiting raisonnable.
-   Protection contre génération répétée accidentelle.
-   Validation email.
-   Échapper/sanitiser les données affichées.
-   HTTPS en production.

------------------------------------------------------------------------

# 39. Performance

Objectif principal : expérience immédiatement réactive.

Avant appel IA :

-   transitions locales instantanées ;
-   SVG préchargé/intégré ;
-   aucune dépendance réseau pour lancer la mini-scène.

Pendant génération :

-   requête lancée avant/au même instant que le début de la scène ;
-   aucune ressource lourde chargée tardivement ;
-   animations CSS/SVG performantes ;
-   privilégier `transform` et `opacity`.

L'image résultat peut être préchargée avant le flash final pour éviter
une apparition vide.

------------------------------------------------------------------------

# 40. Accessibilité pratique

Même si le public principal est enfant :

-   contraste suffisant ;
-   zones tactiles larges ;
-   textes lisibles à distance ;
-   ne pas coder une information uniquement par couleur ;
-   prévoir navigation clavier basique pour l'animateur ;
-   respecter `prefers-reduced-motion` avec une version moins animée si
    possible.

------------------------------------------------------------------------

# 41. Responsive / matériel cible

Priorité :

1.  écran 16:9 Full HD ;
2.  laptop avec webcam ;
3.  tablette paysage.

L'expérience principale doit être optimisée pour le mode paysage.

Prévoir un message ou une adaptation si un smartphone est utilisé en
portrait.

------------------------------------------------------------------------

# 42. Structure de projet indicative

``` text
src/
  app/
    page
    api/
      generate/
      generation/
      email/

  components/
    WelcomeScreen
    ChoiceScreen
    ChoiceCard
    DrawingInstructions
    CameraCapture
    UnderwaterLoader/
      Submarine
      Ocean
      Laboratory
      Fish
      Bubbles
      LoadingMessages
    DroneReveal
    EmailForm

  config/
    animals
    movements
    powers

  lib/
    replicate/
      client
      generateDrone
      prompts
    email/
    image/
    session/

  styles/
```

L'agent est libre d'adapter la structure selon le framework choisi.

------------------------------------------------------------------------

# 43. Machine d'état globale recommandée

``` text
WELCOME
   ↓
ANIMAL
   ↓
MOVEMENT
   ↓
POWER
   ↓
DRAWING
   ↓
CAMERA
   ↓
PHOTO_PREVIEW
   ↓
GENERATING
   ↓
UNDERWATER_SCENE
   ↓
RESULT
   ↓
EMAIL (optional)
   ↓
COMPLETE
   ↓
RESET → WELCOME
```

Les transitions doivent être explicites et testables.

------------------------------------------------------------------------

# 44. Critères d'acceptation MVP

Le MVP est considéré fonctionnel lorsque :

-   l'enfant peut effectuer les trois choix ;
-   les choix sont conservés dans la session ;
-   la webcam peut être ouverte ;
-   une photo peut être prise et reprise ;
-   la photo peut être validée ;
-   la génération Replicate est déclenchée côté serveur ;
-   aucun token Replicate n'est visible côté client ;
-   le prompt tient compte des trois choix ;
-   le croquis est fourni au modèle comme image de référence ;
-   la scène SVG démarre immédiatement ;
-   le sous-marin plonge jusqu'au laboratoire ;
-   l'attente peut durer plus longtemps que la timeline initiale sans
    casser l'animation ;
-   la remontée ne commence qu'après disponibilité du résultat ;
-   l'image est révélée proprement ;
-   `MON SUPER DRONE` est ajouté par l'application, pas par l'IA ;
-   l'utilisateur peut recommencer ;
-   les erreurs principales sont récupérables ;
-   l'état précédent est nettoyé au reset.

L'e-mail peut être intégré dans le MVP ou dans une étape immédiatement
suivante selon la vitesse de développement, mais l'architecture doit le
prévoir dès le départ.

------------------------------------------------------------------------

# 45. Critères qualitatifs

Le projet ne doit pas donner l'impression d'un formulaire suivi d'un
loader IA.

L'expérience recherchée est :

> « Je choisis les pouvoirs de mon invention → je la dessine → une
> petite machine magique part la construire → elle revient avec MON
> drone. »

La fidélité au dessin est plus importante qu'un photoréalisme
spectaculaire.

Le style final doit être suffisamment homogène pour que les créations
successives donnent l'impression d'appartenir au même univers.

------------------------------------------------------------------------

# 46. Priorités de développement

## Phase 1 --- Prototype fonctionnel

-   parcours des trois questions ;
-   capture webcam ;
-   état session ;
-   backend Replicate ;
-   premier prompt ;
-   affichage résultat.

## Phase 2 --- Expérience

-   scène SVG sous-marine ;
-   synchronisation avec génération ;
-   transitions ;
-   reveal ;
-   titre final.

## Phase 3 --- Qualité IA

-   benchmark modèles ;
-   optimisation prompt ;
-   prétraitement photo si nécessaire ;
-   amélioration de la fidélité au croquis.

## Phase 4 --- Livraison événementielle

-   e-mail ;
-   reset automatique ;
-   robustesse réseau ;
-   mode kiosk ;
-   logs/timings ;
-   politique de suppression ;
-   tests longue durée.

------------------------------------------------------------------------

# 47. Points à ne PAS figer prématurément

L'agent ne doit pas rendre difficiles à modifier :

-   modèle Replicate ;
-   prompt ;
-   animaux ;
-   modes de déplacement ;
-   pouvoirs ;
-   textes de l'animation ;
-   fournisseur e-mail ;
-   durée minimale de la mini-scène ;
-   timeout génération ;
-   style graphique final.

Tous ces éléments doivent être configurables autant que raisonnablement
possible.

------------------------------------------------------------------------

# 48. Livrables attendus de l'agent de code

1.  Application exécutable localement.
2.  README d'installation.
3.  `.env.example`.
4.  Parcours complet.
5.  Intégration webcam.
6.  Intégration Replicate côté serveur.
7.  Prompt builder documenté.
8.  Mini-scène SVG responsive.
9.  Gestion de la synchronisation animation/API.
10. Écran résultat.
11. Architecture e-mail prête ou fonctionnelle.
12. Gestion des erreurs.
13. Mode développement/test.
14. Instructions de déploiement.
15. Liste des choix techniques importants.
16. Tests minimaux des fonctions critiques.

------------------------------------------------------------------------

# 49. Définition de « terminé »

Une version est prête pour test terrain lorsqu'un animateur peut lancer
l'application sur un ordinateur avec webcam et faire passer plusieurs
enfants successivement sans intervention technique :

1.  l'enfant choisit son drone ;
2.  dessine sur le Velleda ;
3.  présente le dessin ;
4.  l'animateur/enfant prend la photo ;
5.  le sous-marin part au laboratoire ;
6.  l'IA génère pendant la scène ;
7.  le sous-marin remonte dès que le résultat est prêt ;
8.  le drone apparaît ;
9.  le résultat peut être envoyé ;
10. l'application revient proprement au départ pour l'enfant suivant.

Le test terrain devra particulièrement vérifier la durée réelle de
génération, la lisibilité à distance, la facilité de cadrage du tableau
Velleda et surtout la capacité des enfants à reconnaître leur croquis
dans le drone généré.
