import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { lireCsv, tamponXlsx, lireFeuille } from "@/lib/xlsxIO";
import { parseEmployeeFile } from "@/lib/employeeImport";

const fichier = (contenu: string | ArrayBuffer, nom: string, type = "") => ({
  name: nom, type,
  text: async () => (typeof contenu === "string" ? contenu : ""),
  arrayBuffer: async () => (typeof contenu === "string" ? new TextEncoder().encode(contenu).buffer as ArrayBuffer : contenu),
});

describe("lireCsv", () => {
  it("gère les séparateurs ; et , les guillemets doublés et les sauts de ligne dans une cellule", () => {
    expect(lireCsv('a;b;c\n1;"x;y";"il dit ""oui"""\n')).toEqual([["a", "b", "c"], ["1", "x;y", 'il dit "oui"']]);
    expect(lireCsv("a,b\r\n1,2\r\n")).toEqual([["a", "b"], ["1", "2"]]);
    expect(lireCsv('a;b\n"ligne1\nligne2";2')).toEqual([["a", "b"], ["ligne1\nligne2", "2"]]);
  });
  it("ignore le BOM et les lignes vides", () => {
    expect(lireCsv("﻿a;b\n\n1;2\n")).toEqual([["a", "b"], ["1", "2"]]);
  });
});

describe("classeur Excel : écriture puis lecture", () => {
  it("relit exactement ce qui a été écrit (texte, nombres)", async () => {
    const buf = await tamponXlsx("Test", [["Nom", "Salaire"], ["Fatou", 250000], ["Awa", 1093500]]);
    const rows = await lireFeuille(fichier(buf, "t.xlsx"));
    expect(rows).toEqual([{ Nom: "Fatou", Salaire: 250000 }, { Nom: "Awa", Salaire: 1093500 }]);
  });
  it("lit les dates Excel en AAAA-MM-JJ", async () => {
    const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet("A");
    ws.addRow(["Date"]); ws.addRow([new Date(Date.UTC(2026, 1, 2))]);
    const buf = await wb.xlsx.writeBuffer();
    const rows = await lireFeuille(fichier(buf as ArrayBuffer, "d.xlsx"));
    expect(rows[0].Date).toBe("2026-02-02");
  });
  it("refuse proprement l'ancien format .xls et un fichier corrompu", async () => {
    await expect(lireFeuille(fichier("x", "vieux.xls"))).rejects.toThrow(/xlsx/);
    await expect(lireFeuille(fichier("pas un classeur", "faux.xlsx"))).rejects.toThrow(/illisible/);
  });
});

describe("import des salariés", () => {
  it("importe un CSV, signale doublons et lignes invalides", async () => {
    const csv = [
      "Matricule;Prenom;Nom;Date entree (AAAA-MM-JJ);Salaire de base;Statut",
      "A1;Awa;Diop;2026-01-05;200000;employés",
      "A1;Doublon;Diop;2026-01-05;200000;employés",
      "A2;Sans;Salaire;2026-01-05;0;employés",
    ].join("\n");
    const r = await parseEmployeeFile(fichier(csv, "i.csv", "text/csv"), []);
    expect(r.employees.map((e) => e.matricule)).toEqual(["A1"]);
    expect(r.errors.map((e) => e.message).join(" | ")).toMatch(/doublon.*salaire de base invalide/);
  });
});
