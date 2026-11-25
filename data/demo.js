/* Fictional demonstration data. Replace it with your own operational records. */
(function (root) {
  'use strict';
  const names = [
    ['Aurora Maple', 'PCTC / RoRo', 'North Fleet', 'Malta', 2027, 'Newbuilding'],
    ['Nordic Finch', 'PCTC / RoRo', 'North Fleet', 'Norway', 2021, 'In service'],
    ['Cedar Horizon', 'Bulk carrier', 'Bulk Division', 'Singapore', 2018, 'In service'],
    ['Silver Meridian', 'Tanker', 'Energy Fleet', 'Marshall Islands', 2019, 'In service'],
    ['Ocean Willow', 'PCTC / RoRo', 'North Fleet', 'Malta', 2028, 'Newbuilding'],
    ['Pacific Lark', 'Container ship', 'East Fleet', 'Liberia', 2017, 'In service'],
    ['Cobalt Crest', 'Bulk carrier', 'Bulk Division', 'Panama', 2015, 'In service'],
    ['Amber Tern', 'PCTC / RoRo', 'North Fleet', 'Sweden', 2023, 'In service'],
    ['Harbor Laurel', 'Tanker', 'Energy Fleet', 'Singapore', 2020, 'In service'],
    ['Morning Fjord', 'PCTC / RoRo', 'North Fleet', 'Malta', 2029, 'Newbuilding'],
    ['Starlight Bay', 'General cargo', 'East Fleet', 'Cyprus', 2022, 'In service'],
    ['Northstar Oak', 'Bulk carrier', 'Bulk Division', 'Bahamas', 2014, 'In service'],
    ['Evergreen Skye', 'PCTC / RoRo', 'North Fleet', 'Malta', 2027, 'Newbuilding'],
    ['Blue Cedar', 'Tanker', 'Energy Fleet', 'Singapore', 2018, 'In service'],
    ['Mariner Wren', 'Container ship', 'East Fleet', 'Liberia', 2020, 'In service'],
    ['Linden Crest', 'Bulk carrier', 'Bulk Division', 'Panama', 2016, 'In service'],
    ['Polar Laurel', 'PCTC / RoRo', 'North Fleet', 'Sweden', 2024, 'In service'],
    ['Golden Quay', 'General cargo', 'East Fleet', 'Cyprus', 2019, 'In service'],
    ['Atlas Meadow', 'Tanker', 'Energy Fleet', 'Marshall Islands', 2017, 'In service'],
    ['Coral Osprey', 'PCTC / RoRo', 'North Fleet', 'Malta', 2021, 'In service'],
    ['Westwind Pine', 'Container ship', 'East Fleet', 'Liberia', 2019, 'In service'],
    ['Emerald Rowan', 'Bulk carrier', 'Bulk Division', 'Norway', 2016, 'In service'],
    ['Solstice Fern', 'Tanker', 'Energy Fleet', 'Singapore', 2022, 'In service'],
    ['Seabright Elm', 'PCTC / RoRo', 'North Fleet', 'Malta', 2028, 'Newbuilding']
  ];
  const team = [
    ['Avery Stone', 'North Fleet', 3], ['Jordan Lee', 'North Fleet', 4],
    ['Morgan Reed', 'Bulk Division', 3], ['Taylor Brooks', 'Energy Fleet', 3],
    ['Casey Chen', 'East Fleet', 4], ['Riley Bennett', 'Bulk Division', 3],
    ['Alex Kim', 'North Fleet', 2], ['Sam Patel', 'Bulk Division', 3],
    ['Drew Hayes', 'North Fleet', 3], ['Mila Carter', 'Energy Fleet', 3],
    ['Robin Clarke', 'East Fleet', 3], ['Noel Brooks', 'Bulk Division', 3],
    ['Harper Walsh', 'North Fleet', 3], ['Jamie Ross', 'East Fleet', 3]
  ];
  const vessels = names.map((v, i) => ({
    id: `F-${String(i + 1).padStart(3, '0')}`, name: v[0], type: v[1], group: v[2], flag: v[3], built: v[4], status: v[5], notes: 'Fictional demonstration vessel'
  }));
  const staff = team.map((s, i) => ({
    id: `S-${String(i + 1).padStart(2, '0')}`, name: s[0], team: s[1], capacity: s[2], email: '', notes: 'Fictional demonstration personnel'
  }));
  const assignments = vessels.map((v, i) => ({
    id: `AS-${String(i + 1).padStart(3, '0')}`,
    vesselId: v.id, staffId: staff[(i * 5) % staff.length].id,
    start: i === 4 ? '2028-01-01' : i === 9 ? '2029-01-01' : i === 23 ? '2028-05-01' : '2027-01-01',
    end: '2032-12-31', notes: i === 4 || i === 9 || i === 23 ? 'Future fleet entry' : 'Planned technical coverage'
  }));
  const activities = [];
  const add = (vessel, category, description, start, end, owner, status, priority, budget, actual, notes = '') => {
    activities.push({
      id: `EV-${String(activities.length + 1).padStart(3, '0')}`,
      vesselId: vessels[vessel % vessels.length].id, category, description, start, end,
      ownerId: staff[owner % staff.length].id, status, priority, budget, actual, notes
    });
  };
  add(0, 'Newbuilding', 'Handover and acceptance', '2027-04-15', '2027-05-04', 0, 'In progress', 'Critical', 125000, 72000, 'Owner and yard coordination');
  add(0, 'Inspection', 'Initial operational readiness', '2027-05-02', '2027-05-05', 0, 'In progress', 'High', 12000, 4300);
  add(16, 'Dry dock', 'Scheduled docking and repairs', '2027-05-08', '2027-05-26', 2, 'In progress', 'High', 650000, 380000);
  add(4, 'Dry dock', 'Scheduled docking and repairs', '2027-05-17', '2027-06-04', 4, 'In progress', 'High', 420000, 115000);
  add(5, 'Vessel visit', 'Technical inspection visit', '2027-05-18', '2027-05-20', 4, 'Planned', 'Normal', 3100, 0);
  add(2, 'Audit', 'Internal ISM audit', '2027-03-08', '2027-03-09', 2, 'Completed', 'Normal', 4500, 4700);
  add(7, 'Audit', 'Internal ISM and ISPS audit', '2027-06-03', '2027-06-05', 6, 'Planned', 'High', 5000, 0);
  add(8, 'Vessel visit', 'Superintendent attendance', '2027-04-18', '2027-04-19', 3, 'Completed', 'Normal', 2300, 2450);
  add(1, 'Dry dock', 'Special survey and docking', '2027-07-04', '2027-07-24', 0, 'Planned', 'High', 490000, 0);
  add(11, 'Inspection', 'Annual vessel inspection', '2027-09-11', '2027-09-12', 7, 'Planned', 'Normal', 4000, 0);
  const cycles = [
    ['Inspection', 'Condition and equipment inspection', 6500, 4],
    ['Audit', 'ISM / ISPS internal audit', 5200, 2],
    ['Vessel visit', 'Fleet technical attendance', 3100, 3],
    ['Dry dock', 'Intermediate docking and repairs', 360000, 19],
    ['Newbuilding', 'Delivery readiness and handover', 92000, 16],
    ['Other', 'Equipment retrofit and testing', 26000, 6]
  ];
  for (let y = 2027; y <= 2032; y++) {
    for (let n = 0; n < 16; n++) {
      const type = cycles[(n + y) % cycles.length];
      const vessel = (n * 5 + y) % vessels.length;
      const month = y === 2027 ? ((n * 3 + 7) % 9 + 1) : ((n * 5 + 3) % 12 + 1);
      const day = 3 + (n * 7) % 18;
      const start = `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const endDate = new Date(Date.UTC(y, month - 1, day + type[3] - 1)).toISOString().slice(0, 10);
      const status = y === 2027 && month < 5 ? 'Completed' : 'Planned';
      add(vessel, type[0], type[1], start, endDate, (vessel + 2) % staff.length, status,
        type[0] === 'Dry dock' || type[0] === 'Newbuilding' ? 'High' : 'Normal',
        type[2] + ((n % 4) * Math.round(type[2] * 0.075)),
        status === 'Completed' ? Math.round(type[2] * (0.8 + (n % 4) * 0.07)) : 0,
        'Illustrative planning event');
    }
  }
  const demo = { version: 1, demoData: true, settings: { company: 'DEMONSTRATION FLEET', currency: 'SGD', month: '2027-05' }, vessels, staff, assignments, activities };
  root.FLEETOPS_DEMO = demo;
})(typeof globalThis !== 'undefined' ? globalThis : this);
