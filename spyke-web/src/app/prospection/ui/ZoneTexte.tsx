"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

/**
 * Le conteneur qui défile autour d'un champ : le panneau quand il y en a un,
 * la page sinon.
 */
function defileur(e: HTMLElement): Element | null {
  return e.closest(".sheet") ?? document.scrollingElement;
}

/**
 * Une zone de texte qui grandit avec ce qu'on écrit.
 *
 * Un textarea de hauteur fixe garde sa propre barre de défilement. Sur
 * téléphone, cette barre-là est un piège : la zone vit dans un panneau qui
 * défile, lui-même en position fixe et déplacé par une transformation, et dans
 * cette configuration Safari ne ramène pas le curseur à l'écran. On écrit, on
 * appuie sur Entrée, la ligne existe bel et bien — mais elle est sous le
 * clavier, et rien ne bouge. Vu du commercial, c'est une touche Entrée qui ne
 * marche pas.
 *
 * En laissant la zone prendre la hauteur de son texte, il n'y a plus de
 * défilement interne du tout : c'est le panneau qui défile, et lui sait le
 * faire.
 */
export default function ZoneTexte({
  valeur,
  onTexte,
  minLignes = 4,
  ...reste
}: {
  valeur: string;
  onTexte: (v: string) => void;
  minLignes?: number;
} & Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "onChange" | "rows"
>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const hauteur = useRef(0);
  const auBout = useRef(false);

  /**
   * Mesurer, c'est remettre la hauteur à « auto » le temps d'un calcul. Pendant
   * cet instant la zone se replie, le panneau devient plus court et le
   * navigateur rabote son défilement pour qu'il tienne encore : on perdait la
   * position de lecture à chaque lettre tapée. D'où la sauvegarde.
   *
   * Les bordures, elles, comptent dans la hauteur mais pas dans scrollHeight.
   * Les oublier laisse deux pixels de défilement interne, et la dernière ligne
   * reste coupée en bas.
   */
  const taille = useCallback((t: HTMLTextAreaElement) => {
    const d = defileur(t);
    const garde = d ? d.scrollTop : 0;
    const st = getComputedStyle(t);
    const bords =
      st.boxSizing === "border-box"
        ? parseFloat(st.borderTopWidth) + parseFloat(st.borderBottomWidth)
        : 0;
    t.style.height = "auto";
    const h = t.scrollHeight + bords;
    t.style.height = h + "px";
    if (d) d.scrollTop = garde;
    return h;
  }, []);

  /* Avant la peinture, sinon la zone saute à chaque caractère. */
  useLayoutEffect(() => {
    const t = ref.current;
    if (!t) return;
    const h = taille(t);

    /* Une ligne ajoutée au bout pousse tout ce qui suit vers le bas, curseur
       compris. On défile d'autant : à l'écran, le curseur ne bouge pas d'un
       pixel. Seulement au bout — déplacer la vue quand on corrige un mot au
       milieu serait pire que de ne rien faire. */
    const pousse = h - hauteur.current;
    hauteur.current = h;
    if (auBout.current && pousse > 0) {
      const d = defileur(t);
      if (d) d.scrollTop += pousse;
    }
    auBout.current = false;
  }, [valeur, taille]);

  /* Les hauteurs de ligne changent quand les polices finissent d'arriver. */
  useEffect(() => {
    const f = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (!f) return;
    let vivant = true;
    void f.ready.then(() => {
      const t = ref.current;
      if (vivant && t) hauteur.current = taille(t);
    });
    return () => { vivant = false; };
  }, [taille]);

  return (
    <textarea
      {...reste}
      ref={ref}
      rows={minLignes}
      value={valeur}
      style={{ overflow: "hidden", resize: "none", ...reste.style }}
      onChange={(e) => {
        auBout.current = e.target.selectionStart === e.target.value.length;
        onTexte(e.target.value);
      }}
    />
  );
}
