import { useMemo, useState } from "react";
import type { Employee, PayrollParams, Entreprise } from "@/lib/payroll";
import { calculerPaie, fmt, MOIS } from "@/lib/payroll";
import {
  versLigne, livreDePaie, resumeCotisations, journalDePaie, livreCSV, cotisationsCSV, journalCSV,
  type ArchiveMois, type LigneBulletin, type Organisme,
} from "@/lib/etats";
import { livreHTML, cotisationsHTML, journalHTML } from "@/lib/etatsHtml";
import { ouvrirImpression, telechargerTexte } from "@/lib/impression";
import { inputClass } from "./Modal";

interface EtatsPageProps {
  employees: Employee[];
  params: PayrollParams;
  entreprise: Entreprise;
  archives: ArchiveMois[];
}

type Onglet = "livre" | "cotisations" | "journal";

const ONGLETS: { id: Onglet; label: string; desc: string }[] = [
  { id: "livre", label: "📒 Livre de paie", desc: "Toutes les rubriques, salarié par salarié" },
  { id: "cotisations", label: "🏛️ Cotisations", desc: "Montants à déclarer par organisme" },
  { id: "journal", label: "📗 Journal comptable", desc: "Écritures SYSCOHADA de la période" },
];

const ORG_LIB: Record<Organisme, string> = { DGID: "Impôts (DGID)", IPRES: "IPRES", CSS: "CSS", IPM: "IPM" };
const pct = (n: number) => (n ? `${(n * 100).toFixed(2).replace(".", ",")} %` : "—");
const cellF = (n: number) => (Math.round(n || 0) === 0 ? "" : fmt(n));

export function EtatsPage({ employees, params, entreprise, archives }: EtatsPageProps) {
  const now = new Date();
  const [mois, setMois] = useState(now.getMonth());
  const [annee, setAnnee] = useState(now.getFullYear());
  const [onglet, setOnglet] = useState<Onglet>("livre");
  const [bloque, setBloque] = useState(false);

  const archive = archives.find((a) => a.mois === mois && a.annee === annee);
  const finMois = new Date(annee, mois + 1, 0);
  const periode = `${MOIS[mois]} ${annee}`;
  const codePeriode = `${String(mois + 1).padStart(2, "0")}-${annee}`;
  const dateEcriture = finMois.toLocaleDateString("fr-FR");
  const paramsPeriode = archive?.params || params;

  // Mois clôturé : bulletins figés. Sinon : calcul provisoire avec les données actuelles des salariés.
  const lignes: LigneBulletin[] = useMemo(
    () => archive ? archive.bulletins : employees.map((e) => versLigne(e, calculerPaie(e, params, finMois))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [archive, employees, params, mois, annee],
  );

  const livre = useMemo(() => livreDePaie(lignes), [lignes]);
  const resume = useMemo(() => resumeCotisations(lignes, paramsPeriode), [lignes, paramsPeriode]);
  const journal = useMemo(() => journalDePaie(lignes), [lignes]);
  const equilibre = journal.every((e) => e.totalDebit === e.totalCredit);

  const annees = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i);

  const imprimer = () => {
    const html = onglet === "livre" ? livreHTML(lignes, periode, entreprise)
      : onglet === "cotisations" ? cotisationsHTML(lignes, paramsPeriode, periode, entreprise)
      : journalHTML(lignes, periode, dateEcriture, entreprise);
    setBloque(!ouvrirImpression(html));
  };
  const exporter = () => {
    if (onglet === "livre") telechargerTexte(livreCSV(lignes, periode), `livre_de_paie_${codePeriode}.csv`);
    else if (onglet === "cotisations") telechargerTexte(cotisationsCSV(resume, periode), `cotisations_${codePeriode}.csv`);
    else telechargerTexte(journalCSV(journal, codePeriode, dateEcriture), `journal_paie_${codePeriode}.csv`);
  };

  return (
    <div>
      {/* En-tête */}
      <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
        <div>
          <h1 className="text-foreground text-xl font-extrabold mb-1">États & Comptabilité</h1>
          <div className="text-muted-foreground text-[11px]">Livre de paie · déclarations IPRES / CSS / DGID / IPM · journal SYSCOHADA</div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select aria-label="Mois" value={mois} onChange={(e) => setMois(+e.target.value)} className={`${inputClass} py-2 !w-auto`}>
            {MOIS.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select aria-label="Année" value={annee} onChange={(e) => setAnnee(+e.target.value)} className={`${inputClass} py-2 !w-auto`}>
            {annees.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <button onClick={exporter} disabled={lignes.length === 0}
            className="px-3 py-2 bg-transparent border border-senpaie-blue text-senpaie-blue rounded-lg font-bold text-[12px] cursor-pointer whitespace-nowrap disabled:opacity-40">
            📥 Export CSV
          </button>
          <button onClick={imprimer} disabled={lignes.length === 0}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-[12px] cursor-pointer border-none whitespace-nowrap disabled:opacity-40">
            🖨️ Imprimer / PDF
          </button>
        </div>
      </div>

      {/* Statut de la période */}
      <div className={`mb-4 px-3.5 py-2.5 rounded-lg border text-[11px] ${archive
        ? "bg-primary/10 border-primary text-primary"
        : "bg-senpaie-yellow/10 border-senpaie-yellow text-senpaie-yellow"}`}>
        {archive
          ? <>🔒 <strong>{periode} est clôturé</strong> : les états reprennent les bulletins figés à la clôture ({lignes.length} bénéficiaire{lignes.length > 1 ? "s" : ""}).</>
          : <>⏳ <strong>{periode} n'est pas clôturé</strong> : calcul provisoire avec les données actuelles des salariés. Clôturez le mois depuis le tableau de bord pour figer les états.</>}
      </div>
      {bloque && (
        <div className="mb-4 px-3.5 py-2.5 rounded-lg border border-destructive text-destructive text-[11px]">
          Votre navigateur a bloqué la fenêtre d'impression. Autorisez les fenêtres pop-up pour ce site puis réessayez.
        </div>
      )}

      {/* Onglets */}
      <div className="flex flex-wrap gap-2 mb-4" role="tablist">
        {ONGLETS.map((o) => (
          <button key={o.id} role="tab" aria-selected={onglet === o.id} onClick={() => setOnglet(o.id)}
            className={`px-4 py-2 rounded-lg text-[12px] font-bold cursor-pointer border transition-colors text-left ${onglet === o.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:bg-secondary"}`}>
            {o.label}
            <span className={`block text-[10px] font-normal ${onglet === o.id ? "opacity-80" : "opacity-70"}`}>{o.desc}</span>
          </button>
        ))}
      </div>

      {lignes.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-10 text-center text-muted-foreground">
          Aucun salarié pour cette période.
        </div>
      ) : (
        <>
          {/* ── Livre de paie ── */}
          {onglet === "livre" && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="border-collapse text-xs min-w-full">
                <thead>
                  <tr className="bg-background">
                    <th className="sticky left-0 z-10 bg-background py-2.5 px-3 text-left text-muted-foreground font-semibold border-b border-border min-w-[200px]">Rubrique</th>
                    {lignes.map((l) => (
                      <th key={l.matricule} className="py-2.5 px-3 text-right text-muted-foreground font-semibold border-b border-border whitespace-nowrap">
                        <div className="text-foreground">{l.prenom} {l.nom}</div>
                        <div className="text-[10px] font-normal">{l.matricule} · {l.contrat}</div>
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-right text-primary font-bold border-b border-border">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {livre.map((r) => {
                    const t = r.rubrique.type;
                    const ligneCls = t === "net" ? "bg-primary/10 font-extrabold text-primary"
                      : t === "total" ? "bg-secondary font-bold text-foreground"
                      : t === "patronal" ? "text-senpaie-yellow" : t === "retenue" ? "text-destructive" : "text-foreground";
                    return (
                      <tr key={r.rubrique.code} className={`border-b border-border ${ligneCls}`}>
                        <td className={`sticky left-0 z-10 py-1.5 px-3 whitespace-nowrap ${t === "net" || t === "total" ? "bg-secondary" : "bg-card"}`}>
                          <span className="text-muted-foreground text-[10px] mr-2">{r.rubrique.code}</span>{r.rubrique.libelle}
                        </td>
                        {r.valeurs.map((v, i) => <td key={i} className="py-1.5 px-3 text-right whitespace-nowrap">{cellF(v)}</td>)}
                        <td className="py-1.5 px-3 text-right whitespace-nowrap font-bold">{cellF(r.total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Résumé des cotisations ── */}
          {onglet === "cotisations" && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {(["DGID", "IPRES", "CSS", "IPM"] as Organisme[]).map((org) => (
                  <div key={org} className="bg-card border border-border rounded-lg p-3">
                    <div className="text-muted-foreground text-[10px] uppercase">{ORG_LIB[org]} à reverser</div>
                    <div className="text-foreground font-extrabold text-sm mt-1">{fmt(resume.sousTotaux[org].total)} F</div>
                    <div className="text-muted-foreground text-[10px] mt-0.5">
                      sal. {fmt(resume.sousTotaux[org].salarial)} · pat. {fmt(resume.sousTotaux[org].patronal)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-background">
                      {["Code", "Rubrique", "Taux sal.", "Taux pat.", "Assiette", "Base", "Part salariale", "Part patronale", "Total", "Effectif"].map((hd, i) => (
                        <th key={hd} className={`py-2.5 px-3 text-muted-foreground font-semibold border-b border-border whitespace-nowrap ${i < 2 ? "text-left" : "text-right"}`}>{hd}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(["DGID", "IPRES", "CSS", "IPM"] as Organisme[]).map((org) => (
                      <FragmentOrganisme key={org} org={org} resume={resume} />
                    ))}
                    <tr className="bg-primary text-primary-foreground font-extrabold">
                      <td className="py-2.5 px-3" colSpan={6}>TOTAL GÉNÉRAL DES COTISATIONS</td>
                      <td className="py-2.5 px-3 text-right">{fmt(resume.total.salarial)}</td>
                      <td className="py-2.5 px-3 text-right">{fmt(resume.total.patronal)}</td>
                      <td className="py-2.5 px-3 text-right">{fmt(resume.total.total)}</td>
                      <td className="py-2.5 px-3 text-right">{resume.effectif}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── Journal comptable ── */}
          {onglet === "journal" && (
            <>
              <div className={`mb-3 text-[11px] ${equilibre ? "text-primary" : "text-destructive"}`}>
                {equilibre ? "✓ Toutes les écritures sont équilibrées (débit = crédit)." : "⚠ Écriture déséquilibrée : vérifiez les données."}
                <span className="text-muted-foreground"> Date d'écriture : {dateEcriture}. Plan de comptes repris du modèle SENEXCELPAIE, à valider par votre expert-comptable.</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-background">
                      {["Compte", "Libellé", "Débit", "Crédit"].map((hd, i) => (
                        <th key={hd} className={`py-2.5 px-3 text-muted-foreground font-semibold border-b border-border ${i < 2 ? "text-left" : "text-right"}`}>{hd}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {journal.map((e) => (
                      <EcritureRows key={e.numero} e={e} />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function FragmentOrganisme({ org, resume }: { org: Organisme; resume: ReturnType<typeof resumeCotisations> }) {
  const st = resume.sousTotaux[org];
  return (
    <>
      {resume.lignes.filter((l) => l.organisme === org).map((l, i) => (
        <tr key={l.code} className={`border-b border-border ${i % 2 === 0 ? "bg-card" : "bg-senpaie-alt-row"}`}>
          <td className="py-2 px-3 text-muted-foreground">{l.code}</td>
          <td className="py-2 px-3 text-foreground font-semibold whitespace-nowrap">{l.libelle}</td>
          <td className="py-2 px-3 text-right">{pct(l.tauxSalarial)}</td>
          <td className="py-2 px-3 text-right">{pct(l.tauxPatronal)}</td>
          <td className="py-2 px-3 text-right">{cellF(l.assiette)}</td>
          <td className="py-2 px-3 text-right">{cellF(l.base)}</td>
          <td className="py-2 px-3 text-right text-destructive">{cellF(l.montantSalarial)}</td>
          <td className="py-2 px-3 text-right text-senpaie-yellow">{cellF(l.montantPatronal)}</td>
          <td className="py-2 px-3 text-right font-bold">{cellF(l.montantSalarial + l.montantPatronal)}</td>
          <td className="py-2 px-3 text-right text-muted-foreground">{l.effectif || ""}</td>
        </tr>
      ))}
      <tr className="border-b border-border bg-secondary font-bold">
        <td />
        <td className="py-2 px-3 text-senpaie-blue" colSpan={5}>Total {ORG_LIB[org]}</td>
        <td className="py-2 px-3 text-right">{cellF(st.salarial)}</td>
        <td className="py-2 px-3 text-right">{cellF(st.patronal)}</td>
        <td className="py-2 px-3 text-right text-senpaie-blue">{cellF(st.total)}</td>
        <td />
      </tr>
    </>
  );
}

function EcritureRows({ e }: { e: ReturnType<typeof journalDePaie>[number] }) {
  return (
    <>
      <tr className="bg-senpaie-purple/10 border-b border-border">
        <td colSpan={4} className="py-2 px-3 text-senpaie-purple font-bold">Écriture {e.numero} — {e.libelle}</td>
      </tr>
      {e.lignes.map((l) => (
        <tr key={`${l.compte}-${l.libelle}`} className="border-b border-border bg-card">
          <td className={`py-1.5 px-3 font-mono ${l.credit ? "pl-8" : ""}`}>{l.compte}</td>
          <td className={`py-1.5 px-3 ${l.credit ? "pl-8 text-muted-foreground" : "text-foreground"}`}>{l.libelle}</td>
          <td className="py-1.5 px-3 text-right">{cellF(l.debit)}</td>
          <td className="py-1.5 px-3 text-right">{cellF(l.credit)}</td>
        </tr>
      ))}
      <tr className="border-b-2 border-border bg-secondary font-bold">
        <td />
        <td className="py-1.5 px-3">Total écriture {e.numero}</td>
        <td className="py-1.5 px-3 text-right">{fmt(e.totalDebit)}</td>
        <td className="py-1.5 px-3 text-right">{fmt(e.totalCredit)}</td>
      </tr>
    </>
  );
}

export default EtatsPage;
