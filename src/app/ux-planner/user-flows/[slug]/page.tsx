import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllFlowTypes, getFlowsByType, getFlowTypeBySlug } from "@/lib/user-flow/registry";
import { getAllPersonas } from "@/lib/user-journey/registry";
import { FlowViewer } from "@/components/user-flow/flow-viewer";
import { StudioSidebar, StudioSidebarLink, StudioWorkspace } from "@/components/ux-planner/studio-shell";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ persona?: string }>;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, { persona }] = await Promise.all([params, searchParams]);
  const flowType = getFlowTypeBySlug(slug);

  if (!flowType) {
    return {
      title: "Flow not found · UX Planner",
    };
  }

  const personaFlow = persona
    ? getFlowsByType(slug).find((flow) => flow.slug === persona)
    : undefined;

  return {
    title: `${personaFlow?.title ?? flowType.title} · User Flows`,
    description: flowType.description,
  };
}

export default async function UserFlowPage({ params, searchParams }: Props) {
  const [{ slug }, { persona }] = await Promise.all([params, searchParams]);

  const flowType = getFlowTypeBySlug(slug);
  if (!flowType) notFound();

  const allFlows = getFlowsByType(slug);
  const flowTypes = getAllFlowTypes();
  const allPersonas = getAllPersonas();

  if (allFlows.length === 0) notFound();

  // Determine current active flow (persona)
  const currentFlow = persona
    ? (allFlows.find((f) => f.slug === persona) ?? allFlows[0])
    : allFlows[0];

  return (
    <StudioWorkspace
      section="Flows"
      current={flowType.title}
      sidebar={
        <StudioSidebar title="Flows">
          {flowTypes.map((type) => (
            <StudioSidebarLink key={type.slug} href={`/ux-planner/user-flows/${type.slug}`} active={type.slug === slug} label={type.title} iconName={type.icon || "Map"} />
          ))}
        </StudioSidebar>
      }
    >
      <FlowViewer
        slug={slug}
        flowType={flowType}
        allFlows={allFlows}
        currentFlow={currentFlow}
        allPersonas={allPersonas}
      />
    </StudioWorkspace>
  );
}
