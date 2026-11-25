/* FleetOps Control Center · pure calculations · zero dependencies */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.FleetOpsEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CATEGORIES = ['Dry dock', 'Newbuilding', 'Inspection', 'Audit', 'Vessel visit', 'Other'];
  const STATUSES = ['Planned', 'In progress', 'On hold', 'Completed', 'Cancelled'];
  const PRIORITIES = ['Normal', 'High', 'Critical'];
  const VESSEL_TYPES = ['PCTC / RoRo', 'Bulk carrier', 'Tanker', 'Container ship', 'General cargo', 'Other'];
  const TODAY = () => new Date().toISOString().slice(0, 10);

  function monthBounds(ym) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(ym))) throw new Error('Month must be YYYY-MM');
    const [year, month] = ym.split('-').map(Number);
    return { start: `${ym}-01`, end: new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10) };
  }
  function spans(aStart, aEnd, bStart, bEnd) {
    return Boolean(aStart && aEnd && bStart && bEnd && aStart <= bEnd && aEnd >= bStart);
  }
  function inMonth(item, ym) {
    const { start, end } = monthBounds(ym);
    return spans(item.start, item.end, start, end);
  }
  function months(year) { return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`); }
  function uniq(values) { return [...new Set(values)]; }
  function vesselName(data, id) { return data.vessels.find(x => x.id === id)?.name || 'Unknown vessel'; }
  function staffName(data, id) { return data.staff.find(x => x.id === id)?.name || 'Unassigned'; }
  function cleanAmount(value) { return Math.max(0, Number(value) || 0); }
  function assignedVessels(data, ym) {
    return uniq(data.assignments.filter(a => inMonth(a, ym)).map(a => a.vesselId));
  }
  function staffLoad(data, staffId, ym) {
    return uniq(data.assignments.filter(a => a.staffId === staffId && inMonth(a, ym)).map(a => a.vesselId)).length;
  }
  function monthlyActivityCount(data, ym, priorities = null) {
    return data.activities.filter(a => a.status !== 'Cancelled' && inMonth(a, ym) && (!priorities || priorities.includes(a.priority))).length;
  }
  function yearActivities(data, year) {
    return data.activities.filter(a => a.start?.startsWith(String(year)) && a.status !== 'Cancelled');
  }
  function budgets(data, year) {
    const activities = yearActivities(data, year);
    return CATEGORIES.map(category => {
      const selected = activities.filter(a => a.category === category);
      const budget = selected.reduce((s, a) => s + cleanAmount(a.budget), 0);
      const actual = selected.reduce((s, a) => s + cleanAmount(a.actual), 0);
      return { category, budget, actual, remaining: budget - actual, count: selected.length };
    });
  }
  function totals(rows) {
    return rows.reduce((r, x) => ({ budget: r.budget + x.budget, actual: r.actual + x.actual, remaining: r.remaining + x.remaining, count: r.count + x.count }), { budget: 0, actual: 0, remaining: 0, count: 0 });
  }
  function stats(data, ym) {
    const active = assignedVessels(data, ym);
    const budgetRows = budgets(data, Number(ym.slice(0, 4)));
    return {
      vessels: data.vessels.length,
      assigned: active.length,
      unassigned: data.vessels.filter(v => !active.includes(v.id)).length,
      activities: monthlyActivityCount(data, ym),
      criticalOpen: data.activities.filter(a => a.priority === 'Critical' && !['Completed', 'Cancelled'].includes(a.status)).length,
      overdue: data.activities.filter(a => a.end < ym + '-01' && !['Completed', 'Cancelled'].includes(a.status)).length,
      budget: totals(budgetRows)
    };
  }
  function upcoming(data, ym, limit = 8) {
    const start = monthBounds(ym).start;
    return data.activities.filter(a => !['Completed', 'Cancelled'].includes(a.status) && a.end >= start)
      .slice().sort((a, b) => a.start.localeCompare(b.start)).slice(0, limit);
  }
  function issues(data, ym) {
    const problems = [];
    const vesselIds = new Set(data.vessels.map(v => v.id));
    const staffIds = new Set(data.staff.map(s => s.id));
    const vesselNames = new Map();
    for (const v of data.vessels) {
      const key = String(v.name || '').trim().toLowerCase();
      if (!key) problems.push({ severity: 'critical', area: 'Vessels', message: `Vessel ${v.id} has no name` });
      if (vesselNames.has(key)) problems.push({ severity: 'high', area: 'Vessels', message: `Duplicate vessel name: ${v.name}` });
      vesselNames.set(key, true);
    }
    for (const a of data.assignments) {
      if (!vesselIds.has(a.vesselId)) problems.push({ severity: 'critical', area: 'Assignments', message: `${a.id}: missing vessel` });
      if (!staffIds.has(a.staffId)) problems.push({ severity: 'critical', area: 'Assignments', message: `${a.id}: missing superintendent` });
      if (!a.start || !a.end || a.start > a.end) problems.push({ severity: 'critical', area: 'Assignments', message: `${a.id}: invalid date range` });
    }
    for (let i = 0; i < data.assignments.length; i++) {
      const a = data.assignments[i];
      for (let j = i + 1; j < data.assignments.length; j++) {
        const b = data.assignments[j];
        if (a.vesselId === b.vesselId && spans(a.start, a.end, b.start, b.end)) {
          problems.push({ severity: 'high', area: 'Assignments', message: `${vesselName(data, a.vesselId)}: overlapping coverage (${a.id} / ${b.id})` });
        }
      }
    }
    for (const a of data.activities) {
      if (!vesselIds.has(a.vesselId)) problems.push({ severity: 'critical', area: 'Activities', message: `${a.id}: missing vessel` });
      if (a.ownerId && !staffIds.has(a.ownerId)) problems.push({ severity: 'high', area: 'Activities', message: `${a.id}: unknown owner` });
      if (!a.start || !a.end || a.start > a.end) problems.push({ severity: 'critical', area: 'Activities', message: `${a.id}: invalid date range` });
      if (Number(a.budget) < 0 || Number(a.actual) < 0) problems.push({ severity: 'high', area: 'Activities', message: `${a.id}: negative budget/actual` });
    }
    for (const s of data.staff) {
      const n = staffLoad(data, s.id, ym);
      if (n > Number(s.capacity || 0)) problems.push({ severity: 'high', area: 'Capacity', message: `${s.name}: ${n} vessels assigned / capacity ${s.capacity}` });
    }
    return problems;
  }
  function validateAssignment(data, payload, ignoreId = null) {
    if (!payload.vesselId || !payload.staffId) return 'Select both a vessel and a superintendent.';
    if (!payload.start || !payload.end || payload.start > payload.end) return 'Enter a valid start and end date.';
    const conflict = data.assignments.find(a => a.id !== ignoreId && a.vesselId === payload.vesselId && spans(a.start, a.end, payload.start, payload.end));
    return conflict ? `The vessel already has coverage during these dates (${conflict.id}). Use non-overlapping periods.` : '';
  }
  function matrix(data, year, type) {
    const periods = months(year);
    if (type === 'vessels') return data.vessels.map(v => ({ id: v.id, name: v.name, sub: v.group, values: periods.map(m => data.activities.filter(a => a.vesselId === v.id && a.status !== 'Cancelled' && inMonth(a, m)).length) }));
    return data.staff.map(s => ({ id: s.id, name: s.name, sub: s.team, capacity: s.capacity, values: periods.map(m => staffLoad(data, s.id, m)) }));
  }
  return { CATEGORIES, STATUSES, PRIORITIES, VESSEL_TYPES, TODAY, monthBounds, spans, inMonth, months, uniq, vesselName, staffName, cleanAmount, assignedVessels, staffLoad, monthlyActivityCount, yearActivities, budgets, totals, stats, upcoming, issues, validateAssignment, matrix };
});
