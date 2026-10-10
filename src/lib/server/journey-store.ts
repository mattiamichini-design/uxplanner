import type { JourneyData } from '../user-journey/types';
import { parseJourneyData, parseJourneySlug } from './user-journey-payload';
import { commitFiles, listFiles, readText, revision } from './workspace.mjs';
export function journeySegments(type: string, persona: string) { return ['user-journeys',parseJourneySlug(type),`${parseJourneySlug(persona)}.json`]; }
export function targetPersonas(type: string, persona: string, all: boolean) {
  parseJourneySlug(type); parseJourneySlug(persona);
  if (typeof all !== 'boolean') throw new Error('Invalid apply-to-all value');
  return all ? listFiles('user-journeys',type).filter(f=>f.isFile() && f.name.endsWith('.json') && f.name!=='meta.json').map(f=>f.name.slice(0,-5)) : [persona];
}
export function editJourneys(type: string, personas: string[], edit: (journeys: JourneyData[]) => void, expectedRevision?: string) {
  const targets=[...new Set(personas)].map(persona=>{
    const segments=journeySegments(type,persona); const expected=readText(...segments);
    if(expectedRevision !== undefined && revision(expected)!==expectedRevision)throw new Error("This journey changed. Read it again before saving.");
    return {segments,expected,data:parseJourneyData(JSON.parse(expected))};
  });
  edit(targets.map(t=>t.data));
  commitFiles(targets.map(t=>({segments:t.segments,expected:t.expected,content:JSON.stringify(parseJourneyData({...t.data,meta:{...t.data.meta,updatedAt:new Date().toISOString()}}),null,2)+'\n'})));
}
export function requireRow(data: JourneyData, id: string) {
  const row=data.rows.find(r=>r.id===id);if(!row) throw new Error('Row not found');return row;
}
export function requireCell(data: JourneyData, rowId: string, columnId: string) {
  if(!data.columns.some(c=>c.id===columnId)) throw new Error('Column not found');
  const row=requireRow(data,rowId);let cell=row.cells.find(c=>c.columnId===columnId);
  if(!cell) {cell={columnId,items:[]};row.cells.push(cell);}return cell;
}
export function requireItemIndex(index: number, length: number, insertion=false) {
  if(!Number.isInteger(index)||index<0||index>(insertion?length:length-1)) throw new Error('Item no longer exists. Reload this journey.');
}
