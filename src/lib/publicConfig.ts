/** Configuration non secrète transmise au navigateur (lue côté serveur à chaque requête). */
export interface PublicConfig {
  devTools: boolean;
  /** Durée minimale de la mini-scène sous-marine avant de pouvoir remonter. */
  sceneMinMs: number;
  /** Au-delà, l'écran « Oups » s'affiche. */
  generationTimeoutMs: number;
  /** Retour automatique à l'accueil après inactivité sur l'écran final. */
  resultIdleMs: number;
  /** Retour automatique à l'accueil si un parcours est abandonné. */
  questionIdleMs: number;
  emailEnabled: boolean;
  shareEnabled: boolean;
  shareTtlHours: number;
  camera: {
    mirror: boolean;
    rotation: 0 | 90 | 180 | 270;
    countdown: number;
    deviceLabel: string;
    maxSize: number;
    aspect: number;
  };
  showSubtitle: boolean;
  eventName: string;
  mockMode: boolean;
}
