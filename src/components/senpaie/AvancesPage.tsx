import { useMemo, useState } from "react";
import type { Employee } from "@/lib/payroll";
import { fmt, MOIS } from "@/lib/payroll";
import { useAvances, type Avance } from "@/hooks/useAvances";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, CheckCircle2, Ban, HandCoins } from "lucide-react";

const STATUT_LABEL: Record<Avance["statut"], string> = { en_cours: "En cours", solde: "Soldé", annule: "Annulé" };
const STATUT_VARIANT: Record<Avance["statut"], "default" | "secondary" | "destructive"> = { en_cours: "default", solde: "secondary", annule: "destructive" };

export function AvancesPage({ entrepriseId, employees }: { entrepriseId: string | null; employees: Employee[] }) {
  const { avances, loading, create, markEcheancePayee, setStatut, remove } = useAvances(entrepriseId);
  const [showForm, setShowForm] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [type, setType] = useState<"avance" | "pret">("avance");
  const [montant, setMontant] = useState("");
  const [nbMensualites, setNbMensualites] = useState("1");
  const [dateOctroi, setDateOctroi] = useState(() => new Date().toISOString().slice(0, 10));
  const [motif, setMotif] = useState("");
  const [busy, setBusy] = useState(false);

  const empById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const now = new Date();
  const echeancesDuMois = useMemo(
    () => avances.flatMap((a) => a.echeances.filter((e) => e.statut === "en_attente" && e.mois === now.getMonth() + 1 && e.annee === now.getFullYear()).map((e) => ({ echeance: e, avance: a }))),
    [avances] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const totalEnCours = avances.filter((a) => a.statut === "en_cours").reduce((s, a) => s + a.echeances.filter((e) => e.statut === "en_attente").reduce((x, e) => x + e.montant, 0), 0);

  const submit = async () => {
    const m = Number(montant);
    const n = Number(nbMensualites);
    if (!employeeId || !m || m <= 0 || !n || n < 1 || n > 36) return;
    setBusy(true);
    await create({ employeeId, type, montant: m, dateOctroi, nbMensualites: n, motif });
    setBusy(false);
    setShowForm(false);
    setMontant(""); setMotif(""); setNbMensualites("1");
  };

  return (
    <div className="page-enter space-y-4">
      <div className="page-section flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><HandCoins className="h-5 w-5 text-primary" /> Avances & prêts sur salaire</h2>
          <p className="text-sm text-muted-foreground">Échéanciers générés automatiquement, retenues mensuelles suivies.</p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" /> Nouvelle avance</Button>
      </div>

      <div className="page-section grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Avances en cours</p><p className="text-2xl font-bold">{avances.filter((a) => a.statut === "en_cours").length}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Reste à rembourser</p><p className="text-2xl font-bold">{fmt(totalEnCours)} F</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">À retenir ce mois ({MOIS[now.getMonth()]})</p><p className="text-2xl font-bold">{fmt(echeancesDuMois.reduce((s, x) => s + x.echeance.montant, 0))} F</p></CardContent></Card>
      </div>

      <Card className="page-section">
        <CardHeader><CardTitle className="text-base">Échéances du mois en cours</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {echeancesDuMois.length === 0 && <p className="text-sm text-muted-foreground">Aucune retenue prévue ce mois-ci.</p>}
          {echeancesDuMois.map(({ echeance, avance }) => (
            <div key={echeance.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm">
              <span>{empById.get(avance.employeeId)?.nom || "—"} · {fmt(echeance.montant)} F</span>
              <Button size="sm" variant="outline" onClick={() => markEcheancePayee(echeance.id)}><CheckCircle2 className="h-4 w-4 mr-1" /> Marquer retenue</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="page-section">
        <CardHeader><CardTitle className="text-base">Toutes les avances</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-muted-foreground">Chargement…</p>}
          {!loading && avances.length === 0 && <p className="text-sm text-muted-foreground">Aucune avance enregistrée.</p>}
          {avances.map((a) => {
            const emp = empById.get(a.employeeId);
            const paye = a.echeances.filter((e) => e.statut === "paye").reduce((s, e) => s + e.montant, 0);
            return (
              <div key={a.id} className="rounded-md border p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm">
                    <span className="font-semibold">{emp ? `${emp.prenom} ${emp.nom}` : "—"}</span>
                    <span className="text-muted-foreground"> · {a.type === "avance" ? "Avance" : "Prêt"} · {fmt(a.montant)} F · {a.nbMensualites} mensualité(s)</span>
                    {a.motif && <span className="text-muted-foreground"> · {a.motif}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUT_VARIANT[a.statut]}>{STATUT_LABEL[a.statut]}</Badge>
                    {a.statut === "en_cours" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setStatut(a.id, "solde")}>Solder</Button>
                        <Button size="sm" variant="ghost" onClick={() => setStatut(a.id, "annule")}><Ban className="h-4 w-4" /></Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
                <div className="h-1.5 rounded bg-muted overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${a.montant ? Math.min(100, (paye / a.montant) * 100) : 0}%` }} />
                </div>
                <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                  {a.echeances.map((e) => (
                    <span key={e.id} className={`rounded px-1.5 py-0.5 border ${e.statut === "paye" ? "line-through opacity-60" : ""}`}>
                      {MOIS[e.mois - 1].slice(0, 3)} {e.annee} · {fmt(e.montant)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle avance / prêt</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Salarié</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger><SelectValue placeholder="Choisir un salarié" /></SelectTrigger>
                <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as "avance" | "pret")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="avance">Avance</SelectItem><SelectItem value="pret">Prêt</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Montant (FCFA)</Label><Input type="number" min={1} value={montant} onChange={(e) => setMontant(e.target.value)} /></div>
              <div className="space-y-1"><Label>Mensualités</Label><Input type="number" min={1} max={36} value={nbMensualites} onChange={(e) => setNbMensualites(e.target.value)} /></div>
              <div className="space-y-1"><Label>Date d'octroi</Label><Input type="date" value={dateOctroi} onChange={(e) => setDateOctroi(e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label>Motif (optionnel)</Label><Input value={motif} onChange={(e) => setMotif(e.target.value)} maxLength={200} /></div>
            <Button className="w-full" disabled={busy || !employeeId || !montant} onClick={submit}>{busy ? "Enregistrement…" : "Enregistrer et générer l'échéancier"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
