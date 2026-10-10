import test from 'node:test';
import assert from 'node:assert/strict';
import { currentContextIds } from '../src/lib/ux-planner/ai-context.ts';

const doc = (id, kind, url) => ({ id, kind, url, title: id, uri: id, revision: '1' });

test('current context follows the journey and compared personas without unrelated artifacts', () => {
  const documents = [doc('journey', 'journey', '/ux-planner/user-journeys/onboarding?persona=solo-maker'), doc('journey2', 'journey', '/ux-planner/user-journeys/onboarding?persona=team'), doc('maker', 'persona', '/ux-planner/user-personas/solo-maker'), doc('team', 'persona', '/ux-planner/user-personas/team'), doc('other', 'journey', '/ux-planner/user-journeys/other')];
  assert.deepEqual(currentContextIds(documents, '/ux-planner/user-journeys/onboarding?compare=true&personas=solo-maker,team'), ['journey', 'journey2', 'maker', 'team']);
  assert.deepEqual(currentContextIds(documents, '/ux-planner/user-journeys/onboarding?persona=solo-maker'), ['journey', 'maker']);
  assert.deepEqual(currentContextIds(documents, '/ux-planner/user-personas/solo-maker?edit=true'), ['maker']);
});

test('default and invalid journey selection follows persona order and comparison is explicit', () => {
  const documents = [doc('team', 'persona', '/ux-planner/user-personas/team'), doc('maker', 'persona', '/ux-planner/user-personas/solo-maker'), doc('maker-journey', 'journey', '/ux-planner/user-journeys/onboarding?persona=solo-maker'), doc('team-journey', 'journey', '/ux-planner/user-journeys/onboarding?persona=team')];
  for (const query of ['', '?persona=missing', '?personas=solo-maker', '?compare=true&personas=missing']) {
    assert.deepEqual(currentContextIds(documents, `/ux-planner/user-journeys/onboarding${query}`), ['team', 'team-journey']);
  }
  assert.deepEqual(currentContextIds(documents, '/ux-planner/user-journeys/onboarding?persona=solo-maker&personas=team'), ['maker', 'maker-journey']);
  assert.deepEqual(currentContextIds(documents.slice(2), '/ux-planner/user-journeys/onboarding'), ['maker-journey']);
});

test('flow defaults and unrelated routes never include query personas', () => {
  const documents = [doc('maker', 'persona', '/ux-planner/user-personas/solo-maker'), doc('flow', 'flow', '/ux-planner/user-flows/onboarding?persona=solo-maker'), doc('team-flow', 'flow', '/ux-planner/user-flows/onboarding?persona=team'), doc('story', 'story', '/ux-planner/user-stories/test')];
  assert.deepEqual(currentContextIds(documents, '/ux-planner/user-flows/onboarding'), ['flow']);
  assert.deepEqual(currentContextIds(documents, '/ux-planner/user-flows/onboarding?persona=missing'), ['flow']);
  assert.deepEqual(currentContextIds(documents, '/ux-planner/user-flows/onboarding?persona=team&compare=true&personas=solo-maker'), ['team-flow']);
  assert.deepEqual(currentContextIds(documents, '/ux-planner/user-stories/test?persona=solo-maker'), ['story']);
  assert.deepEqual(currentContextIds(documents, '/ux-planner?persona=solo-maker'), []);
});
