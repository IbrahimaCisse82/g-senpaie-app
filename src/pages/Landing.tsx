import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const FEATURES = [
  { icon: "📊", title: "Bulletins de paie", desc: "Génération automatique conforme au droit sénégalais avec IR, TRIMF, IPRES, CSS et CFCE." },
  { icon: "👥", title: "Gestion des employés", desc: "Fichier complet : état civil, contrats, conventions collectives, catégories professionnelles." },
  { icon: "🏛️", title: "Cotisations sociales", desc: "Calcul automatique de toutes les cotisations salariales et patronales avec plafonds réglementaires." },
  { icon: "📈", title: "Tendances & rapports", desc: "Suivi mensuel de la masse salariale, export CSV et PDF, historique des clôtures." },
  { icon: "⚖️", title: "Conventions collectives", desc: "Commerce, BTP, Industries Alimentaires, Hôtellerie et plus, avec grilles de salaires minima." },
  { icon: "🔒", title: "Sécurité des données", desc: "Données chiffrées, accès isolé par utilisateur, hébergement sécurisé conforme RGPD." },
];

export default function Landing() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-primary text-lg font-bold animate-pulse">Chargement…</div>
    </div>
  );

  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      {/* Nav */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-primary text-lg font-black tracking-[3px]">G-SENPAIE</span>
            <span className="text-muted-foreground text-[10px] ml-3 hidden sm:inline">par Grow Hub SARL</span>
          </div>
          <div className="flex gap-3">
            <Link to="/auth" className="px-4 py-2 text-primary border border-primary rounded-lg text-[12px] font-bold hover:bg-primary/10 transition-colors">
              Se connecter
            </Link>
            <Link to="/auth" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-[12px] font-bold hover:opacity-90 transition-opacity">
              Commencer
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-32 text-center">
        <h1 className="text-3xl md:text-5xl font-black text-foreground mb-5 leading-tight">
          La gestion de la paie<br />
          <span className="text-primary">simplifiée au Sénégal</span>
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
          G-SENPAIE automatise le calcul des bulletins de paie, cotisations sociales et déclarations
          en conformité totale avec la législation sénégalaise. Conçu pour les PME, TPE et cabinets comptables.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/auth" className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">
            🚀 Essayer gratuitement
          </Link>
          <a href="#fonctionnalites" className="px-8 py-3 border border-border text-foreground rounded-lg font-bold text-sm hover:bg-secondary transition-colors">
            Découvrir les fonctionnalités
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="fonctionnalites" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-black text-foreground mb-2">Fonctionnalités</h2>
          <p className="text-muted-foreground text-sm">Tout ce dont vous avez besoin pour gérer la paie au Sénégal</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-card border border-border rounded-xl p-6 hover:border-primary/40 transition-colors">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-foreground font-bold text-sm mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-10 md:p-16 text-center">
          <h2 className="text-2xl md:text-3xl font-black text-foreground mb-3">Prêt à simplifier votre paie ?</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-lg mx-auto">
            Rejoignez les entreprises sénégalaises qui font confiance à G-SENPAIE pour la gestion de leur paie.
          </p>
          <Link to="/auth" className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">
            Créer mon compte
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-8">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-primary font-black tracking-[3px] text-sm mb-2">G-SENPAIE</div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Solution de gestion de la paie conforme à la législation de la République du Sénégal.
              </p>
              <p className="text-muted-foreground text-[10px] mt-3">
                Développé par <strong className="text-foreground">Grow Hub SARL</strong><br />
                Société de droit sénégalais · Dakar, Sénégal
              </p>
            </div>
            <div>
              <div className="text-foreground font-bold text-xs mb-3 uppercase tracking-wider">Légal</div>
              <div className="space-y-2">
                <Link to="/cgu" className="text-muted-foreground text-xs hover:text-primary transition-colors block">Conditions Générales d'Utilisation</Link>
                <Link to="/confidentialite" className="text-muted-foreground text-xs hover:text-primary transition-colors block">Politique de Confidentialité</Link>
                <Link to="/protection-donnees" className="text-muted-foreground text-xs hover:text-primary transition-colors block">Protection des Données</Link>
              </div>
            </div>
            <div>
              <div className="text-foreground font-bold text-xs mb-3 uppercase tracking-wider">Contact</div>
              <div className="space-y-2 text-muted-foreground text-xs">
                <div>✉ g-senpaie@growhubsenegal.com</div>
                <div>📍 Dakar, Sénégal</div>
              </div>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-6 text-center text-muted-foreground text-[10px]">
            © {new Date().getFullYear()} Grow Hub SARL. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
