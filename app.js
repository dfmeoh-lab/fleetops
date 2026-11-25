/* FleetOps Control Center PRO · offline application · no external dependencies */
(function () {
  'use strict';
  const E = window.FleetOpsEngine;
  const DEMO = window.FLEETOPS_DEMO;
  const STORAGE_KEY = 'fleetops-control-center-pro-v1';
  const PAGE_NAMES = {
    overview: 'Overview', fleet: 'Fleet register', staff: 'Superintendents', assignments: 'Assignments',
    activities: 'Activities', timeline: 'Fleet timeline', workload: 'Workload matrix', budgets: 'Budget control',
    reports: 'Reports & exports', settings: 'Settings & data'
  };
  const ICON = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const clone = value => JSON.parse(JSON.stringify(value));
  const $ = id => document.getElementById(id);
  let storageAvailable = true;
  let state = readInitial();
  const ui = { page: 'overview', query: '', filter: 'all', pageNumber: 0, pageSize: 14, year: 2027, matrix: 'vessels', dialog: null };
  let toastTimer;

  function readInitial() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const value = JSON.parse(raw);
        if (validShape(value)) return value;
      }
    } catch { storageAvailable = false; }
    return clone(DEMO);
  }
  function validShape(obj) {
    return Boolean(obj && typeof obj === 'object' && obj.version === 1 && obj.settings &&
      ['vessels', 'staff', 'assignments', 'activities'].every(k => Array.isArray(obj[k])));
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); storageAvailable = true; }
    catch { storageAvailable = false; showToast('Browser storage unavailable. Export a JSON backup to retain changes.', true); }
  }
  function showToast(message, error = false) {
    const el = $('toast'); clearTimeout(toastTimer);
    el.textContent = message; el.className = `toast visible${error ? ' error' : ''}`;
    toastTimer = setTimeout(() => el.classList.remove('visible'), 4400);
  }
  function ym() { return state.settings.month || '2027-05'; }
  function year() { return Number(ui.year || ym().slice(0, 4)); }
  function money(n, prefix = true) {
    const num = Number(n) || 0;
    const amount = new Intl.NumberFormat('en-SG', { maximumFractionDigits: 0 }).format(Math.abs(num));
    return `${num < 0 ? '−' : ''}${prefix ? esc(state.settings.currency || 'SGD') + ' ' : ''}${amount}`;
  }
  function compactMoney(n) {
    const v = Number(n) || 0; const a = Math.abs(v);
    const s = a >= 1000000 ? `${(a / 1000000).toFixed(2)}m` : a >= 1000 ? `${(a / 1000).toFixed(a >= 100000 ? 0 : 1)}k` : String(Math.round(a));
    return (v < 0 ? '−' : '') + s;
  }
  function niceDate(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '—';
    return new Intl.DateTimeFormat('en-SG', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
  }
  function monthLabel(value) { return new Date(`${value}-01T00:00:00Z`).toLocaleDateString('en-SG', { month: 'short', year: 'numeric', timeZone: 'UTC' }); }
  function statusBadge(s) {
    const type = ({ 'Planned': 'planned', 'In progress': 'progress', 'Completed': 'completed', 'On hold': 'hold', 'Cancelled': 'cancelled' })[s] || 'planned';
    return `<span class="pill pill-${type}">${esc(s)}</span>`;
  }
  function priorityBadge(s) { return `<span class="pill pill-${String(s).toLowerCase()}">${esc(s)}</span>`; }
  function iconButton(action, kind, id, icon, title) {
    return `<button class="icon-button" data-action="${action}" data-kind="${kind}" data-id="${esc(id)}" title="${esc(title)}" aria-label="${esc(title)}">${ICON(icon)}</button>`;
  }
  function recordActions(kind, id) { return `<div class="table-actions">${iconButton('edit', kind, id, 'edit', 'Edit record')}${iconButton('delete', kind, id, 'trash', 'Delete record')}</div>`; }
  function pageHeading(title, subtitle, actions = '') {
    return `<div class="page-heading"><div><div class="overline">FLEETOPS / ${esc(state.settings.company)}</div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>${actions ? `<div class="heading-actions">${actions}</div>` : ''}</div>`;
  }
  function panel(title, sub, content, right = '', cls = '') {
    return `<section class="panel ${cls}"><div class="panel-head"><div><div class="panel-title">${title}</div>${sub ? `<div class="panel-sub">${sub}</div>` : ''}</div>${right}</div>${content}</section>`;
  }
  function table(headers, body, cls = '') {
    return `<div class="table-wrap"><table class="table ${cls}"><thead><tr>${headers.map(h => `<th${h.right ? ' class="text-right"' : ''}>${h.label || h}</th>`).join('')}</tr></thead><tbody>${body || `<tr><td colspan="${headers.length}"><div class="empty-state">No records match this view.</div></td></tr>`}</tbody></table></div>`;
  }
  function cellText(x, fallback = '—') { return x === null || x === undefined || x === '' ? fallback : esc(x); }
  function kpi(label, value, foot, icon, cls = '') {
    return `<div class="kpi-card ${cls}"><div class="kpi-top"><span class="kpi-label">${label}</span><span class="kpi-icon">${ICON(icon)}</span></div><div class="kpi-main mono">${value}</div><div class="kpi-bottom">${foot}</div></div>`;
  }
  function selectableYears() {
    const years = new Set([2027, 2028, 2029, 2030, 2031, 2032, Number(ym().slice(0, 4))]);
    for (const a of state.activities) if (a.start) years.add(Number(a.start.slice(0, 4)));
    return [...years].filter(y => y >= 2000 && y <= 2100).sort((a, b) => a - b);
  }
  function yearSelector() {
    return `<div class="year-picker"><label for="view-year">YEAR</label><select class="filter-select" id="view-year">${selectableYears().map(y => `<option value="${y}"${year() === y ? ' selected' : ''}>${y}</option>`).join('')}</select></div>`;
  }
  function relativeMonths(start, count = 12) {
    const [yy, mm] = start.split('-').map(Number);
    return Array.from({ length: count }, (_, n) => { const d = new Date(Date.UTC(yy, mm - 1 + n, 1)); return d.toISOString().slice(0, 7); });
  }
  function trendChart() {
    const periods = relativeMonths(ym(), 12);
    const all = periods.map(p => E.monthlyActivityCount(state, p));
    const critical = periods.map(p => E.monthlyActivityCount(state, p, ['Critical']));
    const max = Math.max(1, ...all) + 1;
    const w = 710, h = 230, left = 32, right = 16, top = 13, bottom = 34, pxW = w - left - right, pxH = h - top - bottom;
    const xx = i => left + i * pxW / 11;
    const yy = value => top + (max - value) * pxH / max;
    const lines = [0, .25, .5, .75, 1].map(f => `<line class="chart-grid" x1="${left}" y1="${top + pxH * f}" x2="${w-right}" y2="${top + pxH * f}"/><text class="chart-axis" x="${left-8}" y="${top + pxH * f + 4}" text-anchor="end">${Math.round(max * (1 - f))}</text>`).join('');
    const poly = values => values.map((v, i) => `${xx(i)},${yy(v)}`).join(' ');
    const dots = (values, className) => values.map((v, i) => `<circle class="${className}" cx="${xx(i)}" cy="${yy(v)}" r="3.3"><title>${monthLabel(periods[i])}: ${v} activities</title></circle>`).join('');
    const labels = periods.map((p, i) => i % 2 === 0 ? `<text class="chart-axis" x="${xx(i)}" y="${h-7}" text-anchor="middle">${p.slice(5)} / ${p.slice(2,4)}</text>` : '').join('');
    return `<div class="panel-chart"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Rolling 12-month activity trend chart">${lines}<polyline class="chart-line" points="${poly(all)}"/><polyline class="chart-line chart-line-gold" points="${poly(critical)}"/>${dots(all, 'chart-dot')}${dots(critical, 'chart-dot chart-dot-gold')}${labels}</svg></div>`;
  }
  function upcomingTable(limit = 7) {
    const list = E.upcoming(state, ym(), limit);
    const rows = list.map(a => `<tr><td><div class="name-cell">${esc(E.vesselName(state, a.vesselId))}</div><span class="subline">${esc(a.id)} · ${esc(a.category)}</span></td><td>${esc(a.description)}</td><td class="nowrap">${niceDate(a.start)}</td><td>${priorityBadge(a.priority)}</td><td>${statusBadge(a.status)}</td></tr>`).join('');
    return table(['VESSEL / EVENT', 'ACTIVITY', 'START', 'PRIORITY', 'STATUS'], rows);
  }
  function capacityPanel(limit = 7) {
    const sorted = state.staff.slice().sort((a, b) => E.staffLoad(state, b.id, ym()) / Math.max(1, b.capacity) - E.staffLoad(state, a.id, ym()) / Math.max(1, a.capacity)).slice(0, limit);
    return `<div class="panel-body">${sorted.length ? sorted.map(s => {
      const load = E.staffLoad(state, s.id, ym()), ratio = Math.round(load / Math.max(1, Number(s.capacity)) * 100);
      return `<div class="capacity-row"><div class="capacity-meta"><span class="capacity-heading">${esc(s.name)}</span><span><b>${load}</b> / ${Number(s.capacity)} vessels</span></div><div class="progress-track"><div class="progress-fill${ratio > 100 ? ' over' : ''}" style="width:${Math.min(100, ratio)}%"></div></div><div class="capacity-foot">${esc(s.team)} · ${ratio}% utilisation</div></div>`;
    }).join('') : '<div class="empty-state">Add superintendents to see capacity.</div>'}</div>`;
  }
  function budgetMini() {
    const totals = E.totals(E.budgets(state, Number(ym().slice(0, 4))));
    const ratio = totals.budget ? Math.min(100, totals.actual / totals.budget * 100) : 0;
    return `<div class="panel-body"><div class="budget-metrics" style="grid-template-columns:1fr 1fr"><div><div class="kpi-label">APPROVED PLAN</div><div class="kpi-main" style="font-size:24px">${compactMoney(totals.budget)}</div></div><div><div class="kpi-label">RECORDED SPEND</div><div class="kpi-main" style="font-size:24px">${compactMoney(totals.actual)}</div></div></div><div class="capacity-meta"><span>Budget utilisation</span><b>${ratio.toFixed(1)}%</b></div><div class="progress-track" style="height:12px"><div class="progress-fill" style="width:${ratio}%"></div></div><div class="capacity-foot">${money(totals.remaining)} remaining · selected year</div></div>`;
  }
  function overview() {
    const s = E.stats(state, ym());
    const issues = E.issues(state, ym());
    return pageHeading('Fleet operations overview', 'One operational view of vessel coverage, technical activities, team capacity and budget exposure.', state.demoData ? '<span class="demo-tag">FICTIONAL DEMO DATA</span>' : '') +
      `<div class="hero-banner"><div><div class="eyebrow">OPERATIONS COMMAND VIEW</div><h2>${esc(state.settings.company)}</h2><p>Reporting period: ${monthLabel(ym())}. Activity and assignment counts follow date ranges, not manually entered totals.</p></div><button class="button" data-page="timeline">${ICON('calendar')} Open fleet timeline</button></div>` +
      `<div class="kpi-grid">` +
      kpi('Vessels', s.vessels, 'Fleet register total', 'ship') +
      kpi('Assigned', s.assigned, '<strong>With active coverage</strong>', 'check', 'green') +
      kpi('Unassigned', s.unassigned, 'No coverage this month', 'alert', s.unassigned ? 'danger' : 'green') +
      kpi('Monthly activities', s.activities, '<strong>' + s.criticalOpen + '</strong> open critical events overall', 'calendar') +
      `</div><div class="content-grid"><div class="panel-stack">` +
      panel('Rolling 12-month activity outlook', 'Workload volumes and critical-priority activity overlaps', trendChart(), `<div class="legend"><span><i class="green"></i>All</span><span><i class="gold"></i>Critical</span></div>`) +
      panel('Upcoming scheduled activities', 'Planned and in-progress events from this reporting month', upcomingTable(), `<button class="panel-link" data-page="activities">View register</button>`, 'panel-tight') +
      `</div><div class="panel-stack">` +
      panel('Superintendent utilisation', 'Highest load first · unique vessels this month', capacityPanel(), `<button class="panel-link" data-page="workload">Full matrix</button>`) +
      panel('Annual budget position', `${ym().slice(0, 4)} · ${esc(state.settings.currency)}`, budgetMini(), `<button class="panel-link" data-page="budgets">Budget detail</button>`) +
      panel('Data integrity', 'Checks for missing references, overlaps and capacity exceptions', `<div class="panel-body"><div class="callout ${issues.length ? '' : 'data-health-good'}"><strong>${issues.length ? `${issues.length} issue${issues.length === 1 ? '' : 's'} require review` : 'All current data checks passed'}</strong><div>${issues.length ? esc(issues[0].message) : 'No missing references, overlapping vessel assignments or overloaded superintendents detected.'}</div></div></div>`, `<button class="panel-link" data-page="reports">Review checks</button>`) +
      `</div></div>`;
  }
  function filtered(data, fields, filterField) {
    const q = ui.query.trim().toLowerCase();
    return data.filter(item => (!q || fields.some(f => String(f(item) ?? '').toLowerCase().includes(q))) &&
      (ui.filter === 'all' || !filterField || String(filterField(item)) === ui.filter));
  }
  function toolbar(filters, actionKind) {
    const filterControl = filters ? `<select class="filter-select" id="table-filter" aria-label="Filter records"><option value="all">All ${filters.label}</option>${filters.options.map(v => `<option value="${esc(v)}"${ui.filter === v ? ' selected' : ''}>${esc(v)}</option>`).join('')}</select>` : '';
    return `<div class="toolbar-row"><div class="toolbar-filters"><label class="search-box">${ICON('search')}<input id="table-search" placeholder="Search records..." value="${esc(ui.query)}" aria-label="Search records"></label>${filterControl}</div><button class="button button-primary" data-action="add" data-kind="${actionKind}">${ICON('plus')} Add ${actionKind === 'staff' ? 'superintendent' : actionKind === 'activities' ? 'activity' : actionKind === 'assignments' ? 'assignment' : 'vessel'}</button></div>`;
  }
  function paging(total) {
    const start = total ? ui.pageNumber * ui.pageSize + 1 : 0;
    const end = Math.min(total, (ui.pageNumber + 1) * ui.pageSize);
    return `<div class="toolbar-row" style="padding:12px 17px 3px;margin:0"><span class="record-count">Showing ${start}–${end} of ${total} records</span><div class="heading-actions"><button class="button button-secondary" data-action="prev-page"${ui.pageNumber === 0 ? ' disabled' : ''}>Previous</button><button class="button button-secondary" data-action="next-page"${end >= total ? ' disabled' : ''}>Next</button></div></div>`;
  }
  function paged(data) { return data.slice(ui.pageNumber * ui.pageSize, (ui.pageNumber + 1) * ui.pageSize); }
  function recordsPage(kind) {
    const config = {
      fleet: { title: 'Fleet register', description: 'The master vessel register. Every assignment and technical event links to one of these vessels.', filters: { label: 'vessel types', options: E.VESSEL_TYPES }, fields: [x => x.name, x => x.id, x => x.type, x => x.group, x => x.flag], filter: x => x.type },
      staff: { title: 'Superintendents', description: 'Technical team members and the maximum concurrent vessel load for each person.', filters: null, fields: [x => x.name, x => x.id, x => x.team], filter: null },
      assignments: { title: 'Vessel assignments', description: 'Time-bound coverage records. The software prevents overlapping assignments for the same vessel.', filters: null, fields: [x => E.vesselName(state, x.vesselId), x => E.staffName(state, x.staffId), x => x.id, x => x.notes], filter: null },
      activities: { title: 'Technical activity register', description: 'The single event register driving timelines, monthly workloads, budgets and management reporting.', filters: { label: 'categories', options: E.CATEGORIES }, fields: [x => E.vesselName(state, x.vesselId), x => x.description, x => x.category, x => x.status, x => x.id], filter: x => x.category }
    }[kind];
    const source = kind === 'fleet' ? state.vessels : kind === 'staff' ? state.staff : state[kind];
    const filteredItems = filtered(source, config.fields, config.filter);
    const totalPages = Math.max(1, Math.ceil(filteredItems.length / ui.pageSize));
    ui.pageNumber = Math.max(0, Math.min(ui.pageNumber, totalPages - 1));
    const rows = paged(filteredItems).map(x => {
      if (kind === 'fleet') {
        const covered = E.assignedVessels(state, ym()).includes(x.id);
        return `<tr><td class="name-cell">${esc(x.name)}<span class="subline">${esc(x.id)}</span></td><td>${cellText(x.type)}</td><td>${cellText(x.flag)}</td><td>${cellText(x.group)}</td><td class="text-center">${cellText(x.built)}</td><td>${covered ? '<span class="pill pill-completed">Assigned</span>' : '<span class="pill pill-high">Unassigned</span>'}</td><td>${recordActions(kind, x.id)}</td></tr>`;
      }
      if (kind === 'staff') {
        const n = E.staffLoad(state, x.id, ym()), over = n > Number(x.capacity);
        return `<tr><td class="name-cell">${esc(x.name)}<span class="subline">${esc(x.id)}</span></td><td>${cellText(x.team)}</td><td class="text-center mono">${Number(x.capacity)}</td><td class="text-center mono">${n}</td><td>${over ? '<span class="pill pill-critical">Over capacity</span>' : '<span class="pill pill-completed">Within capacity</span>'}</td><td>${recordActions(kind, x.id)}</td></tr>`;
      }
      if (kind === 'assignments') return `<tr><td class="name-cell">${esc(E.vesselName(state, x.vesselId))}<span class="subline">${esc(x.id)}</span></td><td>${esc(E.staffName(state, x.staffId))}</td><td>${niceDate(x.start)}</td><td>${niceDate(x.end)}</td><td>${cellText(x.notes)}</td><td>${recordActions(kind, x.id)}</td></tr>`;
      return `<tr><td class="name-cell">${esc(E.vesselName(state, x.vesselId))}<span class="subline">${esc(x.id)}</span></td><td><strong>${esc(x.description)}</strong><span class="subline">${esc(x.category)}</span></td><td>${niceDate(x.start)}</td><td>${niceDate(x.end)}</td><td>${statusBadge(x.status)}</td><td>${priorityBadge(x.priority)}</td><td class="text-right money">${money(x.budget)}</td><td>${recordActions(kind, x.id)}</td></tr>`;
    }).join('');
    const columns = {
      fleet: ['VESSEL', 'TYPE', 'FLAG', 'FLEET GROUP', 'BUILT', 'COVERAGE', ''],
      staff: ['SUPERINTENDENT', 'TEAM', 'CAPACITY', 'ASSIGNED', 'FLAG', ''],
      assignments: ['VESSEL', 'SUPERINTENDENT', 'START', 'END', 'NOTES', ''],
      activities: ['VESSEL', 'ACTIVITY', 'START', 'END', 'STATUS', 'PRIORITY', { label: 'BUDGET', right: true }, '']
    }[kind];
    return pageHeading(config.title, config.description, `<span class="demo-tag">${source.length} TOTAL RECORDS</span>`) + toolbar(config.filters, kind) +
      `<section class="panel record-panel"><div class="panel-head"><div><div class="panel-title">${esc(config.title)}</div><div class="panel-sub">${monthLabel(ym())} reporting context · changes automatically update every view</div></div><div class="record-count">${filteredItems.length} matching</div></div>` +
      table(columns, rows) + paging(filteredItems.length) + '</section>';
  }
  function timeline() {
    const yr = year();
    const list = state.activities.filter(a => a.status !== 'Cancelled' && E.months(yr).some(m => E.inMonth(a, m))).slice().sort((a, b) => a.start.localeCompare(b.start));
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const codes = { 'Dry dock': 'DD', 'Newbuilding': 'NB', 'Inspection': 'INS', 'Audit': 'AUD', 'Vessel visit': 'VIS', 'Other': 'OTH' };
    const rows = list.map(a => `<tr><td class="row-name"><strong>${esc(E.vesselName(state, a.vesselId))}</strong><span>${esc(a.id)} · ${esc(a.category)} · ${niceDate(a.start)}</span></td>` +
      E.months(yr).map(m => E.inMonth(a, m) ? `<td class="gantt-hit category-${a.category.toLowerCase().replace(/[^a-z]+/g, '-')}"><span title="${esc(a.description)} · ${niceDate(a.start)} – ${niceDate(a.end)}">${codes[a.category] || 'EV'}</span></td>` : '<td class="gantt-empty"></td>').join('') + '</tr>').join('');
    const legend = E.CATEGORIES.map(c => `<span><i class="category-${c.toLowerCase().replace(/[^a-z]+/g, '-')}"></i>${esc(c)}</span>`).join('');
    return pageHeading('Fleet activity timeline', 'An event-level Gantt view of technical work. Each coloured cell represents a month touched by the event.', yearSelector()) +
      `<div class="hero-banner"><div><div class="eyebrow">YEARLY EVENT OVERVIEW</div><h2>${yr} technical schedule</h2><p>${list.length} activities overlap this year. Scroll horizontally to review all months; the vessel column remains fixed.</p></div><button class="button" data-action="export-csv" data-kind="activities">${ICON('download')} Export event list</button></div>` +
      `<section class="timeline-shell"><div class="timeline-legend">${legend}</div><div class="timeline-scroll"><table class="gantt"><thead><tr><th>VESSEL / ACTIVITY</th>${labels.map(x => `<th>${x} ${String(yr).slice(2)}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="13"><div class="empty-state">No activities scheduled in ${yr}.</div></td></tr>`}</tbody></table></div><div class="matrix-note">Bars show calendar-month overlap, not daily duration. Edit an event in the Activities register to change this timeline.</div></section>`;
  }
  function workload() {
    const yr = year(), mode = ui.matrix;
    const list = E.matrix(state, yr, mode);
    const headers = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const rows = list.map(r => `<tr><td><b>${esc(r.name)}</b><small>${esc(r.sub || '')}${mode === 'staff' ? ` · cap ${r.capacity}` : ''}</small></td>${r.values.map(v => {
      const over = mode === 'staff' && v > Number(r.capacity), cls = over ? 'heat-over' : `heat-${Math.min(4, v)}`;
      return `<td class="${cls}" title="${v} ${mode === 'staff' ? 'assigned vessels' : 'activities'}">${v || '·'}</td>`;
    }).join('')}</tr>`).join('');
    return pageHeading('Workload matrix', 'Monthly allocation intensity across the fleet and technical team, calculated from the underlying date ranges.', yearSelector()) +
      `<div class="toolbar-row"><div class="heading-actions"><button class="button ${mode === 'vessels' ? 'button-primary' : 'button-secondary'}" data-action="matrix" data-mode="vessels">Vessel activity</button><button class="button ${mode === 'staff' ? 'button-primary' : 'button-secondary'}" data-action="matrix" data-mode="staff">Superintendent load</button></div><span class="chip">${list.length} ${mode === 'staff' ? 'team members' : 'vessels'}</span></div>` +
      `<section class="timeline-shell"><div class="timeline-scroll"><table class="matrix"><thead><tr><th>${mode === 'staff' ? 'SUPERINTENDENT' : 'VESSEL'}</th>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div><div class="matrix-note">Colour intensity represents the count in that month. Red cells indicate superintendent allocation above the person's stated capacity.</div></section>`;
  }
  function budgets() {
    const yr = year(), rows = E.budgets(state, yr), totals = E.totals(rows);
    const max = Math.max(1, ...rows.map(r => r.budget), ...rows.map(r => r.actual));
    const bars = `<div class="bar-chart">${rows.map(r => `<div class="bar-chart-item"><div class="bars"><span class="planned" style="height:${Math.max(1, r.budget / max * 100)}%" title="Budget: ${money(r.budget)}"></span><span class="actual" style="height:${Math.max(1, r.actual / max * 100)}%" title="Actual: ${money(r.actual)}"></span></div><label>${esc(r.category)}</label></div>`).join('')}</div>`;
    const cells = rows.map(r => `<tr><td class="name-cell">${esc(r.category)}</td><td class="text-right">${r.count}</td><td class="text-right money">${money(r.budget)}</td><td class="text-right money">${money(r.actual)}</td><td class="text-right money ${r.remaining < 0 ? 'negative' : ''}">${money(r.remaining)}</td><td><div class="budget-bar-wrap"><div class="budget-bar budget-actual" style="width:${r.budget ? Math.min(100, r.actual / r.budget * 100) : 0}%"></div></div></td></tr>`).join('');
    const footer = `<tr class="table-total"><td>ANNUAL TOTAL</td><td class="text-right">${totals.count}</td><td class="text-right">${money(totals.budget)}</td><td class="text-right">${money(totals.actual)}</td><td class="text-right ${totals.remaining < 0 ? 'negative' : ''}">${money(totals.remaining)}</td><td></td></tr>`;
    return pageHeading('Budget control', 'Planned versus recorded activity spending, grouped by technical activity category and event start year.', yearSelector()) +
      `<div class="budget-metrics"><div class="metric-mini"><span>PLANNED BUDGET</span><strong>${money(totals.budget)}</strong><small>Events starting in ${yr}</small></div><div class="metric-mini"><span>ACTUAL SPEND</span><strong>${money(totals.actual)}</strong><small>Recorded event actuals</small></div><div class="metric-mini"><span>UNSPENT BALANCE</span><strong class="${totals.remaining < 0 ? 'negative' : ''}">${money(totals.remaining)}</strong><small>Budget minus recorded actuals</small></div></div>` +
      `<div class="content-grid"><div>${panel('Budget and actual by category', `Annual comparison · ${esc(state.settings.currency)}`, bars + '<div class="legend" style="padding:7px 23px 22px"><span><i class="green"></i>Budget</span><span><i class="gold"></i>Actual</span></div>')}</div><div>${panel('Budget interpretation', 'What this report includes', `<div class="panel-body"><div class="callout"><strong>Reporting basis</strong><div>Activities are assigned to a year by their start date. Cancelled activities are excluded. Actual spend is the amount currently recorded; it is not a forecast.</div></div><p class="muted" style="font-size:13px">Change budget or actual values in the Activities register. This report and the dashboard update immediately.</p><button class="button button-secondary" data-page="activities">${ICON('edit')} Edit activity costs</button></div>`)}</div></div>` +
      panel('Category-level financials', `${yr} · full category breakdown`, table(['CATEGORY', 'EVENTS', { label: 'PLANNED', right: true }, { label: 'ACTUAL', right: true }, { label: 'UNSPENT', right: true }, 'UTILISATION'], cells + footer), '', 'panel-tight');
  }
  function reports() {
    const s = E.stats(state, ym()), issues = E.issues(state, ym()), yr = Number(ym().slice(0, 4));
    const a = [['Vessels on register', s.vessels], ['Assigned vessels', s.assigned], ['Unassigned vessels', s.unassigned], ['Activities in report month', s.activities], ['Open critical events', s.criticalOpen], ['Annual activity budget', money(s.budget.budget)], ['Annual recorded spend', money(s.budget.actual)], ['Year selected', yr]];
    return pageHeading('Reports & exports', 'Generate a management snapshot, review data integrity, and take complete copies of your business records.', `<button class="button button-secondary" data-action="print">${ICON('report')} Print report</button>`) +
      `<div class="report-grid">` + panel('Operational summary', `Report period · ${monthLabel(ym())}`, `<div class="summary-list">${a.map(([k, v]) => `<div>${esc(k)}</div><div>${v}</div>`).join('')}</div>`) +
      panel('Data quality checks', 'Overlaps, invalid references, dates and capacity', issues.length ? `<div class="alert-list">${issues.slice(0, 20).map(i => `<div class="alert-item ${i.severity}"><strong>${esc(i.area.toUpperCase())} · ${esc(i.severity)}</strong><p>${esc(i.message)}</p></div>`).join('')}</div>` : `<div class="panel-body"><div class="callout data-health-good"><strong>Checks passed</strong><div>No errors or capacity conflicts detected in the current reporting month.</div></div></div>`) + `</div>` +
      `<div class="overline" style="margin:24px 0 12px">EXPORT CENTER</div><div class="action-cards">` +
      `<button class="action-card" data-action="export-json">${ICON('database')}<strong>Complete backup (.json)</strong><span>All vessels, people, assignments, activities and settings. Restore on another computer.</span></button>` +
      `<button class="action-card" data-action="export-csv" data-kind="vessels">${ICON('ship')}<strong>Fleet register (.csv)</strong><span>Vessel IDs, names, types, flags, year built and groups.</span></button>` +
      `<button class="action-card" data-action="export-csv" data-kind="staff">${ICON('users')}<strong>Superintendents (.csv)</strong><span>People, departments and stated assignment capacity.</span></button>` +
      `<button class="action-card" data-action="export-csv" data-kind="assignments">${ICON('layers')}<strong>Assignments (.csv)</strong><span>Coverage dates with vessel and superintendent references.</span></button>` +
      `<button class="action-card" data-action="export-csv" data-kind="activities">${ICON('calendar')}<strong>Activities (.csv)</strong><span>Complete technical event register and budget/actual fields.</span></button>` +
      `<button class="action-card" data-action="import-json">${ICON('upload')}<strong>Restore from backup</strong><span>Import your own previously exported JSON file. This replaces current data after confirmation.</span></button></div>` +
      `<div class="callout"><strong>Privacy:</strong> This app sends no data to a server. Your browser stores edits on this device. CSV files can be opened in Excel; JSON is the reliable full-fidelity backup format.</div>`;
  }
  function settings() {
    const counts = [state.vessels.length, state.staff.length, state.assignments.length, state.activities.length];
    return pageHeading('Settings & data', 'Control how your fleet appears in reports and manage the records stored on this device.') +
      `<div class="settings-grid">` + panel('Company and reporting', 'Used in headings, currency displays and default reporting month', `<div class="settings-box"><div class="field"><label for="company-name">Company / fleet name</label><input id="company-name" maxlength="80" value="${esc(state.settings.company)}"></div><div class="field"><label for="currency-code">Currency (ISO code)</label><input id="currency-code" maxlength="3" value="${esc(state.settings.currency || 'SGD')}"></div><div class="field"><label for="default-month">Default reporting month</label><input id="default-month" type="month" value="${esc(ym())}"></div><button class="button button-primary" data-action="save-settings">${ICON('check')} Save settings</button></div>`) +
      panel('Local data protection', 'Browser storage + manual, portable backups', `<div class="settings-box"><p>Current dataset: <strong>${counts[0]}</strong> vessels, <strong>${counts[1]}</strong> superintendents, <strong>${counts[2]}</strong> assignments and <strong>${counts[3]}</strong> activities.</p>${state.demoData ? '<div class="callout"><strong>Sample data loaded.</strong> All included vessels, staff, and activities are fictional. Click Start fresh below to create your real fleet.</div>' : ''}<div class="settings-actions"><button class="button button-primary" data-action="export-json">${ICON('download')} Export backup</button><button class="button button-secondary" data-action="import-json">${ICON('upload')} Restore backup</button></div><div class="callout"><strong>Important:</strong> Data in browser storage can disappear if browser data is cleared, the app is opened from a different location/origin, or the browser changes its file-storage policy. Keep JSON backups.</div><div class="settings-actions"><button class="button button-primary" data-action="start-fresh">${ICON('plus')} Start fresh · empty workspace</button><button class="button button-danger" data-action="reset-demo">${ICON('trash')} Restore sample data</button></div></div>`) +
      `</div><div class="callout data-health-good"><strong>Offline by design.</strong> No subscriptions, external APIs, cloud database, authentication, trackers or internet connection are required after download. This is a single-device planning tool—not a shared multi-user SaaS.</div>`;
  }
  function render() {
    document.querySelectorAll('[data-page]').forEach(el => {
      if (el.classList.contains('nav-item')) { el.classList.toggle('active', el.dataset.page === ui.page); el.setAttribute('aria-current', el.dataset.page === ui.page ? 'page' : 'false'); }
    });
    $('crumb-page').textContent = PAGE_NAMES[ui.page];
    $('global-month').value = ym();
    const functions = { overview, fleet: () => recordsPage('fleet'), staff: () => recordsPage('staff'), assignments: () => recordsPage('assignments'), activities: () => recordsPage('activities'), timeline, workload, budgets, reports, settings };
    $('page-content').innerHTML = functions[ui.page]();
  }
  function navigate(name) {
    if (!PAGE_NAMES[name]) return;
    ui.page = name; ui.query = ''; ui.filter = 'all'; ui.pageNumber = 0;
    if (['budgets', 'timeline', 'workload'].includes(name)) ui.year = Number(ym().slice(0, 4));
    $('sidebar').classList.remove('open'); window.scrollTo({ top: 0, behavior: 'instant' });
    render();
  }

  const formDefinitions = {
    fleet: [
      ['name', 'Vessel name', 'text', true], ['type', 'Vessel type', 'select', true, E.VESSEL_TYPES],
      ['flag', 'Flag state', 'text', true], ['group', 'Fleet group', 'text', true],
      ['built', 'Year built', 'number', true, null, { min: 1900, max: 2100 }],
      ['status', 'Fleet status', 'select', true, ['In service', 'Newbuilding', 'Laid up', 'Sold', 'Recycling']],
      ['notes', 'Notes', 'textarea', false]
    ],
    staff: [
      ['name', 'Full name', 'text', true], ['team', 'Region / team', 'text', true],
      ['capacity', 'Maximum assigned vessels', 'number', true, null, { min: 1, max: 99 }],
      ['email', 'Email (optional)', 'email', false], ['notes', 'Notes', 'textarea', false]
    ],
    assignments: [
      ['vesselId', 'Vessel', 'select', true, 'vessels'], ['staffId', 'Superintendent', 'select', true, 'staff'],
      ['start', 'Start date', 'date', true], ['end', 'End date', 'date', true], ['notes', 'Coverage notes', 'textarea', false]
    ],
    activities: [
      ['vesselId', 'Vessel', 'select', true, 'vessels'], ['category', 'Activity category', 'select', true, E.CATEGORIES],
      ['description', 'Activity / scope', 'text', true], ['ownerId', 'Owner / PIC', 'select', true, 'staff'],
      ['start', 'Start date', 'date', true], ['end', 'End date', 'date', true],
      ['status', 'Status', 'select', true, E.STATUSES], ['priority', 'Priority', 'select', true, E.PRIORITIES],
      ['budget', 'Budget amount', 'number', true, null, { min: 0, step: .01 }],
      ['actual', 'Actual spend', 'number', true, null, { min: 0, step: .01 }],
      ['notes', 'Notes', 'textarea', false]
    ]
  };
  function nextId(kind) {
    const prefix = { fleet: 'F-', staff: 'S-', assignments: 'AS-', activities: 'EV-' }[kind];
    const collection = kind === 'fleet' ? state.vessels : state[kind];
    const max = Math.max(0, ...collection.map(x => Number(String(x.id || '').replace(/[^0-9]/g, '')) || 0));
    return prefix + String(max + 1).padStart(prefix === 'S-' ? 2 : 3, '0');
  }
  function inputField([key, label, type, required, options, attrs], record) {
    const value = record[key] ?? '';
    const requiredAttr = required ? ' required' : '';
    const limits = attrs ? Object.entries(attrs).map(([k, v]) => ` ${k}="${v}"`).join('') : '';
    let input;
    if (type === 'textarea') input = `<textarea id="f-${key}" name="${key}" rows="3">${esc(value)}</textarea>`;
    else if (type === 'select') {
      const choices = options === 'vessels' ? state.vessels.map(v => [v.id, v.name]) : options === 'staff' ? state.staff.map(s => [s.id, s.name]) : (options || []).map(v => [v, v]);
      input = `<select id="f-${key}" name="${key}"${requiredAttr}><option value="">Select...</option>${choices.map(([id, name]) => `<option value="${esc(id)}"${String(value) === String(id) ? ' selected' : ''}>${esc(name)}</option>`).join('')}</select>`;
    } else input = `<input id="f-${key}" name="${key}" type="${type}" value="${esc(value)}"${requiredAttr}${limits}>`;
    return `<div class="field ${type === 'textarea' || key === 'description' ? 'field-wide' : ''}"><label for="f-${key}">${esc(label)}${required ? ' *' : ''}</label>${input}</div>`;
  }
  function openModal(kind, id = null) {
    const collection = kind === 'fleet' ? state.vessels : state[kind];
    const record = id ? collection.find(x => x.id === id) : {};
    if (id && !record) return showToast('Record not found.', true);
    ui.dialog = { kind, id };
    const nice = kind === 'fleet' ? 'vessel' : kind === 'staff' ? 'superintendent' : kind === 'activities' ? 'activity' : 'assignment';
    $('dialog-title').textContent = `${id ? 'Edit' : 'Add'} ${nice}`;
    $('dialog-fields').innerHTML = formDefinitions[kind].map(d => inputField(d, record)).join('');
    $('dialog-error').textContent = ''; $('dialog-error').classList.remove('visible');
    $('edit-dialog').showModal();
    setTimeout(() => $('dialog-fields').querySelector('input,select,textarea')?.focus(), 30);
  }
  function closeModal() { $('edit-dialog').close(); ui.dialog = null; }
  function formError(message) { $('dialog-error').textContent = message; $('dialog-error').classList.add('visible'); }
  function saveModal(event) {
    event.preventDefault(); if (!ui.dialog) return;
    const { kind, id } = ui.dialog;
    const form = $('record-form');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const next = Object.fromEntries(new FormData(form).entries());
    for (const key of ['built', 'capacity', 'budget', 'actual']) if (Object.hasOwn(next, key)) next[key] = Number(next[key]);
    for (const key of Object.keys(next)) if (typeof next[key] === 'string') next[key] = next[key].trim();
    if (kind === 'fleet') {
      if (state.vessels.some(v => v.id !== id && v.name.toLowerCase() === next.name.toLowerCase())) return formError('A vessel with this name already exists.');
    }
    if (kind === 'staff') {
      if (state.staff.some(s => s.id !== id && s.name.toLowerCase() === next.name.toLowerCase())) return formError('A superintendent with this name already exists.');
    }
    if (kind === 'assignments') {
      const error = E.validateAssignment(state, next, id);
      if (error) return formError(error);
    }
    if (kind === 'activities' && (!next.start || !next.end || next.start > next.end)) return formError('End date must not be before start date.');
    const collection = kind === 'fleet' ? state.vessels : state[kind];
    if (id) Object.assign(collection.find(x => x.id === id), next);
    else collection.push({ id: nextId(kind), ...next });
    persist(); closeModal(); render(); showToast(`${kind === 'staff' ? 'Superintendent' : kind === 'fleet' ? 'Vessel' : kind === 'activities' ? 'Activity' : 'Assignment'} ${id ? 'updated' : 'created'} successfully.`);
  }
  function deleteRecord(kind, id) {
    const collection = kind === 'fleet' ? state.vessels : state[kind];
    const record = collection.find(x => x.id === id); if (!record) return;
    if (kind === 'fleet' && (state.assignments.some(a => a.vesselId === id) || state.activities.some(a => a.vesselId === id))) return showToast('This vessel is referenced by assignments or activities. Remove those records first.', true);
    if (kind === 'staff' && (state.assignments.some(a => a.staffId === id) || state.activities.some(a => a.ownerId === id))) return showToast('This superintendent is referenced by assignments or activities. Remove those records first.', true);
    if (!confirm(`Delete ${id}? This cannot be undone unless you restore a previous backup.`)) return;
    const index = collection.indexOf(record); collection.splice(index, 1); persist(); render(); showToast('Record deleted.');
  }
  function slugDownload(filename, content, type) {
    const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function exportJSON() {
    const stamp = new Date().toISOString().slice(0, 10);
    slugDownload(`fleetops-backup-${stamp}.json`, JSON.stringify({ ...state, exportedAt: new Date().toISOString(), app: 'FleetOps Control Center PRO' }, null, 2), 'application/json');
    showToast('Complete JSON backup downloaded. Keep this file safe.');
  }
  function csvCell(value) {
    let str = String(value ?? '');
    if (/^[=+\-@\t\r]/.test(str)) str = "'" + str; // Avoid spreadsheet formula injection.
    return '"' + str.replace(/"/g, '""') + '"';
  }
  function exportCSV(kind) {
    const fields = {
      vessels: ['id', 'name', 'type', 'flag', 'built', 'group', 'status', 'notes'],
      staff: ['id', 'name', 'team', 'capacity', 'email', 'notes'],
      assignments: ['id', 'vesselId', 'staffId', 'start', 'end', 'notes'],
      activities: ['id', 'vesselId', 'category', 'description', 'start', 'end', 'ownerId', 'status', 'priority', 'budget', 'actual', 'notes']
    }[kind];
    if (!fields) return;
    const data = state[kind];
    const csv = [fields.map(csvCell).join(','), ...data.map(row => fields.map(f => csvCell(row[f])).join(','))].join('\r\n');
    slugDownload(`fleetops-${kind}-${new Date().toISOString().slice(0, 10)}.csv`, '\uFEFF' + csv, 'text/csv;charset=utf-8');
    showToast(`${kind} CSV downloaded.`);
  }
  async function importJSON(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return showToast('Backup is too large (10 MB maximum).', true);
    try {
      const data = JSON.parse(await file.text());
      if (!validShape(data)) throw new Error('This is not a valid FleetOps v1 backup.');
      const ids = ['vessels', 'staff', 'assignments', 'activities'].every(k => data[k].every(x => x && typeof x.id === 'string'));
      if (!ids) throw new Error('The backup has invalid record IDs.');
      if (!confirm(`Restore ${data.vessels.length} vessels and ${data.activities.length} activities from this file? All current records will be replaced. Back up first if needed.`)) return;
      state = { version: 1, demoData: Boolean(data.demoData), settings: { company: String(data.settings.company || 'MY FLEET'), currency: String(data.settings.currency || 'SGD').slice(0,3).toUpperCase(), month: /^\d{4}-(0[1-9]|1[0-2])$/.test(data.settings.month) ? data.settings.month : '2027-05' },
        vessels: data.vessels, staff: data.staff, assignments: data.assignments, activities: data.activities };
      persist(); navigate('overview'); showToast('Backup restored successfully.');
    } catch (err) { showToast(err.message || 'Could not read backup.', true); }
    finally { $('file-import').value = ''; }
  }
  function saveSettings() {
    const company = $('company-name').value.trim(); const currency = $('currency-code').value.trim().toUpperCase(); const m = $('default-month').value;
    if (!company) return showToast('Enter a company name.', true);
    if (!/^[A-Z]{3}$/.test(currency)) return showToast('Currency must be a three-letter code, such as SGD or USD.', true);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(m)) return showToast('Choose a valid reporting month.', true);
    Object.assign(state.settings, { company, currency, month: m }); persist(); render(); showToast('Settings updated.');
  }
  function handleClick(event) {
    const nav = event.target.closest('[data-page]');
    if (nav) { navigate(nav.dataset.page); return; }
    const button = event.target.closest('[data-action]'); if (!button) return;
    const action = button.dataset.action;
    if (action === 'toggle-menu') return $('sidebar').classList.toggle('open');
    if (action === 'add-activity') return openModal('activities');
    if (action === 'add') return openModal(button.dataset.kind);
    if (action === 'edit') return openModal(button.dataset.kind, button.dataset.id);
    if (action === 'delete') return deleteRecord(button.dataset.kind, button.dataset.id);
    if (action === 'close-modal') return closeModal();
    if (action === 'export-json') return exportJSON();
    if (action === 'export-csv') return exportCSV(button.dataset.kind);
    if (action === 'import-json') return $('file-import').click();
    if (action === 'matrix') { ui.matrix = button.dataset.mode; render(); return; }
    if (action === 'prev-page') { ui.pageNumber = Math.max(0, ui.pageNumber - 1); render(); return; }
    if (action === 'next-page') { ui.pageNumber++; render(); return; }
    if (action === 'print') return window.print();
    if (action === 'save-settings') return saveSettings();
    if (action === 'start-fresh') {
      if (!confirm('Start with an empty workspace? This replaces all local vessels, people, assignments and activities. Export a backup first if you want to keep them.')) return;
      state = { version: 1, demoData: false, settings: { company: 'MY FLEET', currency: 'SGD', month: new Date().toISOString().slice(0, 7) }, vessels: [], staff: [], assignments: [], activities: [] };
      persist(); navigate('overview'); showToast('Your empty workspace is ready. Add vessels and superintendents to begin.');
      return;
    }
    if (action === 'reset-demo') {
      if (!confirm('Reset everything to fictional demonstration data? All local edits will be replaced. Export a backup first.')) return;
      state = clone(DEMO); persist(); navigate('overview'); showToast('Demonstration data restored.');
    }
  }
  function handleChange(event) {
    if (event.target.id === 'global-month') {
      if (!event.target.value) return;
      state.settings.month = event.target.value; ui.year = Number(event.target.value.slice(0, 4)); persist(); render(); return;
    }
    if (event.target.id === 'view-year') { ui.year = Number(event.target.value); render(); return; }
    if (event.target.id === 'table-filter') { ui.filter = event.target.value; ui.pageNumber = 0; render(); return; }
    if (event.target.id === 'file-import') return importJSON(event.target.files[0]);
  }
  function handleSearch(event) {
    if (event.target.id !== 'table-search') return;
    const cursor = event.target.selectionStart; ui.query = event.target.value; ui.pageNumber = 0;
    render(); const target = $('table-search'); target?.focus(); target?.setSelectionRange(cursor, cursor);
  }
  document.addEventListener('click', handleClick);
  document.addEventListener('change', handleChange);
  document.addEventListener('input', handleSearch);
  $('record-form').addEventListener('submit', saveModal);
  $('edit-dialog').addEventListener('close', () => { ui.dialog = null; });
  $('edit-dialog').addEventListener('click', event => { if (event.target === $('edit-dialog')) closeModal(); });
  ui.year = Number(ym().slice(0, 4));
  render();
  if (!storageAvailable) showToast('Browser storage may be unavailable from this file. Export backups regularly.', true);
})();
