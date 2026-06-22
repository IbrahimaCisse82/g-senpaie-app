import { useRoles } from "@/hooks/useRH";

interface Props { userId: string; userEmail: string; }

export function EquipePage({ userId, userEmail }: Props) {
  const { roles, loading } = useRoles(userId);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-foreground text-xl font-extrabold mb-1">Équipe & rôles</h1>
        <div className="text-muted-foreground text-[11px]">Gestion des accès et permissions multi-utilisateurs (infrastructure prête, partage entreprise à venir)</div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 mb-4">
        <div className="text-primary text-[12px] font-bold mb-3">👤 Utilisateur connecté</div>
        <div className="text-foreground text-[13px]"><b>{userEmail}</b></div>
        <div className="mt-3">
          <div className="text-muted-foreground text-[11px] mb-1.5 uppercase tracking-wider">Rôles attribués</div>
          {loading ? (
            <div className="text-muted-foreground text-[11px]">Chargement…</div>
          ) : roles.length === 0 ? (
            <div className="text-muted-foreground text-[11px] italic">Aucun rôle attribué — vous êtes propriétaire de votre espace par défaut.</div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {roles.map((r) => (
                <span key={r} className="px-3 py-1 bg-primary/10 text-primary text-[11px] font-bold rounded-full uppercase">{r}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <div className="text-primary text-[12px] font-bold mb-3">📋 Rôles disponibles</div>
        <div className="grid sm:grid-cols-2 gap-3 text-[12px]">
          <div className="p-3 bg-background border border-border rounded-lg">
            <div className="text-foreground font-bold mb-1">👑 Admin</div>
            <div className="text-muted-foreground">Accès complet à toutes les fonctionnalités, paramètres et facturation.</div>
          </div>
          <div className="p-3 bg-background border border-border rounded-lg">
            <div className="text-foreground font-bold mb-1">🧑‍💼 DRH</div>
            <div className="text-muted-foreground">Gestion des employés, congés, contrats, attestations, paie complète.</div>
          </div>
          <div className="p-3 bg-background border border-border rounded-lg">
            <div className="text-foreground font-bold mb-1">💼 Comptable</div>
            <div className="text-muted-foreground">Lecture paie, accès aux déclarations IPRES/CSS, livre de paie, DADS.</div>
          </div>
          <div className="p-3 bg-background border border-border rounded-lg">
            <div className="text-foreground font-bold mb-1">👥 Manager</div>
            <div className="text-muted-foreground">Lecture seule des employés de son équipe et validation des congés.</div>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-senpaie-yellow/10 border border-senpaie-yellow rounded-lg p-4 text-senpaie-yellow text-[11px]">
        🚧 <b>Bientôt :</b> invitation de collaborateurs par email avec partage d'entreprise. L'infrastructure de rôles est en place (table <code>user_roles</code> + fonction sécurisée <code>has_role</code>), prête à être branchée sur l'UI d'invitation.
      </div>
    </div>
  );
}

export default EquipePage;