// The whole website is one SiteContent document, stored as JSON in Supabase and edited from /admin.
// src/lib/schema.ts describes every field here (label, kind, default). Keep the two in step: saved content is
// repaired against the schema, so a field that is only added here is dropped on the next save.

export type Img = { src: string; caption: string; alt: string };
export type Link = { label: string; url: string };
export type Metric = { value: string; label: string };
export type Spec = { label: string; value: string };
export type Repo = { url: string; name: string; note: string }; // a GitHub repository; name empty = taken from the address

export type Version = {
  label: string; // e.g. "v1"
  name: string; // e.g. "STM32 milled prototype"
  date: string; // e.g. "Jan 2025"
  status: string; // e.g. "Built and tested"
  summary: string;
  highlights: string[];
  specs: Spec[];
  images: Img[];
  hidden: boolean;
};

export type ProjectFamily = {
  slug: string;
  title: string;
  tagline: string;
  category: string;
  organisation: string;
  role: string;
  period: string;
  cover: string;
  summary: string;
  tags: string[];
  featured: boolean;
  hidden: boolean;
  metrics: Metric[];
  repos: Repo[];
  links: Link[];
  versions: Version[]; // oldest first; the project page opens on the last (newest) one
  oldSlugs: string[]; // earlier web addresses; they redirect to the current one so shared links keep working
};

export type Experience = {
  organisation: string;
  role: string;
  period: string;
  current: boolean;
  location: string;
  type: string;
  summary: string;
  bullets: string[];
  hidden: boolean;
};

export type Award = { title: string; organisation: string; date: string; detail: string; image: string; link: string; hidden: boolean };

export type Certificate = {
  title: string;
  issuer: string;
  date: string;
  kind: string; // Achievement, Participation, Training, ...
  detail: string;
  image: string; // picture of the certificate
  file: string; // optional PDF
  credentialId: string;
  credentialUrl: string;
  featured: boolean; // shown on the home page
  hidden: boolean;
};

export type Activity = { title: string; date: string; text: string; image: string; link: string; hidden: boolean };
export type Education = { school: string; degree: string; period: string; detail: string; hidden: boolean };
export type SkillGroup = { group: string; items: string[]; hidden: boolean };
export type Pillar = { title: string; text: string };

// Home page sections after the hero, in display order.
export const SECTION_IDS = ["stats", "about", "work", "experience", "recognition", "skills", "leadership", "contact"] as const;
export type SectionId = (typeof SECTION_IDS)[number];
export type LayoutItem = { id: string; show: boolean; nav: string };

export type Labels = {
  menu: string;
  downloadCv: string;
  allWork: string;
  role: string;
  links: string;
  versionHistory: string;
  noImages: string;
  nextProject: string;
  exploreVersions: string; // {n} = number of versions
  viewProject: string;
  versionsCount: string; // {n}
  photosCount: string; // {n}
  allProjectsTitle: string;
  filterAll: string;
  searchProjects: string;
  noResults: string;
  certificatesTitle: string;
  certificatesIntro: string;
  awardsHeading: string;
  viewAllCertificates: string; // {n}
  viewCertificate: string;
  verify: string;
  openPdf: string;
  credentialId: string;
  close: string;
  previous: string;
  next: string;
  notFoundTitle: string;
  notFoundText: string;
  backHome: string;
  sourceCode: string;
  codeOnGithub: string;
  copyLink: string;
  linkCopied: string;
};

export type SiteContent = {
  meta: { siteTitle: string; description: string; ogImage: string; favicon: string; logo: string };
  theme: { accent: string };
  layout: LayoutItem[];
  hero: {
    eyebrow: string;
    name: string;
    headline: string;
    intro: string;
    photo: string;
    location: string;
    availability: string;
    primaryCta: Link;
    secondaryCta: Link;
  };
  stats: Metric[];
  about: { eyebrow: string; heading: string; paragraphs: string[]; pillars: Pillar[] };
  projectsSection: { eyebrow: string; heading: string; intro: string; moreHeading: string; allLabel: string; homeLimit: number };
  projects: ProjectFamily[];
  experienceSection: { eyebrow: string; heading: string; intro: string };
  experience: Experience[];
  recognitionSection: { eyebrow: string; heading: string; intro: string; certificatesHeading: string; homeLimit: number };
  awards: Award[];
  certificates: Certificate[];
  skillsSection: { eyebrow: string; heading: string; intro: string };
  skills: SkillGroup[];
  activitiesSection: { eyebrow: string; heading: string; intro: string; educationHeading: string };
  activities: Activity[];
  education: Education[];
  contact: {
    eyebrow: string;
    heading: string;
    text: string;
    email: string;
    phone: string;
    location: string;
    cvUrl: string;
    links: Link[];
  };
  footer: { text: string; showLinks: boolean };
  labels: Labels;
};

export type DeepPartial<T> = T extends (infer U)[] ? DeepPartial<U>[] : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;
