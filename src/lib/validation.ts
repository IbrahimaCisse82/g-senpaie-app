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
  // NINEA : 7 à 9 chiffres, éventuellement suivis du code COFI (ex. « 006760210 2G3 »)
  ninea: z.string().trim().regex(/^\d{7,9}(\s?[0-9A-Z]{3})?$/i, "NINEA : 7 à 9 chiffres, suivis éventuellement du code COFI (ex. 006760210 2G3)").optional().or(z.literal("")),
  rccm: z
    .string()
    .trim()
    // RCCM : SN-DKR-2020-B-12345, avec tirets, points ou espaces, numéro de 1 à 6 chiffres (anciens formats compris)
    .regex(/^SN[\s.-]?[A-Z]{2,4}[\s.-]?\d{4}[\s.-]?[A-Z][\s.-]?\d{1,6}$/i, "RCCM au format SN-DKR-AAAA-B-XXXXX")
    .optional()
    .or(z.literal("")),
  adresse: z.string().trim().max(300).optional().default(""),
  telephone: z.string().trim().max(30).optional().default(""),
  email: z.string().trim().email("Email invalide").max(150).optional().or(z.literal("")),
  bulletinTemplate: z.string().optional().default("classique"),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;
export type EntrepriseInput = z.infer<typeof entrepriseSchema>;

const LIBELLES: Record<string, string> = {
  matricule: "Matricule", prenom: "Prénom", nom: "Nom", fonction: "Fonction", dateEntree: "Date d'entrée",
  salaireBase: "Salaire de base", sursalaire: "Sursalaire", femmes: "Nombre de femmes", enfants: "Nombre d'enfants",
  telephone: "Téléphone", email: "E-mail", ninea: "NINEA", rccm: "RCCM", adresse: "Adresse", logo: "Logo",
};
export function formatZodError(err: z.ZodError): string {
  return err.issues.map((i) => { const k = String(i.path[0] ?? ""); return `• ${LIBELLES[k] || k || "Champ"} : ${i.message}`; }).join("\n");
}