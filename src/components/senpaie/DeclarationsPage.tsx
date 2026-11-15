import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEntrepriseCtx } from "@/hooks/useEntrepriseContext";
import { calculerDADS, moisClotures, completerPaie, type BulletinArchive, type LigneDADS } from "@/lib/dads";
import { regularisationIR } from "@/lib/regularisation";
import { escapeHtml } from "@/lib/utils";
import type { Employee, PayrollParams, PayrollResult, Entreprise } from "@/lib/payroll";
import { calculerPaie, fmt, MOIS } from "@/lib/payroll";
import { exportHtmlToPdf, exportRowsToCsv } from "@/lib/pdfExport";
import type { PayrollSnapshot } from "@/hooks/useSupabaseData";

interface Props {
  employees: Employee[];
  params: PayrollParams;
  entreprise: Entreprise;
  history: PayrollSnapshot[];
  /** Enregistre une fiche (utilisé pour reporter la régularisation IR sur le bulletin du mois) */
  onSaveEmployee?: (emp: Employee) => Promise<void>;
  canEdit?: boolean;
}

type SubTab = "ipres" | "impots" | "livre" | "dads" | "regul";
type Ligne = { emp: Employee; p: PayrollResult };
const pc = (t: number) => `${String(Math.round(t * 1000) / 10).replace(".", ",")} %`;

export function DeclarationsPage({ employees, params, entreprise, onSaveEmployee, canEdit = false }: Props) {
  const now = new Date();
  const [tab, setTab] = useState<SubTab>("ipres");
  const [mois, setMois] = useState(now.getMonth());
  const [annee, setAnnee] = useState(now.getFullYear());
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const { entrepriseId } = useEntrepriseCtx();
  const [bulletinsAnnee, setBulletinsAnnee] = useState<BulletinArchive[]>([]);
  useEffect(() => {
    if (!entrepriseId) return;
    supabase.from("bulletins_mois").select("matricule, nom_complet, mois, annee, brut, data")
      .eq("entreprise_id", entrepriseId).eq("annee", annee)
      .then(({ data }) => setBulletinsAnnee((data ?? []) as unknown as BulletinArchive[]));
  }, [entrepriseId, annee]);

  const refDate = new Date(annee, mois + 1, 0);
  // Mois clôturé : on déclare les bulletins figés (les fiches ont pu changer depuis, les variables ont été remises à zéro).
  // Mois ouvert : calcul provisoire sur les fiches actuelles.
  const bulletinsDuMois = useMemo(() => bulletinsAnnee.filter((b) => b.mois === mois && b.annee === annee), [bulletinsAnnee, mois, annee]);
  const moisEstCloture = bulletinsDuMois.length > 0;
  const rows: Ligne[] = useMemo(() => {
    if (!moisEstCloture) return employees.map((e) => ({ emp: e, p: calculerPaie(e, params, refDate) }));
    const modele = calculerPaie({ ...(employees[0] ?? ({} as Employee)), salaireBase: 0, sursalaire: 0 } as Employee, params, refDate);
    return bulletinsDuMois.map((b) => {
      const e = employees.find((x) => x.matricule === b.matricule);
      const [prenom, ...reste] = (b.nom_complet || "").split(" ");
      const emp = e ?? ({ matricule: b.matricule, prenom, nom: reste.join(" "), fonction: "", statut: "" } as Employee);
      return { emp, p: completerPaie(b.data, modele) };
    }).sort((a, b) => a.emp.matricule.localeCompare(b.emp.matricule));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, params, mois, annee, bulletinsDuMois, moisEstCloture]);

  const totaux = rows.reduce(
    (s, r) => ({
      brut: s.brut + r.p.brut,
      ipresRG_s: s.ipresRG_s + r.p.ipresRG_s,
      ipresRG_p: s.ipresRG_p + r.p.ipresRG_p,
      ipresRC_s: s.ipresRC_s + r.p.ipresRC_s,
      ipresRC_p: s.ipresRC_p + r.p.ipresRC_p,
      css_af: s.css_af + r.p.css_af,
      css_at: s.css_at + r.p.css_at,
      ir: s.ir + r.p.ir + (r.p.regulIR || 0),
      trimf: s.trimf + r.p.trimf,
      brs: s.brs + (r.p.brs || 0),
      cfce: s.cfce + r.p.cfce,
      ipm_s: s.ipm_s + r.p.ipm_s,
      chargesPat: s.chargesPat + r.p.chargesPat,
      net: s.net + r.p.net,
    }),
    { brut: 0, ipresRG_s: 0, ipresRG_p: 0, ipresRC_s: 0, ipresRC_p: 0, css_af: 0, css_at: 0, ir: 0, trimf: 0, brs: 0, cfce: 0, ipm_s: 0, chargesPat: 0, net: 0 }
  );
  // Taux réellement paramétrés (affichés dans les en-têtes des états)
  const tRG = params.IPRES_RG.taux, tRC = params.IPRES_RCC.taux;
  const libelles = {
    rgS: `RG salarié (${pc(tRG * params.IPRES_RG.tauxSalarial)})`, rgP: `RG patronal (${pc(tRG * params.IPRES_RG.tauxPatronal)})`,
    rcS: `RC salarié (${pc(tRC * params.IPRES_RCC.tauxSalarial)})`, rcP: `RC patronal (${pc(tRC * params.IPRES_RCC.tauxPatronal)})`,
    af: `CSS AF (${pc(params.CSS_AF.taux)})`, at: `CSS AT (${pc(params.CSS_AT.taux)})`,
  };
  const etat = moisEstCloture ? "bulletins clôturés" : "provisoire, mois non clôturé";

  // ── Export IPRES Excel
  const exportIPRESExcel = () => {
    const header = ["Matricule", "Nom", "Prénom", "Statut", "Salaire brut", "Base IPRES RG", libelles.rgS, libelles.rgP, "Base IPRES RC", libelles.rcS, libelles.rcP, "Base CSS", libelles.af, libelles.at];
      const body = rows.map((r) => [
        r.emp.matricule, r.emp.nom, r.emp.prenom, r.emp.statut,
        Math.round(r.p.brut),
        Math.round(r.p.baseIPRES_RG),
        Math.round(r.p.ipresRG_s), Math.round(r.p.ipresRG_p),
        Math.round(r.p.baseIPRES_RC),
        Math.round(r.p.ipresRC_s), Math.round(r.p.ipresRC_p),
        Math.round(r.p.baseCSS),
        Math.round(r.p.css_af), Math.round(r.p.css_at),
      ]);
    const totLine = ["TOTAUX", "", "", "", Math.round(totaux.brut), "", Math.round(totaux.ipresRG_s), Math.round(totaux.ipresRG_p), "", Math.round(totaux.ipresRC_s), Math.round(totaux.ipresRC_p), "", Math.round(totaux.css_af), Math.round(totaux.css_at)];
    const entete = [[`Déclaration IPRES / CSS — ${MOIS[mois]} ${annee} (${etat})`], [entreprise.nom || "", entreprise.ninea ? `NINEA ${entreprise.ninea}` : ""], []];
    exportRowsToCsv([...entete, header, ...body, [], totLine], `declaration_ipres_${MOIS[mois]}_${annee}.csv`);
  };

  const exportIPRESPdf = async () => {
    const html = `<div class="page" style="font-family:Arial,sans-serif;padding:30px;color:#111;background:#fff;width:734px;">
      <div style="text-align:center;margin-bottom:25px;">
        <h1 style="margin:0;font-size:18px;">DÉCLARATION MENSUELLE IPRES / CSS</h1>
        <div style="font-size:11px;margin-top:5px;">${escapeHtml(entreprise.nom || "—")} ${entreprise.ninea ? "· NINEA " + entreprise.ninea : ""}</div>
        <div style="font-size:13px;font-weight:bold;margin-top:5px;">Période : ${MOIS[mois]} ${annee}</div>
        <div style="font-size:9px;margin-top:3px;color:#555;">État établi sur ${etat} · IPRES RG ${pc(tRG)} · RCC ${pc(tRC)} · CSS AF ${pc(params.CSS_AF.taux)} · CSS AT ${pc(params.CSS_AT.taux)}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:9px;">
        <thead><tr style="background:#f0f0f0;font-weight:bold;">
          <th style="border:1px solid #999;padding:4px;">Matricule</th>
          <th style="border:1px solid #999;padding:4px;">Nom & Prénom</th>
          <th style="border:1px solid #999;padding:4px;">Brut</th>
          <th style="border:1px solid #999;padding:4px;">RG sal.</th>
          <th style="border:1px solid #999;padding:4px;">RG pat.</th>
          <th style="border:1px solid #999;padding:4px;">RC sal.</th>
          <th style="border:1px solid #999;padding:4px;">RC pat.</th>
          <th style="border:1px solid #999;padding:4px;">CSS AF</th>
          <th style="border:1px solid #999;padding:4px;">CSS AT</th>
        </tr></thead><tbody>
        ${rows.map((r) => `<tr>
          <td style="border:1px solid #999;padding:3px;">${escapeHtml(r.emp.matricule)}</td>
          <td style="border:1px solid #999;padding:3px;">${escapeHtml(r.emp.nom)} ${escapeHtml(r.emp.prenom)}</td>
          <td style="border:1px solid #999;padding:3px;text-align:right;">${fmt(r.p.brut)}</td>
          <td style="border:1px solid #999;padding:3px;text-align:right;">${fmt(r.p.ipresRG_s)}</td>
          <td style="border:1px solid #999;padding:3px;text-align:right;">${fmt(r.p.ipresRG_p)}</td>
          <td style="border:1px solid #999;padding:3px;text-align:right;">${fmt(r.p.ipresRC_s)}</td>
          <td style="border:1px solid #999;padding:3px;text-align:right;">${fmt(r.p.ipresRC_p)}</td>
          <td style="border:1px solid #999;padding:3px;text-align:right;">${fmt(r.p.css_af)}</td>
          <td style="border:1px solid #999;padding:3px;text-align:right;">${fmt(r.p.css_at)}</td>
        </tr>`).join("")}
        <tr style="background:#f0f0f0;font-weight:bold;">
          <td colspan="2" style="border:1px solid #999;padding:4px;">TOTAUX</td>
          <td style="border:1px solid #999;padding:4px;text-align:right;">${fmt(totaux.brut)}</td>
          <td style="border:1px solid #999;padding:4px;text-align:right;">${fmt(totaux.ipresRG_s)}</td>
          <td style="border:1px solid #999;padding:4px;text-align:right;">${fmt(totaux.ipresRG_p)}</td>
          <td style="border:1px solid #999;padding:4px;text-align:right;">${fmt(totaux.ipresRC_s)}</td>
          <td style="border:1px solid #999;padding:4px;text-align:right;">${fmt(totaux.ipresRC_p)}</td>
          <td style="border:1px solid #999;padding:4px;text-align:right;">${fmt(totaux.css_af)}</td>
          <td style="border:1px solid #999;padding:4px;text-align:right;">${fmt(totaux.css_at)}</td>
        </tr>
      </tbody></table>
      <div style="margin-top:25px;display:flex;justify-content:space-between;font-size:11px;">
        <div><b>Total à verser IPRES :</b> ${fmt(totaux.ipresRG_s + totaux.ipresRG_p + totaux.ipresRC_s + totaux.ipresRC_p)} FCFA</div>
        <div><b>Total à verser CSS :</b> ${fmt(totaux.css_af + totaux.css_at)} FCFA</div>
      </div>
      <div style="margin-top:40px;font-size:10px;">Fait à ${escapeHtml(entreprise.adresse || "Dakar")}, le ${new Date().toLocaleDateString("fr-FR")}<br/><br/>Signature & cachet de l'employeur</div>
    </div>`;
    await exportHtmlToPdf(html, `declaration_ipres_${MOIS[mois]}_${annee}.pdf`);
  };

  // ── Livre de paie PDF (chronologique conforme art. L.116)
  const exportLivrePaie = async () => {
    const html = `<div class="page" style="font-family:Arial,sans-serif;padding:25px;color:#111;background:#fff;width:744px;">
      <div style="text-align:center;margin-bottom:20px;">
        <h1 style="margin:0;font-size:17px;">LIVRE DE PAIE</h1>
        <div style="font-size:10px;">Registre obligatoire — Art. L.116 du Code du Travail (Sénégal)</div>
        <div style="font-size:12px;margin-top:6px;"><b>${escapeHtml(entreprise.nom || "—")}</b>${entreprise.ninea ? " · NINEA " + entreprise.ninea : ""}${entreprise.rccm ? " · RCCM " + entreprise.rccm : ""}</div>
        <div style="font-size:12px;font-weight:bold;margin-top:4px;">Période : ${MOIS[mois]} ${annee}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:8.5px;">
        <thead><tr style="background:#222;color:#fff;">
          <th style="border:1px solid #444;padding:4px;">Mat.</th>
          <th style="border:1px solid #444;padding:4px;">Nom & Prénom</th>
          <th style="border:1px solid #444;padding:4px;">Emploi</th>
          <th style="border:1px solid #444;padding:4px;">Brut</th>
          <th style="border:1px solid #444;padding:4px;">IR+TRIMF+BRS</th>
          <th style="border:1px solid #444;padding:4px;">Cot. sal.</th>
          <th style="border:1px solid #444;padding:4px;">Net payé</th>
          <th style="border:1px solid #444;padding:4px;">Charges pat.</th>
          <th style="border:1px solid #444;padding:4px;">Émargement</th>
        </tr></thead><tbody>
        ${rows.map((r) => `<tr>
          <td style="border:1px solid #999;padding:3px;">${escapeHtml(r.emp.matricule)}</td>
          <td style="border:1px solid #999;padding:3px;">${escapeHtml(r.emp.nom)} ${escapeHtml(r.emp.prenom)}</td>
          <td style="border:1px solid #999;padding:3px;">${escapeHtml(r.emp.fonction)}</td>
          <td style="border:1px solid #999;padding:3px;text-align:right;">${fmt(r.p.brut)}</td>
          <td style="border:1px solid #999;padding:3px;text-align:right;">${fmt(r.p.ir + (r.p.regulIR || 0) + r.p.trimf + (r.p.brs || 0))}</td>
          <td style="border:1px solid #999;padding:3px;text-align:right;">${fmt(r.p.ipresRG_s + r.p.ipresRC_s + r.p.ipm_s)}</td>
          <td style="border:1px solid #999;padding:3px;text-align:right;font-weight:bold;">${fmt(r.p.net)}</td>
          <td style="border:1px solid #999;padding:3px;text-align:right;">${fmt(r.p.chargesPat)}</td>
          <td style="border:1px solid #999;padding:3px;width:80px;"></td>
        </tr>`).join("")}
        <tr style="background:#eee;font-weight:bold;">
          <td colspan="3" style="border:1px solid #999;padding:4px;">TOTAUX (${rows.length} salariés)</td>
          <td style="border:1px solid #999;padding:4px;text-align:right;">${fmt(totaux.brut)}</td>
          <td style="border:1px solid #999;padding:4px;text-align:right;">${fmt(totaux.ir + totaux.trimf + totaux.brs)}</td>
          <td style="border:1px solid #999;padding:4px;text-align:right;">${fmt(totaux.ipresRG_s + totaux.ipresRC_s + totaux.ipm_s)}</td>
          <td style="border:1px solid #999;padding:4px;text-align:right;">${fmt(totaux.net)}</td>
          <td style="border:1px solid #999;padding:4px;text-align:right;">${fmt(totaux.chargesPat)}</td>
          <td style="border:1px solid #999;"></td>
        </tr>
      </tbody></table>
      <div style="margin-top:30px;font-size:10px;">Arrêté à la somme de <b>${fmt(totaux.net)} FCFA</b> (net) · Charges patronales <b>${fmt(totaux.chargesPat)} FCFA</b> · État établi sur ${etat}<br/><br/>Fait à ${escapeHtml(entreprise.adresse || "Dakar")}, le ${new Date().toLocaleDateString("fr-FR")}<br/><br/>Signature de l'employeur</div>
    </div>`;
    await exportHtmlToPdf(html, `livre_paie_${MOIS[mois]}_${annee}.pdf`, { orientation: "landscape" });
  };

  // ── DADS annuelle : cumul des bulletins réellement clôturés (aucune extrapolation)
  const dadsRows: LigneDADS[] = useMemo(() => calculerDADS(bulletinsAnnee, employees, annee), [bulletinsAnnee, employees, annee]);
  const dadsMois = useMemo(() => moisClotures(bulletinsAnnee, annee), [bulletinsAnnee, annee]);

  const exportDADS = () => {
    const header = ["Matricule", "Nom", "Prénom", "Date entrée", "Date sortie", "Mois déclarés", "Brut annuel", "IR annuel (régularisation comprise)", "TRIMF annuelle", "BRS annuelle", "Cotis IPRES (salarié)", "CSS (patronal)", "CFCE (employeur)", "Net annuel"];
    const body = dadsRows.map((r) => [
      r.emp.matricule, r.emp.nom, r.emp.prenom, r.emp.dateEntree, r.emp.dateSortie || "",
      r.moisPayes.length, Math.round(r.brutAnnuel), Math.round(r.irAnnuel), Math.round(r.trimfAnnuel), Math.round(r.brsAnnuel),
      Math.round(r.ipresAnnuel), Math.round(r.cssAnnuel), Math.round(r.cfceAnnuel), Math.round(r.netAnnuel),
    ]);
    const sum = (f: (r: LigneDADS) => number) => Math.round(dadsRows.reduce((s, r) => s + f(r), 0));
    const tot = ["TOTAUX", "", "", "", "", "", sum((r) => r.brutAnnuel), sum((r) => r.irAnnuel), sum((r) => r.trimfAnnuel), sum((r) => r.brsAnnuel), sum((r) => r.ipresAnnuel), sum((r) => r.cssAnnuel), sum((r) => r.cfceAnnuel), sum((r) => r.netAnnuel)];
    const entete = [[`État annuel des salaires ${annee} — ${dadsMois.length}/12 mois clôturés`], [entreprise.nom || "", entreprise.ninea ? `NINEA ${entreprise.ninea}` : ""], []];
    exportRowsToCsv([...entete, header, ...body, [], tot], `dads_${annee}.csv`);
  };

  // ── Impôts et taxes sur salaires du mois (état des retenues à la source à reverser à la DGID)
  const lignesImpots = rows.map((r) => ({ r, ir: r.p.ir + (r.p.regulIR || 0), trimf: r.p.trimf, brs: r.p.brs || 0, cfce: r.p.cfce }));
  const totalImpots = totaux.ir + totaux.trimf + totaux.brs + totaux.cfce;
  const exportImpotsCsv = () => {
    const header = ["Matricule", "Nom", "Prénom", "Contrat", "Brut", "Parts IR", "IR retenu", "TRIMF", "BRS (honoraires)", `CFCE employeur (${pc(params.CFCE.taux)})`];
    const body = lignesImpots.map(({ r, ir, trimf, brs, cfce }) => [r.emp.matricule, r.emp.nom, r.emp.prenom, r.emp.contrat || "", Math.round(r.p.brut), r.p.partsIR || "", Math.round(ir), Math.round(trimf), Math.round(brs), Math.round(cfce)]);
    const tot = ["TOTAUX", "", "", "", Math.round(totaux.brut), "", Math.round(totaux.ir), Math.round(totaux.trimf), Math.round(totaux.brs), Math.round(totaux.cfce)];
    const entete = [[`Impôts et taxes sur salaires — ${MOIS[mois]} ${annee} (${etat})`], [entreprise.nom || "", entreprise.ninea ? `NINEA ${entreprise.ninea}` : ""], []];
    exportRowsToCsv([...entete, header, ...body, [], tot, [], ["Total à reverser", Math.round(totalImpots)]], `impots_salaires_${MOIS[mois]}_${annee}.csv`);
  };
  const exportImpotsPdf = async () => {
    const td = "border:1px solid #999;padding:3px;", tdr = td + "text-align:right;";
    const html = `<div class="page" style="font-family:Arial,sans-serif;padding:30px;color:#111;background:#fff;width:734px;">
      <div style="text-align:center;margin-bottom:22px;">
        <h1 style="margin:0;font-size:17px;">ÉTAT DES RETENUES À LA SOURCE SUR SALAIRES</h1>
        <div style="font-size:10px;">IR, TRIMF, BRS et CFCE à reverser à la DGID</div>
        <div style="font-size:11px;margin-top:5px;">${escapeHtml(entreprise.nom || "—")} ${entreprise.ninea ? "· NINEA " + escapeHtml(entreprise.ninea) : ""}</div>
        <div style="font-size:13px;font-weight:bold;margin-top:5px;">Période : ${MOIS[mois]} ${annee}</div>
        <div style="font-size:9px;margin-top:3px;color:#555;">État établi sur ${etat}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:9px;">
        <thead><tr style="background:#f0f0f0;font-weight:bold;">
          ${["Matricule", "Nom & Prénom", "Brut", "IR", "TRIMF", "BRS", "CFCE"].map((h) => `<th style="border:1px solid #999;padding:4px;">${h}</th>`).join("")}
        </tr></thead><tbody>
        ${lignesImpots.map(({ r, ir, trimf, brs, cfce }) => `<tr>
          <td style="${td}">${escapeHtml(r.emp.matricule)}</td><td style="${td}">${escapeHtml(r.emp.nom)} ${escapeHtml(r.emp.prenom)}</td>
          <td style="${tdr}">${fmt(r.p.brut)}</td><td style="${tdr}">${fmt(ir)}</td><td style="${tdr}">${fmt(trimf)}</td><td style="${tdr}">${fmt(brs)}</td><td style="${tdr}">${fmt(cfce)}</td>
        </tr>`).join("")}
        <tr style="background:#f0f0f0;font-weight:bold;">
          <td colspan="2" style="${td}">TOTAUX (${rows.length})</td>
          <td style="${tdr}">${fmt(totaux.brut)}</td><td style="${tdr}">${fmt(totaux.ir)}</td><td style="${tdr}">${fmt(totaux.trimf)}</td><td style="${tdr}">${fmt(totaux.brs)}</td><td style="${tdr}">${fmt(totaux.cfce)}</td>
        </tr>
      </tbody></table>
      <div style="margin-top:22px;font-size:12px;"><b>Total à reverser : ${fmt(totalImpots)} FCFA</b> (IR ${fmt(totaux.ir)} · TRIMF ${fmt(totaux.trimf)} · BRS ${fmt(totaux.brs)} · CFCE ${fmt(totaux.cfce)})</div>
      <div style="margin-top:36px;font-size:10px;">Fait à ${escapeHtml(entreprise.adresse || "Dakar")}, le ${new Date().toLocaleDateString("fr-FR")}<br/><br/>Signature & cachet de l'employeur</div>
    </div>`;
    await exportHtmlToPdf(html, `impots_salaires_${MOIS[mois]}_${annee}.pdf`);
  };

  // ── Régularisation annuelle de l'IR (année en cours : le mois ouvert est ajouté aux bulletins clôturés)
  const moisCourant = now.getMonth();
  const moisOuvert = annee === now.getFullYear() && !bulletinsAnnee.some((b) => b.mois === moisCourant && b.annee === annee) ? moisCourant : null;
  const regulRows = useMemo(() => regularisationIR(bulletinsAnnee, employees, params, annee, moisOuvert), [bulletinsAnnee, employees, params, annee, moisOuvert]);
  const [regulBusy, setRegulBusy] = useState(false);
  const [regulMsg, setRegulMsg] = useState("");
  const appliquerRegul = async () => {
    if (!onSaveEmployee || moisOuvert === null) return;
    const aFaire = regulRows.filter((l) => l.ecart !== 0 || (employees.find((e) => e.matricule === l.matricule)?.regulIR || 0) !== 0);
    if (!aFaire.length) { setRegulMsg("Aucun écart à régulariser."); return; }
    if (!confirm(`Reporter la régularisation de l'IR sur le bulletin de ${MOIS[moisOuvert]} ${annee} pour ${aFaire.length} salarié(s) ?\nLe net à payer du mois sera modifié.`)) return;
    setRegulBusy(true);
    for (const l of aFaire) {
      const e = employees.find((x) => x.matricule === l.matricule);
      if (e) await onSaveEmployee({ ...e, regulIR: l.ecart });
    }
    setRegulBusy(false);
    setRegulMsg(`✅ Régularisation reportée sur le bulletin de ${MOIS[moisOuvert]} ${annee} pour ${aFaire.length} salarié(s).`);
  };
  const exportRegulCsv = () => {
    const header = ["Matricule", "Nom", "Parts IR", "Mois pris en compte", "Brut de l'année", "IR dû sur l'année", "IR déjà retenu", "Écart (+ à retenir / − à rembourser)"];
    exportRowsToCsv([[`Régularisation annuelle de l'IR ${annee}`], [], header, ...regulRows.map((l) => [l.matricule, l.nom, l.parts, l.nbMois, l.brutAnnuel, l.irDu, l.irRetenu, l.ecart])], `regularisation_ir_${annee}.csv`);
  };

  // ── DADS XML (format structuré importable)
  const exportDADSXml = () => {
    const esc = (s: string) => String(s ?? "").replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c] as string));
    const totalBrut = Math.round(dadsRows.reduce((s, r) => s + r.brutAnnuel, 0));
    const totalIR = Math.round(dadsRows.reduce((s, r) => s + r.irAnnuel, 0));
    const totalIpres = Math.round(dadsRows.reduce((s, r) => s + r.ipresAnnuel, 0));
    const totalCss = Math.round(dadsRows.reduce((s, r) => s + r.cssAnnuel, 0));
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<DADS annee="${annee}">
  <Employeur>
    <RaisonSociale>${esc(entreprise.nom || "")}</RaisonSociale>
    <NINEA>${esc(entreprise.ninea || "")}</NINEA>
    <RCCM>${esc(entreprise.rccm || "")}</RCCM>
    <Adresse>${esc(entreprise.adresse || "")}</Adresse>
  </Employeur>
  <Salaries nb="${dadsRows.length}">
${dadsRows.map((r) => `    <Salarie>
      <Matricule>${esc(r.emp.matricule)}</Matricule>
      <Nom>${esc(r.emp.nom)}</Nom>
      <Prenom>${esc(r.emp.prenom)}</Prenom>
      <DateEntree>${esc(r.emp.dateEntree)}</DateEntree>
      <DateSortie>${esc(r.emp.dateSortie || "")}</DateSortie>
      <SalaireBrutAnnuel>${Math.round(r.brutAnnuel)}</SalaireBrutAnnuel>
      <IRAnnuel>${Math.round(r.irAnnuel)}</IRAnnuel>
      <TrimfAnnuelle>${Math.round(r.trimfAnnuel)}</TrimfAnnuelle>
      <BrsAnnuelle>${Math.round(r.brsAnnuel)}</BrsAnnuelle>
      <IpresSalarie>${Math.round(r.ipresAnnuel)}</IpresSalarie>
      <CssPatronal>${Math.round(r.cssAnnuel)}</CssPatronal>
      <CfceEmployeur>${Math.round(r.cfceAnnuel)}</CfceEmployeur>
      <NetAnnuel>${Math.round(r.netAnnuel)}</NetAnnuel>
      <MoisDeclares>${r.moisPayes.length}</MoisDeclares>
    </Salarie>`).join("\n")}
  </Salaries>
  <Totaux>
    <BrutAnnuel>${totalBrut}</BrutAnnuel>
    <IRAnnuel>${totalIR}</IRAnnuel>
    <IpresSalarie>${totalIpres}</IpresSalarie>
    <CssPatronal>${totalCss}</CssPatronal>
  </Totaux>
</DADS>`;
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `dads_${annee}.xml`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-foreground text-xl font-extrabold mb-1">Déclarations légales</h1>
        <div className="text-muted-foreground text-[11px]">IPRES/CSS et impôts du mois, livre de paie, état annuel des salaires et régularisation de l'IR.</div>
      </div>

      <div className="flex gap-2 mb-4 border-b border-border overflow-x-auto whitespace-nowrap">
        {([
          ["ipres", "🏛️ IPRES / CSS mensuel"],
          ["impots", "🧾 Impôts (DGID)"],
          ["livre", "📖 Livre de paie"],
          ["dads", "📅 DADS annuelle"],
          ["regul", "⚖️ Régularisation IR"],
        ] as [SubTab, string][]).map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-[12px] font-bold cursor-pointer border-b-2 ${tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
            {lbl}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-center">
        {tab !== "dads" && tab !== "regul" && (
          <>
            <span className="text-muted-foreground text-[11px] uppercase font-bold">Mois</span>
            <select value={mois} onChange={(e) => setMois(+e.target.value)} className="py-1.5 px-2.5 bg-background border border-border rounded-lg text-foreground text-[13px] font-mono">
              {MOIS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </>
        )}
        <span className="text-muted-foreground text-[11px] uppercase font-bold">Année</span>
        <select value={annee} onChange={(e) => setAnnee(+e.target.value)} className="py-1.5 px-2.5 bg-background border border-border rounded-lg text-foreground text-[13px] font-mono w-24">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        {tab !== "dads" && tab !== "regul" && (
          <span className={`text-[11px] font-bold ${moisEstCloture ? "text-primary" : "text-senpaie-yellow"}`}>
            {moisEstCloture ? "🔒 Bulletins clôturés" : "⚠️ Provisoire : mois non clôturé, calculé sur les fiches actuelles"}
          </span>
        )}
        <div className="flex-1" />
        {tab === "impots" && (
          <>
            <button onClick={exportImpotsCsv} className="px-3 py-2 bg-transparent border border-primary text-primary rounded-lg font-bold text-[12px]">📥 CSV</button>
            <button onClick={exportImpotsPdf} className="px-4 py-2 bg-destructive text-foreground rounded-lg font-bold text-[12px]">⬇️ PDF</button>
          </>
        )}
        {tab === "regul" && (
          <>
            <button onClick={exportRegulCsv} className="px-3 py-2 bg-transparent border border-primary text-primary rounded-lg font-bold text-[12px]">📥 CSV</button>
            {canEdit && onSaveEmployee && moisOuvert !== null && (
              <button onClick={appliquerRegul} disabled={regulBusy || !regulRows.length} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-[12px] disabled:opacity-50">
                {regulBusy ? "…" : `Reporter sur le bulletin de ${MOIS[moisOuvert]}`}
              </button>
            )}
          </>
        )}
        {tab === "ipres" && (
          <>
            <button onClick={exportIPRESExcel} className="px-3 py-2 bg-transparent border border-primary text-primary rounded-lg font-bold text-[12px]">📥 CSV</button>
            <button onClick={exportIPRESPdf} className="px-4 py-2 bg-destructive text-foreground rounded-lg font-bold text-[12px]">⬇️ PDF</button>
          </>
        )}
        {tab === "livre" && <button onClick={exportLivrePaie} className="px-4 py-2 bg-destructive text-foreground rounded-lg font-bold text-[12px]">⬇️ PDF Livre de Paie</button>}
        {tab === "dads" && (
          <>
            <button onClick={exportDADS} className="px-3 py-2 bg-transparent border border-primary text-primary rounded-lg font-bold text-[12px]">📥 CSV DADS</button>
            <button onClick={exportDADSXml} className="px-4 py-2 bg-destructive text-foreground rounded-lg font-bold text-[12px]">⬇️ XML DADS</button>
          </>
        )}
      </div>

      {tab === "ipres" && <IpresPreview rows={rows} totaux={totaux} libelles={libelles} />}
      {tab === "impots" && (
        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead><tr className="bg-background text-muted-foreground">
              {["Matricule", "Nom", "Brut", "IR", "TRIMF", "BRS", `CFCE (${pc(params.CFCE.taux)})`].map((h, i) => (
                <th key={h} className={`py-2 px-2 ${i < 2 ? "text-left" : "text-right"} border-b border-border`}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {lignesImpots.map(({ r, ir, trimf, brs, cfce }) => (
                <tr key={r.emp.matricule} className="border-b border-border">
                  <td className="py-1.5 px-2">{r.emp.matricule}</td>
                  <td className="py-1.5 px-2">{r.emp.nom} {r.emp.prenom}</td>
                  <td className="py-1.5 px-2 text-right">{fmt(r.p.brut)}</td>
                  <td className="py-1.5 px-2 text-right">{fmt(ir)}</td>
                  <td className="py-1.5 px-2 text-right">{fmt(trimf)}</td>
                  <td className="py-1.5 px-2 text-right">{fmt(brs)}</td>
                  <td className="py-1.5 px-2 text-right">{fmt(cfce)}</td>
                </tr>
              ))}
              <tr className="bg-background font-bold text-primary">
                <td colSpan={2} className="py-2 px-2">TOTAUX</td>
                <td className="py-2 px-2 text-right">{fmt(totaux.brut)}</td>
                <td className="py-2 px-2 text-right">{fmt(totaux.ir)}</td>
                <td className="py-2 px-2 text-right">{fmt(totaux.trimf)}</td>
                <td className="py-2 px-2 text-right">{fmt(totaux.brs)}</td>
                <td className="py-2 px-2 text-right">{fmt(totaux.cfce)}</td>
              </tr>
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-border text-[12px]">Total à reverser à la DGID : <strong className="text-primary">{fmt(totalImpots)} FCFA</strong></div>
        </div>
      )}
      {tab === "regul" && (
        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <div className="px-4 py-3 border-b border-border text-muted-foreground text-[11px] space-y-1">
            <div>Chaque mois, l'IR est retenu comme si le salaire du mois était perçu douze fois. Ici, l'impôt est recalculé sur le revenu réellement versé en <strong className="text-foreground">{annee}</strong> et comparé aux retenues déjà faites.</div>
            <div>
              {moisOuvert !== null
                ? <>Calcul sur les mois clôturés + {MOIS[moisOuvert]} (mois en cours). À passer sur le dernier bulletin de l'année ou au départ du salarié.</>
                : <>Calcul sur les seuls bulletins clôturés de {annee}.</>}
            </div>
            {regulMsg && <div className="text-foreground font-bold">{regulMsg}</div>}
          </div>
          {regulRows.length === 0 && <div className="px-4 py-6 text-center text-muted-foreground text-[12px]">Aucun bulletin de salarié pour {annee}.</div>}
          {regulRows.length > 0 && (
            <table className="w-full text-[11px]">
              <thead><tr className="bg-background text-muted-foreground">
                {["Matricule", "Nom", "Mois", "Brut de l'année", "IR dû", "IR retenu", "Écart"].map((h, i) => (
                  <th key={h} className={`py-2 px-2 ${i < 2 ? "text-left" : "text-right"} border-b border-border`}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {regulRows.map((l) => (
                  <tr key={l.matricule} className="border-b border-border">
                    <td className="py-1.5 px-2">{l.matricule}</td>
                    <td className="py-1.5 px-2">{l.nom}</td>
                    <td className="py-1.5 px-2 text-right">{l.nbMois}</td>
                    <td className="py-1.5 px-2 text-right">{fmt(l.brutAnnuel)}</td>
                    <td className="py-1.5 px-2 text-right">{fmt(l.irDu)}</td>
                    <td className="py-1.5 px-2 text-right">{fmt(l.irRetenu)}</td>
                    <td className={`py-1.5 px-2 text-right font-bold ${l.ecart > 0 ? "text-destructive" : l.ecart < 0 ? "text-primary" : ""}`}>
                      {l.ecart === 0 ? "0" : l.ecart > 0 ? `+ ${fmt(l.ecart)} à retenir` : `− ${fmt(-l.ecart)} à rembourser`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {tab === "livre" && <LivrePreview rows={rows} totaux={totaux} />}
      {tab === "dads" && <DadsPreview rows={dadsRows} annee={annee} moisClotures={dadsMois} />}
    </div>
  );
}

function IpresPreview({ rows, totaux, libelles }: { rows: { emp: Employee; p: PayrollResult }[]; totaux: { brut: number; ipresRG_s: number; ipresRG_p: number; ipresRC_s: number; ipresRC_p: number; css_af: number; css_at: number }; libelles: Record<"rgS" | "rgP" | "rcS" | "rcP" | "af" | "at", string> }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="bg-background text-muted-foreground">
            {["Matricule", "Nom", "Brut", libelles.rgS, libelles.rgP, libelles.rcS, libelles.rcP, libelles.af, libelles.at].map((h, i) => (
              <th key={h} className={`py-2 px-2 ${i < 2 ? "text-left" : "text-right"} border-b border-border`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.emp.matricule} className="border-b border-border">
              <td className="py-1.5 px-2">{r.emp.matricule}</td>
              <td className="py-1.5 px-2">{r.emp.nom} {r.emp.prenom}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.p.brut)}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.p.ipresRG_s)}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.p.ipresRG_p)}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.p.ipresRC_s)}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.p.ipresRC_p)}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.p.css_af)}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.p.css_at)}</td>
            </tr>
          ))}
          <tr className="bg-background font-bold text-primary">
            <td colSpan={2} className="py-2 px-2">TOTAUX</td>
            <td className="py-2 px-2 text-right">{fmt(totaux.brut)}</td>
            <td className="py-2 px-2 text-right">{fmt(totaux.ipresRG_s)}</td>
            <td className="py-2 px-2 text-right">{fmt(totaux.ipresRG_p)}</td>
            <td className="py-2 px-2 text-right">{fmt(totaux.ipresRC_s)}</td>
            <td className="py-2 px-2 text-right">{fmt(totaux.ipresRC_p)}</td>
            <td className="py-2 px-2 text-right">{fmt(totaux.css_af)}</td>
            <td className="py-2 px-2 text-right">{fmt(totaux.css_at)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function LivrePreview({ rows, totaux }: { rows: { emp: Employee; p: PayrollResult }[]; totaux: { brut: number; net: number; ir: number; trimf: number; brs: number; ipresRG_s: number; ipresRC_s: number; ipm_s: number } }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="bg-background text-muted-foreground">
            {["Matricule", "Nom & Prénom", "Emploi", "Brut", "IR+TRIMF+BRS", "Cot. sal.", "Net payé"].map((h, i) => (
              <th key={h} className={`py-2 px-2 ${i < 3 ? "text-left" : "text-right"} border-b border-border`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.emp.matricule} className="border-b border-border">
              <td className="py-1.5 px-2">{r.emp.matricule}</td>
              <td className="py-1.5 px-2">{r.emp.nom} {r.emp.prenom}</td>
              <td className="py-1.5 px-2">{r.emp.fonction}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.p.brut)}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.p.ir + (r.p.regulIR || 0) + r.p.trimf + (r.p.brs || 0))}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.p.ipresRG_s + r.p.ipresRC_s + r.p.ipm_s)}</td>
              <td className="py-1.5 px-2 text-right font-bold">{fmt(r.p.net)}</td>
            </tr>
          ))}
          <tr className="bg-background font-bold text-primary">
            <td colSpan={3} className="py-2 px-2">TOTAUX ({rows.length} salariés)</td>
            <td className="py-2 px-2 text-right">{fmt(totaux.brut)}</td>
            <td className="py-2 px-2 text-right">{fmt(totaux.ir + totaux.trimf + totaux.brs)}</td>
            <td className="py-2 px-2 text-right">{fmt(totaux.ipresRG_s + totaux.ipresRC_s + totaux.ipm_s)}</td>
            <td className="py-2 px-2 text-right">{fmt(totaux.net)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function DadsPreview({ rows, annee, moisClotures }: { rows: LigneDADS[]; annee: number; moisClotures: number[] }) {
  const tot = rows.reduce((s, r) => ({
    brut: s.brut + r.brutAnnuel,
    ir: s.ir + r.irAnnuel,
    ipres: s.ipres + r.ipresAnnuel,
    css: s.css + r.cssAnnuel,
    trimf: s.trimf + r.trimfAnnuel, brs: s.brs + r.brsAnnuel, cfce: s.cfce + r.cfceAnnuel,
  }), { brut: 0, ir: 0, ipres: 0, css: 0, trimf: 0, brs: 0, cfce: 0 });

  return (
    <div className="bg-card border border-border rounded-lg overflow-x-auto">
      <div className="px-4 py-3 border-b border-border text-muted-foreground text-[11px]">
        DADS — Déclaration Annuelle des Salaires <strong className="text-foreground">{annee}</strong> · cumul des bulletins clôturés
        <span className={`ml-2 font-bold ${moisClotures.length === 12 ? "text-primary" : "text-senpaie-yellow"}`}>
          {moisClotures.length}/12 mois clôturés{moisClotures.length ? ` (${moisClotures.map((m) => MOIS[m].slice(0, 3)).join(", ")})` : ""}
        </span>
        {moisClotures.length < 12 && <div className="mt-1">Seuls les mois clôturés sont déclarés. Clôturez chaque mois depuis la page Entreprise avant de déposer la DADS.</div>}
      </div>
      {rows.length === 0 && <div className="px-4 py-6 text-center text-muted-foreground text-[12px]">Aucun bulletin clôturé pour {annee}.</div>}
      <table className="w-full text-[11px]">
        <thead>
          <tr className="bg-background text-muted-foreground">
            {["Matricule", "Nom", "Mois", "Brut annuel", "IR annuel", "TRIMF", "BRS", "IPRES salarié", "CSS patronal", "CFCE"].map((h, i) => (
              <th key={h} className={`py-2 px-2 ${i < 2 ? "text-left" : "text-right"} border-b border-border`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.emp.matricule} className="border-b border-border">
              <td className="py-1.5 px-2">{r.emp.matricule}</td>
              <td className="py-1.5 px-2">{r.emp.nom} {r.emp.prenom}</td>
              <td className="py-1.5 px-2 text-right">{r.moisPayes.length}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.brutAnnuel)}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.irAnnuel)}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.trimfAnnuel)}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.brsAnnuel)}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.ipresAnnuel)}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.cssAnnuel)}</td>
              <td className="py-1.5 px-2 text-right">{fmt(r.cfceAnnuel)}</td>
            </tr>
          ))}
          <tr className="bg-background font-bold text-primary">
            <td colSpan={3} className="py-2 px-2">TOTAUX</td>
            <td className="py-2 px-2 text-right">{fmt(tot.brut)}</td>
            <td className="py-2 px-2 text-right">{fmt(tot.ir)}</td>
            <td className="py-2 px-2 text-right">{fmt(tot.trimf)}</td>
            <td className="py-2 px-2 text-right">{fmt(tot.brs)}</td>
            <td className="py-2 px-2 text-right">{fmt(tot.ipres)}</td>
            <td className="py-2 px-2 text-right">{fmt(tot.css)}</td>
            <td className="py-2 px-2 text-right">{fmt(tot.cfce)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default DeclarationsPage;