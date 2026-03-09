import { Link } from "react-router-dom";

export default function ProtectionDonnees() {
  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/landing" className="text-primary font-black tracking-[3px] text-sm">G-SENPAIE</Link>
          <Link to="/auth" className="text-primary text-xs hover:underline">← Connexion</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-black text-foreground mb-2">Politique de Protection des Données</h1>
        <p className="text-muted-foreground text-xs mb-8">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</p>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-foreground font-bold text-base mb-2">1. Cadre juridique</h2>
            <p>La présente politique s'inscrit dans le cadre de la <strong className="text-foreground">loi n° 2008-12 du 25 janvier 2008</strong> portant sur la protection des données à caractère personnel en République du Sénégal, et du <strong className="text-foreground">décret n° 2008-721 du 30 juin 2008</strong> portant application de ladite loi.</p>
            <p className="mt-2">Grow Hub SARL s'engage à respecter les dispositions de la Commission de Protection des Données Personnelles (CDP) du Sénégal.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-base mb-2">2. Nature des données traitées</h2>
            <p>G-SENPAIE traite les catégories de données suivantes :</p>
            <div className="mt-3 space-y-3">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-foreground font-bold text-xs mb-1">🔐 Données d'authentification</div>
                <p className="text-xs">Email, mot de passe chiffré. Stockés de manière sécurisée avec chiffrement de bout en bout.</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-foreground font-bold text-xs mb-1">👤 Données personnelles des employés</div>
                <p className="text-xs">Nom, prénom, date de naissance, adresse, téléphone, situation familiale. Accessibles uniquement par l'utilisateur propriétaire.</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-foreground font-bold text-xs mb-1">💰 Données salariales</div>
                <p className="text-xs">Salaire de base, primes, cotisations, avances. Isolées par compte utilisateur grâce au Row Level Security.</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-foreground font-bold text-xs mb-1">🏢 Données d'entreprise</div>
                <p className="text-xs">Raison sociale, NINEA, RCCM, coordonnées. Accessibles uniquement par le propriétaire du compte.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-base mb-2">3. Mesures de sécurité techniques</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-foreground">Isolation des données :</strong> Chaque utilisateur accède uniquement à ses propres données grâce à des politiques de sécurité au niveau de la base de données (Row Level Security).</li>
              <li><strong className="text-foreground">Chiffrement :</strong> Les communications sont chiffrées via HTTPS/TLS. Les mots de passe sont hachés avec des algorithmes robustes.</li>
              <li><strong className="text-foreground">Authentification sécurisée :</strong> Vérification par email, protection contre les attaques par force brute.</li>
              <li><strong className="text-foreground">Sauvegardes :</strong> Les données font l'objet de sauvegardes régulières et automatiques.</li>
              <li><strong className="text-foreground">Audit de sécurité :</strong> Des audits réguliers sont effectués pour identifier et corriger les vulnérabilités.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-base mb-2">4. Transfert de données</h2>
            <p>Les données sont hébergées sur des infrastructures sécurisées. Aucun transfert de données à des tiers n'est effectué sans le consentement préalable de l'utilisateur, sauf obligation légale.</p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-base mb-2">5. Conservation et suppression</h2>
            <p>Les données sont conservées pendant la durée du contrat de service. À la clôture du compte :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Les données personnelles sont supprimées sous 30 jours</li>
              <li>Les données de paie sont conservées conformément aux obligations légales (5 ans minimum)</li>
              <li>Les données de connexion sont supprimées sous 12 mois</li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-base mb-2">6. Notification en cas de violation</h2>
            <p>En cas de violation de données personnelles, Grow Hub SARL s'engage à :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Notifier la CDP dans un délai de 72 heures</li>
              <li>Informer les utilisateurs concernés dans les meilleurs délais</li>
              <li>Prendre les mesures correctives nécessaires</li>
            </ul>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-base mb-2">7. Délégué à la protection des données</h2>
            <p>Pour toute question relative à la protection de vos données personnelles :</p>
            <p className="mt-2">
              <strong className="text-foreground">Grow Hub SARL</strong><br />
              Email : <a href="mailto:g-senpaie@growhubsenegal.com" className="text-primary hover:underline">g-senpaie@growhubsenegal.com</a><br />
              Adresse : Dakar, Sénégal
            </p>
          </section>

          <section>
            <h2 className="text-foreground font-bold text-base mb-2">8. Autorité de contrôle</h2>
            <p>En cas de réclamation, vous pouvez saisir la <strong className="text-foreground">Commission de Protection des Données Personnelles (CDP)</strong> du Sénégal.</p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border mt-8 py-6 text-center text-muted-foreground text-[10px]">
        © {new Date().getFullYear()} Grow Hub SARL · Dakar, Sénégal
      </footer>
    </div>
  );
}
