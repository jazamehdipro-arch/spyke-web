"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/prospection/supabase/client";
import { profilCourant } from "@/lib/prospection/auth";
import GateForm from "./GateForm";

export default function Connexion() {
  const router = useRouter();
  const [premierDemarrage, setPremier] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      if (await profilCourant()) {
        router.replace("/prospection");
        return;
      }
      const { data } = await createClient().rpc("equipe_vide");
      setPremier(data === true);
    })().catch(() => setPremier(false));
  }, [router]);

  return (
    <div className="gate">
      <div className="gate-in">
        {/* Les couleurs vivent dans la feuille de style, pas ici : l'écran
            d'entrée doit suivre l'identité comme le reste de l'outil. */}
        <div className="brand">
          <b>SPYKE</b>
          <i />
          <span>Prospection</span>
        </div>
        {premierDemarrage === null ? (
          <p className="hint">Un instant…</p>
        ) : (
          <GateForm premierDemarrage={premierDemarrage} />
        )}
      </div>
    </div>
  );
}
