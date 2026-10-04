import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Calcule l'indemnité de licenciement pour 6 ans d'ancienneté et 300 000 F de salaire moyen",
  "Rédige une attestation de travail",
  "Quelle est la durée de préavis d'un cadre ?",
  "Rédige un contrat CDD de 12 mois pour un comptable",
];

export function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${s.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ messages: next }),
      });
      if (!resp.ok || !resp.body) {
        const j = (await resp.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || "Erreur du service");
      }
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let acc = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i: number;
        while ((i = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, i).trim();
          buf = buf.slice(i + 1);
          if (!line.startsWith("data:")) continue;
          const d = line.slice(5).trim();
          if (d === "[DONE]") continue;
          try {
            const delta = (JSON.parse(d) as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setMessages((m) => [...m.slice(0, -1), { role: "assistant", content: acc }]);
              endRef.current?.scrollIntoView({ behavior: "smooth" });
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter flex flex-col gap-4 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold">Assistant IA paie & RH</h2>
        <p className="text-sm text-muted-foreground">Posez vos questions sur le droit du travail sénégalais ou faites rédiger contrats et attestations.</p>
      </div>
      {messages.length === 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} className="text-left text-sm p-3 rounded-md border border-border bg-card hover:bg-accent transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-3">
        {messages.map((m, i) => (
          <div key={i} className={`rounded-md p-3 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground self-end max-w-[85%]" : "bg-card border border-border"}`}>
            {m.content || "…"}
          </div>
        ))}
        {error && <div className="text-sm text-destructive">{error}</div>}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 items-end">
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Votre question…" rows={2}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} />
        <Button type="submit" disabled={loading || !input.trim()}>{loading ? "…" : "Envoyer"}</Button>
      </form>
      {messages.length > 0 && (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setMessages([])}>Nouvelle conversation</Button>
          {messages.at(-1)?.role === "assistant" && (
            <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(messages.at(-1)?.content ?? "")}>Copier la réponse</Button>
          )}
        </div>
      )}
    </div>
  );
}
