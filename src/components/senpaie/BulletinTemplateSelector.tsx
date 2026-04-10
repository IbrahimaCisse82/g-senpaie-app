import { useState } from "react";
import { BULLETIN_TEMPLATES, type BulletinTemplate } from "@/lib/bulletinTemplates";

interface TemplateSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function BulletinTemplateSelector({ selectedId, onSelect }: TemplateSelectorProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-foreground text-lg font-extrabold">🎨 Modèles de Bulletin</h2>
          <p className="text-muted-foreground text-[11px] mt-0.5">Choisissez le style de vos bulletins de paie PDF</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {BULLETIN_TEMPLATES.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            isSelected={selectedId === t.id}
            onSelect={() => onSelect(t.id)}
            onPreview={() => setPreviewId(t.id)}
          />
        ))}
      </div>

      {previewId && (
        <TemplatePreviewModal
          template={BULLETIN_TEMPLATES.find(t => t.id === previewId)!}
          isDefault={selectedId === previewId}
          onSetDefault={() => { onSelect(previewId); setPreviewId(null); }}
          onClose={() => setPreviewId(null)}
        />
      )}
    </div>
  );
}

function TemplateCard({ template, isSelected, onSelect, onPreview }: {
  template: BulletinTemplate;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}) {
  return (
    <div
      className={`relative rounded-lg border-2 overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? "border-primary shadow-md ring-2 ring-primary/20" : "border-border hover:border-primary/50"
      }`}
      onClick={onPreview}
    >
      {/* Mini preview */}
      <div className="h-28 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${template.couleurPrimaire}15, ${template.couleurPrimaire}05)` }}>
        <div className="absolute inset-0 p-2 flex flex-col">
          <div className="rounded" style={{ background: template.couleurPrimaire, height: "16px", marginBottom: "4px" }} />
          <div className="flex-1 space-y-1">
            <div className="h-1.5 bg-muted rounded w-full" />
            <div className="h-1.5 bg-muted rounded w-3/4" />
            <div className="h-1.5 bg-muted rounded w-5/6" />
            <div className="h-1.5 bg-muted rounded w-2/3" />
            <div className="mt-1 rounded" style={{ background: `${template.couleurPrimaire}20`, border: `1px solid ${template.couleurPrimaire}40`, height: "12px" }} />
            <div className="h-1.5 bg-muted rounded w-full" />
            <div className="h-1.5 bg-muted rounded w-4/5" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: template.couleurPrimaire }} />
          <span className="text-foreground text-[11px] font-bold truncate">{template.nom}</span>
        </div>
        <p className="text-muted-foreground text-[9px] leading-tight line-clamp-2">{template.description}</p>
      </div>

      {/* Default badge */}
      {isSelected && (
        <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground text-[8px] font-bold px-1.5 py-0.5 rounded-full">
          ✓ Par défaut
        </div>
      )}

      {/* Set default button */}
      {!isSelected && (
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className="w-full py-1.5 text-[10px] font-bold text-primary bg-primary/5 border-t border-border hover:bg-primary/10 transition-colors"
        >
          Définir par défaut
        </button>
      )}
    </div>
  );
}

function TemplatePreviewModal({ template, isDefault, onSetDefault, onClose }: {
  template: BulletinTemplate;
  isDefault: boolean;
  onSetDefault: () => void;
  onClose: () => void;
}) {
  // Generate a sample preview
  const sampleEmp = {
    matricule: "EX001", prenom: "MOUSSA", nom: "DIOP", sexe: "M" as const,
    dateNaissance: "1985-03-15", lieuNaissance: "Dakar", nationalite: "Sénégalaise",
    adresse: "Mermoz, Dakar", telephone: "77 123 45 67", email: "moussa@email.com",
    situationFamille: "Marié(e)", femmes: 1, enfants: 3,
    fonction: "COMPTABLE", convention: "COMMERCE", categorie: "8_ème C",
    statut: "cadres", contrat: "CDI", dateEntree: "2018-06-01",
    salaireBase: 250000, sursalaire: 50000,
    heuresAbsence: 0, heuresAbsMaladie: 0, tauxMaladie: 0, nbPaniers: 0,
    hs115: 0, hs140: 0, hs160: 0, hs200: 0,
    avanceTabaski: 0, avanceCaisse: 0, avanceFinanciere: 0, retCooperative: 0, fraisMedicaux: 0, indKilometrique: 0,
  };

  const sampleResult = {
    salaireBase: 250000, sursalaire: 50000, primeAnc: 15000, brut: 315000,
    ir: 22500, trimf: 1000, ipresRG_s: 24192, ipresRC_s: 7776, ipm_s: 0, totalRet: 55468,
    cfce: 9450, ipresRG_p: 36288, ipresRC_p: 11664, css_af: 4410, css_at: 630, ipm_p: 0, chargesPat: 62442,
    transport: 26000, net: 285532, masse: 377442, anc: 8, ancRate: 0.08, baseCSS: 63000, partsIR: 3.5, partsTRIMFCap: 2,
    tauxHoraire: 1442.31, retAbsence: 0, indMaladie: 0,
    mtHS115: 0, mtHS140: 0, mtHS160: 0, mtHS200: 0, totalHS: 0,
    primePanier: 0, indKilometrique: 0, totalAvances: 0,
    avanceTabaski: 0, avanceCaisse: 0, avanceFinanciere: 0, retCooperative: 0, fraisMedicaux: 0,
  };

  const sampleEnt = { nom: "GROW HUB SARL", logo: "", adresse: "Dakar, Sénégal", telephone: "33 800 00 00", email: "contact@growhub.sn", ninea: "12345678", rccm: "SN-DKR-2020-B-1234" };

  const html = template.generate(sampleEmp, sampleResult, new Date().getMonth(), new Date().getFullYear(), 8, sampleEnt);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-2xl w-[95vw] max-w-[900px] max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full" style={{ background: template.couleurPrimaire }} />
            <div>
              <h3 className="text-foreground font-bold text-sm">{template.nom}</h3>
              <p className="text-muted-foreground text-[10px]">{template.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isDefault && (
              <button onClick={onSetDefault} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-[11px] font-bold cursor-pointer border-none">
                ✓ Définir par défaut
              </button>
            )}
            {isDefault && (
              <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[11px] font-bold">
                ✓ Modèle par défaut
              </span>
            )}
            <button onClick={onClose} className="px-3 py-1.5 bg-transparent border border-border text-muted-foreground rounded-lg text-[11px] font-bold cursor-pointer hover:bg-secondary">
              ✕ Fermer
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto p-4 bg-muted/30">
          <div className="mx-auto" style={{ maxWidth: "794px", transform: "scale(0.85)", transformOrigin: "top center" }}>
            <iframe
              srcDoc={html}
              className="w-full border border-border rounded-lg shadow-md bg-white"
              style={{ height: "1123px", pointerEvents: "none" }}
              title={`Aperçu ${template.nom}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
