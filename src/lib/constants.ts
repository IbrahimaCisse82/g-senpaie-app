import type { Employee, PayrollParams, Convention, Entreprise } from "./payroll";

// ══════════════════════════════════════════════════════════════════════════════
//  Default Employees — Corrigés selon le fichier Excel source
// ══════════════════════════════════════════════════════════════════════════════
export const DEFAULT_EMPLOYEES: Employee[] = [
  {
    matricule: "IF0001", prenom: "DIEGANE", nom: "BOB", sexe: "M",
    dateNaissance: "1971-12-19", lieuNaissance: "DIOFIOR", nationalite: "Sénégalaise",
    adresse: "Grand Yoff, Maka 2, Dakar", telephone: "(221) 77 249 73 98",
    situationFamille: "Marié(e)", femmes: 1, enfants: 5,
    fonction: "COMMIS", convention: "COMMERCE", categorie: "3_ème",
    statut: "employés", contrat: "CDI", dateEntree: "2009-01-01",
    salaireBase: 77840, sursalaire: 20104,
  },
  {
    matricule: "IF0002", prenom: "HELENE AIDA", nom: "MALACK", sexe: "F",
    dateNaissance: "1977-02-27", lieuNaissance: "PIKINE", nationalite: "Sénégalaise",
    adresse: "Sicap Liberté 3, N#1889, Dakar", telephone: "(221) 77 564 38 77",
    situationFamille: "Marié(e)", femmes: 0, enfants: 3,
    fonction: "SECRETAIRE MEDICALE", convention: "COMMERCE", categorie: "7_ème B",
    statut: "agents de maîtrise", contrat: "CDI", dateEntree: "2009-06-01",
    salaireBase: 113984, sursalaire: 61659,
  },
];

// ══════════════════════════════════════════════════════════════════════════════
//  Default Parameters — Conforme au fichier Excel
// ══════════════════════════════════════════════════════════════════════════════
export const DEFAULT_PARAMS: PayrollParams = {
  CFCE:      { label: "CFCE",            taux: 0.03,  tauxSalarial: 0,   tauxPatronal: 1,   plafond: null },
  BRS:       { label: "BRS",             taux: 0.05,  tauxSalarial: 1,   tauxPatronal: 0,   plafond: null },
  IPRES_RG:  { label: "IPRES R.G.",      taux: 0.14,  tauxSalarial: 0.4, tauxPatronal: 0.6, plafond: 432000 },
  IPRES_RCC: { label: "IPRES R.C.C.",    taux: 0.06,  tauxSalarial: 0.4, tauxPatronal: 0.6, plafond: 1296000 },
  CSS_AF:    { label: "CSS Alloc. Fam.",  taux: 0.07,  tauxSalarial: 0,   tauxPatronal: 1,   plafond: 63000 },
  CSS_AT:    { label: "CSS Acc. Trav.",   taux: 0.01,  tauxSalarial: 0,   tauxPatronal: 1,   plafond: 63000 },
  IPM:       { label: "IPM",             taux: 0,     tauxSalarial: 0.5, tauxPatronal: 0.5, plafond: null },
  transport: { label: "Ind. Transport",  valeur: 26000 },
};

// ══════════════════════════════════════════════════════════════════════════════
//  Default Entreprise
// ══════════════════════════════════════════════════════════════════════════════
export const DEFAULT_ENTREPRISE: Entreprise = {
  nom: "LE MEDICAL KAMANO",
  logo: "",
  adresse: "4, Bld République x Mouhamed V, Dakar",
  telephone: "+221 77 633 01 34",
  email: "contact@medicalkamano.sn",
  ninea: "006760210",
  rccm: "SN-DKR-2005-B-12345",
};

// ══════════════════════════════════════════════════════════════════════════════
//  Conventions Collectives — Conformes au fichier Excel
// ══════════════════════════════════════════════════════════════════════════════
export const DEFAULT_CONVENTIONS: Convention[] = [
  {
    id: "CC001", nom: "COMMERCE", secteur: "Commerce général", dateSignature: "1982-01-01",
    description: "Convention collective nationale du commerce applicable au Sénégal.",
    categories: [
      { id: "c1",  code: "1_er A",   libelle: "1ère catégorie A",   statut: "employés",             salaireMinima: 70706 },
      { id: "c2",  code: "1_er B",   libelle: "1ère catégorie B",   statut: "employés",             salaireMinima: 74870 },
      { id: "c3",  code: "2_ème",    libelle: "2ème catégorie",     statut: "employés",             salaireMinima: 75361 },
      { id: "c4",  code: "3_ème",    libelle: "3ème catégorie",     statut: "employés",             salaireMinima: 77840 },
      { id: "c5",  code: "4_ème",    libelle: "4ème catégorie",     statut: "employés",             salaireMinima: 82272 },
      { id: "c6",  code: "5_ème",    libelle: "5ème catégorie",     statut: "employés",             salaireMinima: 89244 },
      { id: "c7",  code: "6_ème",    libelle: "6ème catégorie",     statut: "employés",             salaireMinima: 93790 },
      { id: "c8",  code: "7_ème A",  libelle: "7ème catégorie A",   statut: "agents de maîtrise",   salaireMinima: 105342 },
      { id: "c9",  code: "7_ème B",  libelle: "7ème catégorie B",   statut: "agents de maîtrise",   salaireMinima: 113984 },
      { id: "c10", code: "8_ème A",  libelle: "8ème catégorie A",   statut: "agents de maîtrise",   salaireMinima: 115718 },
      { id: "c11", code: "8_ème B",  libelle: "8ème catégorie B",   statut: "agents de maîtrise",   salaireMinima: 123484 },
      { id: "c12", code: "8_ème C",  libelle: "8ème catégorie C",   statut: "cadres",               salaireMinima: 124254 },
      { id: "c13", code: "9_ème A",  libelle: "9ème catégorie A",   statut: "cadres",               salaireMinima: 125543 },
      { id: "c14", code: "9_ème B",  libelle: "9ème catégorie B",   statut: "cadres",               salaireMinima: 132498 },
      { id: "c15", code: "10_ème A", libelle: "10ème catégorie A",  statut: "cadres",               salaireMinima: 141024 },
      { id: "c16", code: "10_ème B", libelle: "10ème catégorie B",  statut: "cadres",               salaireMinima: 157097 },
      { id: "c17", code: "10_ème C", libelle: "10ème catégorie C",  statut: "cadres",               salaireMinima: 174049 },
      { id: "c18", code: "11_ème",   libelle: "11ème catégorie",    statut: "cadres",               salaireMinima: 195119 },
    ],
  },
  {
    id: "CC002", nom: "BTP", secteur: "Bâtiment & Travaux Publics", dateSignature: "1985-03-15",
    description: "Convention collective du secteur BTP au Sénégal.",
    categories: [
      { id: "b1",  code: "H1",     libelle: "Manœuvre H1",        statut: "ouvriers",  salaireMinima: 72085 },
      { id: "b2",  code: "H2",     libelle: "Manœuvre H2",        statut: "ouvriers",  salaireMinima: 72425 },
      { id: "b3",  code: "H3",     libelle: "Manœuvre H3",        statut: "ouvriers",  salaireMinima: 77873 },
      { id: "b4",  code: "4 ème A", libelle: "4ème A Ouvrier",    statut: "ouvriers",  salaireMinima: 80022 },
      { id: "b5",  code: "4 ème B", libelle: "4ème B Ouvrier",    statut: "ouvriers",  salaireMinima: 82171 },
      { id: "b6",  code: "5 ème A", libelle: "5ème A Ouvrier",    statut: "ouvriers",  salaireMinima: 83171 },
      { id: "b7",  code: "5 ème B", libelle: "5ème B Ouvrier",    statut: "ouvriers",  salaireMinima: 86557 },
      { id: "b8",  code: "AM 1",   libelle: "Agent de Maîtrise 1", statut: "agents de maîtrise", salaireMinima: 97615 },
      { id: "b9",  code: "AM 2",   libelle: "Agent de Maîtrise 2", statut: "agents de maîtrise", salaireMinima: 114034 },
      { id: "b10", code: "AM 3",   libelle: "Agent de Maîtrise 3", statut: "agents de maîtrise", salaireMinima: 125290 },
      { id: "b11", code: "P1A",    libelle: "Cadre P1A",          statut: "cadres",    salaireMinima: 142258 },
      { id: "b12", code: "P1B",    libelle: "Cadre P1B",          statut: "cadres",    salaireMinima: 144873 },
      { id: "b13", code: "P2A",    libelle: "Cadre P2A",          statut: "cadres",    salaireMinima: 158139 },
      { id: "b14", code: "P3A",    libelle: "Cadre P3A",          statut: "cadres",    salaireMinima: 189340 },
      { id: "b15", code: "P4",     libelle: "Cadre P4",           statut: "cadres",    salaireMinima: 308589 },
      { id: "b16", code: "P5",     libelle: "Cadre P5",           statut: "cadres",    salaireMinima: 348720 },
    ],
  },
  {
    id: "CC003", nom: "INDUSTRIES_ALIMENTAIRES", secteur: "Industries Alimentaires", dateSignature: "1983-06-01",
    description: "Convention collective des industries alimentaires au Sénégal.",
    categories: [
      { id: "ia1", code: "1ère Ouvriers",  libelle: "1ère Ouvriers",  statut: "ouvriers",             salaireMinima: 64281 },
      { id: "ia2", code: "3ème Ouvriers",  libelle: "3ème Ouvriers",  statut: "ouvriers",             salaireMinima: 69009 },
      { id: "ia3", code: "5ème Ouvriers",  libelle: "5ème Ouvriers",  statut: "ouvriers",             salaireMinima: 74162 },
      { id: "ia4", code: "7ème Ouvriers",  libelle: "7ème Ouvriers",  statut: "ouvriers",             salaireMinima: 85119 },
      { id: "ia5", code: "1ère Employés",  libelle: "1ère Employés",  statut: "employés",             salaireMinima: 64258 },
      { id: "ia6", code: "4ème Employés",  libelle: "4ème Employés",  statut: "employés",             salaireMinima: 76721 },
      { id: "ia7", code: "7ème Employés",  libelle: "7ème Employés",  statut: "employés",             salaireMinima: 95679 },
      { id: "ia8", code: "AM0",            libelle: "Agent Maîtrise 0", statut: "agents de maîtrise", salaireMinima: 98981 },
      { id: "ia9", code: "AM3",            libelle: "Agent Maîtrise 3", statut: "agents de maîtrise", salaireMinima: 119307 },
      { id: "ia10", code: "AM5",           libelle: "Agent Maîtrise 5", statut: "agents de maîtrise", salaireMinima: 133096 },
    ],
  },
  {
    id: "CC004", nom: "SECURITE_PRIVEE", secteur: "Sécurité Privée", dateSignature: "1995-01-01",
    description: "Convention collective du secteur de la sécurité privée au Sénégal.",
    categories: [
      { id: "sp1", code: "1er",     libelle: "1er Employé",         statut: "employés",             salaireMinima: 74870 },
      { id: "sp2", code: "3ème_A",  libelle: "3ème A",              statut: "employés",             salaireMinima: 77840 },
      { id: "sp3", code: "5ème_A",  libelle: "5ème A",              statut: "employés",             salaireMinima: 89244 },
      { id: "sp4", code: "7ème_A",  libelle: "7ème A",              statut: "agents de maîtrise",   salaireMinima: 110160 },
      { id: "sp5", code: "8ème_A",  libelle: "8ème A",              statut: "agents de maîtrise",   salaireMinima: 120960 },
      { id: "sp6", code: "9ème_A",  libelle: "9ème A",              statut: "cadres",               salaireMinima: 127050 },
      { id: "sp7", code: "10ème_A", libelle: "10ème A",             statut: "cadres",               salaireMinima: 168000 },
      { id: "sp8", code: "11ème_A", libelle: "11ème A",             statut: "cadres",               salaireMinima: 195119 },
    ],
  },
  {
    id: "CC005", nom: "INDUSTRIES_HOTELIERES", secteur: "Hôtellerie & Restauration", dateSignature: "1990-01-01",
    description: "Convention collective des industries hôtelières au Sénégal.",
    categories: [
      { id: "ih1", code: "1-er",    libelle: "1ère catégorie",   statut: "employés",             salaireMinima: 64282 },
      { id: "ih2", code: "4-ème",   libelle: "4ème catégorie",   statut: "employés",             salaireMinima: 71100 },
      { id: "ih3", code: "6-ème B", libelle: "6ème B",           statut: "employés",             salaireMinima: 86577 },
      { id: "ih4", code: "7-ème",   libelle: "7ème catégorie",   statut: "agents de maîtrise",   salaireMinima: 93707 },
      { id: "ih5", code: "9-ème A", libelle: "9ème A",           statut: "cadres",               salaireMinima: 110561 },
      { id: "ih6", code: "11-ème B", libelle: "11ème B",         statut: "cadres",               salaireMinima: 176799 },
    ],
  },
  {
    id: "CC006", nom: "PETROLE_ET_GAZ", secteur: "Pétrole et Gaz", dateSignature: "2000-01-01",
    description: "Convention collective du secteur pétrole et gaz au Sénégal.",
    categories: [
      { id: "pg1", code: "O1",    libelle: "Ouvrier O1",         statut: "ouvriers",             salaireMinima: 142299 },
      { id: "pg2", code: "OS2C",  libelle: "Ouvrier Spéc. 2C",   statut: "ouvriers",             salaireMinima: 173197 },
      { id: "pg3", code: "OP3C",  libelle: "Ouvrier Principal 3C", statut: "ouvriers",           salaireMinima: 266632 },
      { id: "pg4", code: "3 ème", libelle: "3ème Employé",        statut: "employés",             salaireMinima: 163386 },
      { id: "pg5", code: "AM_2",  libelle: "Agent Maîtrise 2",   statut: "agents de maîtrise",   salaireMinima: 284532 },
      { id: "pg6", code: "P2A",   libelle: "Cadre P2A",          statut: "cadres",               salaireMinima: 334836 },
      { id: "pg7", code: "P5",    libelle: "Cadre P5",           statut: "cadres",               salaireMinima: 487849 },
    ],
  },
];

export const EMPTY_EMPLOYEE: Employee = {
  matricule: "", prenom: "", nom: "", sexe: "M",
  dateNaissance: "", lieuNaissance: "", nationalite: "Sénégalaise",
  adresse: "", telephone: "", situationFamille: "Célibataire",
  femmes: 0, enfants: 0, fonction: "", convention: "COMMERCE",
  categorie: "", statut: "employés", contrat: "CDI",
  dateEntree: "", salaireBase: 0, sursalaire: 0,
};

export const STATUT_COLORS: Record<string, string> = {
  "employés": "senpaie-blue",
  "agents de maîtrise": "senpaie-yellow",
  "cadres": "senpaie-purple",
  "ouvriers": "primary",
};

export type TabId = "dashboard" | "employes" | "cotisations" | "tendances" | "simulateur" | "conventions" | "entreprise" | "parametres";

export const NAV_ITEMS: { id: TabId; icon: string; label: string }[] = [
  { id: "dashboard",    icon: "◈",  label: "Tableau de bord" },
  { id: "employes",     icon: "◎",  label: "Employés" },
  { id: "cotisations",  icon: "◉",  label: "Cotisations" },
  { id: "tendances",    icon: "∿",  label: "Tendances" },
  { id: "simulateur",   icon: "⊕",  label: "Simulateur" },
  { id: "conventions",  icon: "📋", label: "Conventions" },
  { id: "entreprise",   icon: "🏢", label: "Entreprise" },
  { id: "parametres",   icon: "⚙",  label: "Paramètres" },
];
