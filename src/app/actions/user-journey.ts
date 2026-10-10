"use server";
import { revalidatePath } from 'next/cache';
import { localMutation } from '@/lib/server/local-session';
import { parseJourneySlug, parseJourneyText, parseJourneyIdentifier } from '@/lib/server/user-journey-payload';
import { getAllPersonas } from '@/lib/personas/registry';
import { commitFiles, listFiles, readText, safePath } from '@/lib/server/workspace.mjs';
import { existsSync, readdirSync } from 'node:fs';
function details(title:string,subtitle:string,icon:string,personas:string[]) {
  parseJourneyText(title,'title',500);parseJourneyText(subtitle,'description',4000);parseJourneyIdentifier(icon,'icon');
  if(!title.trim() || !Array.isArray(personas) || !personas.length || personas.length>100 || new Set(personas).size!==personas.length)throw new Error('Select at least one persona and enter a title');
  const available=getAllPersonas();for(const slug of personas){parseJourneySlug(slug);if(!available.some(p=>p.slug===slug))throw new Error('Persona not found');}
}
function blankJourney(title:string,type:string,persona:string) {
  const name=getAllPersonas().find(p=>p.slug===persona)?.name || persona;
  return JSON.stringify({title:`${title} · ${name}`,meta:{persona:name,journeyType:type,updatedAt:new Date().toISOString()},columns:[],rows:[['actions','User actions'],['goals','Goals & experiences'],['feelings','Feelings & thoughts'],['pain-points','Pain points'],['opportunities','Opportunities']].map(([id,label])=>({id,label,cells:[]})),notes:[],content:''},null,2)+'\n';
}
export async function createNewJourney(title:string,subtitle:string,personas:string[],icon='Map') {
  return localMutation(()=>{
    details(title,subtitle,icon,personas);const slug=parseJourneySlug(title.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''));
    if(existsSync(safePath('user-journeys',slug)) && readdirSync(safePath('user-journeys',slug)).length)throw new Error('A journey with this name already exists');
    commitFiles([{segments:['user-journeys',slug,'meta.json'],expected:null,content:JSON.stringify({title,description:subtitle,icon},null,2)+'\n'},...personas.map(p=>({segments:['user-journeys',slug,`${p}.json`],expected:null,content:blankJourney(title,slug,p)}))]);
    revalidatePath('/ux-planner','layout');return {success:true as const,slug};
  });
}
export async function updateJourneyType(slug:string,title:string,subtitle:string,icon?:string,personas?:string[]) {
  return localMutation(()=>{
    parseJourneySlug(slug);const files=listFiles('user-journeys',slug).filter(f=>f.isFile()&&f.name.endsWith('.json')&&f.name!=='meta.json');
    const selected=personas || files.map(f=>f.name.slice(0,-5));details(title,subtitle,icon || 'Map',selected);
    const metaSegments=['user-journeys',slug,'meta.json'];if(!files.length)throw new Error('Journey not found');
    const before=existsSync(safePath(...metaSegments)) ? readText(...metaSegments) : null;const meta=before ? JSON.parse(before) : {};
    const changes: {segments:string[];expected:string|null;content:string|null}[]=[{segments:metaSegments,expected:before,content:JSON.stringify({...meta,title,description:subtitle,icon:icon || meta.icon || 'Map'},null,2)+'\n'}];
    for(const persona of selected)if(!files.some(f=>f.name===`${persona}.json`))changes.push({segments:['user-journeys',slug,`${persona}.json`],expected:null,content:blankJourney(title,slug,persona)});
    for(const file of files)if(!selected.includes(file.name.slice(0,-5))) {const segments=['user-journeys',slug,file.name];changes.push({segments,expected:readText(...segments),content:null});}
    commitFiles(changes);revalidatePath('/ux-planner','layout');return {success:true as const};
  });
}
export async function deleteJourneyType(slug:string) {
  return localMutation(()=>{
    parseJourneySlug(slug);const files=listFiles('user-journeys',slug);if(!files.length)throw new Error('Journey not found');
    if(files.some(f=>!f.isFile()||!f.name.endsWith('.json')))throw new Error('This folder contains extra documents. Remove it explicitly in your editor.');
    commitFiles(files.map(f=>{const segments=['user-journeys',slug,f.name];return {segments,expected:readText(...segments),content:null};}));
    revalidatePath('/ux-planner','layout');return {success:true as const};
  });
}
