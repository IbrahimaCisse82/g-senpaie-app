import { lazy, Suspense, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConges, useContrats } from "@/hooks/useRH";
import { calculerPaie, fmt, MOIS, type Employee, type PayrollParams } from "@/lib/payroll";
import type { Entreprise } from "@/lib/payroll";

const BulletinModal = lazy(() => import("@/components/senpaie/BulletinModal").then((m) => ({ default: m.BulletinModal })));

interface Props {
  userId: string;
  entrepriseId: string;
  employee: Employee | undefined;
  params: PayrollParams;
  entreprise: Entreprise;
  templateId: string;
  onSignOut: () => void;
}

const STATUT_LABEL: Record<string, string> = { demande: "En attente", valide: "Validé", validee: "Validé", refuse: "Refusé", refusee: "Refusé" };

function joursOuvrables(d1: string, d2: string): number {
  const a = new Date(d1), b = new Date(d2);
  if (isNaN(a.getTime()) || isNaN(b.getTime()) || b < a) return 0;
  let n = 0;
  for (const d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) if (d.getDay() !== 0) n++;
  return n;
}

export function EmployeePortal({ userId, entrepriseId, employee, params, entreprise, templateId, onSignOut }: Props) {
  const { conges, save } = useConges(userId, entrepriseId);
  const { contrats } = useContrats(userId, entrepriseId);
  const [showBulletin, setShowBulletin] = useState(false);
  const [debut, setDebut] = useState("");
  const [fin, setFin] = useState("");
  const [motif, setMotif] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const paie = useMemo(() => (employee ? calculerPaie(employee, params) : null), [employee, params]);
  const now = new Date();
  const jours = joursOuvrables(debut, fin);

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-bold">Espace salarié</h1>
          <p className="text-sm text-muted-foreground">Votre compte n'est encore rattaché à aucune fiche salarié. Contactez votre service RH.</p>
          <Button variant="outline" onClick={onSignOut}>Se déconnecter</Button>
        </div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jours) { setMsg("Dates invalides."); return; }
    setBusy(true);
    await save({ matricule: employee.matricule, type: "paye", dateDebut: debut, dateFin: fin, jours, statut: "demande", motif });
    setBusy(false);
    setDebut(""); setFin(""); setMotif("");
    setMsg("✅ Demande envoyée au service RH.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-4 md:px-8 py-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">{entreprise.nom || "G-SENPAIE"}</div>
          <h1 className="text-lg font-bold">Bonjour {employee.prenom} 👋</h1>
        </div>
        <Button variant="outline" size="sm" onClick={onSignOut}>Déconnexion</Button>
      </header>

      <main className="page-enter max-w-4xl mx-auto p-4 md:p-8 grid gap-6 md:grid-cols-2">
        <section className="page-section rounded-lg border border-border bg-card p-5 space-y-2">
          <h2 className="font-bold">Mon profil</h2>
          <dl className="text-sm grid grid-cols-2 gap-y-1">
            <dt className="text-muted-foreground">Matricule</dt><dd>{employee.matricule}</dd>
            <dt className="text-muted-foreground">Fonction</dt><dd>{employee.fonction || "—"}</dd>
            <dt className="text-muted-foreground">Contrat</dt><dd>{employee.contrat}</dd>
            <dt className="text-muted-foreground">Entrée</dt><dd>{employee.dateEntree}</dd>
            <dt className="text-muted-foreground">Catégorie</dt><dd>{employee.categorie || "—"}</dd>
          </dl>
        </section>

        <section className="page-section rounded-lg border border-border bg-card p-5 space-y-3">
          <h2 className="font-bold">Mon bulletin — {MOIS[now.getMonth()]} {now.getFullYear()}</h2>
          {paie && (
            <div className="text-sm grid grid-cols-2 gap-y-1">
              <span className="text-muted-foreground">Salaire brut</span><span>{fmt(paie.brut)} F</span>
              <span className="text-muted-foreground">Net à payer</span><span className="font-bold text-primary">{fmt(paie.net)} F</span>
            </div>
          )}
          <Button onClick={() => setShowBulletin(true)}>Voir / télécharger le bulletin</Button>
        </section>

        <section className="page-section rounded-lg border border-border bg-card p-5 space-y-3">
          <h2 className="font-bold">Demander un congé</h2>
          <form onSubmit={submit} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs">Du<Input type="date" value={debut} onChange={(e) => setDebut(e.target.value)} required /></label>
              <label className="text-xs">Au<Input type="date" value={fin} onChange={(e) => setFin(e.target.value)} required /></label>
            </div>
            <Input placeholder="Motif (facultatif)" value={motif} maxLength={200} onChange={(e) => setMotif(e.target.value)} />
            <div className="text-xs text-muted-foreground">{jours} jour(s) ouvrable(s)</div>
            <Button type="submit" disabled={busy}>{busy ? "Envoi…" : "Envoyer la demande"}</Button>
            {msg && <div className="text-xs">{msg}</div>}
          </form>
        </section>

        <section className="page-section rounded-lg border border-border bg-card p-5 space-y-2">
          <h2 className="font-bold">Mes congés</h2>
          {conges.length === 0 ? <p className="text-sm text-muted-foreground">Aucune demande.</p> : (
            <ul className="text-sm divide-y divide-border">
              {conges.map((c) => (
                <li key={c.id} className="py-2 flex justify-between gap-2">
                  <span>{c.dateDebut} → {c.dateFin} ({c.jours} j)</span>
                  <span className="text-xs font-bold text-primary">{STATUT_LABEL[c.statut] ?? c.statut}</span>
                </li>
              ))}
            </ul>
          )}
          {contrats.length > 0 && (
            <p className="text-xs text-muted-foreground pt-2">Contrat {contrats[0].type} depuis le {contrats[0].dateDebut}{contrats[0].dateFin ? ` jusqu'au ${contrats[0].dateFin}` : ""}.</p>
          )}
        </section>
      </main>

      {showBulletin && (
        <Suspense fallback={null}>
          <BulletinModal emp={employee} params={params} entreprise={entreprise} templateId={templateId} onClose={() => setShowBulletin(false)} />
        </Suspense>
      )}
    </div>
  );
}
