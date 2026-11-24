import { useEffect, useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Remplace window.confirm / window.alert : ces boîtes natives sont bloquées dans les aperçus intégrés
 * (iframe sans « allow-modals ») et font échouer l'action sans message.
 */
interface Demande { message: string; titre: string; confirmer: string; annuler: string | null; resolve: (ok: boolean) => void }

let ouvrir: ((d: Demande) => void) | null = null;

export function confirmer(message: string, opts: { titre?: string; confirmer?: string; annuler?: string } = {}): Promise<boolean> {
  return new Promise((resolve) => {
    const d: Demande = { message, titre: opts.titre ?? "Confirmation", confirmer: opts.confirmer ?? "Confirmer", annuler: opts.annuler ?? "Annuler", resolve };
    // Sans hôte monté (tests, rendu hors application) : on retombe sur la boîte native.
    if (!ouvrir) { resolve(typeof window !== "undefined" && typeof window.confirm === "function" ? window.confirm(message) : false); return; }
    ouvrir(d);
  });
}

export function avertir(message: string, titre = "Information"): Promise<void> {
  return new Promise((resolve) => {
    if (!ouvrir) { if (typeof window !== "undefined") window.alert(message); resolve(); return; }
    ouvrir({ message, titre, confirmer: "OK", annuler: null, resolve: () => resolve() });
  });
}

export function DialogHost() {
  const [file, setFile] = useState<Demande[]>([]);
  useEffect(() => {
    ouvrir = (d) => setFile((f) => [...f, d]);
    return () => { ouvrir = null; };
  }, []);
  const courant = file[0];
  const fermer = (ok: boolean) => { courant?.resolve(ok); setFile((f) => f.slice(1)); };
  return (
    <AlertDialog open={!!courant} onOpenChange={(o) => { if (!o && courant) fermer(false); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{courant?.titre}</AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-line">{courant?.message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {courant?.annuler && <AlertDialogCancel>{courant.annuler}</AlertDialogCancel>}
          <AlertDialogAction onClick={() => fermer(true)}>{courant?.confirmer}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
