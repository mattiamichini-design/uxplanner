import { StoryCategoryFilter } from "@/components/user-story/story-category-filter";
import { getAllStories } from "@/lib/stories/registry";

export const metadata = {
  title: "User Stories",
  description: "Browse the user stories in this project.",
};

export default function UserStoriesPage() {
  const stories = getAllStories();

  return (
    stories.length > 0 ? (
      <StoryCategoryFilter stories={stories.map(({ slug, title, sourcePath, category }) => ({ slug, title, sourcePath, category }))} />
    ) : (
      <main className="p-6 text-sm text-ux-muted">No user stories found in this project.</main>
    )
  );
}
