export type JourneyActor = {
  id: string;
  label: string;
};

export type JourneyItem = {
  text: string;
  emoji?: string;
  emphasis?: "positive" | "neutral" | "negative";
};

export type JourneyCell = {
  columnId: string;
  items: JourneyItem[];
};

export type JourneyRow = {
  id: string;
  label: string;
  description?: string;
  cells: JourneyCell[];
};

export type JourneyColumn = {
  id: string;
  label: string;
  subtitle?: string;
};

export type JourneyMeta = {
  persona: string;
  journeyType?: string;
  updatedAt?: string;
  tags?: string[];
  summary?: string;
};

export type JourneyData = {
  uxArtifact?: { id: string; canonicalRecord: string; role: string; stepIds: string[] };
  title: string;
  meta: JourneyMeta;
  columns: JourneyColumn[];
  rows: JourneyRow[];
  notes?: string[];
  actors?: JourneyActor[];
  content?: string;
};

export type JourneyType = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  icon?: string;
};

export type Persona = {
  id: string;
  slug: string;
  name: string;
  initials: string;
  color?: string;
};

export type PersonaVariant = {
  id: string;
  slug: string;
  name: string;
  personaSlug: string;
};

export type JourneyConfig = {
  id: string;
  slug: string;
  title: string;
  shortTitle?: string;
  persona: string;
  personaSlug: string;
  journeyType: string;
  journeyTypeSlug: string;
  description: string;
};
