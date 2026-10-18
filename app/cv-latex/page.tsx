import type { Metadata } from "next";
import Link from "@/components/Link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import { breadcrumbSchema } from "@/lib/breadcrumbs";
import { XFig, XRow, XCell, Verbatim, PageImage, type PngSize } from "@/components/ExtractFigure";
import { TEMPLATES } from "@/lib/templates";
import fr from "@/lib/seo-cv/fr-results.json";

// Page en français (lang="fr" sur <main>). Les sources LaTeX, les rendus et
// le texte extrait viennent de lib/seo-cv/fr-results.json, produit par
// `node scripts/seo-cv/run-fr.mjs` (compilation YToTech, pdftotext).

const NB = "\u00a0"; // espace insécable avant : ; ! ? et dans les guillemets

export const metadata: Metadata = {
  title: `Modèle de CV LaTeX gratuit${NB}: académique ou entreprise`,
  description:
    `CV LaTeX en français${NB}: académique ou entreprise, photo facultative, une page, typographie française avec babel. Modèles gratuits et générateur sans compte.`,
  keywords: [
    "cv latex", "modèle cv latex", "cv latex français", "modèle cv latex gratuit", "cv académique latex",
    "cv latex photo", "générateur cv latex", "babel french cv",
  ],
  alternates: { canonical: "/cv-latex" },
  openGraph: {
    title: "Modèle de CV LaTeX gratuit | latexci",
    description: `CV académique ou d'entreprise en LaTeX, en français${NB}: modèles, typographie, générateur.`,
    url: "/cv-latex",
    type: "article",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: `Modèle de CV LaTeX gratuit${NB}: académique ou entreprise`,
    description: `CV académique ou d'entreprise en LaTeX, en français${NB}: modèles, typographie, générateur.`,
  },
};

type Doc = { source: string; shown: string; text: string; png?: string; size?: PngSize };
const F = fr as unknown as Record<string, Doc>;

const tpl = (id: string) => TEMPLATES.find((t) => t.id === id)!;
const FR_TEMPLATES = [
  { id: "cv-french-academic", usage: "Candidature MCF, CR, professeur" },
  { id: "cv-french-industry", usage: "Candidature en entreprise" },
  { id: "cv-academic-photo", usage: "Candidature académique avec photo" },
];

const codeStyle = { fontFamily: "var(--font-tt)", fontSize: "0.92em" } as const;

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "Modèle de CV LaTeX gratuit : CV académique ou CV d'entreprise",
  inLanguage: "fr",
  datePublished: "2026-10-18",
  dateModified: "2026-10-18",
  author: { "@type": "Organization", name: "latexci", url: "https://latexci.com" },
  mainEntityOfPage: "https://latexci.com/cv-latex",
};

export default function CvLatexPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema({ name: "Modèle de CV LaTeX", path: "/cv-latex" })) }} />
      <Navbar />

      <main lang="fr" className="paper" style={{ flex: 1, width: "100%", boxSizing: "border-box", paddingBottom: "3rem" }}>
        <header className="titleblock">
          <h1>Modèle de CV LaTeX gratuit</h1>
          <p className="subtitle">CV académique ou CV d&rsquo;entreprise, en français</p>
          <p className="authors">latexci.com &middot; modèles et générateur sans compte</p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", marginTop: "1.6rem" }}>
            <Link href="/tools/cv-builder?lang=fr" className="btn btn-primary">Ouvrir le générateur en français</Link>
            <Link href="/tools/templates/cv-french-academic" className="btn">Modèle de CV académique</Link>
          </div>
        </header>

        <section className="abstract" aria-label="Résumé">
          <p className="abstract-title">Résumé</p>
          <p>
            Un CV en LaTeX se reconnaît à sa typographie, mais en français il faut deux réglages que les modèles
            anglophones ne font pas{NB}: la ponctuation haute précédée d&rsquo;une espace et les guillemets
            français. Cette page compare le CV académique et le CV d&rsquo;entreprise, rappelle ce qu&rsquo;un
            CV n&rsquo;a pas besoin de contenir, montre ce que fait <code style={codeStyle}>babel</code>{" "}avec
            l&rsquo;option <code style={codeStyle}>french</code> sur un vrai document compilé et renvoie vers
            trois modèles gratuits et un générateur.
          </p>
        </section>

        <h2><span className="secnum">1</span>Académique ou entreprise{NB}: deux documents différents</h2>
        <p>
          Le CV académique sert à un recrutement par un comité{NB}: il est complet et peut courir sur
          plusieurs pages. Le CV d&rsquo;entreprise s&rsquo;adresse à un recruteur{NB}: il va à
          l&rsquo;essentiel et vise une page. Le tableau 1 résume ce qui change.
        </p>
        <div style={{ overflowX: "auto", margin: "1.25rem 0 0" }}>
          <table className="booktabs">
            <thead><tr><th></th><th>CV académique</th><th>CV d&rsquo;entreprise</th></tr></thead>
            <tbody>
              <tr><td>Longueur</td><td>Autant de pages que nécessaire</td><td>Une page visée</td></tr>
              <tr><td>Ordre</td><td>Formation, postes, publications, enseignement</td><td>Profil, compétences, expériences, formation</td></tr>
              <tr><td>Publications</td><td>Liste complète, classée par type</td><td>Absentes, ou les plus utiles au poste</td></tr>
              <tr><td>Expériences</td><td>Postes et encadrement</td><td>Puces avec un résultat chiffré</td></tr>
              <tr><td>Photo</td><td>Facultative</td><td>Facultative</td></tr>
            </tbody>
          </table>
        </div>
        <p className="caption"><b>Tableau 1.</b> Les deux formats, tels que les modèles et le générateur latexci les construisent.</p>

        <h2><span className="secnum">2</span>Ce qu&rsquo;un CV n&rsquo;a pas à contenir</h2>
        <p>
          Le Code du travail limite les informations demandées à un candidat à celles qui servent à apprécier
          sa capacité à occuper l&rsquo;emploi ou ses aptitudes professionnelles (
          <a href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006900845/" target="_blank" rel="noopener noreferrer">article L1221-6</a>),
          et l&rsquo;âge comme l&rsquo;apparence physique figurent parmi les critères de discrimination
          interdits (<a href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000045391841" target="_blank" rel="noopener noreferrer">article L1132-1</a>).
          Rien n&rsquo;oblige donc à indiquer sa date de naissance, sa situation de famille ni à joindre une
          photo. Nos modèles n&rsquo;ont pas de champ «{NB}date de naissance{NB}»{NB}; quand un modèle prévoit
          une photo, l&rsquo;emplacement est facultatif.
        </p>

        <h2><span className="secnum">3</span>La typographie française avec babel</h2>
        <p>
          En français, les deux-points, le point-virgule, le point d&rsquo;exclamation et le point
          d&rsquo;interrogation sont précédés d&rsquo;une espace, et les guillemets «{NB}et{NB}» ont des
          espaces à l&rsquo;intérieur. Avec <code style={codeStyle}>{"\\usepackage[french]{babel}"}</code>,
          vous tapez la ponctuation collée et LaTeX ajoute une espace insécable{NB}; la commande{" "}
          <code style={codeStyle}>{"\\og ... \\fg{}"}</code>{" "}pose les guillemets et leurs espaces. La figure 1
          compile la même ligne avec et sans l&rsquo;option.
        </p>
        <figure style={{ margin: "1.5rem 0 0" }}>
          <XFig>
            <XRow><XCell label={<>Source, <code>babel</code> français</>}><Verbatim text={F["fr-babel"].shown} lang="fr" /></XCell></XRow>
            <PageImage src={F["fr-babel"].png!} size={F["fr-babel"].size!} alt="Ligne compilée avec babel french : espaces avant la ponctuation et dans les guillemets" />
            <XRow><XCell label="Texte extrait (pdftotext)"><Verbatim text={F["fr-babel"].text} lang="fr" wrap /></XCell></XRow>
            <XRow><XCell label={<>Source, <code>babel</code> anglais</>}><Verbatim text={F["fr-english"].shown} lang="fr" /></XCell></XRow>
            <PageImage src={F["fr-english"].png!} size={F["fr-english"].size!} alt="Même ligne compilée avec babel english : ponctuation collée" />
            <XRow><XCell label="Texte extrait (pdftotext)"><Verbatim text={F["fr-english"].text} lang="fr" wrap /></XCell></XRow>
          </XFig>
          <figcaption className="caption"><b>Figure 1.</b> Même texte, tapé sans espaces avant la ponctuation. En haut, babel french ajoute les espaces{NB}; en bas, avec l&rsquo;anglais, rien ne change.</figcaption>
        </figure>
        <p>
          Le texte extrait montre un détail utile pour les logiciels de recrutement{NB}: les espaces
          ajoutées par babel ressortent comme des espaces ordinaires, le mot reste lisible et la recherche
          sur «{NB}Langues{NB}» fonctionne. Notre{" "}
          <Link href="/latex-resume-ats" hrefLang="en">test d&rsquo;extraction de texte (en anglais)</Link>{" "}
          détaille les autres pièges{NB}: accents sans <code style={codeStyle}>{"\\usepackage[T1]{fontenc}"}</code>,
          deux colonnes, icônes.
        </p>
        <p>
          Un dernier réglage concerne les listes. Par défaut, babel french remplace les puces des listes{" "}
          <code style={codeStyle}>itemize</code> par des tirets. Pour garder des puces, ajoutez{" "}
          <code style={codeStyle}>{"\\frenchsetup{StandardItemLabels=true}"}</code> au préambule (figure 2)
          {NB}; le générateur latexci le fait.
        </p>
        <figure style={{ margin: "1.5rem 0 0" }}>
          <XFig>
            <XRow cols={2}>
              <XCell label="Par défaut"><PageImage src={F["fr-itemize"].png!} size={F["fr-itemize"].size!} alt="Liste avec des tirets, réglage par défaut de babel french" /></XCell>
              <XCell label={<>Avec <code>StandardItemLabels=true</code></>}><PageImage src={F["fr-itemize-std"].png!} size={F["fr-itemize-std"].size!} alt="Même liste avec des puces rondes" /></XCell>
            </XRow>
          </XFig>
          <figcaption className="caption"><b>Figure 2.</b> Une liste compilée avec babel french, sans puis avec l&rsquo;option.</figcaption>
        </figure>
        <p>Le préambule complet d&rsquo;un CV en français tient en six lignes (figure 3).</p>
        <figure style={{ margin: "1.25rem 0 0" }}>
          <XFig><XRow><XCell label="Préambule"><Verbatim text={F["fr-preamble"].shown} /></XCell></XRow></XFig>
          <figcaption className="caption"><b>Figure 3.</b> Encodage T1, police Latin Modern, babel français, texte du PDF en Unicode et métadonnées en français. Compilé tel quel.</figcaption>
        </figure>

        <h2><span className="secnum">4</span>Trois modèles gratuits</h2>
        <p>
          Chaque modèle a sa page avec la source complète, à copier ou à ouvrir dans l&rsquo;éditeur en ligne
          (tableau 2).
        </p>
        <div style={{ overflowX: "auto", margin: "1.25rem 0 0" }}>
          <table className="booktabs">
            <thead><tr><th>Modèle</th><th>Contenu</th><th className="hide-sm">Pour</th></tr></thead>
            <tbody>
              {FR_TEMPLATES.map(({ id, usage }) => (
                <tr key={id}>
                  <td style={{ whiteSpace: "nowrap" }}><Link href={`/tools/templates/${id}`}>{tpl(id).title}</Link></td>
                  <td>{tpl(id).desc.replace(/ ([:;!?])/g, `${NB}$1`)}</td>
                  <td className="muted hide-sm">{usage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="caption"><b>Tableau 2.</b> Les modèles de CV en français. Libres d&rsquo;usage, sans inscription.</p>

        <h2><span className="secnum">5</span>Sans écrire de LaTeX{NB}: le générateur</h2>
        <p>
          Le <Link href="/tools/cv-builder?lang=fr">générateur de CV</Link>{" "}produit le code LaTeX à partir
          d&rsquo;un formulaire. Choisissez le français{NB}: les titres de section, les dates («{NB}mars
          2022{NB}–{NB}aujourd&rsquo;hui{NB}») et la typographie suivent. La mise en page entreprise a une
          option une page, qui resserre les marges et l&rsquo;interligne, et un emplacement photo facultatif.
          Les chercheurs peuvent importer leurs publications depuis ORCID{NB}: voir{" "}
          <Link href="/orcid-to-latex-cv" hrefLang="en">ORCID to a LaTeX publication list (en anglais)</Link>.
          La figure 4 est l&rsquo;exemple français du générateur, mise en page entreprise, compilé.
        </p>
        <figure style={{ margin: "1.5rem 0 0" }}>
          <XFig>
            <PageImage src={F["builder-fr-industry"].png!} size={F["builder-fr-industry"].size!} alt="CV d'entreprise en français produit par le générateur latexci, une page" scale={0.72} />
          </XFig>
          <figcaption className="caption"><b>Figure 4.</b> L&rsquo;exemple du générateur en français, mise en page entreprise, option une page, coupé sous la dernière ligne. Profil fictif.</figcaption>
        </figure>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
          <Link href="/tools/cv-builder?lang=fr" className="btn btn-primary">Créer mon CV en français</Link>
          <Link href="/tools/templates/cv-french-industry" className="btn">Modèle de CV d&rsquo;entreprise</Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
