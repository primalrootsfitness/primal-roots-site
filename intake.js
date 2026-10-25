/* Primal Roots intake form. Submissions go to a Google Apps Script web app that saves a PDF to Drive and emails it. */
(function () {
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbzJ8XXeBXqE8PCG6k2Ytm6TsS_Jnh88CuYnfTv53w9aW-g5kysi2GxMZOEUKf8kNv6wLQ/exec';
  var LLC_NAME = '[LLC legal name]';
  var STORE = 'pr-intake-draft-v1';

  var YN = ['Yes', 'No'];
  var WAIVER = [
    ['1. Purpose of the program.', 'I am voluntarily enrolling in a coaching program with Primal Roots. The program may include strength and conditioning (including kettlebell and bodyweight training), mobility and fascia-focused work, corrective exercise, cardiovascular conditioning, movement and posture assessments, and general nutrition and lifestyle coaching. Sessions may take place in a private home gym or outdoors.'],
    ['2. Fitness assessments.', 'Before and during the program, my coach may assess my posture, movement, strength, flexibility, endurance, body measurements and body composition. I may decline any assessment, exercise or service, and stop at any time for any reason.'],
    ['Benefits.', 'Regular exercise can improve heart and lung fitness, strength, mobility, posture, body composition, blood pressure, blood sugar control, energy, sleep and mood. It can also reduce pain and the risk of chronic disease. Individual results vary.'],
    ["What's normal during exercise.", 'Expect a faster heart rate, heavier breathing, sweating, warmth, muscle fatigue and a burning feeling in working muscles. Mild muscle soreness for 1–3 days after a session is normal, especially early on. Sharp or joint pain, chest pain, dizziness, nausea or trouble breathing are not normal — stop and tell your coach right away.'],
    ['3. Risks.', 'I understand that exercise carries risks. These include muscle soreness, strains, sprains, joint injury, fractures, dizziness, fainting, abnormal blood pressure, irregular heartbeat and, in rare cases, heart attack, stroke or death. Risks also include injury from equipment, falling objects, slips and falls, and travel to and from sessions.'],
    ['4. My responsibilities.', 'I agree to:', ['Answer every question on the health screening forms completely and truthfully.', 'Tell my coach right away about any change in my health, medications, injuries or pregnancy status.', 'Tell my coach immediately if I feel pain, chest discomfort, shortness of breath, dizziness, nausea or anything unusual during exercise, and stop exercising.', 'Get clearance from my physician if my coach asks me to, before starting or continuing.', 'Follow instructions on proper form, equipment use and safety.']],
    ['5. Not medical care.', 'My coach is a certified personal trainer, not a physician, physical therapist, dietitian or other licensed healthcare provider. Coaching does not diagnose, treat or cure any disease or condition. Nutrition and lifestyle guidance is general and educational. It does not replace advice from my doctor. I will not stop or change any prescribed medication or treatment based on coaching without talking to my doctor.'],
    ['6. Results.', 'I understand results depend on my own effort, consistency, genetics and health. No specific outcome is promised.'],
    ['7. Emergencies.', 'In an emergency, I authorize my coach to call 911 and to give first aid or CPR. I accept responsibility for any resulting medical costs.'],
    ['8. Assumption of risk.', 'I knowingly and voluntarily accept all risks of participating, both known and unknown, even if they arise from the ordinary negligence of Primal Roots.'],
    ['9. Release and waiver.', 'To the fullest extent allowed by Oregon law, I release, waive and agree not to sue ' + LLC_NAME + ', Primal Roots, its owners, coaches, employees and agents for any injury, illness, death, loss or damage arising from my participation, including claims based on their ordinary negligence. This release does not cover gross negligence or intentional misconduct. It binds me, my heirs, executors and assigns.'],
    ['10. Indemnity.', 'I agree to cover any costs, including legal fees, that Primal Roots incurs because of a claim brought by me or on my behalf in breach of this release.'],
    ['11. Confidentiality.', 'My health information will be kept confidential. It will only be shared with my physician or emergency responders when needed for my safety, or with my written permission.'],
    ['12. Photos and video (optional).', 'Primal Roots may record photos or video of my sessions for form review. Check one:'],
  ];
  var WAIVER_END = [['13. Severability.', 'If any part of this agreement is found unenforceable, the rest stays in effect.']];

  function age(v) {
    var d = v.dob ? new Date(v.dob) : null; if (!d || isNaN(d)) return 99;
    var n = new Date(), a = n.getFullYear() - d.getFullYear();
    if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--;
    return a;
  }
  var PARQ1 = ['Has a doctor ever told you that you have a heart condition or high blood pressure?',
    'Do you feel pain in your chest at rest, during daily activities or when you exercise?',
    'Have you lost your balance from dizziness, or lost consciousness, in the past 12 months? (Answer No if the dizziness was from over-breathing during hard exercise.)',
    'Have you been diagnosed with any other chronic medical condition besides heart disease or high blood pressure?',
    'Are you currently taking prescribed medication for a chronic medical condition?',
    'Do you have a bone, joint or soft-tissue problem (muscle, ligament or tendon) that could get worse with more physical activity? (Answer No if it was in the past and doesn\'t limit you now.)',
    'Has a doctor ever said you should only do medically supervised physical activity?'];
  var PARQ2 = ['Arthritis, osteoporosis or back problems', 'Cancer of any kind', 'Heart or circulation problems (heart failure, irregular heartbeat, blocked arteries)',
    'Diabetes or other blood sugar problems', 'Mental health or learning conditions affecting daily activities', 'Lung or breathing problems (asthma, COPD, high blood pressure in the lungs)',
    'Spinal cord injury, stroke, concussion or other nervous-system condition', 'Kidney or liver disease', 'Any other condition not listed here'];
  function parqAnyYes(v) {
    var a = (v.parq1 || []).concat(parqFollow(v) ? (v.parq2 || []) : []);
    return a.indexOf('Yes') > -1;
  }
  function parqFollow(v) { var p = v.parq1 || []; return p[3] === 'Yes' || p[4] === 'Yes'; }

  var STEPS = [
    { title: 'About you', form: 'Client information', intro: 'This takes about 15 minutes. Your answers are confidential and help me build a safe plan for you.', fields: [
      { id: 'name', type: 'text', label: 'Full name', req: true, ac: 'name' },
      { id: 'dob', type: 'date', label: 'Date of birth', req: true },
      { id: 'phone', type: 'text', label: 'Phone', req: true, input: 'tel', ac: 'tel' },
      { id: 'email', type: 'text', label: 'Email', req: true, input: 'email', ac: 'email' },
      { id: 'address', type: 'text', label: 'Address', ac: 'street-address' },
      { id: 'occupation', type: 'text', label: 'Occupation' },
      { id: 'height', type: 'text', label: 'Height', req: true, half: true },
      { id: 'weight', type: 'text', label: 'Weight (lb)', req: true, input: 'number', half: true },
      { id: 'physician', type: 'text', label: 'Physician name and phone' },
      { id: 'lastphysical', type: 'date', label: 'Date of last physical exam' },
      { type: 'heading', label: 'Emergency contact' },
      { id: 'ec_name', type: 'text', label: 'Name', req: true },
      { id: 'ec_rel', type: 'text', label: 'Relationship', req: true, half: true },
      { id: 'ec_phone', type: 'text', label: 'Phone', req: true, input: 'tel', half: true }
    ] },
    { title: 'Consent and waiver', form: 'Form 1 — Informed Consent, Assumption of Risk and Release', fields: [
      { type: 'waiver' },
      { id: 'photo', type: 'radio', label: 'Photos and video', req: true, options: ['Coaching use only — never shared publicly', 'OK to use on social media and the website, with my face shown', 'OK to use on social media and the website, face hidden'] },
      { type: 'waiverEnd' },
      { id: 'waiver_ack', type: 'check', label: 'I have read this entire form. I understand it, I had the chance to ask questions, and I am signing it voluntarily. I understand I am giving up substantial legal rights.', req: true },
      { id: 'sig_waiver', type: 'signature', label: 'Client signature', req: true },
      { id: 'sig_waiver_name', type: 'text', label: 'Printed name', req: true },
      { id: 'sig_guardian', type: 'signature', label: 'Parent or guardian signature (client is under 18)', req: true, showIf: function (v) { return age(v) < 18; } },
      { id: 'sig_guardian_name', type: 'text', label: 'Parent or guardian printed name', req: true, showIf: function (v) { return age(v) < 18; } }
    ] },
    { title: 'Readiness screen', form: 'Form 2 — Physical Activity Readiness Screen (PAR-Q)', intro: 'This screen checks whether you can safely start exercising or should see your doctor first. Answer each question honestly with Yes or No.', fields: [
      { type: 'heading', label: 'Part 1 — General health' },
      { id: 'parq1', type: 'grid', rows: PARQ1, cols: YN, req: true, numbered: 1 },
      { type: 'heading', label: 'Part 2 — Follow-up', note: 'Because you answered Yes to question 4 or 5, do you have any of these?', showIf: parqFollow },
      { id: 'parq2', type: 'grid', rows: PARQ2, cols: YN, req: true, numbered: 8, showIf: parqFollow },
      { id: 'parq_details', type: 'textarea', label: 'You answered Yes to at least one question. Explain here:', req: true, showIf: parqAnyYes },
      { type: 'note', html: '<b>All No answers:</b> You are cleared to start a gradual program. Delay starting if you have a temporary illness like a cold or fever. If you are or may be pregnant, talk to your doctor first.<br><b>Any Yes answer:</b> Do not start training until your physician completes a clearance form. I\'ll send it to you.<br><b>If your health changes</b> so that you would now answer Yes to any question, tell your coach right away.' },
      { id: 'parq_ack', type: 'check', label: 'I have read, understood and fully completed this questionnaire. All my answers are true.', req: true },
      { id: 'sig_parq', type: 'signature', label: 'Client signature', req: true }
    ] },
    { title: 'Health history', form: 'Form 3 — Health Status Questionnaire', intro: 'This gives your coach a full picture of your health history so your program is safe and built around you. All answers are confidential.', fields: [
      { type: 'heading', label: 'Heart disease risk factors' },
      { id: 'risk', type: 'grid', req: true, cols: ['Yes', 'No', 'Not sure'], rows: ['Male 45+ or female 55+', 'Father or brother had a heart attack, bypass surgery or sudden death before 55; mother or sister before 65', 'Currently smoke or vape, or quit within the last 6 months', 'Blood pressure 130/80 or higher, or taking blood pressure medication', 'Total cholesterol over 200, LDL over 130, HDL under 40, or taking cholesterol medication', 'Fasting blood sugar 100 or higher, or told you have prediabetes or diabetes', 'Body mass index 30 or higher, or waist over 40 in (men) / 35 in (women)', 'Less than 150 minutes of moderate exercise per week for the past 3 months'] },
      { type: 'heading', label: 'Medical history', note: 'Check anything you have now or have had in the past.' },
      { id: 'history', type: 'checks', options: ['Heart attack, heart surgery or heart disease', 'Irregular heartbeat or heart murmur', 'Chest pain or tightness', 'High blood pressure', 'Stroke or blood clots', 'Asthma or other lung disease', 'Diabetes or low blood sugar', 'Thyroid or other hormone condition', 'Kidney or liver disease', 'Seizures or epilepsy', 'Cancer', 'Osteoporosis or arthritis', 'Hernia', 'Concussion or head injury', 'Fainting or frequent dizziness', 'Pregnancy (current or within the past 6 months)', 'Other'] },
      { id: 'history_explain', type: 'textarea', label: 'Explain any checked items', showIf: function (v) { return (v.history || []).length > 0; } },
      { type: 'heading', label: 'Symptoms in the past 12 months' },
      { id: 'symptoms', type: 'grid', req: true, cols: YN, rows: ['Chest, neck, jaw or arm pain or pressure', 'Shortness of breath at rest or with light activity', 'Heart racing, pounding or skipping beats', 'Swollen ankles or legs', 'Leg pain or cramping when walking', 'Unusual fatigue with daily activities', 'Unexplained weight loss or gain'] },
      { type: 'heading', label: 'Injuries, surgeries and pain', note: 'Fill in only the areas that apply.' },
      { id: 'injuries', type: 'table', rowLabel: 'Area', rows: ['Neck', 'Shoulders', 'Elbows / wrists / hands', 'Upper back', 'Lower back', 'Hips', 'Knees', 'Ankles / feet', 'Other'], cols: [{ label: 'Current pain (0–10)', kind: 'pain' }, { label: 'Past injury or surgery?', kind: 'yn' }, { label: 'Details and date', kind: 'text' }] },
      { id: 'avoid', type: 'textarea', label: 'Any movements that cause pain or that you have been told to avoid?' },
      { id: 'meds', type: 'textarea', label: 'Medications and supplements (name, dose and what it\'s for)' },
      { id: 'allergies', type: 'textarea', label: 'Allergies (food, medication, latex, other)' },
      { type: 'heading', label: 'Your health' },
      { id: 'health_rating', type: 'radio', label: 'How would you rate your overall health?', options: ['Excellent', 'Good', 'Fair', 'Poor'], req: true, inline: true },
      { id: 'health_change', type: 'radio', label: 'How has your health changed in the past year?', options: ['Better', 'Same', 'Worse'], req: true, inline: true },
      { id: 'energy', type: 'scale', label: 'Energy level through the day (1–10)' },
      { id: 'sleep_q', type: 'scale', label: 'Sleep quality (1–10)' },
      { id: 'sleep_h', type: 'text', label: 'Average hours of sleep', input: 'number', half: true },
      { id: 'digestion', type: 'textarea', label: 'Digestion — any regular bloating, heartburn or irregularity?' },
      { id: 'concerns', type: 'textarea', label: 'Any health concerns you\'d like to improve?' },
      { type: 'heading', label: 'Your fitness' },
      { id: 'fit_rating', type: 'radio', label: 'How would you rate your current fitness?', options: ['Excellent', 'Good', 'Fair', 'Poor'], req: true, inline: true },
      { id: 'self_rate', type: 'scales', label: 'Rate yourself 1–10', rows: ['Strength', 'Endurance', 'Flexibility', 'Balance'] },
      { id: 'stairs', type: 'radio', label: 'Can you climb 2 flights of stairs without stopping or getting winded?', options: YN, inline: true },
      { id: 'floor', type: 'radio', label: 'Can you get down to the floor and back up without using your hands?', options: YN, inline: true },
      { id: 'activity', type: 'radio', label: 'Current activity level', options: ['Sedentary', 'Light', 'Moderate', 'Very active'], inline: true },
      { id: 'cant_do', type: 'textarea', label: 'Physical activities you can\'t do now that you\'d like to' },
      { type: 'heading', label: 'Stress and mindset' },
      { id: 'stress', type: 'scale', label: 'Stress level (1 = low, 10 = very high)' },
      { id: 'stress_src', type: 'textarea', label: 'Main sources of stress' },
      { id: 'stress_handle', type: 'textarea', label: 'How do you usually handle stress?' },
      { id: 'ex_feel', type: 'radio', label: 'How do you feel about exercise right now?', options: ['Excited', 'Neutral', 'Anxious', 'Dread'], inline: true },
      { id: 'ex_past', type: 'textarea', label: 'Any past experiences that make exercise hard (injury, burnout, bad coaching)?' },
      { id: 'body_feel', type: 'textarea', label: 'How do you feel about your body and current shape?' },
      { id: 'mental', type: 'textarea', label: 'Is there anything about your mental or emotional health your coach should know to support you? (optional)' },
      { id: 'hsq_ack', type: 'check', label: 'I confirm that this information is complete and true. I will tell my coach about any changes.', req: true }
    ] },
    { title: 'Goals and lifestyle', form: 'Form 4 — Behavior and Lifestyle Questionnaire', intro: 'Your daily habits, goals and readiness to change. There are no wrong answers. Honest answers help build a plan you\'ll actually stick to.', fields: [
      { type: 'heading', label: 'Goals' },
      { id: 'goals', type: 'textarea', label: 'What are your top 3 goals for working with Primal Roots?', req: true },
      { id: 'goals_why', type: 'textarea', label: 'Why do these goals matter to you right now?' },
      { id: 'success', type: 'textarea', label: 'What would success look like 6 months from now?' },
      { id: 'stopped', type: 'textarea', label: 'What has stopped you from reaching these goals before?' },
      { type: 'heading', label: 'Exercise history' },
      { id: 'days', type: 'text', label: 'How many days per week do you exercise now?', input: 'number', half: true },
      { id: 'kind', type: 'text', label: 'What kind (lifting, running, sports, walking, other)?' },
      { id: 'consistent', type: 'text', label: 'How long have you trained consistently?' },
      { id: 'sports', type: 'text', label: 'Sports or activities you\'ve played in the past' },
      { id: 'coach_before', type: 'textarea', label: 'Have you worked with a coach or trainer before? What worked and what didn\'t?' },
      { id: 'enjoy', type: 'text', label: 'Exercises or activities you enjoy' },
      { id: 'dislike', type: 'text', label: 'Exercises or activities you dislike or avoid' },
      { id: 'times', type: 'textarea', label: 'Days and times you can train each week', req: true },
      { type: 'heading', label: 'Daily life' },
      { id: 'sleep_hrs', type: 'text', label: 'Hours of sleep per night (average)', input: 'number', half: true },
      { id: 'sleep_q2', type: 'scale', label: 'Sleep quality (1 = poor, 10 = great)' },
      { id: 'stress2', type: 'scale', label: 'Stress level (1 = low, 10 = very high)' },
      { id: 'energy2', type: 'scale', label: 'Energy through the day (1 = drained, 10 = strong)' },
      { id: 'sitting', type: 'text', label: 'Hours sitting per day (work + driving + screens)', input: 'number', half: true },
      { id: 'steps', type: 'text', label: 'Daily steps or time spent walking' },
      { id: 'outdoors', type: 'text', label: 'Time outdoors / in sunlight per day' },
      { id: 'work', type: 'text', label: 'Work schedule (shifts, travel, desk vs. on your feet)' },
      { type: 'heading', label: 'Nutrition and substances' },
      { id: 'typical_day', type: 'textarea', label: 'Describe a typical day of eating (breakfast, lunch, dinner, snacks)' },
      { id: 'meals', type: 'text', label: 'Meals per day / how often you eat out or eat fast food' },
      { id: 'water', type: 'text', label: 'Water intake per day' },
      { id: 'caffeine', type: 'text', label: 'Caffeine per day (coffee, energy drinks, pre-workout)' },
      { id: 'alcohol', type: 'text', label: 'Alcohol per week' },
      { id: 'tobacco', type: 'text', label: 'Tobacco, nicotine or cannabis use' },
      { id: 'diet_restrict', type: 'text', label: 'Any dietary restrictions or preferences' },
      { id: 'diet_before', type: 'textarea', label: 'Have you followed a specific diet before? How did it go?' },
      { type: 'heading', label: 'Readiness to change' },
      { id: 'stage', type: 'radio', label: 'Which statement fits you best right now?', req: true, options: ['I\'m not thinking about changing my exercise or eating habits.', 'I\'m thinking about changing in the next 6 months.', 'I plan to change in the next 30 days and have started taking small steps.', 'I\'ve been making changes consistently for less than 6 months.', 'I\'ve kept up healthy habits for more than 6 months.'] },
      { id: 'importance', type: 'scale', label: 'How important is it to you to reach your goals? (1–10)' },
      { id: 'confidence', type: 'scale', label: 'How confident are you that you can reach them? (1–10)' },
      { id: 'support', type: 'scale', label: 'How much support do you have from family and friends? (1–10)' },
      { id: 'obstacles', type: 'textarea', label: 'What could get in the way of sticking with the program?' },
      { id: 'coach_style', type: 'radio', label: 'How do you like to be coached?', options: ['Tough love', 'Encouragement', 'Data-driven', 'A mix'], inline: true },
      { id: 'checkin', type: 'radio', label: 'How do you prefer check-ins?', options: ['Text', 'Call', 'App', 'In person'], inline: true },
      { id: 'anything', type: 'textarea', label: 'Anything else your coach should know?' }
    ] }
  ];

  var values = {};
  try { values = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) { values = {}; }
  delete values.sig_waiver; delete values.sig_parq; delete values.sig_guardian;
  var step = 0, root = document.getElementById('intake');
  if (!root) return;

  function save() { try { var c = Object.assign({}, values); delete c.sig_waiver; delete c.sig_parq; delete c.sig_guardian; localStorage.setItem(STORE, JSON.stringify(c)); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function visible(f) { return !f.showIf || f.showIf(values); }

  function fieldHTML(f, si, fi) {
    if (!visible(f)) return '';
    var id = f.id, req = f.req ? ' <span class="req" aria-hidden="true">*</span>' : '';
    var v = id ? values[id] : null;
    switch (f.type) {
      case 'heading': return '<div class="ih"><h3>' + esc(f.label) + '</h3>' + (f.note ? '<p class="muted">' + esc(f.note) + '</p>' : '') + '</div>';
      case 'note': return '<div class="note">' + f.html + '</div>';
      case 'waiver':
        return '<div class="waiver"><p class="muted"><b>' + esc(LLC_NAME) + ' dba Primal Roots</b> · Bend, Oregon · 541-703-8179 · wade@primalroots.fit</p>' + WAIVER.map(function (w) {
          return '<p><b>' + esc(w[0]) + '</b> ' + esc(w[1]) + '</p>' + (w[2] ? '<ul>' + w[2].map(function (li) { return '<li>' + esc(li) + '</li>'; }).join('') + '</ul>' : '');
        }).join('') + '</div>';
      case 'waiverEnd': return '<div class="waiver">' + WAIVER_END.map(function (w) { return '<p><b>' + esc(w[0]) + '</b> ' + esc(w[1]) + '</p>'; }).join('') + '</div>';
      case 'text': return '<div class="fld' + (f.half ? ' half' : '') + '"><label for="f_' + id + '">' + esc(f.label) + req + '</label><input id="f_' + id + '" data-id="' + id + '" type="' + (f.input || 'text') + '"' + (f.ac ? ' autocomplete="' + f.ac + '"' : '') + (f.input === 'number' ? ' inputmode="decimal"' : '') + ' value="' + esc(v || '') + '"></div>';
      case 'date': return '<div class="fld half"><label for="f_' + id + '">' + esc(f.label) + req + '</label><input id="f_' + id + '" data-id="' + id + '" type="date" value="' + esc(v || '') + '"></div>';
      case 'textarea': return '<div class="fld"><label for="f_' + id + '">' + esc(f.label) + req + '</label><textarea id="f_' + id + '" data-id="' + id + '" rows="3">' + esc(v || '') + '</textarea></div>';
      case 'radio': return '<fieldset class="fld' + (f.inline ? ' inline' : '') + '"><legend>' + esc(f.label) + req + '</legend><div class="opts">' + f.options.map(function (o, oi) {
          return '<label class="opt"><input type="radio" name="f_' + id + '" data-id="' + id + '" value="' + esc(o) + '"' + (v === o ? ' checked' : '') + '><span>' + esc(o) + '</span></label>';
        }).join('') + '</div></fieldset>';
      case 'checks': v = v || []; return '<fieldset class="fld"><div class="opts cols">' + f.options.map(function (o) {
          return '<label class="opt"><input type="checkbox" data-multi="' + id + '" value="' + esc(o) + '"' + (v.indexOf(o) > -1 ? ' checked' : '') + '><span>' + esc(o) + '</span></label>';
        }).join('') + '</div></fieldset>';
      case 'check': return '<label class="attest"><input type="checkbox" data-id="' + id + '" data-bool="1"' + (v ? ' checked' : '') + '><span>' + esc(f.label) + req + '</span></label>';
      case 'grid': v = v || []; return '<div class="grid" role="table">' + f.rows.map(function (r, ri) {
          return '<div class="grow" role="row"><div class="gq">' + (f.numbered ? '<span class="gn">' + (f.numbered + ri) + '</span>' : '') + esc(r) + '</div><div class="gopts">' + f.cols.map(function (c) {
            return '<label class="pill"><input type="radio" name="g_' + id + '_' + ri + '" data-grid="' + id + '" data-row="' + ri + '" value="' + esc(c) + '"' + (v[ri] === c ? ' checked' : '') + '><span>' + esc(c) + '</span></label>';
          }).join('') + '</div></div>';
        }).join('') + '</div>';
      case 'scale': return '<fieldset class="fld"><legend>' + esc(f.label) + req + '</legend><div class="scale">' + [1,2,3,4,5,6,7,8,9,10].map(function (n) {
          return '<label class="pill"><input type="radio" name="f_' + id + '" data-id="' + id + '" value="' + n + '"' + (String(v) === String(n) ? ' checked' : '') + '><span>' + n + '</span></label>';
        }).join('') + '</div></fieldset>';
      case 'scales': v = v || []; return '<fieldset class="fld"><legend>' + esc(f.label) + '</legend>' + f.rows.map(function (r, ri) {
          return '<div class="srow"><span class="sl">' + esc(r) + '</span><div class="scale">' + [1,2,3,4,5,6,7,8,9,10].map(function (n) {
            return '<label class="pill"><input type="radio" name="s_' + id + '_' + ri + '" data-grid="' + id + '" data-row="' + ri + '" value="' + n + '"' + (String(v[ri]) === String(n) ? ' checked' : '') + '><span>' + n + '</span></label>';
          }).join('') + '</div></div>';
        }).join('') + '</fieldset>';
      case 'table': v = v || {}; return '<div class="itable">' + f.rows.map(function (r, ri) {
          var rv = v[ri] || {};
          return '<details class="irow"' + (rv.pain || rv.past || rv.details ? ' open' : '') + '><summary>' + esc(r) + (rv.pain ? ' <span class="muted">· pain ' + esc(rv.pain) + '/10</span>' : '') + '</summary><div class="icells">' +
            '<label>Current pain (0–10)<select data-table="' + id + '" data-row="' + ri + '" data-key="pain"><option value=""></option>' + [0,1,2,3,4,5,6,7,8,9,10].map(function (n) { return '<option' + (String(rv.pain) === String(n) ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></label>' +
            '<label>Past injury or surgery?<select data-table="' + id + '" data-row="' + ri + '" data-key="past"><option value=""></option><option' + (rv.past === 'Yes' ? ' selected' : '') + '>Yes</option><option' + (rv.past === 'No' ? ' selected' : '') + '>No</option></select></label>' +
            '<label class="wide">Details and date<input type="text" data-table="' + id + '" data-row="' + ri + '" data-key="details" value="' + esc(rv.details || '') + '"></label></div></details>';
        }).join('') + '</div>';
      case 'signature': return '<div class="fld"><label>' + esc(f.label) + req + '</label><div class="sigwrap"><canvas class="sig" data-sig="' + id + '" aria-label="Signature pad: sign with your finger or mouse"></canvas><button type="button" class="copybtn" data-clear="' + id + '">Clear</button></div><p class="muted small">Sign with your finger or mouse.</p></div>';
    }
    return '';
  }

  function render() {
    var s = STEPS[step];
    var html = '<div class="progress" aria-label="Step ' + (step + 1) + ' of ' + STEPS.length + '">' + STEPS.map(function (x, i) {
      return '<span class="' + (i < step ? 'done' : i === step ? 'cur' : '') + '">' + (i + 1) + '. ' + esc(x.title) + '</span>';
    }).join('') + '</div>';
    html += '<p class="label">' + esc(s.form) + '</p><h2>' + esc(s.title) + '</h2>' + (s.intro ? '<p class="lede">' + esc(s.intro) + '</p>' : '');
    html += '<div class="fields">' + s.fields.map(fieldHTML).join('') + '</div>';
    html += '<p class="err" id="err" role="alert" hidden></p>';
    html += '<div class="nav">' + (step > 0 ? '<button type="button" class="btn ghost" id="back">Back</button>' : '<span></span>') +
      (step < STEPS.length - 1 ? '<button type="button" class="btn" id="next">Next</button>' : '<button type="button" class="btn" id="submit">Send my forms</button>') + '</div>';
    html += '<input type="text" id="hp" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">';
    root.innerHTML = html;
    initSigs();
  }

  var sigs = {};
  function initSigs() {
    root.querySelectorAll('canvas[data-sig]').forEach(function (cv) {
      var id = cv.dataset.sig, ctx = cv.getContext('2d'), dpr = window.devicePixelRatio || 1, drawing = false, last = null;
      function size() { var r = cv.getBoundingClientRect(); cv.width = r.width * dpr; cv.height = r.height * dpr; ctx.scale(dpr, dpr); ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#15130F';
        if (values[id]) { var img = new Image(); img.onload = function () { ctx.drawImage(img, 0, 0, r.width, r.height); }; img.src = values[id]; } }
      size();
      function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
      cv.addEventListener('pointerdown', function (e) { drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId); e.preventDefault(); });
      cv.addEventListener('pointermove', function (e) { if (!drawing) return; var p = pos(e); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p; sigs[id] = true; });
      function end() { if (drawing && sigs[id]) { values[id] = cv.toDataURL('image/png'); } drawing = false; }
      cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    });
  }

  root.addEventListener('input', onChange);
  root.addEventListener('change', onChange);
  function onChange(e) {
    var t = e.target, d = t.dataset;
    if (d.id) values[d.id] = d.bool ? t.checked : t.value;
    else if (d.multi) { values[d.multi] = Array.prototype.map.call(root.querySelectorAll('[data-multi="' + d.multi + '"]:checked'), function (x) { return x.value; }); }
    else if (d.grid) { values[d.grid] = values[d.grid] || []; values[d.grid][+d.row] = t.value; }
    else if (d.table) { values[d.table] = values[d.table] || {}; values[d.table][d.row] = values[d.table][d.row] || {}; values[d.table][d.row][d.key] = t.value; }
    else return;
    save();
    if (e.type === 'change' && (t.type === 'radio' || t.type === 'checkbox' || t.type === 'date')) rerenderKeep();
  }
  function rerenderKeep() {
    var y = window.scrollY, active = document.activeElement && document.activeElement.id;
    var sigData = {}; Object.keys(values).forEach(function (k) { if (/^sig_/.test(k)) sigData[k] = values[k]; });
    render(); window.scrollTo(0, y); if (active) { var a = document.getElementById(active); if (a) a.focus({ preventScroll: true }); }
  }
  root.addEventListener('click', function (e) {
    var t = e.target;
    if (t.dataset && t.dataset.clear) { delete values[t.dataset.clear]; sigs[t.dataset.clear] = false; var cv = root.querySelector('canvas[data-sig="' + t.dataset.clear + '"]'); var c = cv.getContext('2d'); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); c.restore(); }
    if (t.id === 'next') { if (validate()) { step++; render(); window.scrollTo(0, root.offsetTop - 80); } }
    if (t.id === 'back') { step--; render(); window.scrollTo(0, root.offsetTop - 80); }
    if (t.id === 'submit') { if (validate()) submit(); }
  });

  function missing(f) {
    if (!f.req || !visible(f) || !f.id) return false;
    var v = values[f.id];
    if (f.type === 'grid') { v = v || []; for (var i = 0; i < f.rows.length; i++) if (!v[i]) return true; return false; }
    if (f.type === 'check') return !v;
    if (f.type === 'checks') return !(v && v.length);
    return !v || !String(v).trim();
  }
  function validate() {
    var bad = STEPS[step].fields.filter(missing), err = document.getElementById('err');
    root.querySelectorAll('.bad').forEach(function (x) { x.classList.remove('bad'); });
    if (!bad.length) { err.hidden = true; return true; }
    bad.forEach(function (f) { var el = root.querySelector('[data-id="' + f.id + '"],[data-grid="' + f.id + '"],[data-sig="' + f.id + '"]'); if (el) { var box = el.closest('.fld,.grid,.attest,.sigwrap') || el; box.classList.add('bad'); } });
    err.textContent = 'Please complete the highlighted ' + (bad.length === 1 ? 'question' : bad.length + ' questions') + ' before continuing.';
    err.hidden = false;
    var first = root.querySelector('.bad'); if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }

  function answers() {
    var out = [];
    STEPS.forEach(function (s) {
      var items = [];
      s.fields.forEach(function (f) {
        if (!visible(f)) return;
        var v = f.id ? values[f.id] : null;
        if (f.type === 'heading') items.push({ h: f.label });
        else if (f.type === 'waiver') WAIVER.forEach(function (w) { items.push({ p: w[0] + ' ' + w[1] + (w[2] ? ' ' + w[2].map(function (x) { return '• ' + x; }).join(' ') : '') }); });
        else if (f.type === 'waiverEnd') WAIVER_END.forEach(function (w) { items.push({ p: w[0] + ' ' + w[1] }); });
        else if (f.type === 'grid') f.rows.forEach(function (r, i) { items.push({ q: (f.numbered ? (f.numbered + i) + '. ' : '') + r, a: (v || [])[i] || '' }); });
        else if (f.type === 'scales') f.rows.forEach(function (r, i) { items.push({ q: f.label + ': ' + r, a: (v || [])[i] || '' }); });
        else if (f.type === 'checks') items.push({ q: 'Checked', a: (v || []).join('; ') || 'None' });
        else if (f.type === 'table') f.rows.forEach(function (r, i) { var rv = (v || {})[i]; if (rv && (rv.pain || rv.past || rv.details)) items.push({ q: r, a: 'Pain ' + (rv.pain || '—') + '/10 · Past injury/surgery: ' + (rv.past || '—') + (rv.details ? ' · ' + rv.details : '') }); });
        else if (f.type === 'check') items.push({ q: f.label, a: v ? 'Agreed' : 'Not agreed' });
        else if (f.type === 'signature') items.push({ sig: f.id, q: f.label });
        else if (f.type === 'note') items.push({ p: f.html.replace(/<br>/g, ' ').replace(/<[^>]+>/g, '') });
        else if (f.id) items.push({ q: f.label, a: v == null ? '' : String(v) });
      });
      out.push({ title: s.form, items: items });
    });
    return out;
  }

  function submit() {
    var err = document.getElementById('err'), btn = document.getElementById('submit');
    if (document.getElementById('hp').value) return;
    if (!ENDPOINT) { err.textContent = 'Online submission isn\'t switched on yet. Please call or text 541-703-8179 and I\'ll get you the forms another way.'; err.hidden = false; return; }
    btn.disabled = true; btn.textContent = 'Sending…';
    var payload = { client: { name: values.name, email: values.email, phone: values.phone, dob: values.dob }, parqFlag: parqAnyYes(values),
      under18: age(values) < 18, submittedAt: new Date().toISOString(), sections: answers(),
      signatures: { sig_waiver: values.sig_waiver || '', sig_parq: values.sig_parq || '', sig_guardian: values.sig_guardian || '' } };
    fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
      .then(function () {
        try { localStorage.removeItem(STORE); } catch (e) {}
        root.innerHTML = '<div class="done"><p class="label">Sent</p><h2>Thanks, ' + esc((values.name || '').split(' ')[0]) + '.</h2><p class="lede">Your forms are in. A copy is on its way to ' + esc(values.email) + '. I\'ll review your answers before your intro session.</p>' +
          (payload.parqFlag ? '<p class="note">Based on your answers, I\'ll reach out about a quick doctor\'s clearance before we train. We can still meet to talk through your goals and plan.</p>' : '') +
          '<p class="muted">Questions? Call or text 541-703-8179.</p><a class="btn ghost" href="index.html">Back to the home page</a></div>';
        window.scrollTo(0, 0);
      })
      .catch(function () { btn.disabled = false; btn.textContent = 'Send my forms'; err.textContent = 'Your forms didn\'t send. Check your connection and try again. Your answers are saved on this device.'; err.hidden = false; });
  }

  render();
})();
