import { redirect } from "next/navigation";
import { getAllFlowTypes } from "@/lib/user-flow/registry";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Flows",
  description: "Explore the user flows in this project.",
};

export default function UserFlowsPage() {
  const flowTypes = getAllFlowTypes();

  if (flowTypes.length > 0) {
    redirect(`/ux-planner/user-flows/${flowTypes[0].slug}`);
  }

  return (
    <main className="grid w-full gap-8 px-6 py-8">
      <header className="text-foreground grid gap-4 text-center">
        <h1 className="text-3xl font-semibold">User Flows</h1>
        <p className="text-muted-foreground text-base">No user flows found in this project.</p>
      </header>
    </main>
  );
}
