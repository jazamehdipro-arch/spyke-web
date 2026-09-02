import { redirect } from "next/navigation";
import { createClient } from "@/lib/prospection/supabase/server";
import { currentProfile } from "@/lib/prospection/auth";
import GateForm from "./GateForm";

export default async function Connexion() {
  // Déjà connecté : on ne réaffiche pas le formulaire.
  if (await currentProfile()) redirect("/prospection");

  const supabase = await createClient();
  const { data } = await supabase.rpc("equipe_vide");
  const premierDemarrage = data === true;

  return (
    <div className="gate">
      <div className="gate-in">
        <div className="brand">
          <b style={{ fontSize: 21, letterSpacing: ".06em", color: "#fff" }}>SPYKE</b>
          <i
            style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#2F5BEA", display: "block", alignSelf: "center",
            }}
          />
          <span style={{ fontSize: 12, color: "#8FA6D8" }}>Prospection</span>
        </div>
        <GateForm premierDemarrage={premierDemarrage} />
      </div>
    </div>
  );
}
