"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { latexToHtml, ParseWarning } from "@/lib/latex-parser";
import LZString from "lz-string";
import { createClient } from "@/lib/supabase/client";
import type { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import UpgradeModal from "@/components/UpgradeModal";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });

const STORAGE_KEY = "latexci_source";

const SAMPLE = `\\documentclass{article}
\\usepackage{amsmath}
\\usepackage{amssymb}

\\title{A Brief Introduction to Calculus}
\\author{latexci Demo}
\\date{\\today}

\\begin{document}

\\maketitle

\\begin{abstract}
Calculus is the mathematical study of continuous change, founded by Newton and Leibniz in the 17th century. This document gives a concise overview of limits, derivatives, and integration.
\\end{abstract}

\\section{Limits and Derivatives}

The derivative of a function $f(x)$ is defined as the limit:

\\[
  f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}
\\]

For example, if $f(x) = x^2$, then $f'(x) = 2x$.

\\subsection{Common Derivatives}

\\begin{itemize}
  \\item $\\frac{d}{dx}[x^n] = nx^{n-1}$
  \\item $\\frac{d}{dx}[\\sin x] = \\cos x$
  \\item $\\frac{d}{dx}[e^x] = e^x$
  \\item $\\frac{d}{dx}[\\ln x] = \\frac{1}{x}$
\\end{itemize}

\\section{Integration}

The fundamental theorem of calculus states:

\\[
  \\int_a^b f'(x)\\,dx = f(b) - f(a)
\\]

The Gaussian integral is a beautiful result:

\\[
  \\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}
\\]

\\section{Maxwell's Equations}

In differential form, Maxwell's equations are:

\\begin{align}
  \\nabla \\cdot \\mathbf{E} &= \\frac{\\rho}{\\varepsilon_0} \\\\
  \\nabla \\cdot \\mathbf{B} &= 0 \\\\
  \\nabla \\times \\mathbf{E} &= -\\frac{\\partial \\mathbf{B}}{\\partial t} \\\\
  \\nabla \\times \\mathbf{B} &= \\mu_0\\mathbf{J} + \\mu_0\\varepsilon_0\\frac{\\partial \\mathbf{E}}{\\partial t}
\\end{align}

\\end{document}
`;

const SNIPPETS: { label: string; icon: string; insert: string }[] = [
  { label: "Inline math",   icon: "∑", insert: "$...$" },
  { label: "Display math",  icon: "∫", insert: "\\[\n  ...\n\\]" },
  { label: "Align",         icon: "=", insert: "\\begin{align}\n  a &= b \\\\\\\\\n  c &= d\n\\end{align}" },
  { label: "Itemize",       icon: "•", insert: "\\begin{itemize}\n  \\item First\n  \\item Second\n\\end{itemize}" },
  { label: "Enumerate",     icon: "1.", insert: "\\begin{enumerate}\n  \\item First\n  \\item Second\n\\end{enumerate}" },
  { label: "Section",       icon: "§", insert: "\\section{Title}" },
  { label: "Bold",          icon: "B", insert: "\\textbf{text}" },
  { label: "Italic",        icon: "I", insert: "\\textit{text}" },
  { label: "Fraction",      icon: "½", insert: "\\frac{a}{b}" },
  { label: "Sum",           icon: "Σ", insert: "\\sum_{i=1}^{n}" },
  { label: "Integral",      icon: "∫", insert: "\\int_{a}^{b} f(x)\\,dx" },
  { label: "Matrix",        icon: "[]", insert: "\\begin{pmatrix}\n  a & b \\\\\\\\\n  c & d\n\\end{pmatrix}" },
  { label: "Theorem",       icon: "⊢", insert: "\\begin{theorem}\n  Statement here.\n\\end{theorem}" },
  { label: "α β λ",         icon: "α", insert: "\\alpha \\beta \\lambda" },
];

export default function LatexEditor({ initialValue }: { initialValue?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const docId = searchParams.get("doc");

  const [source, setSource]           = useState(initialValue ?? SAMPLE);
  const [html, setHtml]               = useState("");
  const [warnings, setWarnings]       = useState<ParseWarning[]>([]);
  const [copied, setCopied]           = useState(false);
  const [shared, setShared]           = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [isMobile, setIsMobile]       = useState(false);
  const [activePane, setActivePane]   = useState<"editor" | "preview">("editor");
  const [extensions, setExtensions]   = useState<unknown[]>([]);
  const [saveStatus, setSaveStatus]   = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pdfStatus, setPdfStatus]     = useState<"idle" | "compiling" | "error">("idle");
  const [userId, setUserId]           = useState<string | null>(null);
  const [userEmail, setUserEmail]     = useState<string | null>(null);
  const [docTitle, setDocTitle]       = useState("Untitled");
  // Role on the open cloud doc: owner | collaborator with edit | view-only
  const [docRole, setDocRole]         = useState<"owner" | "edit" | "view" | null>(null);
  const [loadError, setLoadError]     = useState(false);
  const [cloudSaving, setCloudSaving] = useState(false);
  const [isLight, setIsLight]         = useState(false);
  const [splitPct, setSplitPct]       = useState(50); // editor width %
  const [upgradeModal, setUpgradeModal] = useState<{
    feature: "pdf_export";
    reason: "sign_in_required" | "upgrade_required";
  } | null>(null);
  const [clearPending, setClearPending] = useState(false);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClear = useCallback(() => {
    if (clearPending) {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      setClearPending(false);
      setSource("");
    } else {
      setClearPending(true);
      clearTimerRef.current = setTimeout(() => setClearPending(false), 2500);
    }
  }, [clearPending]);

  const previewRef    = useRef<HTMLDivElement>(null);
  const previewScroll = useRef<HTMLDivElement>(null);
  const editorRef     = useRef<ReactCodeMirrorRef>(null);
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Only true after a cloud document has been read successfully. Autosave is
  // gated on this so a FAILED load never lets autosave overwrite the real
  // (unread) document with the sample/placeholder content.
  const docLoadedOk   = useRef(false);
  const splitRef      = useRef<HTMLDivElement>(null);
  const isDragging    = useRef(false);
  const supabase      = useMemo(() => createClient(), []);

  // Track theme (dark/light toggle)
  useEffect(() => {
    const check = () => setIsLight(document.documentElement.classList.contains("light"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Column resize drag
  useEffect(() => {
    const handle = splitRef.current;
    if (!handle || isMobile) return;
    const container = handle.parentElement;
    if (!container) return;
    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      e.preventDefault();
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const rect = container.getBoundingClientRect();
      const pct = Math.min(75, Math.max(25, ((e.clientX - rect.left) / rect.width) * 100));
      setSplitPct(pct);
    };
    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    handle.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      handle.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isMobile]);

  // Get logged-in user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setUserEmail(data.user?.email ?? null);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load CodeMirror extensions — theme + LaTeX keybindings. Re-runs on dark/light toggle.
  useEffect(() => {
    (async () => {
      const [{ createTheme }, { tags }, lang, { keymap }, { Prec }] = await Promise.all([
        import("@uiw/codemirror-themes"),
        import("@lezer/highlight"),
        import("@codemirror/lang-markdown").then(m => m.markdown()),
        import("@codemirror/view"),
        import("@codemirror/state"),
      ]);

      // ── Theme ─────────────────────────────────────────────────────────────
      const theme = isLight
        ? createTheme({
            theme: "light",
            settings: {
              background: "#faf6f0", foreground: "#2c2018", caret: "#7a5c40",
              selection: "rgba(180,150,110,0.28)", selectionMatch: "rgba(180,150,110,0.16)",
              lineHighlight: "#f5efea", gutterBackground: "#f0ebe3",
              gutterForeground: "#b0a090", gutterBorder: "transparent",
            },
            styles: [
              { tag: tags.comment,  color: "#9a8070", fontStyle: "italic" },
              { tag: tags.keyword,  color: "#6d3fa0", fontWeight: "600" },
              { tag: tags.operator, color: "#6d3fa0" },
              { tag: tags.string,   color: "#3d7a50" },
              { tag: tags.number,   color: "#c06020" },
              { tag: tags.escape,   color: "#c06020" },
              { tag: [tags.bracket, tags.paren, tags.brace], color: "#7a5c3c" },
              { tag: tags.meta,     color: "#a04040" },
              { tag: tags.tagName,  color: "#6d3fa0" },
              { tag: tags.heading,  fontWeight: "700" },
              { tag: tags.emphasis, fontStyle: "italic" },
              { tag: tags.strong,   fontWeight: "bold" },
              { tag: [tags.url, tags.link], color: "#3d5fa0" },
              { tag: tags.invalid,  color: "#cc2222" },
            ],
          })
        : createTheme({
            theme: "dark",
            settings: {
              background: "#13131e", foreground: "#c8c5e0", caret: "#7c6cf8",
              selection: "rgba(124,108,248,0.22)", selectionMatch: "rgba(124,108,248,0.12)",
              lineHighlight: "#1c1c2a", gutterBackground: "#0f0f1a",
              gutterForeground: "#4a4868", gutterBorder: "transparent",
            },
            styles: [
              { tag: tags.comment,  color: "#5c5a7a", fontStyle: "italic" },
              { tag: tags.keyword,  color: "#b49ff5", fontWeight: "600" },
              { tag: tags.operator, color: "#b49ff5" },
              { tag: tags.string,   color: "#78b08a" },
              { tag: tags.number,   color: "#d4a56a" },
              { tag: tags.escape,   color: "#d4a56a" },
              { tag: [tags.bracket, tags.paren, tags.brace], color: "#8080b0" },
              { tag: tags.meta,     color: "#e07070" },
              { tag: tags.tagName,  color: "#b49ff5" },
              { tag: tags.heading,  fontWeight: "700" },
              { tag: tags.emphasis, fontStyle: "italic" },
              { tag: tags.strong,   fontWeight: "bold" },
              { tag: [tags.url, tags.link], color: "#6a9fd8" },
              { tag: tags.invalid,  color: "#ef4444" },
            ],
          });

      // ── LaTeX keyboard shortcuts ──────────────────────────────────────────
      type EV = import("@codemirror/view").EditorView;

      /** Wrap selection (or placeholder) with \cmd{...} */
      function wrapCmd(cmd: string, placeholder = "text") {
        return (v: EV): boolean => {
          const sel = v.state.selection.main;
          const inner = v.state.doc.sliceString(sel.from, sel.to) || placeholder;
          const repl  = `\\${cmd}{${inner}}`;
          v.dispatch({
            changes: { from: sel.from, to: sel.to, insert: repl },
            selection: { anchor: sel.from + cmd.length + 2, head: sel.from + repl.length - 1 },
          });
          v.focus(); return true;
        };
      }

      const latexKeymap = Prec.high(keymap.of([
        // Formatting (Cmd/Ctrl + key)
        { key: "Mod-b", run: wrapCmd("textbf") },        // bold
        { key: "Mod-i", run: wrapCmd("textit") },        // italic
        { key: "Mod-u", run: wrapCmd("underline") },     // underline
        // Math
        { key: "Mod-m", run: (v: EV) => {               // inline math $...$
            const sel = v.state.selection.main;
            const inner = v.state.doc.sliceString(sel.from, sel.to) || "x";
            const repl  = `$${inner}$`;
            v.dispatch({ changes: { from: sel.from, to: sel.to, insert: repl },
              selection: { anchor: sel.from + 1, head: sel.from + repl.length - 1 } });
            v.focus(); return true;
          },
        },
        { key: "Mod-Shift-m", run: (v: EV) => {         // display math \[...\]
            const cursor = v.state.selection.main.head;
            const snip   = "\\[\n  \n\\]";
            v.dispatch({ changes: { from: cursor, insert: snip },
              selection: { anchor: cursor + 4 } });
            v.focus(); return true;
          },
        },
        // Comment/uncomment lines (Cmd+/)
        { key: "Mod-/", run: (v: EV) => {
            const { from, to } = v.state.selection.main;
            const text    = v.state.doc.sliceString(from, to);
            const lines   = text.split("\n");
            const allCommented = lines.every(l => l.trimStart().startsWith("%"));
            const toggled = lines.map(l =>
              allCommented ? l.replace(/^\s*%\s?/, "") : `% ${l}`
            ).join("\n");
            v.dispatch({ changes: { from, to, insert: toggled },
              selection: { anchor: from, head: from + toggled.length } });
            v.focus(); return true;
          },
        },
        // Tab → 2-space indent
        { key: "Tab", run: (v: EV) => {
            const { from, to } = v.state.selection.main;
            if (from === to) {
              v.dispatch({ changes: { from, insert: "  " }, selection: { anchor: from + 2 } });
            } else {
              const indented = v.state.doc.sliceString(from, to).split("\n")
                .map((l: string) => "  " + l).join("\n");
              v.dispatch({ changes: { from, to, insert: indented },
                selection: { anchor: from, head: from + indented.length } });
            }
            v.focus(); return true;
          },
        },
      ]));

      setExtensions([lang, theme, latexKeymap]);
    })();
  }, [isLight]); // re-run whenever dark⇄light toggles

  // Load document: priority = docId (cloud) > URL hash > localStorage
  useEffect(() => {
    if (initialValue) return;

    // docId comes from useSearchParams, so switching ?doc=A→B updates it WITHOUT
    // remounting — reset the load guards for the new doc so a stale docLoadedOk
    // can't let autosave write the previous doc's content onto this one.
    docLoadedOk.current = false;
    // Deliberately synchronous: the guard must be cleared BEFORE the async load
    // below starts, or a stale docLoadedOk could let autosave write the previous
    // doc's content onto the newly selected one (F2 audit fix).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadError(false);

    if (docId && userId) {
      // No user_id filter: RLS lets owners AND invited collaborators read.
      (async () => {
        const { data, error } = await supabase
          .from("documents")
          .select("title, content, user_id")
          .eq("id", docId)
          .single();
        // A failed/blocked read must NOT fall through to editing the sample and
        // then autosaving over the real document. Surface the error and leave
        // autosave disabled (docLoadedOk stays false).
        if (error || !data) {
          setLoadError(true);
          return;
        }
        setSource(data.content || SAMPLE);
        setDocTitle(data.title || "Untitled");
        if (data.user_id === userId) {
          setDocRole("owner");
        } else {
          // RLS limits this to the signed-in user's own invite row.
          const { data: invite } = await supabase
            .from("document_collaborators")
            .select("permission")
            .eq("document_id", docId)
            .maybeSingle();
          setDocRole(invite?.permission === "edit" ? "edit" : "view");
        }
        docLoadedOk.current = true;
      })();
      return;
    }

    const hash = window.location.hash.slice(1);
    if (hash.startsWith("s=")) {
      const dec = LZString.decompressFromEncodedURIComponent(hash.slice(2));
      if (dec) { setSource(dec); return; }
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setSource(saved);
  }, [initialValue, docId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist scratch work to localStorage — but never overwrite it with a
  // cloud doc's content (opening a shared paper must not clobber drafts).
  useEffect(() => {
    if (!docId) localStorage.setItem(STORAGE_KEY, source);
  }, [source, docId]);

  // Autosave to Supabase (debounced 2 s) — owners and edit-collaborators.
  // RLS enforces permissions server-side; .select() confirms a row was
  // actually written so a blocked save shows "Save failed", not "Saved".
  useEffect(() => {
    if (!userId || !docId || docRole === "view" || docRole === null) return;
    // Never autosave a cloud doc we failed to load — would clobber it.
    if (!docLoadedOk.current) return;
    if (saveRef.current) clearTimeout(saveRef.current);
    setSaveStatus("saving");
    saveRef.current = setTimeout(async () => {
      const { data, error } = await supabase
        .from("documents")
        .update({ content: source, updated_at: new Date().toISOString() })
        .eq("id", docId)
        .select("id");
      setSaveStatus(error || !data?.length ? "error" : "saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 2000);
    return () => { if (saveRef.current) clearTimeout(saveRef.current); };
  }, [source, userId, docId, docRole]); // eslint-disable-line react-hooks/exhaustive-deps

  // Line count is pure derivation from source — no state/effect needed.
  const lineCount = useMemo(() => source.split("\n").length, [source]);

  // Debounced render — preserve preview scroll position
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const savedScroll = previewScroll.current?.scrollTop ?? 0;
      const { html: rendered, warnings: w } = latexToHtml(source);
      setHtml(rendered);
      setWarnings(w);
      // Restore scroll after React commits the new DOM
      requestAnimationFrame(() => {
        if (previewScroll.current) previewScroll.current.scrollTop = savedScroll;
      });
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [source]);

  // KaTeX hydration — restore scroll after rendering
  useEffect(() => {
    if (!previewRef.current || !html) return;
    const savedScroll = previewScroll.current?.scrollTop ?? 0;
    (async () => {
      const katex = (await import("katex")).default;
      // katex.min.css is already loaded globally in app/layout.tsx — do NOT import it again here
      const root = previewRef.current!;
      root.querySelectorAll<HTMLElement>(".math-inline[data-math]").forEach(el => {
        try {
          el.innerHTML = katex.renderToString(
            decodeURIComponent(el.dataset.math!),
            { throwOnError: false, displayMode: false }
          );
          el.removeAttribute("data-math");
        } catch { /* ignore */ }
      });
      root.querySelectorAll<HTMLElement>(".math-block[data-math]").forEach(el => {
        try {
          el.innerHTML = katex.renderToString(
            decodeURIComponent(el.dataset.math!),
            { throwOnError: false, displayMode: true }
          );
          el.removeAttribute("data-math");
        } catch { /* ignore */ }
      });
      // Restore scroll after KaTeX layout settles
      requestAnimationFrame(() => {
        if (previewScroll.current) previewScroll.current.scrollTop = savedScroll;
      });
    })();
  }, [html]);

  // Save the current scratch document to the user's cloud space, then
  // switch the URL to ?doc=<id> so autosave takes over.
  const saveToCloud = useCallback(async () => {
    if (!userId || cloudSaving) return;
    // If the current cloud doc failed to load, don't "save" — that would insert a
    // NEW document full of the sample/placeholder text (the message says editing
    // is disabled precisely to avoid this).
    if (loadError) return;
    setCloudSaving(true);
    const titleMatch = source.match(/\\title\{([^}]*)\}/);
    const title = titleMatch?.[1]?.trim() || "Untitled";
    // Ensure the profiles row exists (documents.user_id FK → profiles.id);
    // best-effort, the insert below surfaces the real error if anything fails.
    await supabase
      .from("profiles")
      .upsert({ id: userId, email: userEmail ?? "" }, { onConflict: "id", ignoreDuplicates: true });
    const { data, error } = await supabase
      .from("documents")
      .insert({ user_id: userId, title, content: source })
      .select("id")
      .single();
    setCloudSaving(false);
    if (error || !data) {
      console.error("saveToCloud failed:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
      return;
    }
    setDocTitle(title);
    setDocRole("owner");
    router.replace(`/tools/preview?doc=${data.id}`);
  }, [userId, userEmail, cloudSaving, source, supabase, router, loadError]);

  const copyHtml = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked (permissions / insecure context) — don't show a false "copied"
    }
  }, [html]);

  const shareLink = useCallback(async () => {
    const compressed = LZString.compressToEncodedURIComponent(source);
    const url = `${window.location.origin}/tools/preview#s=${compressed}`;
    // Update the URL fragment even if the clipboard is blocked, so the
    // address bar still holds a shareable link the user can copy manually.
    window.history.replaceState(null, "", `#s=${compressed}`);
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch {
      // clipboard blocked — URL fragment is already set
    }
  }, [source]);

  const insertSnippet = useCallback((text: string) => {
    const view = editorRef.current?.view;
    if (view) {
      const { state } = view;
      const cursor = state.selection.main.head;
      const before = state.doc.sliceString(Math.max(0, cursor - 1), cursor);
      const insert = (before === "\n" || cursor === 0 ? "" : "\n") + text + "\n";
      view.dispatch({
        changes: { from: cursor, insert },
        selection: { anchor: cursor + insert.length },
      });
      view.focus();
    } else {
      // Fallback: append to end
      setSource(prev => prev + (prev.endsWith("\n") ? "" : "\n") + text + "\n");
    }
  }, []);

  const exportPdf = useCallback(async () => {
    setPdfStatus("compiling");
    try {
      const res = await fetch("/api/compile-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      });

      // ── Gate response ─────────────────────────────────────────────────────
      if (res.status === 403) {
        const body = await res.json().catch(() => ({}));
        setPdfStatus("idle");
        setUpgradeModal({
          feature: "pdf_export",
          reason: body.reason === "sign_in_required" ? "sign_in_required" : "upgrade_required",
        });
        return;
      }

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(error);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), {
        href: url,
        download: (docId && docTitle !== "Untitled" ? docTitle : "document") + ".pdf",
      });
      a.click();
      URL.revokeObjectURL(url);
      setPdfStatus("idle");
    } catch (err) {
      console.error("PDF export failed:", err);
      setPdfStatus("error");
      setTimeout(() => setPdfStatus("idle"), 3500);
    }
  }, [source, docId, docTitle]);

  // ── LaTeX → Markdown export ────────────────────────────────────────────
  const downloadMarkdown = useCallback(() => {
    // Convert LaTeX source directly to Markdown (better fidelity than HTML→MD)
    let md = source;

    // Strip preamble — keep only body content
    const bodyMatch = md.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
    if (bodyMatch) md = bodyMatch[1];

    // Title / author / date → YAML front matter
    const titleM  = source.match(/\\title\{([^}]*)\}/);
    const authorM = source.match(/\\author\{([^}]*)\}/);
    const dateM   = source.match(/\\date\{([^}]*)\}/);
    let frontMatter = "";
    if (titleM || authorM) {
      frontMatter = "---\n";
      if (titleM)  frontMatter += `title: "${titleM[1].replace(/\\/g, "").trim()}"\n`;
      if (authorM) frontMatter += `author: "${authorM[1].replace(/\\/g, "").trim()}"\n`;
      if (dateM && !dateM[1].includes("\\today")) frontMatter += `date: "${dateM[1].trim()}"\n`;
      frontMatter += "---\n\n";
    }

    // Remove preamble leftovers
    md = md.replace(/\\maketitle\b/g, "");
    md = md.replace(/\\(?:usepackage|documentclass|geometry|setlength|pagestyle)(?:\[[^\]]*\])?\{[^}]*\}/g, "");
    md = md.replace(/\\(?:newcommand|renewcommand)\{[^}]*\}(?:\[[^\]]*\])?\{[^}]*\}/g, "");
    md = md.replace(/\\definecolor\{[^}]*\}\{[^}]*\}\{[^}]*\}/g, "");

    // Sections → Markdown headings
    md = md.replace(/\\chapter\*?\{([^}]*)\}/g, "\n# $1\n");
    md = md.replace(/\\section\*?\{([^}]*)\}/g,    "\n## $1\n");
    md = md.replace(/\\subsection\*?\{([^}]*)\}/g,    "\n### $1\n");
    md = md.replace(/\\subsubsection\*?\{([^}]*)\}/g, "\n#### $1\n");
    md = md.replace(/\\paragraph\*?\{([^}]*)\}/g,  "\n**$1**\n");

    // Abstract → blockquote
    md = md.replace(/\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/g, (_, c) =>
      `\n> **Abstract:** ${c.trim().replace(/\n+/g, " ")}\n`
    );

    // Math — keep as-is (Obsidian/Notion understand $...$ and $$...$$)
    md = md.replace(/\\\[([\s\S]*?)\\\]/g, (_, m) => `\n$$\n${m.trim()}\n$$\n`);
    md = md.replace(/\\begin\{equation\*?\}([\s\S]*?)\\end\{equation\*?\}/g, (_, m) =>
      `\n$$\n${m.replace(/\\label\{[^}]*\}/g, "").trim()}\n$$\n`
    );
    md = md.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g, (_, m) =>
      `\n$$\n\\begin{aligned}\n${m.replace(/\\label\{[^}]*\}/g, "").trim()}\n\\end{aligned}\n$$\n`
    );

    // Lists
    md = md.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (_, items) =>
      items.split(/\\item\s*/).filter((s: string) => s.trim())
        .map((s: string) => `- ${s.trim().replace(/\n+/g, " ")}`)
        .join("\n") + "\n"
    );
    md = md.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (_, items) => {
      let n = 0;
      return items.split(/\\item\s*/).filter((s: string) => s.trim())
        .map((s: string) => `${++n}. ${s.trim().replace(/\n+/g, " ")}`)
        .join("\n") + "\n";
    });

    // Code / verbatim
    md = md.replace(/\\begin\{verbatim\}([\s\S]*?)\\end\{verbatim\}/g, (_, c) => `\`\`\`\n${c}\`\`\`\n`);
    md = md.replace(/\\begin\{lstlisting\}(?:\[.*?\])?([\s\S]*?)\\end\{lstlisting\}/g, (_, c) => `\`\`\`latex\n${c}\`\`\`\n`);

    // Tables → Markdown table (simplified)
    md = md.replace(/\\begin\{tabular\}\{[^}]*\}([\s\S]*?)\\end\{tabular\}/g, (_, content) => {
      const rows = content.split("\\\\").map((r: string) => r.replace(/\\hline|\\(top|mid|bottom)rule/g, "").trim()).filter(Boolean);
      if (!rows.length) return "";
      const cells = (r: string) => r.split("&").map((c: string) => c.trim());
      const header = cells(rows[0]).join(" | ");
      const sep = cells(rows[0]).map(() => "---").join(" | ");
      return `\n| ${header} |\n| ${sep} |\n${rows.slice(1).length ? rows.slice(1).map((r: string) => `| ${cells(r).join(" | ")} |`).join("\n") : ""}\n`;
    });

    // Environments
    md = md.replace(/\\begin\{(?:quote|quotation)\}([\s\S]*?)\\end\{(?:quote|quotation)\}/g, (_, c) =>
      `\n> ${c.trim().replace(/\n/g, "\n> ")}\n`
    );
    md = md.replace(/\\begin\{center\}([\s\S]*?)\\end\{center\}/g, (_, c) => c.trim() + "\n");
    md = md.replace(/\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}/g, "");  // drop remaining envs

    // Text formatting
    md = md.replace(/\\textbf\{([^}]*)\}/g, "**$1**");
    md = md.replace(/\\textit\{([^}]*)\}/g, "_$1_");
    md = md.replace(/\\emph\{([^}]*)\}/g, "_$1_");
    md = md.replace(/\\underline\{([^}]*)\}/g, "$1");
    md = md.replace(/\\texttt\{([^}]*)\}/g, "`$1`");
    md = md.replace(/\\textsc\{([^}]*)\}/g, "$1");

    // Links
    md = md.replace(/\\href\{([^}]*)\}\{([^}]*)\}/g, "[$2]($1)");
    md = md.replace(/\\url\{([^}]*)\}/g, "<$1>");

    // Citations / refs → plain text
    md = md.replace(/\\cite(?:\[[^\]]*\])?\{([^}]*)\}/g, "[@$1]");
    md = md.replace(/\\ref\{([^}]*)\}/g, "\\ref{$1}");
    md = md.replace(/\\label\{[^}]*\}/g, "");

    // Horizontal rules
    md = md.replace(/\\(?:hrule|hrulefill|rule\{[^}]*\}\{[^}]*\})/g, "\n---\n");

    // Spacing / misc
    md = md.replace(/\\(?:newpage|clearpage|pagebreak)\b/g, "\n---\n");
    md = md.replace(/\\(?:vspace|hspace|kern)\{[^}]*\}/g, "");
    md = md.replace(/\\(?:noindent|indent|bigskip|medskip|smallskip|centering|raggedright)\b/g, "");
    md = md.replace(/\\footnote\{([^}]*)\}/g, "[^fn]: $1");

    // Typography
    md = md.replace(/---/g, "—").replace(/--/g, "–");
    md = md.replace(/``/g, "“").replace(/''/g, "”");
    md = md.replace(/\\ldots\b|\\dots\b/g, "…");
    md = md.replace(/~/g, " ");

    // Generic cleanup
    md = md.replace(/\\[a-zA-Z]+\*?\{([^}]*)\}/g, "$1");
    md = md.replace(/\\[a-zA-Z]+\*?\b/g, "");
    md = md.replace(/\{([^{}]*)\}/g, "$1");
    md = md.replace(/[{}]/g, "");
    md = md.replace(/%%[^\n]*/gm, "");
    md = md.replace(/%[^\n]*/gm, "");

    // Collapse whitespace
    md = md.replace(/\n{3,}/g, "\n\n").trim();

    const final = frontMatter + md + "\n";
    const fname = (docId && docTitle !== "Untitled" ? docTitle : "document").replace(/\s+/g, "-");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([final], { type: "text/markdown" })),
      download: `${fname}.md`,
    });
    a.click();
  }, [source, docId, docTitle]);

  const downloadHtml = useCallback(() => {
    const full = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>latexci export</title>` +
      `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex/dist/katex.min.css">` +
      `<style>body{max-width:700px;margin:3rem auto;font-family:Georgia,serif;line-height:1.75;padding:1rem;color:#111}` +
      `h1{font-size:1.8rem;border-bottom:1px solid #ccc;padding-bottom:.4rem}` +
      `h2{font-size:1.3rem;color:#333;margin-top:2rem}` +
      `.math-block{text-align:center;margin:1.5rem 0}` +
      `table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:.5rem .75rem}</style></head>` +
      `<body>${html}</body></html>`;
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([full], { type: "text/html" })),
      download: "document.html",
    });
    a.click();
  }, [html]);

  // ── Derived stats ──────────────────────────────────────────────────────
  const wordCount = useMemo(() => {
    if (!html) return 0;
    const text = html
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;|&#\d+;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text ? text.split(" ").filter(w => w.length > 0).length : 0;
  }, [html]);

  // ── Styles ─────────────────────────────────────────────────────────────

  /* 100dvh adjusts when iOS Safari address bar appears/disappears,
     preventing content from being clipped behind the browser chrome. */
  const containerH = "calc(100dvh - 56px)";

  return (
    <>
    <div style={{ display: "flex", flexDirection: "column", height: containerH, background: "var(--bg)" }}>

      {/* ── Top toolbar ──────────────────────────────────────────────── */}
      {isMobile ? (
        /* ── Mobile: two-row toolbar ─────────────────────────────────── */
        <div className="editor-panel" style={{ flexShrink: 0, background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
          {/* Row 1: filename + pane tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0 0.75rem", height: 40 }}>
            <div style={{ display: "flex", gap: 5, marginRight: 2 }}>
              {["#ff5f57", "#ffbd2e", "#28c840"].map(c => (
                <span key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, display: "inline-block" }} />
              ))}
            </div>
            <span style={{
              fontFamily: "var(--font-mono), monospace", fontSize: "0.72rem", color: "var(--fg-muted)", flex: 1,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {docId ? docTitle : "main.tex"}
            </span>
            {/* Pane switcher — always visible on mobile */}
            <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 6, border: "1px solid var(--border)", overflow: "hidden" }}>
              {(["editor", "preview"] as const).map(pane => (
                <button key={pane} onClick={() => setActivePane(pane)} style={{
                  padding: "0.28rem 0.9rem", border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600,
                  background: activePane === pane ? "var(--accent)" : "transparent",
                  color: activePane === pane ? "#fff" : "var(--fg-muted)",
                }}>
                  {pane === "editor" ? "Edit" : "Preview"}
                </button>
              ))}
            </div>
          </div>
          {/* Row 2: action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0 0.75rem 0.5rem" }}>
            <Btn active={showSnippets} onClick={() => setShowSnippets(s => !s)} title="Snippets">⌨</Btn>
            <Btn onClick={() => setSource(SAMPLE)} title="Restore demo">Reset</Btn>
            <Btn active={clearPending} activeColor="#ef4444" onClick={handleClear} title={clearPending ? "Click again to confirm" : "Clear editor"}>
              {clearPending ? "Sure?" : "Clear"}
            </Btn>
            <div style={{ flex: 1 }} />
            {!docId && userId && (
              <Btn onClick={saveToCloud} title="Save to your documents (cloud)">
                {cloudSaving ? "…" : "☁"}
              </Btn>
            )}
            <Btn active={shared} activeColor="#10b981" onClick={shareLink} title="Copy shareable URL">
              {shared ? "✓" : "🔗"}
            </Btn>
            {/* PDF export — also available on mobile */}
            <button
              onClick={exportPdf}
              disabled={pdfStatus === "compiling"}
              title={pdfStatus === "error" ? "Compilation failed — check LaTeX syntax" : "Compile & download PDF"}
              style={{
                background: pdfStatus === "error" ? "#7f1d1d" : pdfStatus === "compiling" ? "#7f1d1d" : "#dc2626",
                border: `1px solid ${pdfStatus === "error" ? "#ef4444" : "#b91c1c"}`,
                borderRadius: 5, color: "#fff",
                fontSize: "0.72rem", fontWeight: 600,
                padding: "0.22rem 0.55rem",
                cursor: pdfStatus === "compiling" ? "wait" : "pointer",
                whiteSpace: "nowrap",
                display: "inline-flex", alignItems: "center", gap: "0.25rem",
              }}
            >
              {pdfStatus === "compiling" ? "⏳" : pdfStatus === "error" ? "✗" : "↓ PDF"}
            </button>
          </div>
        </div>
      ) : (
        /* ── Desktop: single-row toolbar ─────────────────────────────── */
        <div className="editor-panel" style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          padding: "0 0.75rem", height: 44,
          background: "var(--surface)", borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", gap: 5, marginRight: 4 }}>
            {["#ff5f57", "#ffbd2e", "#28c840"].map(c => (
              <span key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c, display: "inline-block" }} />
            ))}
          </div>
          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: "0.75rem", color: "var(--fg-muted)" }}>
            {docId ? docTitle : "main.tex"}
          </span>
          {/* Document load failure — autosave stays disabled to protect the doc */}
          {loadError && (
            <span role="alert" style={{
              fontSize: "0.68rem", color: "#ef4444", fontWeight: 600,
              padding: "0.1rem 0.4rem",
            }}>
              ⚠ Couldn&apos;t load this document — editing is disabled to avoid overwriting it. Reload to retry.
            </span>
          )}
          {/* Autosave status */}
          {docId && !loadError && saveStatus !== "idle" && (
            <span style={{
              fontSize: "0.68rem",
              color: saveStatus === "saved" ? "#10b981" : saveStatus === "error" ? "#ef4444" : "var(--fg-muted)",
              padding: "0.1rem 0.4rem",
            }}>
              {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "✓ Saved" : "Save failed"}
            </span>
          )}
          {/* View-only badge for collaborators without edit permission */}
          {docId && docRole === "view" && (
            <span style={{
              fontSize: "0.66rem", fontWeight: 600, color: "var(--fg-muted)",
              background: "var(--surface2)", border: "1px solid var(--border)",
              padding: "0.12rem 0.5rem", borderRadius: 99,
            }}>
              View only
            </span>
          )}
          <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px" }} />
          <Btn active={showSnippets} onClick={() => setShowSnippets(s => !s)} title="Snippets panel">⌨ Snippets</Btn>
          <Btn onClick={() => setSource(SAMPLE)} title="Restore demo document">Reset</Btn>
          <Btn active={clearPending} activeColor="#ef4444" onClick={handleClear} title={clearPending ? "Click again to confirm" : "Clear editor"}>
            {clearPending ? "Sure?" : "Clear"}
          </Btn>
          <div style={{ flex: 1 }} />
          {/* Save to cloud — signed-in users on scratch docs */}
          {!docId && userId && (
            <Btn onClick={saveToCloud} title="Save to your documents (cloud)">
              {cloudSaving ? "Saving…" : "☁ Save"}
            </Btn>
          )}
          {!docId && !userId && (
            <Btn onClick={() => { window.location.href = "/auth?next=/tools/preview"; }} title="Sign in to save this paper to your cloud space">
              ☁ Sign in to save
            </Btn>
          )}
          <Btn active={shared} activeColor="#10b981" onClick={shareLink} title="Copy shareable URL">
            {shared ? "✓ Copied!" : "🔗 Share"}
          </Btn>
          <Btn active={copied} activeColor="#6c63ff" onClick={copyHtml} title="Copy HTML output">
            {copied ? "✓ HTML!" : "Copy HTML"}
          </Btn>
          <Btn onClick={downloadHtml} title="Download as HTML file">↓ HTML</Btn>
          <Btn onClick={downloadMarkdown} title="Download as Markdown (Obsidian / Notion compatible)">↓ MD</Btn>
          {/* PDF button — always red so it stands out */}
          <button
            onClick={exportPdf}
            disabled={pdfStatus === "compiling"}
            title={pdfStatus === "error" ? "Compilation failed — check your LaTeX syntax" : "Compile & download PDF via YToTech"}
            style={{
              background: pdfStatus === "error" ? "#7f1d1d" : pdfStatus === "compiling" ? "#7f1d1d" : "#dc2626",
              border: `1px solid ${pdfStatus === "error" ? "#ef4444" : "#b91c1c"}`,
              borderRadius: 5,
              color: "#fff",
              fontSize: "0.75rem",
              fontWeight: 600,
              padding: "0.22rem 0.7rem",
              cursor: pdfStatus === "compiling" ? "wait" : "pointer",
              transition: "background 0.15s",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
            onMouseEnter={e => { if (pdfStatus !== "compiling") (e.currentTarget as HTMLButtonElement).style.background = "#b91c1c"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = pdfStatus === "error" ? "#7f1d1d" : "#dc2626"; }}
          >
            {pdfStatus === "compiling" ? (
              <><span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: "0.7rem" }}>⏳</span> PDF…</>
            ) : pdfStatus === "error" ? (
              <>✗ PDF failed</>
            ) : (
              <>↓ PDF</>
            )}
          </button>
        </div>
      )}

      {/* ── Main split ───────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Editor pane */}
        {(!isMobile || activePane === "editor") && (
          <div className="editor-panel" style={{
            width: isMobile ? "100%" : showSnippets ? `calc(${splitPct}% - 160px)` : `${splitPct}%`,
            display: "flex", flexDirection: "column",
            borderRight: `1px solid var(--editor-border)`,
            background: "var(--editor-bg)",
            transition: "width 0.2s",
            flexShrink: 0,
          }}>
            <div style={{ flex: 1, overflow: "hidden" }}>
              {extensions.length > 0 ? (
                <CodeMirror
                  ref={editorRef}
                  value={source}
                  onChange={setSource}
                  editable={!loadError}
                  extensions={extensions as import("@uiw/react-codemirror").ReactCodeMirrorProps["extensions"]}
                  height="100%"
                  style={{ height: "100%", fontSize: "13px" }}
                  basicSetup={{
                    lineNumbers: true,
                    highlightActiveLine: true,
                    bracketMatching: true,
                    autocompletion: false,
                    foldGutter: true,
                  }}
                />
              ) : (
                <textarea
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  spellCheck={false}
                  style={{
                    width: "100%", height: "100%",
                    background: "var(--editor-bg)",
                    color: isLight ? "#2c2018" : "#c8c5e0",
                    border: "none", outline: "none", padding: "1rem",
                    fontFamily: "var(--font-mono), monospace", fontSize: "13px",
                    lineHeight: 1.65, resize: "none",
                  }}
                />
              )}
            </div>

            {/* Status bar */}
            <div style={{
              padding: "0.2rem 0.75rem",
              background: "var(--editor-statusbar)",
              fontSize: "0.68rem", color: "var(--editor-statusbar-fg)",
              display: "flex", gap: "1rem", alignItems: "center", flexShrink: 0,
            }}>
              <span>Ln {lineCount}</span>
              <span>{source.length} ch</span>
              {warnings.length > 0 && (
                <span style={{
                  color: "#f59e0b",
                  background: "rgba(245,158,11,0.12)",
                  border: "1px solid rgba(245,158,11,0.25)",
                  borderRadius: 3, padding: "0 0.3rem", fontSize: "0.62rem",
                }}>
                  ⚠ {warnings.length} warning{warnings.length > 1 ? "s" : ""}
                </span>
              )}
              <span style={{ marginLeft: "auto", fontWeight: 600, letterSpacing: "0.04em", color: "var(--editor-statusbar-lang)" }}>LaTeX</span>
            </div>
          </div>
        )}

        {/* Snippets sidebar */}
        {showSnippets && !isMobile && (
          <div className="editor-panel" style={{
            width: 160, borderRight: `1px solid var(--editor-border)`,
            background: "var(--editor-sidebar-bg)", display: "flex", flexDirection: "column",
            flexShrink: 0, overflowY: "auto",
          }}>
            <div style={{
              padding: "0.5rem 0.75rem", fontSize: "0.65rem", fontWeight: 700,
              color: "var(--fg-muted)", letterSpacing: "0.1em", borderBottom: "1px solid var(--border)",
              textTransform: "uppercase",
            }}>Snippets</div>
            {SNIPPETS.map(s => (
              <button
                key={s.label}
                onClick={() => insertSnippet(s.insert)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  width: "100%", textAlign: "left", padding: "0.45rem 0.75rem",
                  background: "transparent", border: "none",
                  borderBottom: "1px solid var(--border)",
                  color: "var(--fg-muted)", fontSize: "0.78rem", cursor: "pointer",
                  transition: "background 0.1s, color 0.1s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.color = "var(--fg)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-muted)"; }}
              >
                <span style={{ width: 18, textAlign: "center", fontSize: "0.85rem", opacity: 0.7 }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* ── Resize handle (desktop only) ─────────────────────────── */}
        {!isMobile && (
          <div
            ref={splitRef}
            title="Drag to resize"
            style={{
              width: 5, flexShrink: 0, cursor: "col-resize",
              background: "var(--border)",
              transition: "background 0.15s",
              zIndex: 10,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--accent)")}
            onMouseLeave={e => (e.currentTarget.style.background = "var(--border)")}
          />
        )}

        {/* ── Preview pane ─────────────────────────────────────────── */}
        {(!isMobile || activePane === "preview") && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            background: "var(--preview-desk)",
            minWidth: 0,
          }}>
            {/* Preview header */}
            <div style={{
              padding: "0.35rem 1rem",
              background: "var(--preview-hdr)",
              borderBottom: "1px solid var(--preview-hdr-bdr)",
              display: "flex", alignItems: "center", gap: "0.5rem",
              flexShrink: 0,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "var(--preview-hdr-dot)", display: "inline-block",
                boxShadow: "0 0 6px rgba(45,122,69,0.55)",
              }} />
              <span style={{ fontSize: "0.71rem", color: "var(--preview-hdr-muted)", fontWeight: 500 }}>
                Preview · live
              </span>
              <div style={{ flex: 1 }} />
              {wordCount > 0 && (
                <span style={{ fontSize: "0.67rem", color: "var(--preview-hdr-muted)", opacity: 0.7 }}>
                  ~{wordCount} words
                </span>
              )}
              <span style={{
                fontSize: "0.67rem", color: "var(--preview-hdr-muted)", opacity: 0.55,
                borderLeft: "1px solid var(--preview-hdr-bdr)", paddingLeft: "0.5rem", marginLeft: "0.25rem",
              }}>
                {html.length > 0 ? `${html.split(/<\/p>|<\/h[1-6]>|<\/li>/).length - 1} blocks` : ""}
              </span>
            </div>

            {/* Paper / document */}
            <div ref={previewScroll} style={{ flex: 1, overflowY: "auto", padding: isMobile ? "1rem 0.5rem" : "2rem 1.5rem" }}>
              <div
                ref={previewRef}
                className="latex-preview"
                dangerouslySetInnerHTML={{ __html: html }}
                style={{
                  maxWidth: 720,
                  margin: "0 auto",
                  background: "var(--paper-bg)",
                  boxShadow: "var(--paper-shadow)",
                  borderRadius: isMobile ? 0 : 3,
                  padding: isMobile ? "1.25rem 1rem" : "3.5rem 4rem",
                  minHeight: "calc(100dvh - 140px)",
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: isMobile ? "14px" : "15px",
                  lineHeight: 1.8,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>

    {/* ── Upgrade modal (PDF gate) ──────────────────────────────────────── */}
    {upgradeModal && (
      <UpgradeModal
        feature={upgradeModal.feature}
        reason={upgradeModal.reason}
        onClose={() => setUpgradeModal(null)}
      />
    )}
    </>
  );
}

// ── Small reusable button ────────────────────────────────────────────────
function Btn({
  children, onClick, active, activeColor, title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  activeColor?: string;
  title?: string;
}) {
  const color = activeColor ?? "var(--accent2)";
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: active ? `${activeColor ?? "var(--accent2)"}22` : "var(--surface2)",
        border: `1px solid ${active ? `${color}55` : "var(--border)"}`,
        borderRadius: 5,
        color: active ? color : "var(--fg-muted)",
        fontSize: "0.75rem",
        padding: "0.22rem 0.6rem",
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.color = "var(--fg)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = active ? `${color}55` : "var(--border)";
        e.currentTarget.style.color = active ? color : "var(--fg-muted)";
      }}
    >
      {children}
    </button>
  );
}
