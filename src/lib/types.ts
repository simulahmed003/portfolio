// The whole website is driven by one SiteContent document.
// It is stored as JSON in Supabase (table portfolio_content, id = 'main') and edited from /admin.
// If Supabase is not configured or empty, src/content/default.ts is used.

export type Img = { src: string; caption: string };
export type Link = { label: string; url: string };
export type Metric = { value: string; label: string };
export type Spec = { label: string; value: string };

export type Version = {
  label: string; // e.g. "v1.0"
  name: string; // e.g. "STM32 milled prototype"
  date: string; // e.g. "Jan 2025"
  status: string; // e.g. "Built and tested", "In production", "In design"
  summary: string;
  highlights: string[];
  specs: Spec[];
  images: Img[];
};

export type ProjectFamily = {
  slug: string;
  title: string;
  tagline: string;
  category: string; // "Commercial product" | "Client work" | "Research" | "Fabrication" | "Personal build"
  organisation: string;
  role: string;
  period: string;
  cover: string;
  summary: string;
  tags: string[];
  featured: boolean;
  hidden: boolean;
  metrics: Metric[];
  links: Link[];
  versions: Version[];
};

export type Experience = {
  organisation: string;
  role: string;
  period: string;
  location: string;
  type: string;
  summary: string;
  bullets: string[];
  hidden: boolean;
};

export type Award = { title: string; organisation: string; date: string; detail: string; image: string };
export type Activity = { title: string; date: string; text: string; image: string; link: string };
export type Education = { school: string; degree: string; period: string; detail: string };
export type Certification = { name: string; issuer: string; date: string; credential: string; image: string };

export type SiteContent = {
  meta: { siteTitle: string; description: string };
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
  about: { heading: string; paragraphs: string[]; pillars: { title: string; text: string }[] };
  projectsSection: { heading: string; intro: string };
  projects: ProjectFamily[];
  experienceSection: { heading: string; intro: string };
  experience: Experience[];
  skills: { group: string; items: string[] }[];
  awards: Award[];
  certifications: Certification[];
  education: Education[];
  activitiesSection: { heading: string; intro: string };
  activities: Activity[];
  contact: {
    heading: string;
    text: string;
    email: string;
    phone: string;
    linkedin: string;
    github: string;
    location: string;
    cvUrl: string;
  };
};
