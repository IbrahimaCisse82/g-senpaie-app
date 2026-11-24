/**
 * Lecture et écriture de classeurs Excel (.xlsx) et CSV, via exceljs.
 * Remplace la bibliothèque « xlsx » (SheetJS 0.18), qui comporte des failles connues (pollution de
 * prototype, déni de service par expression régulière) sans correctif publié sur npm.
 */

export type Cellule = string | number | null;

/** Télécharge un classeur d'une feuille. */
export async function telechargerXlsx(nomFichier: string, feuille: string, lignes: Cellule[][], largeur = 14) {
  const blob = await classeurXlsx(feuille, lignes, largeur);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nomFichier;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Construit le classeur (séparé du téléchargement pour pouvoir le tester). */
export async function classeurXlsx(feuille: string, lignes: Cellule[][], largeur = 14): Promise<Blob> {
  const buf = await tamponXlsx(feuille, lignes, largeur);
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export async function tamponXlsx(feuille: string, lignes: Cellule[][], largeur = 14): Promise<ArrayBuffer> {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(feuille);
  lignes.forEach((l) => ws.addRow(l));
  const colonnes = Math.max(0, ...lignes.map((l) => l.length));
  for (let i = 1; i <= colonnes; i++) ws.getColumn(i).width = Math.max(largeur, Math.min(40, String(lignes[0]?.[i - 1] ?? "").length + 2));
  ws.getRow(1).font = { bold: true };
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

/** Découpe un CSV (séparateur « ; » ou « , », guillemets doublés). */
export function lireCsv(texte: string): string[][] {
  const t = texte.replace(/^\uFEFF/, "");
  const premiere = t.split(/\r?\n/, 1)[0] ?? "";
  const sep = (premiere.match(/;/g)?.length ?? 0) >= (premiere.match(/,/g)?.length ?? 0) ? ";" : ",";
  const lignes: string[][] = []; let ligne: string[] = []; let cur = ""; let q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === sep) { ligne.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; ligne.push(cur); lignes.push(ligne); ligne = []; cur = ""; }
    else cur += c;
  }
  if (cur !== "" || ligne.length) { ligne.push(cur); lignes.push(ligne); }
  return lignes.filter((l) => l.some((x) => x.trim() !== ""));
}

const valeurCellule = (v: unknown): string | number => {
  if (v == null) return "";
  if (v instanceof Date) return isNaN(v.getTime()) ? "" : v.toISOString().slice(0, 10);
  if (typeof v === "number" || typeof v === "string") return v;
  if (typeof v === "boolean") return v ? "oui" : "non";
  const o = v as { result?: unknown; richText?: { text: string }[]; text?: string; hyperlink?: string };
  if (o.richText) return o.richText.map((r) => r.text).join("");
  if ("result" in o) return valeurCellule(o.result);
  if (o.text) return o.text;
  return "";
};

/** Lit la première feuille d'un fichier .xlsx ou .csv : une ligne d'en-têtes puis un objet par ligne. */
export async function lireFeuille(file: Pick<File, "name" | "type" | "text" | "arrayBuffer">): Promise<Record<string, string | number>[]> {
  let matrice: (string | number)[][];
  if (/\.csv$/i.test(file.name) || file.type === "text/csv") {
    matrice = lireCsv(await file.text());
  } else {
    if (/\.xls$/i.test(file.name)) throw new Error("Ancien format .xls non pris en charge : enregistrez le fichier au format .xlsx ou .csv.");
    const { default: ExcelJS } = await import("exceljs");
    const wb = new ExcelJS.Workbook();
    try { await wb.xlsx.load(await file.arrayBuffer()); }
    catch { throw new Error("Fichier illisible : utilisez un classeur .xlsx ou un fichier .csv."); }
    const ws = wb.worksheets[0];
    if (!ws) return [];
    matrice = [];
    ws.eachRow({ includeEmpty: false }, (row) => {
      const vals: (string | number)[] = [];
      for (let i = 1; i <= ws.columnCount; i++) vals.push(valeurCellule(row.getCell(i).value));
      matrice.push(vals);
    });
  }
  if (matrice.length < 2) return [];
  const entetes = matrice[0].map((h) => String(h).trim());
  return matrice.slice(1).map((l) => Object.fromEntries(entetes.map((h, i) => [h, l[i] ?? ""])));
}
