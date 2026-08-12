import * as XLSX from "xlsx";
import type { Employee } from "@/lib/payroll";
import { EMPTY_EMPLOYEE } from "@/lib/constants";

/** Colonnes du modèle d'import (libellé → clé Employee) */
export const IMPORT_COLUMNS: { header: string; key: keyof Employee; type: "text" | "number" }[] = [
  { header: "Matricule", key: "matricule", type: "text" },
  { header: "Prenom", key: "prenom", type: "text" },
  { header: "Nom", key: "nom", type: "text" },
  { header: "Sexe (M/F)", key: "sexe", type: "text" },
  { header: "Date naissance (AAAA-MM-JJ)", key: "dateNaissance", type: "text" },
  { header: "Telephone", key: "telephone", type: "text" },
  { header: "Email", key: "email", type: "text" },
  { header: "Situation famille", key: "situationFamille", type: "text" },
  { header: "Femmes", key: "femmes", type: "number" },
  { header: "Enfants", key: "enfants", type: "number" },
  { header: "Fonction", key: "fonction", type: "text" },
  { header: "Convention", key: "convention", type: "text" },
  { header: "Categorie", key: "categorie", type: "text" },
  { header: "Statut", key: "statut", type: "text" },
  { header: "Contrat", key: "contrat", type: "text" },
  { header: "Date entree (AAAA-MM-JJ)", key: "dateEntree", type: "text" },
  { header: "Salaire de base", key: "salaireBase", type: "number" },
  { header: "Sursalaire", key: "sursalaire", type: "number" },
];

export interface ImportRowError { ligne: number; message: string }
export interface ImportResult { employees: Employee[]; errors: ImportRowError[] }

const num = (v: unknown): number => {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  const n = Number(String(v ?? "").replace(/[^0-9.,-]/g, "").replace(/\s/g, "").replace(",", "."));
  return isFinite(n) ? n : 0;
};

const txt = (v: unknown): string => String(v ?? "").trim();

/** Normalise une date Excel (serial ou texte) en AAAA-MM-JJ */
const toDate = (v: unknown): string => {
  if (v == null || v === "") return "";
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = txt(v);
  const fr = s.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (fr) return `${fr[3]}-${fr[2]}-${fr[1]}`;
  return s;
};

/** Génère et télécharge le fichier modèle d'import */
export function downloadImportTemplate() {
  const headers = IMPORT_COLUMNS.map((c) => c.header);
  const example = [
    "EMP001", "Fatou", "Diop", "F", "1992-04-15", "770000000", "fatou.diop@exemple.sn",
    "Marié(e)", 0, 2, "Comptable", "COMMERCE", "M1", "employés", "CDI", "2020-01-06", 250000, 50000,
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(14, h.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Employés");
  XLSX.writeFile(wb, "modele_import_employes.xlsx");
}

/** Exporte la liste des employés au format Excel */
export function exportEmployeesXlsx(employees: Employee[]) {
  const rows = employees.map((e) =>
    Object.fromEntries(IMPORT_COLUMNS.map((c) => [c.header, e[c.key] ?? ""])),
  );
  const ws = XLSX.utils.json_to_sheet(rows, { header: IMPORT_COLUMNS.map((c) => c.header) });
  ws["!cols"] = IMPORT_COLUMNS.map((c) => ({ wch: Math.max(14, c.header.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Employés");
  XLSX.writeFile(wb, `employes_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/** Parse un fichier Excel/CSV en employés, avec contrôles de cohérence */
export async function parseEmployeeFile(file: File, existingMats: string[] = []): Promise<ImportResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  const employees: Employee[] = [];
  const errors: ImportRowError[] = [];
  const seen = new Set(existingMats.map((m) => m.toUpperCase()));

  raw.forEach((row, i) => {
    const ligne = i + 2;
    const get = (header: string) => {
      const found = Object.keys(row).find((k) => k.trim().toLowerCase() === header.trim().toLowerCase());
      return found ? row[found] : "";
    };
    const emp: Employee = { ...EMPTY_EMPLOYEE };
    for (const col of IMPORT_COLUMNS) {
      const v = get(col.header);
      if (col.type === "number") (emp[col.key] as number) = num(v);
      else (emp[col.key] as string) = txt(v);
    }
    emp.dateNaissance = toDate(get("Date naissance (AAAA-MM-JJ)"));
    emp.dateEntree = toDate(get("Date entree (AAAA-MM-JJ)"));
    emp.sexe = emp.sexe.toUpperCase().startsWith("F") ? "F" : "M";

    if (!emp.matricule) { errors.push({ ligne, message: "Matricule manquant" }); return; }
    if (!emp.nom || !emp.prenom) { errors.push({ ligne, message: `${emp.matricule} : nom ou prénom manquant` }); return; }
    if (!emp.dateEntree) { errors.push({ ligne, message: `${emp.matricule} : date d'entrée manquante` }); return; }
    if (seen.has(emp.matricule.toUpperCase())) { errors.push({ ligne, message: `${emp.matricule} : matricule en doublon` }); return; }
    if (emp.salaireBase <= 0) { errors.push({ ligne, message: `${emp.matricule} : salaire de base invalide` }); return; }

    seen.add(emp.matricule.toUpperCase());
    employees.push(emp);
  });

  return { employees, errors };
}
