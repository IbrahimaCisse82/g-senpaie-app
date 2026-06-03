import { z } from "zod";

export const employeeSchema = z.object({
  matricule: z.string().trim().min(1, "Matricule requis").max(50),
  prenom: z.string().trim().min(1, "Prénom requis").max(100),
  nom: z.string().trim().min(1, "Nom requis").max(100),
  fonction: z.string().trim().max(150).optional().default(""),
  dateEntree: z.string().trim().min(1, "Date d'entrée requise"),
  salaireBase: z.coerce.number().min(0, "Salaire base ≥ 0").max(100_000_000),
  sursalaire: z.coerce.number().min(0).max(100_000_000),
  femmes: z.coerce.number().int().min(0).max(20),
  enfants: z.coerce.number().int().min(0).max(50),
  telephone: z.string().trim().max(30).optional().default(""),
  email: z.string().trim().email("Email invalide").max(150).optional().or(z.literal("")),
});

export const entrepriseSchema = z.object({
  nom: z.string().trim().min(1, "Nom de l'entreprise requis").max(200),
  logo: z.string().optional().default(""),
  ninea: z.string().trim().regex(/^\d{9}$/, "NINEA = 9 chiffres").optional().or(z.literal("")),
  rccm: z.string().trim().max(50).optional().default(""),
  adresse: z.string().trim().max(300).optional().default(""),
  telephone: z.string().trim().max(30).optional().default(""),
  email: z.string().trim().email("Email invalide").max(150).optional().or(z.literal("")),
  bulletinTemplate: z.string().optional().default("classique"),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;
export type EntrepriseInput = z.infer<typeof entrepriseSchema>;

export function formatZodError(err: z.ZodError): string {
  return err.issues.map((i) => `• ${i.path.join(".") || "champ"}: ${i.message}`).join("\n");
}