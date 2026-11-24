import { describe, it, expect } from "vitest";
import { escapeHtml, safeImageUrl, escapeStrings } from "./utils";

describe("protection XSS des bulletins", () => {
  it("échappe les balises et guillemets", () => {
    expect(escapeHtml(`<img src=x onerror="alert(1)">`)).toBe("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });
  it("refuse les URL javascript: pour le logo", () => {
    expect(safeImageUrl("javascript:alert(1)")).toBe("");
    expect(safeImageUrl(`https://x.supabase.co/logo.png" onerror="alert(1)`)).not.toContain('"');
    expect(safeImageUrl("https://x.supabase.co/logo.png")).toBe("https://x.supabase.co/logo.png");
  });
  it("échappe les textes sans toucher aux nombres", () => {
    const r = escapeStrings({ nom: "<b>", salaire: 1000 });
    expect(r).toEqual({ nom: "&lt;b&gt;", salaire: 1000 });
  });
});

import { csvCell } from "./utils";
describe("csvCell", () => {
  it("neutralise les formules et double les guillemets", () => {
    expect(csvCell('=HYPERLINK("http://x")')).toBe(`"'=HYPERLINK(""http://x"")"`);
    expect(csvCell("+33 1")).toBe(`"'+33 1"`);
    expect(csvCell("@cmd")).toBe(`"'@cmd"`);
    expect(csvCell("-cmd|calc")).toBe(`"'-cmd|calc"`);
  });
  it("laisse intacts nombres, négatifs et texte normal", () => {
    expect(csvCell(1250)).toBe('"1250"');
    expect(csvCell("-1 250,5")).toBe('"-1 250,5"');
    expect(csvCell("Fatou Sarr")).toBe('"Fatou Sarr"');
    expect(csvCell(null)).toBe('""');
  });
});
