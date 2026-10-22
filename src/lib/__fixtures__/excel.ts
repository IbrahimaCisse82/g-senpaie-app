/** Cas de référence de l'Excel SENEXCELPAIE « LOGICIEL GESTION DE LA PAIE » (période : novembre 2024) */
import type { Employee, PayrollParams } from "../payroll";
import { DEFAULT_PARAMS, DEFAULT_EMPLOYEES } from "../constants";

export const FIN_NOV_2024 = new Date(2024, 10, 30);

/** Paramètres tels que saisis dans l'onglet PARAMETRES de l'Excel */
export const PARAMS_EXCEL: PayrollParams = {
  ...JSON.parse(JSON.stringify(DEFAULT_PARAMS)),
  CSS_AT: { ...DEFAULT_PARAMS.CSS_AT, taux: 0.05 },
  IPM: { ...DEFAULT_PARAMS.IPM, taux: 1, tauxSalarial: 1, tauxPatronal: 0, plafond: 5000 },
};

const vide = { ...DEFAULT_EMPLOYEES[0], sursalaire: 0, femmes: 0, enfants: 0 };

export const OUSMANE: Employee = {
  ...vide, matricule: "IF0001", prenom: "OUSMANE", nom: "DIOP", categorie: "10_ème A", statut: "cadres",
  contrat: "CDI", dateEntree: "2021-08-01", situationFamille: "Marié(e)", femmes: 1, enfants: 3,
  salaireBase: 141024, sursalaire: 800000, heuresAbsence: 8, hs115: 32, hs140: 12, hs160: 16, hs200: 8,
  avanceTabaski: 10000, avanceCaisse: 5000, fraisMedicaux: 2000,
};
export const FANTA: Employee = {
  ...vide, matricule: "IF0002", prenom: "FANTA", nom: "GAYE", categorie: "7_ème B", statut: "agents de maîtrise",
  contrat: "CDD", dateEntree: "2020-07-01", situationFamille: "Célibataire",
  salaireBase: 113984, sursalaire: 556481.9733333334,
};
export const MANSOUR: Employee = {
  ...vide, matricule: "IF0003", prenom: "MANSOUR", nom: "GAYE", categorie: "PRESTATION", statut: "employés",
  contrat: "Prestation", dateEntree: "2020-05-01", situationFamille: "Veuf(ve)", enfants: 4,
  salaireBase: 526315.7894736843, // honoraires
};
