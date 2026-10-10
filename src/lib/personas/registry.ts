import matter from 'gray-matter';
import type { PersonaData } from './types';
import { listFiles, readText } from '../server/workspace.mjs';

export function getAllPersonas(): PersonaData[] {
  return listFiles('personas').filter(file => file.isFile() && file.name.endsWith('.md') && file.name.toLowerCase() !== 'readme.md').map(file => {
    const { data, content } = matter(readText('personas', file.name));
    return { id: String(data.id || file.name.slice(0,-3)), slug: String(data.slug || file.name.slice(0,-3)), name: String(data.name || file.name.slice(0,-3)), role: data.role, summary: data.summary, ageRange: data['age-range'], location: data.location, techSavvy: data['tech-savvy'], mvpPractice: data.mvp_practice, mvpPriority: data.mvp_priority, validated: data.validated, updated: data.updated instanceof Date ? data.updated.toISOString() : data.updated, tags: data.tags, content };
  });
}
export function getPersonaBySlug(slug: string) { return getAllPersonas().find(persona => persona.slug === slug); }
export function personaFilename(slug: string) {
  return listFiles('personas').filter(file => file.isFile() && file.name.endsWith('.md') && file.name.toLowerCase() !== 'readme.md').find(file => {
    const { data } = matter(readText('personas', file.name));
    return String(data.slug || file.name.slice(0,-3)) === slug;
  })?.name;
}
