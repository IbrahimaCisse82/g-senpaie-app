import { Link } from "react-router-dom";

export default function CGU() {
  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/landing" className="text-primary font-black tracking-[3px] text-sm">G-SENPAIE</Link>
          <Link to="/auth" className="text-primary text-xs hover:underline">← Connexion</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-black text-foreground mb-2">Conditions Générales d'Utilisation</h1>
        <p className="text-muted-foreground text-xs mb-8">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</p>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-foreground font-bold text-base mb-2">1. Objet</h2>
            <p>Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme G-SENPAIE, éditée par <strong className="text-foreground">Grow Hub SARL</strong>, société de droit sénégalais, dont le siège social est situé à Dakar, Sénégal.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-base mb-2">2. Éditeur</h2>
            <p>G-SENPAIE est édité par :<br />
            <strong className="text-foreground">Grow Hub SARL</strong><br />
            Siège social : Dakar, Sénégal<br />
            Email : g-senpaie@growhubsenegal.com</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-base mb-2">3. Acceptation des CGU</h2>
            <p>L'utilisation de G-SENPAIE implique l'acceptation pleine et entière des présentes CGU. L'utilisateur reconnaît avoir pris connaissance de ces conditions avant toute utilisation de la plateforme.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-base mb-2">4. Description du service</h2>
            <p>G-SENPAIE est une solution de gestion de la paie en ligne destinée aux entreprises établies au Sénégal. Elle permet notamment :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Le calcul automatique des bulletins de paie conformément à la législation sénégalaise</li>
              <li>La gestion des cotisations sociales (IPRES, CSS, CFCE, IR, TRIMF)</li>
              <li>La gestion des employés et des conventions collectives</li>
              <li>La génération de rapports et l'export des données</li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-base mb-2">5. Inscription et compte utilisateur</h2>
            <p>L'accès aux fonctionnalités de G-SENPAIE requiert la création d'un compte utilisateur. L'utilisateur s'engage à fournir des informations exactes et à maintenir la confidentialité de ses identifiants de connexion. Toute utilisation du compte est sous la responsabilité exclusive de l'utilisateur.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-base mb-2">6. Responsabilités de l'utilisateur</h2>
            <p>L'utilisateur s'engage à :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Utiliser la plateforme conformément à sa destination</li>
              <li>Vérifier l'exactitude des données saisies et des calculs générés</li>
              <li>Ne pas utiliser la plateforme à des fins illicites ou frauduleuses</li>
              <li>Ne pas tenter de compromettre la sécurité de la plateforme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-base mb-2">7. Limitation de responsabilité</h2>
            <p>G-SENPAIE est un outil d'aide à la gestion de la paie. Grow Hub SARL ne saurait être tenue responsable des erreurs de calcul résultant de données incorrectes saisies par l'utilisateur. L'utilisateur reste seul responsable de la conformité de ses déclarations auprès des organismes compétents.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-base mb-2">8. Propriété intellectuelle</h2>
            <p>L'ensemble des éléments composant la plateforme G-SENPAIE (code source, interface, textes, graphiques, logos) sont la propriété exclusive de Grow Hub SARL et sont protégés par les lois relatives à la propriété intellectuelle.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-base mb-2">9. Droit applicable</h2>
            <p>Les présentes CGU sont soumises au droit sénégalais. Tout litige relatif à l'interprétation ou l'exécution des présentes sera soumis à la compétence exclusive des tribunaux de Dakar.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-base mb-2">10. Contact</h2>
            <p>Pour toute question relative aux présentes CGU, vous pouvez nous contacter à l'adresse : <a href="mailto:g-senpaie@growhubsenegal.com" className="text-primary hover:underline">g-senpaie@growhubsenegal.com</a></p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border mt-8 py-6 text-center text-muted-foreground text-[10px]">
        © {new Date().getFullYear()} Grow Hub SARL · Dakar, Sénégal
      </footer>
    </div>
  );
}
