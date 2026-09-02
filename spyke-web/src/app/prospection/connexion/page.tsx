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
        <div className="brand">
          <b style={{ fontSize: 21, letterSpacing: ".06em", color: "#fff" }}>SPYKE</b>
          <i style={{ width: 6, height: 6, borderRadius: "50%", background: "#2F5BEA", display: "block", alignSelf: "center" }} />
          <span style={{ fontSize: 12, color: "#8FA6D8" }}>Prospection</span>
        </div>
        {premierDemarrage === null ? (
          <p style={{ color: "#8FA6D8", fontSize: 13.5 }}>Un instant…</p>
        ) : (
          <GateForm premierDemarrage={premierDemarrage} />
        )}
      </div>
    </div>
  );
}
