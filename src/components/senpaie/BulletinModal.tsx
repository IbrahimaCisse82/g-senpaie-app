import { useState, useMemo, useRef, useEffect } from "react";
import type { Employee, PayrollParams, PayrollResult, Entreprise } from "@/lib/payroll";
import { calculerPaie, getAnciennete, fmt, MOIS } from "@/lib/payroll";
import { genererBulletinParTemplate, BULLETIN_TEMPLATES, type BulletinTemplateId } from "@/lib/bulletinTemplates";
import { Modal } from "./Modal";

interface BulletinModalProps {
  emp: Employee;
  params: PayrollParams;
  entreprise: Entreprise;
  onClose: () => void;
}

function exportBulletinCSV(emp: Employee, p: PayrollResult, mois: number, annee: number) {
  const rows = [
    ["Bulletin de Paie", `${MOIS[mois]} ${annee}`],
    ["Employé", `${emp.prenom} ${emp.nom}`],
    ["Matricule", emp.matricule],
    ["Fonction", emp.fonction],
    [],
    ["Élément", "Montant (FCFA)"],
    ["Salaire de base", Math.round(p.salaireBase)],
    ["Sursalaire", Math.round(p.sursalaire)],
    ["Prime ancienneté", Math.round(p.primeAnc)],
    ["Heures supplémentaires", Math.round(p.totalHS)],
    ["Retenue absences", -Math.round(p.retAbsence)],
    ["Indemnité maladie", Math.round(p.indMaladie)],
    ["SALAIRE BRUT", Math.round(p.brut)],
    [],
    ["IR", -Math.round(p.ir)],
    ["TRIMF", -Math.round(p.trimf)],
    ["IPRES RG salarié", -Math.round(p.ipresRG_s)],
    ["IPRES RC salarié", -Math.round(p.ipresRC_s)],
    ["IPM salarié", -Math.round(p.ipm_s)],
    ["Total retenues", -Math.round(p.totalRet)],
    [],
    ["Transport", Math.round(p.transport)],
    ["Prime panier", Math.round(p.primePanier)],
    ["Indemnité kilométrique", Math.round(p.indKilometrique)],
    ["Avances & retenues", -Math.round(p.totalAvances)],
    [],
    ["NET À PAYER", Math.round(p.net)],
    [],
    ["Charges patronales", Math.round(p.chargesPat)],
    ["Masse salariale", Math.round(p.masse)],
  ];

  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(";")).join("\n");
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bulletin_${emp.matricule}_${MOIS[mois]}_${annee}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function BulletinModal({ emp, params, entreprise, onClose }: BulletinModalProps) {
  const now = new Date();
  const [mois, setMois] = useState(now.getMonth());
  const [annee, setAnnee] = useState(now.getFullYear());
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const refDate = new Date(annee, mois + 1, 0);
  const p = calculerPaie(emp, params, refDate);
  const anc = getAnciennete(emp.dateEntree, refDate);
  const periodeLabel = `${MOIS[mois]} ${annee}`;
  const years = Array.from({ length: 10 }, (_, i) => now.getFullYear() - i);
  const templateId = (params.bulletinTemplate || "classique") as BulletinTemplateId;
  const currentTemplate = BULLETIN_TEMPLATES.find(t => t.id === templateId);

  const previewHtml = useMemo(() => {
    const html = genererBulletinParTemplate(templateId, emp, p, mois, annee, anc, entreprise);
    // Remove the print bar for the preview and hide signatures for compact view
    return html.replace(/class="no-print"[^>]*>[\s\S]*?<\/div>/, '');
  }, [templateId, emp, p, mois, annee, anc, entreprise]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(previewHtml);
    doc.close();
  }, [previewHtml]);

  const openPDF = () => {
    const html = genererBulletinParTemplate(templateId, emp, p, mois, annee, anc, entreprise);
    const win = window.open("", "_blank");
    if (!win) { alert("Veuillez autoriser les popups pour ce site."); return; }
    win.document.write(html);
    win.document.close();
  };

  return (
    <Modal title="📄 Bulletin de Paie" onClose={onClose} width={780}>
      {/* Période + Template + Boutons */}
      <div className="flex gap-2 items-center mb-3 p-3 bg-muted/50 rounded-lg flex-wrap">
        <div className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">Période :</div>
        <select value={mois} onChange={(e) => setMois(+e.target.value)} className="py-1.5 px-2.5 bg-background border border-border rounded-lg text-foreground text-[13px] font-mono outline-none">
          {MOIS.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select value={annee} onChange={(e) => setAnnee(+e.target.value)} className="py-1.5 px-2.5 bg-background border border-border rounded-lg text-foreground text-[13px] font-mono outline-none w-24">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={() => exportBulletinCSV(emp, p, mois, annee)} className="px-3 py-2 bg-transparent border border-primary text-primary rounded-lg font-bold text-[12px] cursor-pointer whitespace-nowrap">
          📥 CSV
        </button>
        <button onClick={openPDF} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-bold text-[12px] cursor-pointer border-none whitespace-nowrap">
          ⬇️ PDF
        </button>
      </div>

      {/* Template indicator */}
      {currentTemplate && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-muted/30 rounded-lg border border-border">
          <span className="text-lg">{currentTemplate.icon}</span>
          <div>
            <div className="text-foreground text-xs font-semibold">{currentTemplate.name}</div>
            <div className="text-muted-foreground text-[10px]">{currentTemplate.description}</div>
          </div>
          <div className="ml-auto flex gap-1">
            <div className="w-3 h-3 rounded-full" style={{ background: currentTemplate.previewColors.header }} />
            <div className="w-3 h-3 rounded-full" style={{ background: currentTemplate.previewColors.accent }} />
          </div>
        </div>
      )}

      {/* Live preview iframe */}
      <div className="border border-border rounded-lg overflow-hidden bg-white" style={{ height: 520 }}>
        <iframe
          ref={iframeRef}
          title="Aperçu bulletin"
          className="w-full h-full border-0"
          sandbox="allow-same-origin"
          style={{ transform: "scale(0.62)", transformOrigin: "top left", width: "161.3%", height: "161.3%" }}
        />
      </div>

      <div className="mt-3 px-3.5 py-2 bg-muted/50 rounded-lg border border-border text-muted-foreground text-[11px]">
        💡 Cliquez <strong>⬇️ PDF</strong> pour ouvrir dans un nouvel onglet, puis <strong>Ctrl+P</strong> → "Enregistrer en PDF". Le template peut être changé dans <strong>Paramètres</strong>.
      </div>
    </Modal>
  );
}

export default BulletinModal;
