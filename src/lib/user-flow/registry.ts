import matter from 'gray-matter';
import type { FlowType, UserFlow } from './types';
import { listFiles, readText, readJSON } from '../server/workspace.mjs';

export function getAllFlowTypes(): FlowType[] {
  return listFiles('user-flows').filter(e=>e.isDirectory()).map(e=>{
    const meta=listFiles('user-flows',e.name).some(f=>f.name==='meta.json') ? readJSON('user-flows',e.name,'meta.json') : {};
    return {slug:e.name,title:meta.title || e.name.replaceAll('-',' '),description:meta.description || '',icon:meta.icon || 'Map'};
  });
}
export function getFlowsByType(typeSlug: string): UserFlow[] {
  return listFiles('user-flows',typeSlug).filter(f=>f.isFile() && f.name.endsWith('.md') && f.name.toLowerCase()!=='readme.md').map(f=>{
    const {data,content}=matter(readText('user-flows',typeSlug,f.name));
    return {slug:f.name.slice(0,-3),flowTypeSlug:typeSlug,title:data.title || f.name.slice(0,-3),mermaidContent:content.match(/```mermaid\s*([\s\S]*?)```/)?.[1].trim() || '',narrative:content.replace(/```mermaid[\s\S]*?```/g,'').trim()};
  });
}
export function getFlowTypeBySlug(slug:string) { return getAllFlowTypes().find(t=>t.slug===slug); }
