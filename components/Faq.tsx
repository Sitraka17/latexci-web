interface FaqItem {
  q: string;
  a: string;
}

// Server-rendered FAQ built on native <details>/<summary>: it works without
// JavaScript, is keyboard and screen-reader accessible out of the box, and adds
// nothing to the client bundle. A shared `name` makes the group exclusive
// (opening one closes the others), like the previous client-side accordion.
// Styles live in globals.css (.faq*).
export default function Faq({ items, name = "faq" }: { items: FaqItem[]; name?: string }) {
  return (
    <div className="faq">
      {items.map(({ q, a }) => (
        <details key={q} name={name} className="faq-item">
          <summary>
            <span>{q}</span>
            <span aria-hidden="true" className="faq-plus">+</span>
          </summary>
          <div className="faq-answer">{a}</div>
        </details>
      ))}
    </div>
  );
}
