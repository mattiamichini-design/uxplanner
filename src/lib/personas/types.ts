export type PersonaData = {
  id: string;
  slug: string;
  name: string;
  role?: string;
  summary?: string;
  ageRange?: string;
  location?: string;
  techSavvy?: string;
  mvpPractice?: string;
  mvpPriority?: boolean;
  validated?: boolean;
  updated?: string;
  tags?: string[];
  content: string; // Markdown body
};
