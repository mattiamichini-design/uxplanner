import test from 'node:test';
import assert from 'node:assert/strict';

const {getHorizontalScrollMetrics,getScrollProgressFromPointer}=await import('../src/lib/user-journey/horizontal-scroll.ts');

test('horizontal scroll metrics cover no overflow, start, middle and end',()=>{
 assert.deepEqual(getHorizontalScrollMetrics(800,800,0),{hasOverflow:false,thumbRatio:1,progress:0,maxScroll:0});
 assert.deepEqual(getHorizontalScrollMetrics(2000,1000,0),{hasOverflow:true,thumbRatio:0.5,progress:0,maxScroll:1000});
 assert.equal(getHorizontalScrollMetrics(2000,1000,500).progress,0.5);
 assert.equal(getHorizontalScrollMetrics(2000,1000,1000).progress,1);
});

test('pointer progress preserves the thumb grab offset and clamps to the track',()=>{
 assert.equal(getScrollProgressFromPointer(1000,400,0.4,100),0.5);
 assert.equal(getScrollProgressFromPointer(1000,-20,0.4,100),0);
 assert.equal(getScrollProgressFromPointer(1000,900,0.4,100),1);
 assert.equal(getScrollProgressFromPointer(1000,400,1,0),0);
});
