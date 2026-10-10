import type { JourneyType, JourneyConfig, Persona, PersonaVariant } from './types';
import { getAllPersonas as readPersonas } from '../personas/registry';
import { personaInitials } from '../personas/initials';
import { listFiles, readJSON } from '../server/workspace.mjs';
export type { JourneyConfig };
export function getAllJourneyTypes(): JourneyType[] {
  return listFiles('user-journeys').filter(entry => entry.isDirectory() && listFiles('user-journeys',entry.name).some(file => file.name.endsWith('.json'))).map(entry => {
    const files = listFiles('user-journeys',entry.name);
    const meta = files.some(file => file.name === 'meta.json') ? readJSON('user-journeys',entry.name,'meta.json') : {};
    return { id: entry.name, slug: entry.name, title: meta.title || entry.name.replaceAll('-',' '), description: meta.description || '', icon: meta.icon || 'Map' };
  });
}
export function getAllPersonas(): Persona[] {
  return readPersonas().map(persona => ({ id:persona.id, slug:persona.slug, name:persona.name, initials:personaInitials(persona.name), color:'bg-ux-persona-chip' }));
}
export function getAllPersonaVariants(): PersonaVariant[] { return getAllPersonas().map(p => ({...p,personaSlug:p.slug})); }
export function getPersonaBySlug(slug: string) { return getAllPersonas().find(p=>p.slug===slug); }
export function getAllJourneys(): JourneyConfig[] {
  return getAllJourneyTypes().flatMap(type => listFiles('user-journeys',type.slug).filter(file=>file.isFile() && file.name.endsWith('.json') && file.name!=='meta.json').map(file=>{
    const personaSlug=file.name.slice(0,-5); const data=readJSON('user-journeys',type.slug,file.name);
    return {id:`${type.slug}-${personaSlug}`,slug:`${type.slug}-${personaSlug}`,title:data.title,shortTitle:data.title,persona:data.meta?.persona || personaSlug,personaSlug,journeyType:type.slug,journeyTypeSlug:type.slug,description:data.meta?.summary || ''};
  }));
}
export function getJourneysByType(slug: string) { return getAllJourneys().filter(j=>j.journeyTypeSlug===slug); }
export function getJourneyBySlug(slug: string) { return getAllJourneys().find(j=>j.slug===slug); }
export function getJourneyTypeBySlug(slug: string) { return getAllJourneyTypes().find(t=>t.slug===slug); }
export async function journeyExists(slug: string) { return Boolean(getJourneyBySlug(slug)); }
