"use server";
import { revalidatePath } from 'next/cache';
import matter from 'gray-matter';
import type { PersonaData } from '@/lib/personas/types';
import { assertSafePathSegment } from '@/lib/server/resolve-inside-root';
import { assertBoundedArray, assertBoundedBoolean, assertBoundedRecord, assertBoundedString, optionalBoundedString } from '@/lib/server/action-payload';
import { localMutation } from '@/lib/server/local-session';
import { commitFiles, readText } from '@/lib/server/workspace.mjs';
import { getAllJourneys } from '@/lib/user-journey/registry';
import { personaFilename, getPersonaBySlug } from '@/lib/personas/registry';
type PersonaUpdateData = Omit<PersonaData, "id" | "slug" | "updated">;
const PERSONA_DATA_KEYS = [
  "id",
  "slug",
  "name",
  "role",
  "summary",
  "ageRange",
  "location",
  "techSavvy",
  "mvpPractice",
  "mvpPriority",
  "validated",
  "updated",
  "tags",
  "content",
] as const;

function parsePersonaSlug(value: unknown): string {
  const slug = assertBoundedString(value, "persona slug", {
    minLength: 1,
    maxLength: 120,
    singleLine: true,
  });
  assertSafePathSegment(slug);
  return slug;
}

function parsePersonaName(value: unknown): string {
  const name = assertBoundedString(value, "persona name", {
    minLength: 1,
    maxLength: 120,
    singleLine: true,
  });
  if (!name.trim()) throw new Error("Invalid persona name");
  return name;
}

function parsePersonaUpdate(value: unknown): PersonaUpdateData {
  const data = assertBoundedRecord(value, "persona data", {
    maxKeys: PERSONA_DATA_KEYS.length,
    allowedKeys: PERSONA_DATA_KEYS,
  });
  const optionalString = (field: string, maxLength: number) =>
    optionalBoundedString(data[field], field, { maxLength });

  if (data.id !== undefined) optionalString("id", 120);
  if (data.slug !== undefined) parsePersonaSlug(data.slug);
  if (data.updated !== undefined) optionalString("updated", 80);

  const name = parsePersonaName(data.name);
  const role = optionalString("role", 500);
  const summary = optionalString("summary", 4_000);
  const ageRange = optionalString("ageRange", 120);
  const location = optionalString("location", 500);
  const techSavvy = optionalString("techSavvy", 120);
  const mvpPractice = optionalString("mvpPractice", 120);
  const content = assertBoundedString(data.content, "persona content", { maxLength: 100_000 });
  const tags =
    data.tags === undefined
      ? undefined
      : assertBoundedArray(data.tags, "persona tags", {
          maxLength: 30,
          itemName: "persona tag",
          parseItem: (tag, field) =>
            assertBoundedString(tag, field, { maxLength: 100, singleLine: true }),
        });
  const mvpPriority =
    data.mvpPriority === undefined
      ? undefined
      : assertBoundedBoolean(data.mvpPriority, "mvp priority");
  const validated =
    data.validated === undefined ? undefined : assertBoundedBoolean(data.validated, "validated");

  return {
    name,
    role,
    summary,
    ageRange,
    location,
    techSavvy,
    mvpPractice,
    mvpPriority,
    validated,
    tags,
    content,
  };
}


function serialize(slug:string,data:PersonaUpdateData,existing:Record<string,unknown> = {}) {
  return matter.stringify(data.content,{...existing,slug,name:data.name,role:data.role || '',summary:data.summary || '', 'age-range':data.ageRange || '',location:data.location || '', 'tech-savvy':data.techSavvy || '',mvp_practice:data.mvpPractice || '',mvp_priority:data.mvpPriority || false,validated:data.validated || false,updated:new Date().toISOString(),tags:data.tags || []});
}
export async function createPersona(name:string) {
  return localMutation(()=>{
    const validName=parsePersonaName(name);const slug=parsePersonaSlug(validName.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''));
    if(personaFilename(slug))throw new Error('Persona with this name already exists');
    commitFiles([{segments:['personas',`${slug}.md`],expected:null,content:serialize(slug,{name:validName,content:'## Overview\n\n## Motivations\n\n## Goals\n\n## Pain Points\n'})}]);
    revalidatePath('/ux-planner','layout');return {success:true as const,slug};
  });
}
export async function updatePersona(slug:string,data:PersonaUpdateData,expectedUpdated?:string) {
  return localMutation(()=>{
    parsePersonaSlug(slug);const validated=parsePersonaUpdate(data);const filename=personaFilename(slug);if(!filename)throw new Error('Persona not found');
    if(expectedUpdated !== undefined && getPersonaBySlug(slug)?.updated!==expectedUpdated)throw new Error('This persona changed. Reload before saving.');
    const segments=['personas',filename];const before=readText(...segments);commitFiles([{segments,expected:before,content:serialize(slug,validated,matter(before).data)}]);
    revalidatePath('/ux-planner','layout');return {success:true as const};
  });
}
export async function deletePersona(slug:string) {
  return localMutation(()=>{
    parsePersonaSlug(slug);const filename=personaFilename(slug);if(!filename)throw new Error('Persona not found');
    if(getAllJourneys().some(j=>j.personaSlug===slug))throw new Error('This persona has journeys. Remove it from those journeys before deleting.');
    const segments=['personas',filename];commitFiles([{segments,expected:readText(...segments),content:null}]);
    revalidatePath('/ux-planner','layout');return {success:true as const};
  });
}
