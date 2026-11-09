// Describes every field of SiteContent: what kind of input it is, its label and help text, and its default.
// The admin panel draws its forms from this, and normalize.ts uses it to repair saved data, so an empty
// list still knows what its items look like and a bad value can never reach the public pages.

export type FieldKind =
  | "text"
  | "textarea"
  | "url"
  | "email"
  | "number"
  | "toggle"
  | "color"
  | "image"
  | "file"
  | "select"
  | "tags"
  | "lines"
  | "gallery"
  | "group"
  | "list";

export type Item = Record<string, unknown>;

export type ItemShape = {
  noun: string; // "project" -> "+ Add project"
  fields: Field[];
  title: (item: Item) => string;
  subtitle?: (item: Item) => string;
  thumb?: (item: Item) => string;
  fresh?: () => Item; // values for a brand-new item, on top of the field defaults
};

export type Field = {
  key: string;
  kind: FieldKind;
  label: string;
  help?: string;
  placeholder?: string;
  default?: unknown;
  options?: string[]; // select: suggestions
  accept?: string; // file
  long?: boolean; // lines: use text areas
  half?: boolean; // half width on wide screens
  advanced?: boolean; // tucked under "More options"
  fields?: Field[]; // group
  item?: ItemShape; // list
};

type Opts = Partial<Omit<Field, "key" | "kind" | "label">>;
const f = (kind: FieldKind) => (key: string, label: string, o: Opts = {}): Field => ({ key, kind, label, ...o });
const text = f("text");
const textarea = f("textarea");
const url = f("url");
const email = f("email");
const number = f("number");
const toggle = f("toggle");
const color = f("color");
const image = f("image");
const file = f("file");
const select = f("select");
const tags = f("tags");
const lines = f("lines");
const gallery = f("gallery");
const group = (key: string, label: string, fields: Field[], o: Opts = {}): Field => ({ key, kind: "group", label, fields, ...o });
const list = (key: string, label: string, item: ItemShape, o: Opts = {}): Field => ({ key, kind: "list", label, item, ...o });

const str = (v: unknown) => (typeof v === "string" ? v : "");
const join = (...parts: unknown[]) => parts.map(str).filter(Boolean).join(" · ");

export const PROJECT_CATEGORIES = ["Commercial product", "Client work", "Research", "Fabrication", "Personal build", "Competition", "Academic"];
export const VERSION_STATUSES = ["Concept", "In design", "Prototype", "Built and tested", "In production", "Delivered", "Retired"];
export const CERTIFICATE_KINDS = ["Achievement", "Participation", "Training", "Industrial attachment", "Appreciation", "Professional", "Course"];

const hiddenField = (what: string) => toggle("hidden", "Hidden", { help: `Keep this ${what} in admin but hide it from the website.` });

const linkShape: ItemShape = {
  noun: "link",
  fields: [text("label", "Label", { half: true, placeholder: "GitHub" }), url("url", "Address", { half: true, placeholder: "https://…" })],
  title: (i) => str(i.label) || str(i.url) || "New link",
};

// "https://github.com/owner/repo" -> { owner, repo }
export function parseRepo(u: string): { owner: string; repo: string } | null {
  const m = u.trim().match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?(?:[?#].*)?$/i);
  return m ? { owner: m[1], repo: m[2] } : null;
}

// The GitHub username in a list of profile links ("https://github.com/simulahmed003" -> "simulahmed003").
export function githubUserFrom(links: { url: string }[]): string {
  for (const l of links) {
    const m = l.url.trim().match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w-]+)\/?$/i);
    if (m) return m[1];
  }
  for (const l of links) {
    const r = parseRepo(l.url);
    if (r) return r.owner;
  }
  return "";
}

export const repoShape: ItemShape = {
  noun: "repository",
  fields: [
    url("url", "GitHub address", { placeholder: "https://github.com/you/repository" }),
    text("name", "Name to show", { half: true, placeholder: "the repository name", help: "Empty uses the repository name." }),
    text("note", "What is in it", { half: true, placeholder: "Firmware, PCB files, report…" }),
  ],
  title: (i) => str(i.name) || parseRepo(str(i.url))?.repo || str(i.url) || "New repository",
  subtitle: (i) => str(i.note),
};

const metricShape: ItemShape = {
  noun: "number",
  fields: [text("value", "Value", { half: true, placeholder: "2,000+" }), text("label", "What it measures", { half: true, placeholder: "units in the field" })],
  title: (i) => join(i.value, i.label) || "New number",
};

const specShape: ItemShape = {
  noun: "spec",
  fields: [text("label", "Spec", { half: true, placeholder: "MCU" }), text("value", "Value", { half: true, placeholder: "STM32F411" })],
  title: (i) => join(i.label, i.value) || "New spec",
};

const firstImage = (i: Item): string => {
  const imgs = Array.isArray(i.images) ? (i.images as Item[]) : [];
  return str(imgs[0]?.src);
};

export const versionShape: ItemShape = {
  noun: "version",
  title: (i) => join(i.label, i.name) || "New version",
  subtitle: (i) => join(i.date, i.status),
  thumb: firstImage,
  fresh: () => ({ label: "v1", status: "Prototype" }),
  fields: [
    text("label", "Version tag", { half: true, placeholder: "v2", help: "Short tag on the timeline: v1, v2, Prototype…" }),
    text("name", "Version name", { half: true, placeholder: "STM32 milled prototype" }),
    text("date", "Date", { half: true, placeholder: "Jan 2026" }),
    select("status", "Status", { half: true, options: VERSION_STATUSES }),
    textarea("summary", "What this version is", { placeholder: "What changed in this version and why." }),
    lines("highlights", "Highlights", { help: "Short points, one per line." }),
    list("specs", "Specs", specShape),
    gallery("images", "Photos"),
    hiddenField("version"),
  ],
};

const projectThumb = (i: Item): string => {
  if (str(i.cover)) return str(i.cover);
  const vs = Array.isArray(i.versions) ? (i.versions as Item[]) : [];
  for (let k = vs.length - 1; k >= 0; k--) if (firstImage(vs[k])) return firstImage(vs[k]);
  return "";
};

export const projectShape: ItemShape = {
  noun: "project",
  title: (i) => str(i.title) || "Untitled project",
  subtitle: (i) => join(i.category, i.period),
  thumb: projectThumb,
  // new projects start hidden so nothing half-finished goes live
  fresh: () => ({ hidden: true, category: "Personal build", versions: [{ label: "v1", name: "", date: "", status: "Prototype", summary: "", highlights: [], specs: [], images: [], hidden: false }] }),
  fields: [
    text("title", "Project name", { placeholder: "Smart Medicine Dispenser" }),
    textarea("tagline", "One-line description", { help: "Shown on the project card." }),
    select("category", "Category", { half: true, options: PROJECT_CATEGORIES, help: "Projects are grouped and filtered by this." }),
    text("period", "Period", { half: true, placeholder: "2025 – 2026" }),
    text("organisation", "Company / client / lab", { half: true }),
    text("role", "Your role", { half: true }),
    image("cover", "Cover photo", { help: "Main picture on the card. Leave empty to use the first photo of the newest version." }),
    textarea("summary", "Overview", { help: "The story of the whole project, shown at the top of its page." }),
    tags("tags", "Tools and tags", { placeholder: "Altium Designer" }),
    toggle("featured", "Featured", { help: "Show as a large card at the top of the Projects section." }),
    toggle("hidden", "Hidden", { help: "Hidden projects stay here but are not on the website." }),
    list("metrics", "Key numbers", metricShape, { help: "Up to 4 look best. The first 3 also show on featured cards." }),
    list("repos", "GitHub repositories", repoShape, { help: "One or more repositories with the code, design files or report." }),
    list("links", "Other links", linkShape, { help: "Demo video, paper, news post…" }),
    list("versions", "Versions", versionShape, { help: "Oldest first. The project page opens on the last one." }),
    text("slug", "Web address", {
      advanced: true,
      placeholder: "made from the name",
      help: "The end of the page address: /projects/<this>. Lowercase letters, numbers and dashes. Filled in from the name when empty.",
    }),
    tags("oldSlugs", "Earlier web addresses", { advanced: true, help: "These still open this project, so links already shared keep working." }),
  ],
};

const experienceShape: ItemShape = {
  noun: "role",
  title: (i) => join(i.role, i.organisation) || "New role",
  subtitle: (i) => str(i.period),
  fields: [
    text("role", "Role", { half: true }),
    text("organisation", "Organisation", { half: true }),
    text("period", "Period", { half: true, placeholder: "Jan 2025 – Present" }),
    text("type", "Type", { half: true, placeholder: "Full-time, Contract, Part-time…" }),
    text("location", "Location", { half: true }),
    toggle("current", "Current role", { help: "Highlights the dot on the timeline." }),
    textarea("summary", "Summary"),
    lines("bullets", "Points", { help: "One point per line." }),
    hiddenField("role"),
  ],
};

const awardShape: ItemShape = {
  noun: "award",
  title: (i) => str(i.title) || "New award",
  subtitle: (i) => join(i.organisation, i.date),
  thumb: (i) => str(i.image),
  fields: [
    text("title", "Award", { placeholder: "2nd Place, International" }),
    text("organisation", "Event / organisation", { half: true }),
    text("date", "Date", { half: true, placeholder: "Dec 2025" }),
    textarea("detail", "Details"),
    image("image", "Photo or certificate image"),
    url("link", "Link", { help: "Optional: news post, result page…" }),
    hiddenField("award"),
  ],
};

export const certificateShape: ItemShape = {
  noun: "certificate",
  title: (i) => str(i.title) || "New certificate",
  subtitle: (i) => join(i.kind, i.issuer, i.date),
  thumb: (i) => str(i.image),
  fresh: () => ({ kind: "Participation" }),
  fields: [
    text("title", "Certificate", { placeholder: "Industrial Attachment: PCB Fabrication" }),
    select("kind", "Type", { half: true, options: CERTIFICATE_KINDS, help: "Used for the filter on the certificates page." }),
    text("date", "Date", { half: true, placeholder: "Nov 2024" }),
    text("issuer", "Issued by", { placeholder: "SARBS Communications Ltd." }),
    textarea("detail", "Details", { help: "Optional: what you did or learned." }),
    image("image", "Certificate image", { help: "A photo, screenshot or scan. You can also pick a PDF: its first page becomes the image." }),
    file("file", "PDF (optional)", { accept: ".pdf,application/pdf", help: "Visitors can open the original PDF." }),
    text("credentialId", "Credential ID", { half: true, advanced: true }),
    url("credentialUrl", "Verify link", { half: true, advanced: true }),
    toggle("featured", "Show on home page", { help: "Featured certificates appear on the home page; all of them are on the certificates page." }),
    hiddenField("certificate"),
  ],
};

const activityShape: ItemShape = {
  noun: "activity",
  title: (i) => str(i.title) || "New activity",
  subtitle: (i) => str(i.date),
  thumb: (i) => str(i.image),
  fields: [
    text("title", "Title"),
    text("date", "Date", { half: true }),
    url("link", "Link", { half: true, help: "Optional." }),
    textarea("text", "Text"),
    image("image", "Photo"),
    hiddenField("activity"),
  ],
};

const educationShape: ItemShape = {
  noun: "school",
  title: (i) => str(i.school) || "New school",
  subtitle: (i) => join(i.degree, i.period),
  fields: [text("school", "School"), text("degree", "Degree", { half: true }), text("period", "Period", { half: true }), textarea("detail", "Details"), hiddenField("entry")],
};

const skillShape: ItemShape = {
  noun: "skill group",
  title: (i) => str(i.group) || "New group",
  subtitle: (i) => (Array.isArray(i.items) ? `${i.items.length} items` : ""),
  fields: [text("group", "Group name"), tags("items", "Skills", { placeholder: "KiCad" }), hiddenField("group")],
};

const pillarShape: ItemShape = {
  noun: "card",
  title: (i) => str(i.title) || "New card",
  fields: [text("title", "Title"), textarea("text", "Text")],
};

const layoutShape: ItemShape = {
  noun: "section",
  title: (i) => str(i.id),
  fields: [text("id", "Section"), toggle("show", "Show", { default: true }), text("nav", "Menu label")],
};

const sectionText = (extra: Field[] = []) => [
  text("eyebrow", "Small label above the heading", { half: true }),
  text("heading", "Heading", { half: true }),
  textarea("intro", "Intro"),
  ...extra,
];

export const LABEL_FIELDS: Field[] = [
  text("menu", "Mobile menu button"),
  text("downloadCv", "Download CV button"),
  text("allWork", "Back link on project pages"),
  text("role", "“Role” on project pages"),
  text("links", "“Links” on project pages"),
  text("versionHistory", "Version history heading"),
  text("noImages", "When a version has no photos"),
  text("nextProject", "Next project link"),
  text("exploreVersions", "Featured card button (several versions)", { help: "{n} is replaced by the number of versions." }),
  text("viewProject", "Featured card button (one version)"),
  text("versionsCount", "Version count tag", { help: "{n} is replaced by the number." }),
  text("photosCount", "Photo count", { help: "{n} is replaced by the number." }),
  text("allProjectsTitle", "All projects page title"),
  text("filterAll", "“All” filter"),
  text("searchProjects", "Project search box"),
  text("noResults", "When the search finds nothing"),
  text("certificatesTitle", "Certificates page title"),
  textarea("certificatesIntro", "Certificates page intro"),
  text("awardsHeading", "Awards heading on the certificates page"),
  text("viewAllCertificates", "Link to all certificates", { help: "{n} is replaced by the number." }),
  text("viewCertificate", "View certificate"),
  text("verify", "Verify link"),
  text("openPdf", "Open PDF link"),
  text("credentialId", "Credential ID label"),
  text("close", "Close button"),
  text("previous", "Previous button"),
  text("next", "Next button"),
  text("notFoundTitle", "Page not found title"),
  text("notFoundText", "Page not found text"),
  text("backHome", "Back to home link"),
  text("sourceCode", "“Source code” on project pages"),
  text("codeOnGithub", "Code badge on project cards"),
  text("copyLink", "Copy link button"),
  text("linkCopied", "After the link is copied"),
];

export const siteFields: Field[] = [
  group("meta", "Search and sharing", [
    text("siteTitle", "Browser tab and Google title"),
    textarea("description", "Description for Google and link previews"),
    image("ogImage", "Link preview image", { help: "Shown when the site is shared on LinkedIn, WhatsApp… Empty = your photo." }),
    image("favicon", "Browser tab icon", { help: "A small square image. Empty = default icon." }),
    image("logo", "Logo", { help: "Shown top left. Empty = your initials." }),
  ]),
  group("theme", "Colours", [color("accent", "Accent colour", { default: "#e3a061", help: "Buttons, highlights and links." })]),
  list("layout", "Sections", layoutShape),
  group("hero", "Top of the page", [
    text("eyebrow", "Small label above your name"),
    text("name", "Name"),
    textarea("headline", "Headline"),
    textarea("intro", "Intro"),
    image("photo", "Photo"),
    text("location", "Location", { half: true }),
    text("availability", "Availability line", { half: true, help: "Empty hides the green dot line." }),
    group("primaryCta", "Main button", [text("label", "Label", { half: true }), text("url", "Goes to", { half: true, help: "#work, #contact or a full web address." })]),
    group("secondaryCta", "Second button", [text("label", "Label", { half: true }), text("url", "Goes to", { half: true })]),
  ]),
  list("stats", "Key numbers", metricShape, { help: "Four look best." }),
  group("about", "About", [
    text("eyebrow", "Small label above the heading", { half: true }),
    text("heading", "Heading", { half: true }),
    lines("paragraphs", "Paragraphs", { long: true }),
    list("pillars", "Cards", pillarShape, { help: "Four look best." }),
  ]),
  group("projectsSection", "Projects section", [
    ...sectionText(),
    text("moreHeading", "Heading above the smaller cards", { half: true }),
    text("allLabel", "Link to all projects", { half: true }),
    number("homeLimit", "Smaller cards on the home page", { default: 6, help: "0 shows every project." }),
  ]),
  list("projects", "Projects", projectShape),
  group("experienceSection", "Experience section", sectionText()),
  list("experience", "Roles", experienceShape, { help: "Newest first." }),
  group("recognitionSection", "Recognition section", [
    ...sectionText(),
    text("certificatesHeading", "Certificates heading", { half: true }),
    number("homeLimit", "Certificates on the home page", { half: true, default: 6, help: "Featured ones first. 0 shows all." }),
  ]),
  list("awards", "Awards", awardShape),
  list("certificates", "Certificates", certificateShape),
  group("skillsSection", "Skills section", sectionText()),
  list("skills", "Skill groups", skillShape),
  group("activitiesSection", "Leadership section", [...sectionText(), text("educationHeading", "Education heading")]),
  list("activities", "Activities", activityShape),
  list("education", "Education", educationShape),
  group("contact", "Contact", [
    text("eyebrow", "Small label above the heading", { half: true }),
    text("heading", "Heading", { half: true }),
    textarea("text", "Text"),
    email("email", "Email", { half: true }),
    text("phone", "Phone", { half: true, help: "Empty hides it." }),
    text("location", "Location"),
    file("cvUrl", "CV (PDF)", { accept: ".pdf,application/pdf", help: "Upload your CV to show a Download CV button." }),
    list("links", "Profile links", linkShape, { help: "LinkedIn, GitHub, ResearchGate… shown in Contact and the footer." }),
  ]),
  group("footer", "Footer", [
    text("text", "Footer text", { help: "{year} and {name} are filled in automatically." }),
    toggle("showLinks", "Show profile links in the footer", { default: true }),
  ]),
  group("labels", "Words and labels", LABEL_FIELDS),
];

export function fieldByKey(fields: Field[], key: string) {
  return fields.find((x) => x.key === key);
}
