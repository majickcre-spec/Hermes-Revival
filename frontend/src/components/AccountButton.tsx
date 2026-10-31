import { useEffect, useState } from "react";
import { syncEnabled, getUser, login, register, logout, push } from "@/lib/sync";

/**
 * Floating "account" chip shown on every page. Lets a player sign in with a
 * name + code so their progress syncs across devices. Renders nothing if the
 * backend sync URL (VITE_API_URL) isn't configured.
 */
export default function AccountButton() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"login" | "create">("login");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => { setUser(getUser()); }, [open]);

  if (!syncEnabled()) return null;

  const C = {
    panel: "#1d1533", line: "#3a3356", cream: "#e8e4d9", gold: "#ff9f5c", muted: "#9a93b8", bg: "#140d28",
  };
  const chip: React.CSSProperties = {
    position: "fixed", top: 10, right: 12, zIndex: 2147483000,
    background: "rgba(29,21,51,.9)", color: C.cream, border: `1px solid ${C.line}`,
    borderRadius: 999, padding: "6px 12px", font: "600 13px/1 system-ui,sans-serif",
    cursor: "pointer", backdropFilter: "blur(6px)",
  };

  async function submit() {
    setErr(""); setBusy(true);
    try {
      if (tab === "create") await register(name.trim(), code.trim());
      else await login(name.trim(), code.trim());
      setUser(getUser()); setOpen(false); setName(""); setCode("");
    } catch (e: any) { setErr(e?.message || "Something went wrong."); }
    finally { setBusy(false); }
  }

  const input: React.CSSProperties = {
    width: "100%", background: C.bg, border: `1px solid ${C.line}`, color: C.cream,
    borderRadius: 9, padding: "10px 12px", font: "15px system-ui,sans-serif", marginTop: 4, boxSizing: "border-box",
  };
  const btn = (primary: boolean): React.CSSProperties => ({
    flex: 1, padding: "10px 12px", borderRadius: 10, cursor: "pointer",
    font: "700 14px system-ui,sans-serif",
    background: primary ? C.gold : "transparent", color: primary ? "#201a10" : C.cream,
    border: primary ? "none" : `1px solid ${C.line}`,
  });
  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "8px", cursor: "pointer", background: "transparent",
    border: "none", borderBottom: active ? `2px solid ${C.gold}` : `2px solid transparent`,
    color: active ? C.gold : C.muted, font: "600 14px system-ui,sans-serif",
  });

  return (
    <>
      <button style={chip} onClick={() => setOpen(true)} title="Account & sync">
        {user ? `👤 ${user}` : "👤 Sign in"}
      </button>

      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{ position: "fixed", inset: 0, zIndex: 2147483001, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          <div style={{ width: "100%", maxWidth: 360, background: C.panel, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18, boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}>
            {user ? (
              <div>
                <div style={{ color: C.cream, font: "700 18px system-ui", marginBottom: 6 }}>👤 {user}</div>
                <div style={{ color: C.muted, font: "14px system-ui", lineHeight: 1.5, marginBottom: 14 }}>
                  Your progress syncs to this account. Sign in with the same name &amp; code on any device to pick up where you left off.
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={btn(true)} onClick={async () => { await push(true).catch(() => {}); setOpen(false); }}>Sync now ✓</button>
                  <button style={btn(false)} onClick={() => { logout(); setUser(null); location.reload(); }}>Log out</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", marginBottom: 14, borderBottom: `1px solid ${C.line}` }}>
                  <button style={tabBtn(tab === "login")} onClick={() => { setTab("login"); setErr(""); }}>Log in</button>
                  <button style={tabBtn(tab === "create")} onClick={() => { setTab("create"); setErr(""); }}>Create account</button>
                </div>
                <div style={{ color: C.muted, font: "13px system-ui", lineHeight: 1.5, marginBottom: 10 }}>
                  {tab === "create"
                    ? "Pick a name and a secret code (4+ characters). Use them to sign in on any device — no email needed."
                    : "Enter the name and code you created. Your players, progress and saved instruments will come with you."}
                </div>
                <label style={{ color: C.cream, font: "600 13px system-ui" }}>Name
                  <input style={input} value={name} maxLength={24} autoComplete="off" onChange={(e) => setName(e.target.value)} placeholder="e.g. travis" />
                </label>
                <label style={{ color: C.cream, font: "600 13px system-ui", display: "block", marginTop: 10 }}>Code
                  <input style={input} value={code} type="password" maxLength={64} autoComplete="off" onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder="your secret code" />
                </label>
                {err && <div style={{ color: "#ff8f8c", font: "13px system-ui", marginTop: 10 }}>{err}</div>}
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <button style={btn(false)} onClick={() => setOpen(false)}>Cancel</button>
                  <button style={btn(true)} onClick={submit} disabled={busy}>
                    {busy ? "…" : tab === "create" ? "Create & sync" : "Log in"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
