/**
 * Une option de choix affichée à l'enfant.
 *
 * - Les champs `label`, `hint`, `summary`, `tagline` sont destinés à l'écran (français).
 * - Le champ `prompt` est destiné au modèle d'image (anglais) : c'est un fragment
 *   sémantique, jamais la valeur technique brute (cf. §12 « Mapping sémantique »).
 */
export interface ChoiceOption<Id extends string = string> {
  id: Id;
  /** Libellé très court sous la carte ("Requin"). */
  label: string;
  /** Petit sous-texte facultatif ("rapide, agile"). */
  hint?: string;
  /** Emoji de secours si aucune illustration n'est fournie. */
  emoji: string;
  /** Illustration de la carte (chemin dans /public). */
  image?: string;
  /** Couleur d'accent de la carte (CSS). */
  color: string;
  /** Fragment pour la phrase résumé ("du GUÉPARD"). */
  summary: string;
  /** Fragment pour le sous-titre du résultat ("Rapide comme un requin"). */
  tagline: string;
  /** Fragment de prompt (anglais) décrivant l'intention visuelle. */
  prompt: string;
}
