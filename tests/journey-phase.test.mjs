import test from 'node:test';
import assert from 'node:assert/strict';

const {getJourneyPhaseNumber}=await import('../src/lib/user-journey/phase-color.ts');

test('journey phase grays follow logical columns and bounce after the darkest phase',()=>{
 assert.deepEqual(Array.from({length:10},(_,index)=>getJourneyPhaseNumber(index)),[1,2,3,4,3,2,1,2,3,4]);
});
