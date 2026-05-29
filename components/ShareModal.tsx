"use client";
import { useState, useEffect, useRef } from "react";

type Collaborator = {
  id: string;
  email: string;
  permission: "view" | "edit";
  created_at: string;
};

type ShareState = {
  share_token: string;
  is_public: boolean;
  public_can_edit: boolean;
  collaborators: Collaborator[];
};

type Props = {
  docId: string;
  docTitle: string;
  onClose: () => void;
};

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://latexci-web.vercel.app";

export default function ShareModal({ docId, docTitle, onClose }: Props) {
  const [state, setState]         = useState<ShareState | null>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePerm, setInvitePerm]   = useState<"view" | "edit">("view");
  const [inviting, setInviting]   = useState(false);
  const [copied, setCopied]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  function showError(msg: string) {
    setError(msg);
    setTimeout(() => setError(null), 4000);
  }

  // Load current share state
  useEffect(() => {
    fetch(`/api/documents/${docId}/share`)
      .then(r => r.json())
      .then(d => { setState(d); setLoading(false); })
      .catch(() => { showError("Failed to load sharing settings"); setLoading(false); });
  }, [docId]);

  // Close on overlay click
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  async function togglePublic(isPublic: boolean) {
    if (!state) return;
    setSaving(true);
    const res = await fetch(`/api/documents/${docId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_public", is_public: isPublic, public_can_edit: state.public_can_edit }),
    });
    if (res.ok) {
      setState(s => s ? { ...s, is_public: isPublic } : s);
    } else {
      showError("Failed to update link sharing");
    }
    setSaving(false);
  }

  async function toggleEdit(canEdit: boolean) {
    if (!state) return;
    setSaving(true);
    const res = await fetch(`/api/documents/${docId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_public", is_public: state.is_public, public_can_edit: canEdit }),
    });
    if (res.ok) {
      setState(s => s ? { ...s, public_can_edit: canEdit } : s);
    } else {
      showError("Failed to update edit permission");
    }
    setSaving(false);
  }

  async function invite() {
    if (!inviteEmail.trim() || !state) return;
    setInviting(true);
    const res = await fetch(`/api/documents/${docId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "invite", email: inviteEmail.trim(), permission: invitePerm }),
    });
    if (res.ok) {
      const newCollab: Collaborator = {
        id: Date.now().toString(),
        email: inviteEmail.trim().toLowerCase(),
        permission: invitePerm,
        created_at: new Date().toISOString(),
      };
      // Update existing or add new
      setState(s => {
        if (!s) return s;
        const exists = s.collaborators.find(c => c.email === newCollab.email);
        return {
          ...s,
          collaborators: exists
            ? s.collaborators.map(c => c.email === newCollab.email ? { ...c, permission: newCollab.permission } : c)
            : [...s.collaborators, newCollab],
        };
      });
      setInviteEmail("");
    } else {
      const data = await res.json().catch(() => ({}));
      showError(data?.error || "Failed to send invite");
    }
    setInviting(false);
  }

  async function changePermission(email: string, permission: "view" | "edit") {
    const res = await fetch(`/api/documents/${docId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "change_permission", email, permission }),
    });
    if (res.ok) {
      setState(s => s ? {
        ...s,
        collaborators: s.collaborators.map(c => c.email === email ? { ...c, permission } : c),
      } : s);
    } else {
      showError("Failed to change permission");
    }
  }

  async function removeCollaborator(email: string) {
    const res = await fetch(`/api/documents/${docId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", email }),
    });
    if (res.ok) {
      setState(s => s ? { ...s, collaborators: s.collaborators.filter(c => c.email !== email) } : s);
    } else {
      showError("Failed to remove collaborator");
    }
  }

  function copyLink() {
    if (!state) return;
    navigator.clipboard.writeText(`${SITE}/shared/${state.share_token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const shareUrl = state ? `${SITE}/shared/${state.share_token}` : "";

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: "0.45rem 0.7rem",
    background: "var(--surface, #1a1a1a)",
    border: "1px solid var(--border, #333)",
    borderRadius: 8, color: "var(--fg)",
    fontSize: "0.82rem",
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div style={{
        background: "var(--bg, #0f0f0f)",
        border: "1px solid var(--border, #222)",
        borderRadius: 14,
        width: "100%",
        maxWidth: 480,
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>Share document</h2>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "var(--fg-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 360 }}>
              {docTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "var(--fg-muted)", lineHeight: 1, padding: 2 }}
          >
            ×
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            padding: "0.55rem 0.85rem",
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8, fontSize: "0.8rem", color: "#ef4444",
          }}>
            ⚠ {error}
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: "center", color: "var(--fg-muted)", fontSize: "0.85rem" }}>Loading…</p>
        ) : !state ? (
          <p style={{ textAlign: "center", color: "var(--fg-muted)", fontSize: "0.85rem" }}>Failed to load sharing settings.</p>
        ) : (<>

          {/* ── Public link section ───────────────────────────────────────── */}
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.65rem" }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem" }}>🔗 Share via public link</p>
                <p style={{ margin: "0.15rem 0 0", fontSize: "0.75rem", color: "var(--fg-muted)" }}>
                  Anyone with the link can view{state.public_can_edit ? " or edit" : ""}
                </p>
              </div>
              {/* Toggle */}
              <button
                onClick={() => togglePublic(!state.is_public)}
                disabled={saving}
                aria-label={state.is_public ? "Disable public link" : "Enable public link"}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: "none",
                  background: state.is_public ? "var(--accent)" : "var(--border, #444)",
                  position: "relative", cursor: saving ? "wait" : "pointer", flexShrink: 0,
                  transition: "background 0.2s",
                }}
              >
                <span style={{
                  position: "absolute", top: 3, left: state.is_public ? 23 : 3,
                  width: 18, height: 18, borderRadius: "50%", background: "#fff",
                  transition: "left 0.2s",
                }} />
              </button>
            </div>

            {state.is_public && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                {/* Link box + copy */}
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <input
                    readOnly
                    value={shareUrl}
                    onClick={e => (e.target as HTMLInputElement).select()}
                    style={{
                      flex: 1, padding: "0.45rem 0.7rem",
                      background: "var(--surface, #1a1a1a)",
                      border: "1px solid var(--border, #333)",
                      borderRadius: 8, color: "var(--fg-muted)",
                      fontSize: "0.75rem", overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}
                  />
                  <button
                    onClick={copyLink}
                    style={{
                      padding: "0.45rem 0.9rem", borderRadius: 8,
                      background: copied ? "#22c55e" : "var(--accent)",
                      color: "#fff", fontWeight: 700, fontSize: "0.8rem",
                      border: "none", cursor: "pointer", flexShrink: 0,
                      transition: "background 0.2s",
                    }}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

                {/* Allow editing toggle */}
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.8rem", color: "var(--fg-muted)" }}>
                  <input
                    type="checkbox"
                    checked={state.public_can_edit}
                    onChange={e => toggleEdit(e.target.checked)}
                    disabled={saving}
                    style={{ accentColor: "var(--accent)", width: 14, height: 14 }}
                  />
                  Allow anyone to edit
                </label>
              </div>
            )}
          </section>

          <div style={{ height: 1, background: "var(--border, #222)" }} />

          {/* ── Invite collaborators ──────────────────────────────────────── */}
          <section>
            <p style={{ margin: "0 0 0.65rem", fontWeight: 600, fontSize: "0.88rem" }}>👥 Invite by email</p>
            <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.75rem" }}>
              <input
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && invite()}
                style={inputStyle}
              />
              <select
                value={invitePerm}
                onChange={e => setInvitePerm(e.target.value as "view" | "edit")}
                style={{
                  padding: "0.45rem 0.5rem",
                  background: "var(--surface, #1a1a1a)",
                  border: "1px solid var(--border, #333)",
                  borderRadius: 8, color: "var(--fg)",
                  fontSize: "0.82rem", cursor: "pointer",
                }}
              >
                <option value="view">Can view</option>
                <option value="edit">Can edit</option>
              </select>
              <button
                onClick={invite}
                disabled={inviting || !inviteEmail.trim()}
                style={{
                  padding: "0.45rem 0.9rem", borderRadius: 8,
                  background: "var(--accent)", color: "#fff",
                  fontWeight: 700, fontSize: "0.8rem",
                  border: "none",
                  cursor: inviting || !inviteEmail.trim() ? "not-allowed" : "pointer",
                  opacity: inviteEmail.trim() ? 1 : 0.5,
                  flexShrink: 0,
                }}
              >
                {inviting ? "…" : "Invite"}
              </button>
            </div>

            {/* Collaborator list */}
            {state.collaborators.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {state.collaborators.map(c => (
                  <div key={c.id} style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.45rem 0.65rem",
                    background: "var(--surface, #1a1a1a)",
                    border: "1px solid var(--border, #333)",
                    borderRadius: 8,
                  }}>
                    <span style={{ flex: 1, fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.email}
                    </span>
                    {/* Editable permission dropdown */}
                    <select
                      value={c.permission}
                      onChange={e => changePermission(c.email, e.target.value as "view" | "edit")}
                      style={{
                        padding: "0.2rem 0.4rem",
                        background: c.permission === "edit" ? "rgba(99,102,241,0.15)" : "var(--surface2, #222)",
                        border: "1px solid var(--border, #333)",
                        borderRadius: 5, fontSize: "0.72rem", fontWeight: 600,
                        color: c.permission === "edit" ? "#818cf8" : "var(--fg-muted)",
                        cursor: "pointer", flexShrink: 0,
                      }}
                    >
                      <option value="view">Can view</option>
                      <option value="edit">Can edit</option>
                    </select>
                    <button
                      onClick={() => removeCollaborator(c.email)}
                      title="Remove"
                      style={{
                        background: "none", border: "none",
                        cursor: "pointer", color: "var(--fg-muted)",
                        fontSize: "0.9rem", padding: "0 0.1rem",
                        lineHeight: 1, flexShrink: 0,
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--fg-muted)")}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: "0.78rem", color: "var(--fg-muted)", margin: 0 }}>
                No collaborators yet. Invite someone above.
              </p>
            )}
          </section>
        </>)}
      </div>
    </div>
  );
}
