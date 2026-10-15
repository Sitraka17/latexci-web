// Shown while a tool route streams in. Text-free on purpose: anything typed
// here precedes the H1 in the streamed HTML, which crawlers read as the page's
// first words. A plain block of the page colour keeps the layout from jumping.
export default function ToolLoading() {
  return <div aria-hidden="true" style={{ height: "calc(100dvh - 54px)", background: "var(--bg)" }} />;
}
