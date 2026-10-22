// Corps HTML imprimables des états de paie (toutes les données saisies sont échappées).
import type { Entreprise } from "./payroll";
import { escapeHtml as h } from "./utils";
import { documentImprimable, montantHtml as m } from "./impression";
import { livreDePaie, resumeCotisations, journalDePaie, type LigneBulletin, type Organisme } from "./etats";
import type { PayrollParams } from "./payroll";

const CLASSE: Record<string, string> = { total: "total", net: "net" };

export function livreHTML(lignes: LigneBulletin[], periode: string, entreprise: Entreprise): string {
  const livre = livreDePaie(lignes);
  // Au-delà de 8 salariés par page, on découpe en blocs pour rester lisible en A4 paysage
  const PAR_PAGE = 8;
  const blocs: LigneBulletin[][] = [];
  for (let i = 0; i < lignes.length; i += PAR_PAGE) blocs.push(lignes.slice(i, i + PAR_PAGE));
  if (blocs.length === 0) blocs.push([]);
  const corps = blocs.map((bloc, bi) => {
    const debut = bi * PAR_PAGE;
    const dernier = bi === blocs.length - 1;
    return `<table>
<thead><tr><th class="l">Code</th><th class="l">Rubrique</th>${bloc.map((l) => `<th>${h(l.matricule)}<br>${h(l.prenom)} ${h(l.nom)}</th>`).join("")}${dernier ? "<th>Total</th>" : ""}</tr></thead>
<tbody>${livre.map((r) => `<tr class="${CLASSE[r.rubrique.type] || ""}"><td class="l">${r.rubrique.code}</td><td class="l">${h(r.rubrique.libelle)}</td>${
      r.valeurs.slice(debut, debut + PAR_PAGE).map((v) => `<td>${m(v)}</td>`).join("")}${dernier ? `<td><b>${m(r.total)}</b></td>` : ""}</tr>`).join("")}
</tbody></table>${dernier ? "" : '<div style="page-break-after:always"></div>'}`;
  }).join("");
  return documentImprimable({ titre: "Livre de paie", periode, entreprise, corps: corps + `<div class="note">${lignes.length} bénéficiaire(s). Montants en FCFA.</div>`, paysage: true });
}

const ORG_LIB: Record<Organisme, string> = { DGID: "Total impôts (DGID)", IPRES: "Total IPRES", CSS: "Total CSS", IPM: "Total IPM" };

export function cotisationsHTML(lignes: LigneBulletin[], params: PayrollParams, periode: string, entreprise: Entreprise): string {
  const r = resumeCotisations(lignes, params);
  const pct = (n: number) => (n ? `${(n * 100).toFixed(2).replace(".", ",")} %` : "");
  let html = `<table><thead><tr><th class="l">Code</th><th class="l">Rubrique</th><th>Taux sal.</th><th>Taux pat.</th><th>Assiette</th><th>Base</th><th>Part salariale</th><th>Part patronale</th><th>Total</th><th>Effectif</th></tr></thead><tbody>`;
  for (const org of ["DGID", "IPRES", "CSS", "IPM"] as Organisme[]) {
    for (const l of r.lignes.filter((x) => x.organisme === org)) {
      html += `<tr><td class="l">${l.code}</td><td class="l">${h(l.libelle)}</td><td>${pct(l.tauxSalarial)}</td><td>${pct(l.tauxPatronal)}</td><td>${m(l.assiette)}</td><td>${m(l.base)}</td><td>${m(l.montantSalarial)}</td><td>${m(l.montantPatronal)}</td><td>${m(l.montantSalarial + l.montantPatronal)}</td><td>${l.effectif || ""}</td></tr>`;
    }
    const st = r.sousTotaux[org];
    html += `<tr class="sous"><td></td><td class="l">${ORG_LIB[org]}</td><td colspan="4"></td><td>${m(st.salarial)}</td><td>${m(st.patronal)}</td><td>${m(st.total)}</td><td></td></tr>`;
  }
  html += `<tr class="grand"><td></td><td class="l">TOTAL GÉNÉRAL DES COTISATIONS</td><td colspan="4"></td><td>${m(r.total.salarial)}</td><td>${m(r.total.patronal)}</td><td>${m(r.total.total)}</td><td>${r.effectif}</td></tr></tbody></table>`;
  return documentImprimable({ titre: "Résumé des cotisations", periode, entreprise, corps: html, paysage: true });
}

export function journalHTML(lignes: LigneBulletin[], periode: string, dateEcriture: string, entreprise: Entreprise): string {
  const j = journalDePaie(lignes);
  let html = `<table><thead><tr><th class="l">Compte</th><th class="l">Libellé</th><th>Débit</th><th>Crédit</th></tr></thead><tbody>`;
  for (const e of j) {
    html += `<tr class="ecr"><td colspan="4">Écriture ${e.numero} – ${h(e.libelle)} – ${h(dateEcriture)}</td></tr>`;
    html += e.lignes.map((l) => `<tr><td class="l">${h(l.compte)}</td><td class="l">${h(l.libelle)}</td><td>${m(l.debit)}</td><td>${m(l.credit)}</td></tr>`).join("");
    html += `<tr class="total"><td></td><td class="l">Total écriture ${e.numero}</td><td>${m(e.totalDebit)}</td><td>${m(e.totalCredit)}</td></tr>`;
  }
  const td = j.reduce((s, e) => s + e.totalDebit, 0), tc = j.reduce((s, e) => s + e.totalCredit, 0);
  html += `<tr class="grand"><td></td><td class="l">TOTAL JOURNAL DE PAIE</td><td>${m(td)}</td><td>${m(tc)}</td></tr></tbody></table>
<div class="note">Plan de comptes SYSCOHADA repris du modèle SENEXCELPAIE, à valider par votre expert-comptable.</div>`;
  return documentImprimable({ titre: "Journal de paie", periode, entreprise, corps: html });
}
