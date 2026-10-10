import matter from 'gray-matter';
import { listFiles, readText } from '../server/workspace.mjs';

export type StorySummary = {
  slug: string;
  title: string;
  content: string;
  sourcePath: string;
  category: string;
  journey?: string;
};

const uncategorized = 'Uncategorized';

export function getAllStories(): StorySummary[] {
  return listFiles('user-stories').filter(f=>f.isFile() && f.name.endsWith('.md') && f.name.toLowerCase()!=='readme.md').map(f=>{
    const {data,content}=matter(readText('user-stories',f.name));
    const category=typeof data.category==='string' && data.category.trim() ? data.category.trim() : uncategorized;
    const journey=typeof data.journey==='string' && data.journey.trim() ? data.journey.trim() : undefined;
    return {slug:f.name.slice(0,-3),title:String(data.title || content.match(/^#\s+(.+)/m)?.[1] || f.name.slice(0,-3)),content,sourcePath:`docs/ux/user-stories/${f.name}`,category,journey};
  });
}
export function getStoryBySlug(slug:string) {return getAllStories().find(s=>s.slug===slug);}
