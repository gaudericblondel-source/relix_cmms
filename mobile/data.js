// Relix Mobile — demo data (fake). Same plant, people and work orders as the Relix web prototype.
// Persona: Pierre Leroy, mechanic, Mechanical team, Thourotte Plant. "Today" = Tuesday, September 29.
(function () {
  const ME = 'PL';
  const TODAY = 'Tuesday, September 29';

  // key: [name, role, avatar bg, avatar fg, team]
  const PEOPLE = {
    PL: ['Pierre Leroy', 'Mechanic', '#E8EEF9', '#2456B8', 'Mechanical team'],
    GD: ['Gaudéric Durand', 'Maintenance Manager', '#FBE7EA', '#A30014', 'Mechanical team'],
    MD: ['Marc Dupont', 'Mechanic', '#E6F4EE', '#0B6B4A', 'Mechanical team'],
    AM: ['Alex Martin', 'Maintenance Technician', '#FEF3E2', '#B54708', 'Mechanical team'],
    SM: ['Sophie Martin', 'Electrician', '#F3EEFC', '#6941C6', 'Electrical team'],
    SL: ['Sarah Lambert', 'Storekeeper', '#E6F4EE', '#0B6B4A', 'Stores'],
    HP: ['Hugo Petit', 'Maintenance Planner', '#E8EEF9', '#2456B8', 'Planning'],
    JM: ['Julie Martin', 'Technician', '#FDECEC', '#B42318', 'Float Line team'],
    CM: ['Claire Moreau', 'Reliability Engineer', '#F3EEFC', '#6941C6', 'Engineering'],
    LB: ['Lucas Bernard', 'Production Supervisor', '#EEF1F4', '#475467', 'Production'],
    ER: ['Emma Roux', 'HSE', '#E6F4EE', '#0B6B4A', 'HSE'],
  };

  const TYPE_ICON = { Pump: 'water_pump', Fan: 'mode_fan', Furnace: 'local_fire_department', Conveyor: 'conveyor_belt', Compressor: 'compress', Press: 'compress', Robot: 'precision_manufacturing', Mixer: 'blender', 'Cooling tower': 'water', Cutter: 'content_cut' };
  const D = (name, kind, size) => ({ name, kind, size });

  const ASSETS = {
    'P-101': { name: 'Pump P-101', type: 'Pump', loc: 'Tempering Line › Pumping', status: 'Stopped', crit: 'Critical', maker: 'KSB', model: 'Etanorm 65-200', serial: 'KSB-9921', year: 2014, owner: 'PL',
      specs: [['Flow rate', '90 m³/h'], ['Head', '48 m'], ['Power', '18.5 kW'], ['Speed', '2,950 rpm']],
      docs: [D('Seal replacement procedure', 'PDF', '1.2 MB'), D('KSB Etanorm manual', 'PDF', '9.8 MB'), D('Pump curve datasheet', 'PDF', '410 KB')],
      parts: ['SEAL-M45', 'GSK-P101', 'ORG-KIT'],
      history: [['Sep 12', 'Leak check', 'PL', 'No leak'], ['Aug 28', 'Bearing lubrication', 'MD', 'Done'], ['Jul 03', 'Seal replacement', 'PL', 'Done']] },
    'TB-01': { name: 'Tin Bath', type: 'Furnace', loc: 'Float Line › Tin bath', status: 'Stopped', crit: 'Critical', maker: 'Fives Stein', model: 'TB-4.2', serial: 'FS-0912', year: 2011, owner: 'MD',
      specs: [['Max temperature', '1,100 °C'], ['Capacity', '800 t/day'], ['Heating zones', '6']],
      docs: [D('Tin bath roller maintenance', 'PDF', '3.1 MB')], parts: [],
      history: [['Sep 21', 'Roller inspection', 'MD', 'Done'], ['Sep 02', 'Thermocouple replacement', 'SM', 'Done']] },
    'V-12': { name: 'Fan V-12', type: 'Fan', loc: 'Float Line › Tin bath', status: 'In service', crit: 'High', maker: 'Ziehl-Abegg', model: 'ZN100', serial: 'ZA-55120', year: 2015, owner: 'AM',
      specs: [['Air flow', '42,000 m³/h'], ['Power', '30 kW'], ['Speed', '1,480 rpm']],
      docs: [D('Bearing replacement procedure', 'PDF', '820 KB'), D('Ziehl-Abegg ZN100 manual', 'PDF', '6.4 MB')], parts: ['BRG-6205'],
      history: [['Sep 15', 'Vibration measurement', 'CM', '5.1 mm/s'], ['Jun 10', 'Belt replacement', 'AM', 'Done']] },
    'CV-L3': { name: 'Conveyor Line 3', type: 'Conveyor', loc: 'Float Line › Cold end', status: 'In service', crit: 'High', maker: 'Bystronic', model: 'Cold-end 3', serial: 'BY-3317', year: 2016, owner: 'GD',
      specs: [['Length', '64 m'], ['Belt width', '4.2 m'], ['Speed', '0–25 m/min']], docs: [D('Conveyor sensor wiring', 'PDF', '1.9 MB')], parts: ['SEN-PT100'],
      history: [['Sep 18', 'Belt tracking', 'MD', 'Done']] },
    'FT2-FR-001': { name: 'Tempering Furnace 2', type: 'Furnace', loc: 'Tempering Line › Heating', status: 'In service', crit: 'Critical', maker: 'Glaston', model: 'FC500', serial: 'GL-500-204', year: 2020, owner: 'PL',
      specs: [['Max temperature', '720 °C'], ['Power', '850 kW'], ['Heating zones', '12']],
      docs: [D('Glaston FC500 operating manual', 'PDF', '18.4 MB'), D('Heating zone wiring diagram', 'PDF', '2.1 MB')], parts: ['SEN-PT100', 'CTR-LC1D'],
      history: [['Sep 22', 'Corrective repair', 'PL', 'Done'], ['Sep 01', 'Thermal imaging', 'SB', 'Done']] },
    'C-01': { name: 'Compressor C-01', type: 'Compressor', loc: 'Compressed Air › Compression', status: 'In service', crit: 'High', maker: 'Atlas Copco', model: 'GA 90', serial: 'AC-90-4471', year: 2016, owner: 'SM',
      specs: [['Free air delivery', '16.4 m³/min'], ['Pressure', '7.5 bar'], ['Power', '90 kW']],
      docs: [D('Atlas Copco GA 90 manual', 'PDF', '22.0 MB')], parts: ['FLT-HX10'],
      history: [['Sep 29', 'Filter replacement (paused)', 'SM', 'Waiting'], ['Aug 30', 'Oil change', 'SM', 'Done']] },
    'PH-030': { name: 'Hydraulic Press PH-030', type: 'Press', loc: 'Maintenance Workshop › Press area', status: 'In service', crit: 'Medium', maker: 'Lasco', model: 'HP 300', serial: 'LA-300-09', year: 2009, owner: 'PL',
      specs: [['Force', '300 t'], ['Oil volume', '420 L']], docs: [D('Hydraulic circuit diagram', 'PDF', '1.4 MB')], parts: ['FLT-HX10'],
      history: [['Sep 10', 'Oil analysis', 'CM', 'Normal']] },
    'RP-01': { name: 'Palletizing Robot 1', type: 'Robot', loc: 'Packaging › Palletizing', status: 'In service', crit: 'High', maker: 'FANUC', model: 'M-410iC', serial: 'FA-41077', year: 2020, owner: 'AM',
      specs: [['Payload', '185 kg'], ['Axes', '4']], docs: [D('Lubrication plan', 'PDF', '300 KB')], parts: [], history: [['Jun 29', 'Lubrication', 'PL', 'Done']] },
    'MX-02': { name: 'Mixer 02', type: 'Mixer', loc: 'Batch House › Mixing', status: 'In service', crit: 'Medium', maker: 'Eirich', model: 'R19', serial: 'E-48812', year: 2017, owner: 'SB',
      specs: [['Capacity', '3,000 L']], docs: [], parts: ['BLT-BPU280'], history: [['Sep 29', 'Belt tension check', 'PL', 'Done']] },
    'AL-01': { name: 'Annealing Lehr', type: 'Furnace', loc: 'Float Line › Annealing lehr', status: 'In service', crit: 'High', maker: 'Fives Stein', model: 'Lehr 180', serial: 'FS-0913', year: 2011, owner: 'MD',
      specs: [['Length', '180 m']], docs: [D('Roller alignment procedure', 'PDF', '950 KB')], parts: [], history: [['Sep 14', 'Roller alignment', 'MD', 'Done']] },
    'BC-548': { name: 'Bottero 548 Cutter', type: 'Cutter', loc: 'Cutting Line › Cutting', status: 'In service', crit: 'High', maker: 'Bottero', model: '548 LAM', serial: 'BT-548-77', year: 2019, owner: 'AM',
      specs: [['Table size', '6.1 × 3.3 m']], docs: [], parts: [], history: [] },
    'CT-01': { name: 'Cooling Tower', type: 'Cooling tower', loc: 'Cooling Water › Cooling tower', status: 'In service', crit: 'High', maker: 'Baltimore Aircoil', model: 'VXT-215', serial: 'BAC-2210', year: 2012, owner: 'JM',
      specs: [['Cooling capacity', '2.1 MW']], docs: [], parts: [], history: [] },
  };

  // [ref, name, unit, stock, store]
  const PARTS = {
    'SEAL-M45': ['Mechanical seal 45 mm', 'pcs', 3, 'Main store · A-07'],
    'GSK-P101': ['Pump casing gasket', 'pcs', 4, 'Main store · A-07'],
    'ORG-KIT': ['O-ring kit NBR', 'kit', 12, 'Main store · A-09'],
    'BRG-6205': ['Ball bearing 6205-2RS', 'pcs', 42, 'Workshop store · B-02'],
    'SEN-PT100': ['Temperature probe PT100', 'pcs', 6, 'Main store · C-11'],
    'BLT-BPU280': ['Drive belt BPU280', 'pcs', 2, 'Float Line store · F-03'],
    'FLT-HX10': ['Hydraulic filter HX-10', 'pcs', 0, 'Workshop store · B-05'],
    'CTR-LC1D': ['Contactor LC1D18', 'pcs', 11, 'Main store · E-01'],
  };
  const CONSUMABLES = [['GRS-LT2', 'Lithium grease LT2', 'cartridge'], ['SEAL-TH', 'Thread sealant 50 ml', 'tube'], ['CLN-RAG', 'Cleaning cloths', 'pack'], ['GLV-NIT', 'Nitrile gloves', 'pair']];

  // Checklists — same step types as the web checklist model.
  const st = (id, title, type, o = {}) => ({ id, title, type, required: false, desc: '', options: [], media: [], rules: [], ...o });
  const CHECKLISTS = {
    'pump-seal': { name: 'Pump seal replacement', est: 90, steps: [
      st('s1', 'Secure the pump', 'confirm', { required: true, desc: 'Isolate the pump before any work.', options: ['Pump stopped and valves closed', 'Lockout / tagout applied', 'Zero energy verified at the motor'], media: [D('Lockout procedure', 'PDF', '640 KB')] }),
      st('s2', 'Is a leak visible?', 'yesno', { required: true, desc: 'Look at the seal area and the pump body for drips or damage.', flagWhen: 'Yes', photoWhen: 'Yes', rules: [{ when: 'Yes', goto: 's3' }, { when: 'No', goto: 's7' }] }),
      st('s3', 'Where does the leak come from?', 'single', { required: true, conditional: true, desc: 'A cracked casing cannot be repaired on site — the checklist ends and a follow-up is planned.', options: ['Mechanical seal', 'Pipe fitting', 'Pump casing', 'Other'], flagWhen: 'Pump casing', rules: [{ when: 'Pump casing', finish: true }] }),
      st('s4', 'Replace the mechanical seal', 'instruction', { desc: 'Drain the pump casing into the retention tray\nRemove the coupling guard and the motor coupling\nReplace the mechanical seal and the O-rings\nTighten the flange bolts to 45 N·m in a cross pattern', expected: 'New seal fitted, shaft turns freely by hand', media: [D('Seal replacement — 4 min', 'Video', '38 MB'), D('Seal replacement procedure', 'PDF', '1.2 MB')] }),
      st('s5', 'Spare parts used', 'parts', { parts: [['SEAL-M45', 1], ['GSK-P101', 1], ['ORG-KIT', 1]] }),
      st('s6', 'Consumables used', 'consumables'),
      st('s7', 'Discharge pressure', 'number', { required: true, desc: 'Remove your lockout, restart the pump and measure after 5 minutes.', unit: 'bar', min: 3.5, max: 4.5, media: [D('Gauge location', 'Image', '420 KB')] }),
      st('s8', 'Any leak after 10 minutes?', 'yesno', { required: true, desc: 'Watch the seal area with the pump running.', flagWhen: 'Yes', rules: [{ when: 'Yes', goto: 's9' }] }),
      st('s9', 'Tighten the flange and re-test', 'instruction', { conditional: true, desc: 'Stop the pump\nRe-tighten the flange bolts to 45 N·m\nRestart and watch for 5 minutes' }),
      st('s10', 'Photo after repair', 'photo', { required: true, desc: 'Seal area, pump running.' }),
      st('s11', 'Clean up and hand over', 'confirm', { required: true, options: ['Tools and old parts removed', 'Area cleaned, retention tray emptied', 'Operator informed the pump is back in service'] }),
    ] },
    vibration: { name: 'Fan bearing check', est: 75, steps: [
      st('v1', 'Secure the fan', 'confirm', { required: true, options: ['Fan stopped', 'Lockout / tagout applied'], media: [D('Lockout procedure', 'PDF', '640 KB')] }),
      st('v2', 'Vibration at the motor-side bearing', 'number', { required: true, desc: 'Measure with the vibration analyzer, fan running at nominal speed.', unit: 'mm/s', min: 0, max: 4.5 }),
      st('v3', 'Bearing condition', 'single', { required: true, options: ['Normal', 'Noisy', 'Hot', 'Damaged'], flagWhen: 'Damaged' }),
      st('v4', 'Replace the motor-side bearing', 'instruction', { desc: 'Remove the coupling guard\nPull the bearing with the bearing puller\nHeat the new bearing to 80 °C and fit it\nRefit the guard', expected: 'Shaft turns freely, no axial play', media: [D('Bearing replacement procedure', 'PDF', '820 KB')] }),
      st('v5', 'Spare parts used', 'parts', { parts: [['BRG-6205', 1]] }),
      st('v6', 'Vibration after repair', 'number', { required: true, desc: 'Same point, fan at nominal speed.', unit: 'mm/s', min: 0, max: 4.5 }),
      st('v7', 'Clean up and hand over', 'confirm', { required: true, options: ['Tools removed', 'Guard refitted', 'Operator informed'] }),
    ] },
    inspection: { name: 'Line safety inspection', est: 40, steps: [
      st('i1', 'Guards and fences in place?', 'yesno', { required: true, flagWhen: 'No', photoWhen: 'No' }),
      st('i2', 'Emergency stops tested', 'confirm', { required: true, options: ['E-stop furnace entry', 'E-stop quench', 'Light curtain unloading'] }),
      st('i3', 'Fire extinguishers checked?', 'yesno', { required: true, flagWhen: 'No' }),
      st('i4', 'Photo of the line', 'photo'),
      st('i5', 'Remarks', 'comment'),
    ] },
    standard: { name: 'Standard intervention', est: 60, steps: [
      st('t1', 'Secure the equipment', 'confirm', { required: true, options: ['Equipment stopped', 'Lockout / tagout applied'], media: [D('Lockout procedure', 'PDF', '640 KB')] }),
      st('t2', 'Is the equipment in normal condition?', 'yesno', { required: true, flagWhen: 'No', photoWhen: 'No' }),
      st('t3', 'Carry out the work', 'instruction', { desc: 'Follow the work order description\nReplace worn parts if needed\nReassemble and check all fixings' }),
      st('t4', 'Spare parts used', 'parts'),
      st('t5', 'Photo after the work', 'photo'),
      st('t6', 'Clean up and hand over', 'confirm', { required: true, options: ['Area cleaned', 'Operator informed'] }),
    ] },
  };

  // when: overdue | today | tomorrow | done ; status: Requested | Scheduled | In progress | Completed
  const W = (id, asset, task, o) => ({ id, asset, task, type: 'Corrective', prio: 'Medium', status: 'Scheduled', who: [ME], cl: 'standard', desc: '', parts: [], ...o });
  const WOS = [
    W('WO-1339852', 'V-12', 'Abnormal vibration', { prio: 'High', status: 'In progress', waiting: 'Waiting for the bearing puller', when: 'today', time: '08:00', cl: 'vibration', desc: 'Operators report a growing vibration on the motor side. Trend from reliability: 5.1 mm/s on Sep 15.', parts: [['BRG-6205', 1]], started: true }),
    W('WO-1339861', 'FT2-FR-001', 'Line safety inspection', { type: 'Inspection', when: 'overdue', time: 'Mon 14:00', late: '1 d late', cl: 'inspection', desc: 'Monthly safety round on the Tempering Line: guards, emergency stops, fire extinguishers.' }),
    W('WO-1339859', 'P-101', 'Seal replacement', { prio: 'Critical', when: 'today', time: '09:30', who: [ME, 'SM'], cl: 'pump-seal', desc: 'Operators reported a major leak at the pump shaft during the night shift. The mechanical seal is suspected. Pump is running on the backup line — replace the seal and check the discharge pressure before handing back.', parts: [['SEAL-M45', 1], ['GSK-P101', 1], ['ORG-KIT', 1]] }),
    W('WO-1339866', 'PH-030', 'Oil leak', { when: 'today', time: '11:30', desc: 'Oil drops under the main cylinder. Check seals and hoses.' }),
    W('WO-1339870', 'FT2-FR-001', 'Thermal imaging', { type: 'Predictive', prio: 'Low', when: 'today', time: '14:00', desc: 'Quarterly thermography of the heating cabinet. Thermal camera TC-01 reserved.' }),
    W('WO-1339874', 'RP-01', 'Lubrication', { type: 'Preventive', prio: 'Low', when: 'tomorrow', time: '10:00', desc: 'Quarterly lubrication of axes J1–J4.' }),
    W('WO-1339848', 'MX-02', 'Belt tension check', { type: 'Preventive', status: 'Completed', when: 'done', time: '07:15', desc: 'Monthly belt tension check.' }),
    // Team
    W('WO-1339914', 'TB-01', 'Roller stopped', { prio: 'Critical', status: 'Requested', who: [], when: 'today', time: '09:12', reported: 'Reported by Lucas Bernard · 09:12', desc: 'Roller 14 stopped on the exit side. Line running at reduced speed.' }),
    W('WO-1339850', 'AL-01', 'Roller alignment', { prio: 'High', status: 'In progress', who: ['AM'], when: 'today', time: '08:30', help: 'Alex Martin asks for someone to take over', desc: 'Rollers out of alignment on the drive side.' }),
    W('WO-1339844', 'C-01', 'Filter replacement', { type: 'Preventive', status: 'In progress', who: ['SM'], when: 'today', time: '08:00', waiting: 'Waiting for spare parts', desc: 'Filter housing cracked — new housing ordered.' }),
    W('WO-1339855', 'CV-L3', 'Sensor check', { prio: 'High', status: 'In progress', who: ['MD'], when: 'today', time: '09:00', desc: 'Intermittent sensor fault on the cold end.' }),
    W('WO-1339868', 'BC-548', 'Motor inspection', { type: 'Inspection', prio: 'High', who: ['AM'], when: 'today', time: '15:30' }),
    W('WO-1339847', 'CT-01', 'Water treatment check', { type: 'Preventive', status: 'Completed', who: ['JM'], when: 'done', time: '07:40' }),
  ];

  // Paused progress already saved for Fan V-12 (step 4 of 7).
  const RUNS = {
    'WO-1339852': { cl: 'vibration', path: ['v1', 'v2', 'v3', 'v4'], answers: { v1: ['Fan stopped', 'Lockout / tagout applied'], v2: { value: '7.8', comment: 'Clearly on the motor-side bearing.' }, v3: 'Noisy' }, elapsed: 23 * 60000 + 14000, status: 'paused', touched: 1 },
  };

  const S = (id, who, t, text, x = {}) => ({ id, who, t, text, ...x });
  const CHANNELS = {
    'WO-1339859': { kind: 'wo', title: 'Pump P-101 — Seal replacement', sub: 'WO-1339859 · 5 people', msgs: [
      S('w1', 'sys', '07:31', 'Work order created by L. Bernard · night shift'),
      S('w2', 'PL', '07:40', 'Seal is weeping again on the drive side. @Sarah can you check whether we have the 45 mm seal in stock?', { tag: 'Missing part' }),
      S('w3', 'SL', '07:52', '3 in stock, store A-07. I reserved one on this work order.', { ref: ['Spare part', 'Mechanical seal 45 mm', '3 in stock'] }),
      S('w4', 'GD', '08:05', 'Thanks. @Pierre start as soon as Conveyor 3 is done — production wants the backup line freed by noon.'),
      S('w5', 'PL', '08:10', 'OK. Lockout planned for 09:30.'),
    ] },
    'WO-1339852': { kind: 'wo', title: 'Fan V-12 — Abnormal vibration', sub: 'WO-1339852 · 3 people', msgs: [
      S('h0', 'sys', '08:31', 'Intervention paused at step 4 of 7'),
      S('h1', 'PL', '08:32', 'Paused at step 4 — waiting for the bearing puller from the workshop.', { tag: 'Handover' }),
      S('h2', 'MD', '09:10', 'Puller is on the cart next to the press, help yourself.'),
    ] },
    team: { kind: 'team', title: 'Mechanical team', sub: '6 members · 4 on shift', msgs: [
      S('t1', 'MD', '07:52', 'Shift handover: Annealing Lehr rollers still out of alignment on the drive side. Dial gauge left on the cart.', { tag: 'Handover' }),
      S('t2', 'SM', '08:40', 'Filter housing on C-01 is cracked — paused the intervention, progress is saved.'),
      S('t3', 'GD', '09:05', '@Pierre can you take Tin Bath roller 14 after P-101? Production is at reduced speed.', { ref: ['Work order', 'Tin Bath — Roller stopped', 'WO-1339914'] }),
      S('t4', 'AM', '09:48', "Called to another breakdown — can someone take over the Annealing Lehr alignment? Progress saved at step 3.", { tag: 'Help' }),
    ] },
    site: { kind: 'site', title: 'Thourotte Plant', sub: 'Maintenance, production, HSE', msgs: [
      S('s1', 'LB', '07:30', 'Float Line speed reduced to 80% from 14:00 for the glass thickness change.'),
      S('s2', 'ER', '08:05', 'Reminder: hot work permits required in the Tempering zone all week.'),
      S('s3', 'HP', '08:50', 'Planned shutdown of Line 2 on Oct 8. Please submit work orders for it by Friday.'),
    ] },
    'dm-SL': { kind: 'dm', other: 'SL', msgs: [
      S('d1', 'SL', '09:15', 'Seal and gasket for P-101 are on the cart at the pump. O-ring kit is in drawer A-09.'),
    ] },
    'dm-GD': { kind: 'dm', other: 'GD', msgs: [
      S('d2', 'GD', '07:35', 'Pierre, P-101 is now critical — please start right after Conveyor 3.', { ref: ['Work order', 'Pump P-101 — Seal replacement', 'WO-1339859'] }),
      S('d3', 'PL', '07:41', 'Understood. Lockout around 09:30.'),
    ] },
    'dm-MD': { kind: 'dm', other: 'MD', msgs: [
      S('d4', 'MD', 'Yesterday', 'Can I borrow the laser alignment kit after lunch? Annealing Lehr again.'),
      S('d5', 'PL', 'Yesterday', 'Sure, it is in the workshop store.'),
    ] },
  };
  // messages already read per channel
  const READ = { 'WO-1339859': 5, 'WO-1339852': 2, team: 3, site: 3, 'dm-SL': 0, 'dm-GD': 2, 'dm-MD': 2 };

  const DOCS = [
    ['Lockout procedure', 'Procedure · Site HSE', 'PDF'], ['Seal replacement procedure', 'Pump P-101', 'PDF'], ['KSB Etanorm manual', 'Pump P-101', 'PDF'],
    ['Bearing replacement procedure', 'Fan V-12', 'PDF'], ['Glaston FC500 operating manual', 'Tempering Furnace 2', 'PDF'], ['Hydraulic circuit diagram', 'Hydraulic Press PH-030', 'PDF'],
  ];

  window.RX = { ME, TODAY, PEOPLE, TYPE_ICON, ASSETS, PARTS, CONSUMABLES, CHECKLISTS, WOS, RUNS, CHANNELS, READ, DOCS };
})();
