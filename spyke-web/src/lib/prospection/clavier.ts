"use client";

/**
 * Garder la touche Entrée aux zones de texte.
 *
 * Spyke n'est pas seul sur sa page : le composant téléphonique de l'opérateur
 * s'y installe, et le navigateur du commercial y ajoute ses extensions. Les uns
 * comme les autres posent des écouteurs sur la fenêtre entière pour leurs
 * raccourcis. Il suffit que l'un d'eux s'intéresse à Entrée — pour valider un
 * numéro, pour envoyer un message — et le retour à la ligne disparaît partout
 * dans l'application : dans l'e-mail au prospect comme dans les notes prises
 * pendant l'appel. C'est arrivé, sur un poste et pas sur un autre, ce qui est
 * la signature d'un tiers et non d'un défaut de Spyke.
 *
 * On pose donc cette garde au démarrage, avant tout le reste. Elle ne regarde
 * qu'Entrée, et seulement dans une zone de texte ; là, elle coupe court : plus
 * personne d'autre ne voit la touche.
 *
 * Ce qu'elle ne fait pas, et c'est le point : elle n'appelle pas
 * preventDefault(). Arrêter la propagation empêche les autres écouteurs de
 * s'exécuter, pas le navigateur d'insérer le saut de ligne. La zone de texte
 * fait donc son travail normalement.
 */
export function protegerEntree(): () => void {
  const garde = (e: KeyboardEvent) => {
    if (e.key !== "Enter") return;
    const cible = e.target as HTMLElement | null;
    if (!cible || cible.tagName !== "TEXTAREA") return;
    e.stopImmediatePropagation();
  };
  // En capture : la fenêtre voit la touche avant la page, donc avant les
  // écouteurs posés plus bas, et avant ceux posés plus tard sur la fenêtre.
  window.addEventListener("keydown", garde, true);
  return () => window.removeEventListener("keydown", garde, true);
}
