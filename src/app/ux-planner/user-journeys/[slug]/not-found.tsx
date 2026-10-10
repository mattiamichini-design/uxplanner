import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid w-full gap-8 px-6 py-8">
      <div className="text-foreground mx-auto grid max-w-2xl gap-6 py-16 text-center">
        <div className="text-6xl">🗺️</div>
        <h1 className="text-3xl font-semibold">Journey not found</h1>
        <p className="text-muted-foreground text-base">
          This journey does not exist or has not been created yet.
        </p>
        <div className="mt-4 flex justify-center gap-4">
          <Link
            href="/ux-planner/user-journeys"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 py-3 font-medium transition"
          >
            See all journeys
          </Link>
        </div>
      </div>
    </main>
  );
}
