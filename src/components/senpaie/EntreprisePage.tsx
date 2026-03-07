import { useState } from "react";
import type { Entreprise } from "@/lib/payroll";
import { Field, inputClass } from "./Modal";

interface EntreprisePageProps {
  entreprise: Entreprise;
  onSave: (data: Entreprise) => void;
  onUploadLogo?: (file: File) => Promise<string | null>;
}

export function EntreprisePage({ entreprise, onSave, onUploadLogo }: EntreprisePageProps) {
  const [form, setForm] = useState<Entreprise>({ ...entreprise });
  const [logoPreview, setLogoPreview] = useState(entreprise.logo || "");
  const [uploading, setUploading] = useState(false);
  const set = (k: keyof Entreprise, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Le fichier est trop volumineux. Max 2 Mo.");
      return;
    }

    if (onUploadLogo) {
      setUploading(true);
      const url = await onUploadLogo(file);
      setUploading(false);
      if (url) {
        setLogoPreview(url);
        set("logo", url);
      }
    } else {
      // Fallback to base64
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setLogoPreview(result);
        set("logo", result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-[700px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-foreground text-xl font-extrabold mb-1">🏢 Informations de l'Entreprise</h1>
          <div className="text-muted-foreground text-[11px]">Ces informations apparaissent sur les bulletins de paie</div>
        </div>
        <button onClick={() => onSave(form)} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-[13px] cursor-pointer border-none">
          💾 Enregistrer
        </button>
      </div>

      {/* Logo */}
      <div className="bg-card rounded-lg p-5 mb-4 border border-border">
        <div className="text-primary text-xs font-bold mb-3.5 pb-2 border-b border-border">🖼️ Logo de l'entreprise</div>
        <div className="flex gap-5 items-center">
          <div className={`w-[140px] h-[80px] bg-background border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden shrink-0 ${logoPreview ? "border-primary" : "border-border"}`}>
            {uploading ? (
              <div className="text-primary text-[11px] animate-pulse">Upload…</div>
            ) : logoPreview ? (
              <img src={logoPreview} alt="logo" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="text-center text-muted-foreground text-[11px]"><div className="text-2xl mb-1">🖼️</div>Aucun logo</div>
            )}
          </div>
          <div>
            <label className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-xs cursor-pointer mb-2.5">
              📁 Choisir un logo
              <input type="file" accept="image/*" onChange={handleLogo} className="hidden" disabled={uploading} />
            </label>
            {logoPreview && (
              <button onClick={() => { setLogoPreview(""); set("logo", ""); }}
                className="ml-2.5 px-3 py-2 bg-transparent border border-destructive text-destructive rounded-lg text-xs cursor-pointer">
                ✕ Supprimer
              </button>
            )}
            <div className="text-muted-foreground text-[11px] mt-1">PNG, JPG, SVG · Max 2 Mo</div>
          </div>
        </div>
      </div>

      {/* Coordonnées */}
      <div className="bg-card rounded-lg p-5 border border-border">
        <div className="text-primary text-xs font-bold mb-3.5 pb-2 border-b border-border">📋 Coordonnées</div>
        <div className="grid grid-cols-2 gap-x-5">
           <Field label="Nom de l'entreprise *"><input value={form.nom} onChange={(e) => set("nom", e.target.value)} className={inputClass} placeholder="Nom officiel de votre entreprise" /></Field>
           <Field label="Téléphone"><input value={form.telephone} onChange={(e) => set("telephone", e.target.value)} className={inputClass} placeholder="ex: +221 77 123 45 67" /></Field>
           <Field label="Adresse"><input value={form.adresse} onChange={(e) => set("adresse", e.target.value)} className={inputClass} placeholder="ex: Rue 01, Plateau, Dakar" /></Field>
           <Field label="Email"><input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputClass} placeholder="ex: contact@entreprise.sn" /></Field>
           <Field label="NINEA"><input value={form.ninea} onChange={(e) => set("ninea", e.target.value)} className={inputClass} placeholder="ex: 006760210 (9 chiffres)" /></Field>
           <Field label="RCCM"><input value={form.rccm} onChange={(e) => set("rccm", e.target.value)} className={inputClass} placeholder="ex: SN-DKR-2024-B-00001" /></Field>
        </div>
      </div>

      {/* Aperçu */}
      <div className="mt-4 bg-card rounded-lg p-4 border border-border">
        <div className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider mb-3">Aperçu du bulletin</div>
        <div className="bg-emerald-900 rounded-md px-3.5 py-2.5 flex justify-between items-center mb-1.5">
          <div className="flex items-center gap-3">
            {logoPreview ? (
              <img src={logoPreview} alt="logo" className="h-8 max-w-[80px] object-contain" />
            ) : (
              <div className="w-12 h-8 bg-emerald-950 rounded flex items-center justify-center text-primary text-[9px]">LOGO</div>
            )}
            <div className="text-primary font-black text-[13px]">{form.nom || "Nom entreprise"}</div>
          </div>
          <div className="text-right text-emerald-300 text-[10px]">
            <div className="font-bold text-white text-xs">BULLETIN DE PAIE</div>
            <div>Période : {MOIS[new Date().getMonth()]} {new Date().getFullYear()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const MOIS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

export default EntreprisePage;
