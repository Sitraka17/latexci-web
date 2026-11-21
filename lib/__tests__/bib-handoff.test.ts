import { describe, expect, it } from "vitest";
import { formatHref, identifierLookup, readHandoff } from "../bib-handoff";

describe("bib handoff", () => {
  it("round-trips BibTeX through the URL fragment", () => {
    const bib = "@article{k,\n  title = {{\\LaTeX} été & co},\n  year = {2024}\n}";
    const href = formatHref("/tools/bibtex-to-apa", bib);
    expect(href.startsWith("/tools/bibtex-to-apa#bib=")).toBe(true);
    expect(readHandoff(href.slice(href.indexOf("#")))).toBe(bib);
  });

  it("ignores other fragments", () => {
    expect(readHandoff("#s=abc")).toBeNull();
    expect(readHandoff("")).toBeNull();
  });
});

describe("identifierLookup", () => {
  it.each([
    ["10.1093/comjnl/27.2.97", "doi"],
    ["https://doi.org/10.1038/s41586-021-03819-2", "doi"],
    ["2106.09685", "arxiv"],
    ["arXiv:2106.09685v2", "arxiv"],
    ["https://arxiv.org/abs/hep-th/9901001", "arxiv"],
    ["978-0-201-52983-8", "isbn"],
    ["020152983X", "isbn"],
    ["31452104", "pmid"],
  ])("%s is a %s", (raw, kind) => {
    expect(identifierLookup(raw)?.kind).toBe(kind);
  });

  it("rejects text that is no identifier", () => {
    expect(identifierLookup("hello world")).toBeNull();
    expect(identifierLookup("  ")).toBeNull();
  });
});
