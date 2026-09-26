/**
 * Tous les textes visibles de l'animation, centralisés ici pour pouvoir
 * les changer sans toucher aux composants.
 */
export const texts = {
  welcome: {
    title: "Crée ton drone du futur",
    subtitle: "Imagine-le. Dessine-le. Donne-lui vie !",
    cta: "C'est parti",
  },
  questions: {
    animal: "De quel animal marin ton drone s'inspire-t-il ?",
    movement: "Où ton drone va-t-il opérer ?",
    power: "Quel est son super pouvoir ?",
  },
  customChoice: {
    animal: { title: "Imagine l'animal de ton drone", placeholder: "ex. : une pieuvre lumineuse" },
    movement: { title: "Imagine où ira ton drone", placeholder: "ex. : sous la banquise" },
    power: { title: "Invente le super pouvoir de ton drone", placeholder: "ex. : faire des bulles géantes" },
    cta: "Valider",
    cancel: "Retour",
    privacy: "Une idée courte suffit, sans nom ni prénom.",
    errors: {
      length: "Écris entre 3 et 60 lettres.",
      chars: "Utilise seulement des lettres et des chiffres.",
      blocked: "Choisis un autre pouvoir, plus sympa !",
    },
  },
  summary: {
    /** {animal}, {movement}, {power} sont remplacés par les fragments `summary` de la config. */
    sentence: "Tu vas créer un drone inspiré {animal}, {movement} et qui peut {power} !",
    sentenceCustom: "Tes idées : {animal} · {movement} · {power}. À toi de dessiner ton drone !",
    cta: "À toi de le dessiner",
  },
  drawing: {
    title: "Dessine ton drone sur le tableau",
    subtitle: "Quand tu as fini, montre ton dessin à la caméra.",
    cta: "Prendre mon dessin en photo",
  },
  camera: {
    hint: "Place ton dessin dans le cadre",
    capture: "Photo",
    retake: "Reprendre la photo",
    confirm: "C'est parfait",
    starting: "Démarrage de la caméra…",
    // Messages destinés à l'animateur (simples, non techniques pour l'enfant).
    errors: {
      denied: "La caméra est bloquée. Autorisez l'accès à la caméra dans le navigateur, puis réessayez.",
      notFound: "Aucune caméra détectée. Branchez une webcam, puis réessayez.",
      busy: "La caméra est déjà utilisée par une autre application. Fermez-la, puis réessayez.",
      insecure: "La caméra nécessite une connexion sécurisée (https ou localhost).",
      capture: "La photo n'a pas pu être prise. On réessaie ?",
      generic: "La caméra ne répond pas. Vérifiez le branchement, puis réessayez.",
    },
    retry: "Réessayer la caméra",
  },
  scene: {
    starting: "Bien reçu ! Ton projet part au centre d'essais.",
    diving: "Plongée vers le centre d'essais sous-marin…",
    laboratory: ["Assemblage de la coque…", "Intégration du super pouvoir…"],
    waiting: [
      "Les ingénieurs font les derniers réglages…",
      "Contrôle de tous les systèmes…",
      "Essais en bassin en cours…",
      "Calibrage des capteurs…",
      "Vérification de l'étanchéité…",
      "Même les poissons veulent voir ton drone !",
    ],
    resultReady: "Ton drone est prêt à appareiller !",
    surfacing: "Remontée en surface !",
  },
  error: {
    title: "Oups ! Une petite avarie au centre d'essais.",
    subtitle: "Pas de panique, on relance la fabrication.",
    retry: "Réessayer",
    home: "Retour à l'accueil",
  },
  result: {
    title: "Mon super drone",
    scan: "Scanne pour garder ton drone",
    linkValidity: "Lien valable {hours} h",
    again: "Créer un autre drone",
    email: "Recevoir par e-mail",
    preparingQr: "Préparation du lien…",
  },
  email: {
    title: "Où devons-nous envoyer ton super drone ?",
    placeholder: "adresse e-mail d'un parent",
    cta: "Envoyer",
    cancel: "Retour",
    invalid: "Cette adresse ne semble pas correcte.",
    sending: "Envoi…",
    success: "C'est envoyé ! Ton drone file vers ta boîte mail.",
    failure: "Ton drone est bien créé ! L'envoi n'a pas fonctionné. On peut réessayer.",
    privacy: "L'adresse sert uniquement à cet envoi et n'est pas conservée.",
    subject: "Ton super drone du futur",
  },
  animator: {
    open: "Menu animateur",
    back: "↩ Étape précédente",
    home: "Recommencer (accueil)",
    regenerate: "Régénérer l'image",
    fullscreen: "Plein écran",
    close: "Fermer",
    holdHint: "Maintenir appuyé",
  },
  rotate: "Tourne l'écran en mode paysage",
} as const;

export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
