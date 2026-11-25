const test = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../engine.js');
require('../data/demo.js');
const demo = globalThis.FLEETOPS_DEMO;

test('the bundled demo loads 24 vessels and 14 superintendents', () => {
  assert.equal(demo.vessels.length, 24);
  assert.equal(demo.staff.length, 14);
  assert.ok(demo.activities.length > 75);
});

test('month bounds correctly handle month end and leap years', () => {
  assert.deepEqual(Engine.monthBounds('2028-02'), { start: '2028-02-01', end: '2028-02-29' });
  assert.deepEqual(Engine.monthBounds('2027-02'), { start: '2027-02-01', end: '2027-02-28' });
  assert.throws(() => Engine.monthBounds('2027-13'));
});

test('inclusive event date ranges overlap both relevant months', () => {
  const event = { start: '2027-05-31', end: '2027-06-01' };
  assert.equal(Engine.inMonth(event, '2027-05'), true);
  assert.equal(Engine.inMonth(event, '2027-06'), true);
  assert.equal(Engine.inMonth(event, '2027-07'), false);
});

test('initial demonstration coverage includes three unassigned vessels', () => {
  const s = Engine.stats(demo, '2027-05');
  assert.equal(s.vessels, 24);
  assert.equal(s.assigned, 21);
  assert.equal(s.unassigned, 3);
});

test('budget category totals reconcile with annual totals', () => {
  const rows = Engine.budgets(demo, 2027);
  const t = Engine.totals(rows);
  assert.equal(rows.length, Engine.CATEGORIES.length);
  assert.equal(rows.reduce((sum, r) => sum + r.budget, 0), t.budget);
  assert.equal(rows.reduce((sum, r) => sum + r.actual, 0), t.actual);
  assert.equal(t.budget - t.actual, t.remaining);
});

test('assignment validation detects overlapping vessel coverage', () => {
  const existing = demo.assignments[0];
  const failure = Engine.validateAssignment(demo, {
    vesselId: existing.vesselId, staffId: demo.staff[1].id, start: '2027-02-01', end: '2027-02-28'
  });
  assert.match(failure, /already has coverage/);
});

test('assignment validation permits a non-overlapping later period', () => {
  const existing = demo.assignments[0];
  const result = Engine.validateAssignment(demo, {
    vesselId: existing.vesselId, staffId: demo.staff[1].id, start: '2033-01-01', end: '2033-12-31'
  });
  assert.equal(result, '');
});

test('workload matrix changes when an assignment is added', () => {
  const data = structuredClone(demo);
  const before = Engine.staffLoad(data, data.staff[0].id, '2033-04');
  data.assignments.push({ id: 'AS-999', vesselId: data.vessels[0].id, staffId: data.staff[0].id, start: '2033-01-01', end: '2033-12-31' });
  assert.equal(Engine.staffLoad(data, data.staff[0].id, '2033-04'), before + 1);
});

test('data quality flags an over-capacity superintendent', () => {
  const data = structuredClone(demo);
  data.staff[0].capacity = 0;
  assert.ok(Engine.issues(data, '2027-05').some(issue => issue.area === 'Capacity' && issue.message.includes(data.staff[0].name)));
});

test('data quality flags missing vessel references', () => {
  const data = structuredClone(demo);
  data.activities[0].vesselId = 'F-MISSING';
  assert.ok(Engine.issues(data, '2027-05').some(i => i.area === 'Activities' && i.message.includes('missing vessel')));
});

test('cancelled events do not affect the monthly or annual budget totals', () => {
  const data = structuredClone(demo);
  const target = data.activities.find(a => a.start.startsWith('2027'));
  const before = Engine.yearActivities(data, 2027).length;
  target.status = 'Cancelled';
  assert.equal(Engine.yearActivities(data, 2027).length, before - 1);
});

test('empty buyer workspace produces zeroed KPIs and reports', () => {
  const empty = { version: 1, demoData: false, settings: { company: 'MY FLEET', currency: 'SGD', month: '2026-11' },
    vessels: [], staff: [], assignments: [], activities: [] };
  const s = Engine.stats(empty, '2026-11');
  assert.equal(s.vessels, 0);
  assert.equal(s.assigned, 0);
  assert.equal(s.activities, 0);
  assert.equal(Engine.issues(empty, '2026-11').length, 0);
  assert.equal(Engine.totals(Engine.budgets(empty, 2026)).budget, 0);
});
