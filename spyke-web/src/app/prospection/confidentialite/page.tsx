/**
 * La page à montrer — ou à envoyer — au prospect qui demande d'où vient son
 * numéro, ce qu'on sait de lui, et comment le faire effacer.
 *
 * Elle est publique et sans connexion : la personne concernée n'a pas de compte
 * Spyke, elle doit pouvoir la lire depuis le lien qu'on lui donne au téléphone.
 * Elle est aussi tenue hors des moteurs de recherche, comme le reste de l'outil.
 */

export const metadata = {
  title: "Spyke Prospection · Vos données",
  description: "Comment Spyke traite les données des entreprises qu'elle contacte.",
  robots: { index: false, follow: false },
};

export default function Confidentialite() {
  return (
    <>
      <div className="top" style={{ position: "static" }}>
        <div className="brand"><b>SPYKE</b><i /><span>Vos données</span></div>
        <div style={{ height: 14 }} />
      </div>

      <div className="wrap">
      <div className="panel">
        <h3>D&apos;où vient votre numéro</h3>
        <p className="hint">
          Spyke contacte des entreprises pour leur proposer un audit
          d&apos;automatisation. Les coordonnées que nous utilisons — nom de
          l&apos;établissement, adresse, téléphone professionnel, secteur
          d&apos;activité — proviennent de <b>sources professionnelles
          publiques</b> : annuaires d&apos;entreprises, fiches
          d&apos;établissement en ligne, sites professionnels.
        </p>
        <p className="hint" style={{ marginTop: 10 }}>
          Nous ne collectons aucune donnée personnelle au sens strict : pas de
          numéro personnel, pas d&apos;adresse privée, pas de donnée sensible.
        </p>
      </div>

      <div className="panel">
        <h3>Pourquoi nous avons le droit</h3>
        <p className="hint">
          Le fondement est <b>l&apos;intérêt légitime</b> (article 6.1.f du
          RGPD) : une entreprise a un intérêt légitime à faire connaître son
          offre à d&apos;autres entreprises dont l&apos;activité correspond à
          cette offre. Nous ne contactons que des professionnels, sur leurs
          coordonnées professionnelles, pour un sujet professionnel.
        </p>
        <p className="hint" style={{ marginTop: 10 }}>
          Vous pouvez vous y opposer à tout moment, sans avoir à vous justifier.
          Il suffit de le dire au téléphone ou de nous écrire.
        </p>
      </div>

      <div className="panel">
        <h3>Ce que nous notons</h3>
        <p className="hint">
          Les coordonnées de l&apos;établissement, la date et la durée de nos
          appels, ce qui a été dit d&apos;utile pour la suite (« rappeler en
          septembre », « intéressé par la facturation »), et le cas échéant la
          date d&apos;un rendez-vous.
        </p>
        <p className="hint" style={{ marginTop: 10 }}>
          Ces notes vous sont communicables si vous les demandez. Nos
          commerciaux le savent et sont tenus de n&apos;y écrire que ce
          qu&apos;ils vous diraient en face.
        </p>
      </div>

      <div className="panel">
        <h3>Combien de temps</h3>
        <p className="hint">
          <b>Trois ans</b> à compter du dernier contact. Passé ce délai, la
          fiche et son historique sont effacés automatiquement. Une fiche jamais
          appelée part trois ans après son entrée dans notre fichier.
        </p>
        <p className="hint" style={{ marginTop: 10 }}>
          Seule exception : les documents comptables liés à une prestation
          facturée, conservés le temps qu&apos;impose la loi.
        </p>
      </div>

      <div className="panel">
        <h3>Vos droits</h3>
        <div className="stat"><span>Savoir ce que nous avons sur vous</span><b>Accès</b></div>
        <div className="stat"><span>Faire corriger une information fausse</span><b>Rectification</b></div>
        <div className="stat"><span>Être effacé de notre fichier</span><b>Effacement</b></div>
        <div className="stat"><span>Ne plus jamais être rappelé</span><b>Opposition</b></div>
        <p className="hint" style={{ marginTop: 14 }}>
          Écrivez à <b>contact@spykeapp.fr</b> en indiquant le nom de votre
          établissement. Nous répondons sous un mois. L&apos;effacement est
          immédiat et définitif : nous gardons seulement une empreinte
          indéchiffrable de votre numéro, pour ne pas vous réimporter par erreur
          lors d&apos;un prochain fichier.
        </p>
        <p className="hint" style={{ marginTop: 10 }}>
          Si notre réponse ne vous satisfait pas, vous pouvez saisir la CNIL
          (cnil.fr).
        </p>
      </div>

      <div className="panel">
        <h3>Qui traite ces données</h3>
        <p className="hint">
          Spyke — contact@spykeapp.fr — spykeapp.fr
        </p>
        <p className="hint" style={{ marginTop: 10 }}>
          Les données sont hébergées dans l&apos;Union européenne. Elles ne sont
          ni vendues, ni louées, ni transmises à des tiers à des fins
          commerciales.
        </p>
      </div>
      </div>
    </>
  );
}
