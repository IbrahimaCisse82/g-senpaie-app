import { Link } from "react-router-dom";

export default function Confidentialite() {
  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/landing" className="text-primary font-black tracking-[3px] text-sm">G-SENPAIE</Link>
          <Link to="/auth" className="text-primary text-xs hover:underline">← Connexion</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-black text-foreground mb-2">Politique de Confidentialité</h1>
        <p className="text-muted-foreground text-xs mb-8">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</p>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-foreground font-bold text-base mb-2">1. Responsable du traitement</h2>
            <p><strong className="text-foreground">Grow Hub SARL</strong><br />
            Siège social : Dakar, Sénégal<br />
            Email : g-senpaie@growhubsenegal.com</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-base mb-2">2. Données collectées</h2>
            <p>Dans le cadre de l'utilisation de G-SENPAIE, nous collectons les données suivantes :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong className="text-foreground">Données d'identification :</strong> nom, prénom, adresse email</li>
              <li><strong className="text-foreground">Données des employés :</strong> état civil, coordonnées, informations contractuelles, données salariales</li>
              <li><strong className="text-foreground">Données d'entreprise :</strong> raison sociale, NINEA, RCCM, adresse, coordonnées</li>
              <li><strong className="text-foreground">Données de connexion :</strong> adresse IP, horodatages d'accès</li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-base mb-2">3. Finalités du traitement</h2>
            <p>Les données sont traitées exclusivement pour :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>La gestion des comptes utilisateurs et l'authentification</li>
              <li>Le calcul et la génération des bulletins de paie</li>
              <li>Le calcul des cotisations sociales</li>
              <li>La génération de rapports et statistiques pour l'utilisateur</li>
              <li>L'amélioration de la plateforme et le support technique</li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-base mb-2">4. Base légale</h2>
            <p>Le traitement des données est fondé sur :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>L'exécution du contrat de service entre l'utilisateur et Grow Hub SARL</li>
              <li>Le consentement de l'utilisateur lors de son inscription</li>
              <li>Les obligations légales en matière de gestion de la paie</li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-base mb-2">5. Partage des données</h2>
            <p>Grow Hub SARL ne vend, ne loue et ne communique aucune donnée personnelle à des tiers à des fins commerciales. Les données peuvent être partagées uniquement avec nos sous-traitants techniques pour le fonctionnement de la plateforme, dans le respect strict de la confidentialité.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-base mb-2">6. Durée de conservation</h2>
            <p>Les données sont conservées pendant toute la durée d'utilisation du service, puis supprimées dans un délai de 12 mois suivant la clôture du compte, sauf obligation légale de conservation plus longue.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-base mb-2">7. Droits des utilisateurs</h2>
            <p>Conformément à la loi sénégalaise n° 2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Droit d'accès à vos données personnelles</li>
              <li>Droit de rectification des données inexactes</li>
              <li>Droit de suppression de vos données</li>
              <li>Droit d'opposition au traitement</li>
              <li>Droit à la portabilité de vos données</li>
            </ul>
            <p className="mt-2">Pour exercer ces droits, contactez-nous à : <a href="mailto:g-senpaie@growhubsenegal.com" className="text-primary hover:underline">g-senpaie@growhubsenegal.com</a></p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-base mb-2">8. Sécurité</h2>
            <p>Grow Hub SARL met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, modification, divulgation ou destruction.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-base mb-2">9. Cookies</h2>
            <p>G-SENPAIE utilise uniquement des cookies techniques nécessaires au fonctionnement de la plateforme (authentification, préférences de session). Aucun cookie de tracking ou publicitaire n'est utilisé.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-base mb-2">10. Contact</h2>
            <p>Pour toute question relative à cette politique, contactez-nous à : <a href="mailto:g-senpaie@growhubsenegal.com" className="text-primary hover:underline">g-senpaie@growhubsenegal.com</a></p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border mt-8 py-6 text-center text-muted-foreground text-[10px]">
        © {new Date().getFullYear()} Grow Hub SARL · Dakar, Sénégal
      </footer>
    </div>
  );
}
