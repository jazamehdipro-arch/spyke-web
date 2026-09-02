"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/prospection/supabase/client";

export default function GateForm({
  premierDemarrage,
}: {
  premierDemarrage: boolean;
}) {
  const router = useRouter();
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [mdp, setMdp] = useState("");
  const [erreur, setErreur] = useState("");
  const [occupe, setOccupe] = useState(false);

  async function entrer(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");

    if (!email.trim() || !mdp) {
      setErreur("Il manque l'e-mail ou le mot de passe.");
      return;
    }
    if (premierDemarrage && !nom.trim()) {
      setErreur("Il manque ton prénom.");
      return;
    }

    setOccupe(true);
    const supabase = createClient();

    const { error } = premierDemarrage
      ? await supabase.auth.signUp({
          email: email.trim(),
          password: mdp,
          options: { data: { nom: nom.trim() } },
        })
      : await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: mdp,
        });

    setOccupe(false);

    if (error) {
      // Les messages de Supabase sont en anglais. On les traduit, mais sans
      // tout écraser : afficher « mot de passe incorrect » sur une adresse non
      // confirmée envoie la personne chercher au mauvais endroit — c'est
      // exactement ce qui s'est passé au premier démarrage.
      const brut = error.message.toLowerCase();
      setErreur(
        brut.includes("not confirmed")
          ? "Cette adresse n'a pas encore été validée. Demande à Mehdi de l'activer."
          : brut.includes("invalid login")
            ? "E-mail ou mot de passe incorrect."
            : premierDemarrage
              ? "La création du compte a échoué. " + error.message
              : "Connexion impossible. " + error.message
      );
      return;
    }

    router.replace("/prospection");
    router.refresh();
  }

  return (
    <form onSubmit={entrer}>
      <h1>{premierDemarrage ? "Premier démarrage" : "Ton espace"}</h1>
      <p>
        {premierDemarrage
          ? "Crée ton accès responsable. Tu pourras ensuite ajouter tes commerciaux depuis les Réglages."
          : "Entre ton e-mail et ton mot de passe."}
      </p>

      {premierDemarrage && (
        <>
          <label htmlFor="gN">Ton prénom</label>
          <input
            type="text"
            id="gN"
            placeholder="Mehdi"
            autoComplete="off"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
          />
        </>
      )}

      <label htmlFor="gE">E-mail</label>
      <input
        type="email"
        id="gE"
        placeholder="prenom@spyke.fr"
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label htmlFor="gP">Mot de passe</label>
      <input
        type="password"
        id="gP"
        placeholder={premierDemarrage ? "À retenir" : "Ton mot de passe"}
        autoComplete={premierDemarrage ? "new-password" : "current-password"}
        value={mdp}
        onChange={(e) => setMdp(e.target.value)}
      />

      <div className="err">{erreur}</div>
      <button className="go" type="submit" disabled={occupe}>
        {occupe ? "…" : premierDemarrage ? "Créer mon accès" : "Entrer"}
      </button>
    </form>
  );
}
