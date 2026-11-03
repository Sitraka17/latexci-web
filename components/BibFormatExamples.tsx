import { nodeFormatter } from "@/lib/bib-format-node";
import { SAMPLE_ENTRIES } from "@/lib/bib-format-samples";
import { styleById, type StyleId } from "@/lib/csl-styles";

/**
 * Table of one formatted reference per BibTeX entry type, computed at build
 * time by the same formatter as the tool, so the page cannot show an example
 * the tool would not produce. Server component: no client JavaScript.
 */
export default async function BibFormatExamples({ style, table }: { style: StyleId; table: number }) {
  const info = styleById(style);
  const f = nodeFormatter();
  const rows = await Promise.all(
    SAMPLE_ENTRIES.map(async (s) => ({ s, r: await f.format(s.bib, style) })),
  );
  return (
    <>
      <div className="bib-table fmt-examples">
        <table className="booktabs">
          <thead>
            <tr><th scope="col">Entry type</th><th scope="col">{info.label} output</th></tr>
          </thead>
          <tbody>
            {rows.map(({ s, r }) => (
              <tr key={s.type}>
                <td><code>{s.type}</code><br /><span className="muted">{s.kind}</span></td>
                <td>
                  {r.entries.map((e) => (
                    <div key={e.id} className={r.layout.hangingIndent ? "fmt-ref" : undefined}>
                      {e.label ? `${e.label} ` : ""}
                      <span dangerouslySetInnerHTML={{ __html: e.html }} />
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="caption">
        <b>Table {table}.</b> One entry of each type from the sample file, formatted by the tool in {info.label}.
      </p>
    </>
  );
}

/** The BibTeX source of one sample entry, by citation key. */
export function sampleBib(key: string): string {
  return SAMPLE_ENTRIES.find((e) => e.bib.includes(`{${key},`))?.bib ?? "";
}
