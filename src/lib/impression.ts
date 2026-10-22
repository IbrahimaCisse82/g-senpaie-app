// Documents imprimables (livre de paie, résumé des cotisations, journal) : HTML autonome + bouton « Enregistrer en PDF ».
import type { Entreprise } from "./payroll";
import { escapeHtml, safeImageUrl } from "./utils";

const fmtN = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n || 0));
export const montantHtml = (n: number) => (Math.round(n || 0) === 0 ? "" : fmtN(n));

/** Construit un document A4 (paysage si demandé) avec l'en-tête de l'entreprise. Le corps doit déjà être échappé. */
export function documentImprimable(opts: {
  titre: string; periode: string; entreprise: Entreprise; corps: string; paysage?: boolean;
}): string {
  const e = opts.entreprise;
  const logo = safeImageUrl(e.logo);
  const coord = [e.adresse, e.telephone, e.email, e.ninea && `NINEA : ${e.ninea}`, e.rccm && `RCCM : ${e.rccm}`]
    .filter(Boolean).map(escapeHtml).join(" · ");
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>${escapeHtml(opts.titre)} – ${escapeHtml(opts.periode)}</title>
<style>
@page{size:A4 ${opts.paysage ? "landscape" : "portrait"};margin:10mm}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:10px;color:#1f2937;background:#fff}
.page{padding:10mm}
.head{display:flex;justify-content:space-between;align-items:center;background:#064e3b;color:#fff;padding:10px 14px;border-radius:6px;margin-bottom:10px}
.head .ent{display:flex;gap:10px;align-items:center}.head .nom{font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:1px}
.head .coord{font-size:8px;color:#a7f3d0;margin-top:2px}.head h1{font-size:14px;text-align:right}.head .per{font-size:10px;color:#a7f3d0;text-align:right}
table{width:100%;border-collapse:collapse;margin-bottom:10px}
th{background:#f3f4f6;color:#374151;font-size:8.5px;text-transform:uppercase;padding:5px 6px;border:1px solid #e5e7eb;text-align:right}
th.l,td.l{text-align:left}td{padding:4px 6px;border:1px solid #e5e7eb;text-align:right;white-space:nowrap}
tr.total td{font-weight:700;background:#f9fafb}tr.net td{font-weight:800;background:#ecfdf5;color:#065f46}
tr.sous td{font-weight:700;background:#eff6ff;color:#1e3a8a}tr.grand td{font-weight:900;background:#064e3b;color:#fff}
tr.ecr td{background:#f5f3ff;font-weight:700;color:#5b21b6;text-align:left}
.note{font-size:8px;color:#6b7280;margin-top:6px}.foot{margin-top:12px;text-align:center;font-size:8px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:5px}
.bar{background:#1f2937;color:#fff;padding:10px;text-align:center;position:sticky;top:0}
.bar button{background:#10b981;color:#fff;border:none;padding:8px 22px;border-radius:6px;font-weight:700;cursor:pointer}
@media print{.bar{display:none}.page{padding:0}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="bar"><button onclick="window.print()">🖨️ Imprimer / Enregistrer en PDF</button></div>
<div class="page">
<div class="head"><div class="ent">${logo ? `<img src="${logo}" alt="logo" style="height:40px;max-width:110px;object-fit:contain"/>` : ""}
<div><div class="nom">${escapeHtml(e.nom || "ENTREPRISE")}</div><div class="coord">${coord}</div></div></div>
<div><h1>${escapeHtml(opts.titre)}</h1><div class="per">${escapeHtml(opts.periode)}</div></div></div>
${opts.corps}
<div class="foot">Document généré par G-SENPAIE le ${new Date().toLocaleDateString("fr-FR")}</div>
</div></body></html>`;
}

export function ouvrirImpression(html: string) {
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}

export function telechargerTexte(contenu: string, nomFichier: string, type = "text/csv;charset=utf-8;") {
  const blob = new Blob([contenu], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomFichier;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
