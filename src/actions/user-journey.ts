"use server";
import { revalidatePath } from 'next/cache';
import type { JourneyData, JourneyItem } from '@/lib/user-journey/types';
import { localMutation } from '@/lib/server/local-session';
import { editJourneys, targetPersonas, requireCell, requireItemIndex } from '@/lib/server/journey-store';
import { parseJourneyData, parseJourneyIdentifier, parseJourneyText, parseJourneyItemUpdate } from '@/lib/server/user-journey-payload';
function edit(type: string, personas: string[], operation: (data: JourneyData[])=>void, expectedRevision?:string) {
  editJourneys(type,personas,operation,expectedRevision); revalidatePath('/ux-planner','layout'); return {success:true as const};
}
export async function addJourneyItem(type:string, persona:string,row:string,column:string,text:string,expectedRevision?:string) {
  return localMutation(()=>edit(type,[persona],([data])=>{requireCell(data,row,column).items.push({text:parseJourneyText(text,'item text')});},expectedRevision));
}
export async function updateJourneyItem(type:string,persona:string,row:string,column:string,index:number,item:JourneyItem,expectedRevision?:string) {
  return localMutation(()=>edit(type,[persona],([data])=>{const cell=requireCell(data,row,column);requireItemIndex(index,cell.items.length);cell.items[index]=parseJourneyItemUpdate(item);},expectedRevision));
}
export async function deleteJourneyItem(type:string,persona:string,row:string,column:string,index:number) {
  return localMutation(()=>edit(type,[persona],([data])=>{const cell=requireCell(data,row,column);requireItemIndex(index,cell.items.length);cell.items.splice(index,1);}));
}
export async function duplicateJourneyItem(type:string,persona:string,row:string,column:string,index:number) {
  return localMutation(()=>edit(type,[persona],([data])=>{const cell=requireCell(data,row,column);requireItemIndex(index,cell.items.length);cell.items.splice(index+1,0,structuredClone(cell.items[index]));}));
}
export async function addJourneyRow(type:string,persona:string,label:string,id:string,description:string,all:boolean) {
  return localMutation(()=>edit(type,targetPersonas(type,persona,all),data=>{for(const journey of data){if(journey.rows.some(r=>r.id===id)) throw new Error('Row already exists');journey.rows.push({id:parseJourneyIdentifier(id,'row id'),label:parseJourneyText(label,'row label',500),description:parseJourneyText(description,'row description',4000),cells:[]});}}));
}
export async function updateJourneyRow(type:string,persona:string,id:string,label:string,description:string,all:boolean) {
  return localMutation(()=>edit(type,targetPersonas(type,persona,all),data=>{let found=false;for(const journey of data){const row=journey.rows.find(candidate=>candidate.id===id);if(!row)continue;found=true;Object.assign(row,{label:parseJourneyText(label,'row label',500),description:parseJourneyText(description,'row description',4000)});}if(!found)throw new Error('Row not found');}));
}
export async function deleteJourneyRow(type:string,persona:string,id:string,all:boolean) {
  return localMutation(()=>edit(type,targetPersonas(type,persona,all),data=>{let found=false;for(const journey of data){if(journey.rows.some(row=>row.id===id))found=true;journey.rows=journey.rows.filter(row=>row.id!==id);}if(!found)throw new Error('Row not found');}));
}
export async function addJourneyColumn(type:string,persona:string,label:string,id:string,subtitle:string,all:boolean) {
  return localMutation(()=>edit(type,targetPersonas(type,persona,all),data=>{for(const journey of data){if(journey.columns.some(c=>c.id===id))throw new Error('Column already exists');journey.columns.push({id:parseJourneyIdentifier(id,'column id'),label:parseJourneyText(label,'column label',500),subtitle:parseJourneyText(subtitle,'column subtitle',2000)});}}));
}
export async function updateJourneyColumn(type:string,persona:string,id:string,label:string,subtitle:string) {
  return localMutation(()=>edit(type,[persona],([data])=>{const column=data.columns.find(c=>c.id===id);if(!column)throw new Error('Column not found');Object.assign(column,{label:parseJourneyText(label,'column label',500),subtitle:parseJourneyText(subtitle,'column subtitle',2000)});}));
}
export async function deleteJourneyColumn(type:string,persona:string,id:string) {
  return localMutation(()=>edit(type,[persona],([data])=>{if(!data.columns.some(c=>c.id===id))throw new Error('Column not found');data.columns=data.columns.filter(c=>c.id!==id);for(const row of data.rows)row.cells=row.cells.filter(c=>c.columnId!==id);}));
}
export async function importJourneyBoards(type:string, entries:{persona:string;data:Pick<JourneyData,"columns"|"rows">;expectedUpdatedAt?:string}[]) {
  return localMutation(()=>{
    if(!Array.isArray(entries)||entries.length===0||entries.length>100||new Set(entries.map(e=>e.persona)).size!==entries.length)throw new Error('Invalid CSV personas');
    return edit(type,entries.map(e=>e.persona),journeys=>{
      journeys.forEach((current,index)=>{
        const entry=entries[index];
        if(current.meta.updatedAt!==entry.expectedUpdatedAt)throw new Error('This journey changed. Reload before importing.');
        // CSV replaces board cells; each target keeps its own identity and source evidence.
        Object.assign(current,parseJourneyData({...current,columns:entry.data.columns,rows:entry.data.rows}));
      });
    });
  });
}
export async function moveJourneyItem(type:string,persona:string,startRow:string,startColumn:string,endRow:string,endColumn:string,startIndex:number,endIndex:number) {
  return localMutation(()=>edit(type,[persona],([data])=>{const source=requireCell(data,startRow,startColumn);const target=requireCell(data,endRow,endColumn);requireItemIndex(startIndex,source.items.length);requireItemIndex(endIndex,target.items.length,true);const [item]=source.items.splice(startIndex,1);target.items.splice(endIndex,0,item);}));
}
export async function copyItemToPersona(type:string,sourcePersona:string,targetPersona:string,row:string,sourceColumn:string,targetColumn:string,index:number,targetIndex:number) {
  return localMutation(()=>edit(type,[sourcePersona,targetPersona],journeys=>{const [source,target=source]=journeys;const from=requireCell(source,row,sourceColumn);const to=requireCell(target,row,targetColumn);requireItemIndex(index,from.items.length);requireItemIndex(targetIndex,to.items.length,true);to.items.splice(targetIndex,0,structuredClone(from.items[index]));}));
}
export async function moveItemToPersona(type:string,sourcePersona:string,targetPersona:string,sourceRow:string,targetRow:string,sourceColumn:string,targetColumn:string,index:number,targetIndex:number) {
  return localMutation(()=>edit(type,[sourcePersona,targetPersona],journeys=>{const [source,target=source]=journeys;const from=requireCell(source,sourceRow,sourceColumn);const to=requireCell(target,targetRow,targetColumn);requireItemIndex(index,from.items.length);requireItemIndex(targetIndex,to.items.length,true);const [item]=from.items.splice(index,1);to.items.splice(targetIndex,0,item);}));
}
export async function importJourneyFromPersona(type:string,sourcePersona:string,targetPersona:string) {
  return localMutation(()=>edit(type,[sourcePersona,targetPersona],journeys=>{const [source,target=source]=journeys;target.columns=structuredClone(source.columns);target.rows=structuredClone(source.rows);}));
}
export async function duplicateColumnFromPersona(type:string,sourcePersona:string,targetPersona:string,sourceColumn:string,newColumnId?:string) {
  return localMutation(()=>{const id=parseJourneyIdentifier(newColumnId || `${sourceColumn}-copy-${Date.now()}`,'column id');edit(type,[sourcePersona,targetPersona],journeys=>{const [source,target=source]=journeys;const column=source.columns.find(c=>c.id===sourceColumn);if(!column)throw new Error('Column not found');if(target.columns.some(c=>c.id===id))throw new Error('Column already exists');target.columns.push({...column,id});for(const row of source.rows){const cell=row.cells.find(c=>c.columnId===sourceColumn);const targetRow=target.rows.find(r=>r.id===row.id);if(cell&&targetRow)targetRow.cells.push({columnId:id,items:structuredClone(cell.items)});}});return {success:true as const,columnId:id};});
}
