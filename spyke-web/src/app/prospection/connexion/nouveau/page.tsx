"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/prospection/supabase/client";

/**
 * La page au bout du lien « mot de passe oublié ».
 *
 * Le lien porte un jeton de session dans son adresse. La bibliothèque de la
 * base le lit au chargement et ouvre une session le temps de poser un nouveau
 * mot de passe — c'est le seul moment où quelqu'un qui a perdu le sien peut
 * écrire quelque chose. On attend donc cette session avant d'afficher le
 * formulaire, plutôt que de laisser la personne taper dans le vide.
 *
 * Un lien vieux d'une heure, ou déjà utilisé, n'ouvre rien : on le dit, et on
 * renvoie en demander un autre au lieu d'afficher une erreur technique.
 */
export default function NouveauMotDePasse() {
  const router = useRouter();
  const [pret, setPret] = useState<boolean | null>(null);
  const [mdp, setMdp] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState("");
  const [occupe, setOccupe] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let vivant = true;

    const { data: abonnement } = supabase.auth.onAuthStateChange((_e, session) => {
      if (vivant && session) setPret(true);
    });

    // La lecture de l'adresse est asynchrone : on laisse le temps de s'ouvrir
    // avant de conclure que le lien ne vaut rien.
    const t = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (vivant) setPret(data.session !== null);
    }, 1800);

    return () => {
      vivant = false;
      window.clearTimeout(t);
      abonnement.subscription.unsubscribe();
    };
  }, []);

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    if (mdp.length < 8) {
      setErreur("Huit caractères au minimum.");
      return;
    }
    if (mdp !== confirmation) {
      setErreur("Les deux mots de passe ne sont pas les mêmes.");
      return;
    }
    setOccupe(true);
    const { error } = await createClient().auth.updateUser({ password: mdp });
    setOccupe(false);
    if (error) {
      setErreur("Impossible d'enregistrer. " + error.message);
      return;
    }
    router.replace("/prospection");
    router.refresh();
  }

  return (
    <div className="gate">
      <div className="gate-in">
        <div className="brand">
          <b>SPYKE</b>
          <i />
          <span>Prospection</span>
        </div>

        {pret === null && <p className="hint">Un instant…</p>}

        {pret === false && (
          <>
            <h1>Lien expiré</h1>
            <p>
              Ce lien ne vaut qu&apos;une heure, et une seule fois. Redemandes-en un
              depuis l&apos;écran de connexion.
            </p>
            <a className="go" style={{ display: "block", textAlign: "center" }}
               href="/prospection/connexion">
              Retour à la connexion
            </a>
          </>
        )}

        {pret === true && (
          <form onSubmit={enregistrer}>
            <h1>Nouveau mot de passe</h1>
            <p>Choisis-en un, il remplace l&apos;ancien tout de suite.</p>

            <label htmlFor="nP">Nouveau mot de passe</label>
            <input
              type="password"
              id="nP"
              autoComplete="new-password"
              placeholder="Huit caractères au minimum"
              value={mdp}
              onChange={(e) => setMdp(e.target.value)}
            />

            <label htmlFor="nC">Répète-le</label>
            <input
              type="password"
              id="nC"
              autoComplete="new-password"
              placeholder="Le même"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />

            <div className="err">{erreur}</div>
            <button className="go" type="submit" disabled={occupe}>
              {occupe ? "…" : "Enregistrer et entrer"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
