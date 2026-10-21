import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Échappe une chaîne pour insertion dans du HTML (contenu ou attribut entre guillemets) */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** N'accepte que les URL d'image sûres (http(s), blob, data:image) ; sinon chaîne vide */
export function safeImageUrl(url: string | undefined | null): string {
  const u = (url || "").trim();
  return /^(https?:|blob:|data:image\/(png|jpe?g|gif|webp|svg\+xml);)/i.test(u) ? escapeHtml(u) : "";
}

/** Copie d'un objet dont toutes les propriétés texte sont échappées pour le HTML (nombres inchangés) */
export function escapeStrings<T extends object>(obj: T): T {
  const out = { ...obj } as Record<string, unknown>;
  for (const [k, v] of Object.entries(out)) if (typeof v === "string") out[k] = escapeHtml(v);
  return out as T;
}
