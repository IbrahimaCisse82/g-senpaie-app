import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ROLE_LABEL, type AppRole } from "@/hooks/useEntrepriseContext";

interface Props {
  userId: string;
  userEmail: string;
  entrepriseId: string | null;
  role: AppRole | null;
}

interface Member { user_id: string; role: AppRole; joined_at: string; }
interface Invitation { id: string; email: string; role: AppRole; token: string; expires_at: string; accepted_at: string | null; }

export function EquipePage({ userId, userEmail, entrepriseId, role }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState<AppRole>("drh");
  const [loading, setLoading] = useState(true);
  const isAdmin = role === "admin";

  const load = useCallback(async () => {
    if (!entrepriseId) return;
    const { data: m } = await supabase.from("entreprise_members" as never).select("user_id, role, joined_at").eq("entreprise_id", entrepriseId) as { data: Member[] | null };
    const { data: i } = await supabase.from("entreprise_invitations" as never).select("id, email, role, token, expires_at, accepted_at").eq("entreprise_id", entrepriseId).is("accepted_at", null) as { data: Invitation[] | null };
    setMembers(m || []);
    setInvites(i || []);
    setLoading(false);
  }, [entrepriseId]);

  useEffect(() => { load(); }, [load]);

  const invite = async () => {
    if (!entrepriseId || !email) return;
    const { data, error } = await supabase.functions.invoke("invite-member", {
      body: { entrepriseId, email: email.toLowerCase().trim(), role: newRole },
    });
    if (error || (data as { error?: string })?.error) {
      toast({ title: "Erreur", description: error?.message || (data as { error?: string })?.error, variant: "destructive" });
      return;
    }
    const sent = (data as { emailSent?: boolean })?.emailSent;
    toast({
      title: sent ? "Invitation envoyée ✉️" : "Invitation créée",
      description: sent ? `Email envoyé à ${email}.` : "Copiez le lien depuis la liste ci-dessous.",
    });
    setEmail("");
    await load();
  };

  const revoke = async (id: string) => {
    await supabase.from("entreprise_invitations" as never).delete().eq("id", id);
    await load();
  };

  const removeMember = async (uid: string) => {
    if (uid === userId) { toast({ title: "Action impossible", description: "Vous ne pouvez pas vous retirer vous-même." }); return; }
    await supabase.from("entreprise_members" as never).delete().eq("entreprise_id", entrepriseId!).eq("user_id", uid);
    await load();
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/invitation?token=${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Lien copié", description: url });
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-foreground text-xl font-extrabold mb-1">Équipe & rôles</h1>
        <div className="text-muted-foreground text-[11px]">Gestion des accès multi-utilisateurs de votre entreprise</div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 mb-4">
        <div className="text-primary text-[12px] font-bold mb-3">👤 Vous</div>
        <div className="text-foreground text-[13px]"><b>{userEmail}</b> — <span className="text-primary">{role ? ROLE_LABEL[role] : "—"}</span></div>
      </div>

      {isAdmin && (
        <div className="bg-card border border-border rounded-lg p-5 mb-4">
          <div className="text-primary text-[12px] font-bold mb-3">➕ Inviter un collaborateur</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" className="flex-1 px-3 py-2 bg-background border border-border rounded text-[12px] text-foreground" />
            <select value={newRole} onChange={(e) => setNewRole(e.target.value as AppRole)} className="px-3 py-2 bg-background border border-border rounded text-[12px] text-foreground">
              <option value="admin">Admin</option>
              <option value="drh">DRH</option>
              <option value="comptable">Comptable</option>
              <option value="manager">Manager</option>
            </select>
            <button onClick={invite} className="px-4 py-2 bg-primary text-primary-foreground rounded text-[12px] font-bold">Créer l'invitation</button>
          </div>
          <div className="text-muted-foreground text-[10px] mt-2">L'invité doit cliquer sur le lien et se créer un compte avec le même email.</div>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg p-5 mb-4">
        <div className="text-primary text-[12px] font-bold mb-3">👥 Membres ({members.length})</div>
        {loading ? <div className="text-muted-foreground text-[11px]">Chargement…</div> : (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.user_id} className="flex items-center justify-between p-2 bg-background border border-border rounded text-[12px]">
                <div className="flex-1 truncate"><span className="text-foreground font-mono">{m.user_id === userId ? "vous" : m.user_id.slice(0, 8) + "…"}</span></div>
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase mr-2">{ROLE_LABEL[m.role]}</span>
                {isAdmin && m.user_id !== userId && <button onClick={() => removeMember(m.user_id)} className="text-destructive text-[11px]">Retirer</button>}
              </div>
            ))}
          </div>
        )}
      </div>

      {isAdmin && invites.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-primary text-[12px] font-bold mb-3">✉️ Invitations en attente ({invites.length})</div>
          <div className="space-y-2">
            {invites.map((i) => (
              <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 p-2 bg-background border border-border rounded text-[12px]">
                <div className="text-foreground truncate flex-1">{i.email}</div>
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase">{ROLE_LABEL[i.role]}</span>
                <button onClick={() => copyLink(i.token)} className="text-primary text-[11px] font-bold">📋 Copier le lien</button>
                <button onClick={() => revoke(i.id)} className="text-destructive text-[11px]">Révoquer</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EquipePage;
