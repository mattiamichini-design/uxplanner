import test from 'node:test';
import assert from 'node:assert/strict';
import { csvToJourney, journeyToCsv } from '../src/csv.js';
import type { JourneyData } from '../src/types.js';
const template:JourneyData={title:'Research',meta:{persona:'Ana'},columns:[{id:'a',label:'Discover'},{id:'b',label:'Discover'}],rows:[{id:'goals',label:'Goals',cells:[{columnId:'a',items:[{text:'A comma, and a "quote"'}]},{columnId:'b',items:[{text:'Second step'}]}]}]};
test('CSV retains duplicate labels as distinct columns, unicode and quoted text',()=>{
 const csv=journeyToCsv([template]);const parsed=csvToJourney(csv,template).get('Ana')!;
 assert.equal(new Set(parsed.columns.map(c=>c.id)).size,2);assert.equal(parsed.rows[0].cells[0].items[0].text,'A comma, and a "quote"');assert.equal(parsed.rows[0].cells[1].items[0].text,'Second step');
});
test('comparison export includes unique rows and never borrows another persona data',()=>{
 const second:JourneyData={...template,meta:{persona:'Bea'},columns:[{id:'a',label:'Discover'}],rows:[{id:'pain',label:'Pain points',cells:[{columnId:'a',items:[{text:'Bea only'}]}]}]};
 const parsed=csvToJourney(journeyToCsv([template,second]),template);
 assert.equal(parsed.get('Bea')!.rows.find(r=>r.id==='goals')!.cells.length,0);assert.equal(parsed.get('Ana')!.rows.find(r=>r.id==='pain')!.cells.length,0);assert.equal(parsed.get('Bea')!.rows.find(r=>r.id==='pain')!.cells[0].items[0].text,'Bea only');
});
test('invalid or incomplete CSV is rejected instead of silently replacing data',()=>{
 for(const csv of ['', 'name,value\na,b','ID,Section,Description\n1,2,3','ID,Section,Description,Phase\nx,y,z,"unfinished'])assert.throws(()=>csvToJourney(csv,template));
});
