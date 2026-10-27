/* Primal Roots app — live version (Supabase). Client + coach views. */
(function () {
  'use strict';
  var SUPABASE_URL = 'https://rzlobdptknxstdsvgcuu.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_QU2hnK0GW7MYSp15iOwf_g_0eWjtjB5';
  var COACH = { name: 'Wade', phone: '541-703-8179', email: 'wade@primalroots.fit', bookingLink: 'https://calendar.app.google/3cA5vLPcfc19vx5R9' };

  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' } });
  var root = document.getElementById('app');

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseYmd(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  var NOW = new Date(), TODAY = ymd(NOW);
  var MONTH = ymd(new Date(NOW.getFullYear(), NOW.getMonth(), 1));
  var NEXT_MONTH = ymd(new Date(NOW.getFullYear(), NOW.getMonth() + 1, 1));
  function weekStart() { var d = new Date(NOW); var day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); d.setHours(0, 0, 0, 0); return d; }
  function fmtDay(d) { d = d instanceof Date ? d : new Date(d); return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); }
  function fmtShort(d) { d = d instanceof Date ? d : parseYmd(d); return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
  function fmtTime(d) { d = d instanceof Date ? d : new Date(d); return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); }
  function money(n) { return '$' + Math.round(+n || 0).toLocaleString(); }
  function first(name) { return String(name || '').trim().split(/\s+/)[0] || ''; }
  function q(p) { return p.then(function (r) { if (r.error) throw r.error; return r.data; }); }
  var USED = ['Attended', 'Late cancel', 'No-show'];

  var S = { loading: true, tab: 'today', sub: null, toast: null, data: {} };
  function toast(t) { S.toast = t; draw(); clearTimeout(toast._t); toast._t = setTimeout(function () { S.toast = null; draw(); }, 2200); }
  function fail(e) { console.error(e); toast((e && e.message) ? 'Error: ' + e.message : 'Something went wrong. Try again.'); }
  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function checked(id) { var el = document.getElementById(id); return !!(el && el.checked); }

  var ICON = {
    today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
    train: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="14" r="6"/><path d="M9 8.5V6a3 3 0 0 1 6 0v2.5"/></svg>',
    food: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 3v8a2 2 0 0 0 4 0V3M9 11v10M17 3c-2 0-3 3-3 6s1 4 3 4v8"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h16v11H9l-5 4z"/></svg>',
    me: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>',
    clients: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.5"/><path d="M2 20c.8-3.5 3.6-5 7-5s6.2 1.5 7 5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 15c2 .6 3.4 2.2 4 5"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12l5 5 9-10"/></svg>'
  };
  var MARK = '<svg class="mk" viewBox="0 0 200 200" aria-hidden="true"><g fill="none" stroke="#15130F" stroke-linecap="round" stroke-linejoin="round"><circle cx="100" cy="100" r="92" stroke-width="10"/><g transform="translate(100 104) scale(0.62) translate(-105 -120)" stroke-width="12"><path d="M60 40 C60 64 58 80 52 94 C44 104 40 112 44 120 H158 C168 120 170 110 162 106 C140 100 118 92 102 82 C92 76 86 64 84 50 V40"/></g><path d="M34 104 H166" stroke="#A4471E" stroke-width="7"/><g transform="translate(100 104) scale(0.58) translate(-100 -82)" stroke-width="13"><path d="M100 82 V180"/><path d="M100 96 C86 112 66 120 44 126"/><path d="M100 96 C114 112 134 120 156 126"/><path d="M100 124 C88 140 72 150 56 162"/><path d="M100 124 C112 140 128 150 144 162"/></g></g></svg>';

  /* ---------- auth ---------- */
  async function boot() {
    var r = await sb.auth.getSession();
    S.session = r.data.session;
    sb.auth.onAuthStateChange(function (evt, session) {
      var had = !!S.session; S.session = session;
      if (evt === 'SIGNED_OUT') { S.profile = null; S.data = {}; draw(); }
      else if (session && !had) { start(); }
    });
    if (S.session) await start(); else { S.loading = false; draw(); }
  }
  async function start() {
    S.loading = true; draw();
    try {
      var uid = S.session.user.id;
      var prof = await q(sb.from('profiles').select('*').eq('id', uid).maybeSingle());
      if (!prof) { await new Promise(function (r) { setTimeout(r, 1200); }); prof = await q(sb.from('profiles').select('*').eq('id', uid).maybeSingle()); }
      S.profile = prof || { role: 'client', email: S.session.user.email };
      S.role = S.profile.role;
      S.tab = 'today'; S.sub = null;
      if (S.role === 'coach') await loadCoach(); else await loadClient();
      subscribe();
    } catch (e) { fail(e); }
    S.loading = false; draw();
    if (location.hash && /access_token|error/.test(location.hash)) history.replaceState(null, '', location.pathname);
  }
  async function sendLink(email) {
    var r = await sb.auth.signInWithOtp({ email: email, options: { emailRedirectTo: location.origin + location.pathname } });
    if (r.error) throw r.error;
  }

  /* ---------- realtime ---------- */
  var channel = null;
  function subscribe() {
    if (channel) sb.removeChannel(channel);
    var filter = S.role === 'coach' ? {} : { filter: 'client_id=eq.' + (S.data.client && S.data.client.id) };
    if (S.role !== 'coach' && !S.data.client) return;
    channel = sb.channel('messages-live').on('postgres_changes', Object.assign({ event: 'INSERT', schema: 'public', table: 'messages' }, filter), function (p) {
      var m = p.new, D = S.data;
      if (S.role === 'coach') {
        (D.threads[m.client_id] = D.threads[m.client_id] || []);
        if (!D.threads[m.client_id].some(function (x) { return x.id === m.id; })) D.threads[m.client_id].push(m);
        if (m.sender === 'client' && !(S.tab === 'inbox' && S.chatWith === m.client_id)) D.unread[m.client_id] = (D.unread[m.client_id] || 0) + 1;
        if (D.detail && D.detail.client.id === m.client_id && !D.detail.messages.some(function (x) { return x.id === m.id; })) D.detail.messages.push(m);
      } else {
        if (!D.messages.some(function (x) { return x.id === m.id; })) D.messages.push(m);
        if (m.sender === 'coach' && S.tab !== 'chat') D.unread = (D.unread || 0) + 1;
      }
      draw();
    }).subscribe();
  }

  /* ---------- client data ---------- */
  async function loadClient() {
    var uid = S.session.user.id, D = S.data = {};
    D.client = await q(sb.from('clients').select('*').eq('profile_id', uid).maybeSingle());
    if (!D.client) return;
    var cid = D.client.id;
    var res = await Promise.all([
      q(sb.from('programs').select('*').eq('client_id', cid).eq('active', true).order('created_at', { ascending: false }).limit(1)),
      q(sb.from('checkins').select('*').eq('client_id', cid).order('day', { ascending: true }).limit(90)),
      q(sb.from('nutrition_plans').select('*').eq('client_id', cid).maybeSingle()),
      q(sb.from('food_logs').select('*').eq('client_id', cid).gte('logged_at', new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate()).toISOString()).order('logged_at')),
      q(sb.from('water_logs').select('*').eq('client_id', cid).eq('day', TODAY).maybeSingle()),
      q(sb.from('messages').select('*').eq('client_id', cid).order('created_at').limit(300)),
      q(sb.from('sessions').select('*').eq('client_id', cid).gte('starts_at', new Date(MONTH + 'T00:00:00').toISOString()).order('starts_at')),
      q(sb.from('payments').select('*').eq('client_id', cid).eq('month', MONTH)),
      q(sb.from('documents').select('*').eq('client_id', cid).order('signed_on', { ascending: false })),
      q(sb.from('workout_completions').select('*').eq('client_id', cid).gte('completed_at', weekStart().toISOString())),
      q(sb.from('set_logs').select('*').eq('client_id', cid).eq('logged_on', TODAY))
    ]);
    D.program = res[0][0] || null; D.checkins = res[1]; D.nutrition = res[2]; D.food = res[3]; D.water = res[4] ? res[4].glasses : 0;
    D.messages = res[5]; D.sessions = res[6]; D.payments = res[7]; D.documents = res[8]; D.completions = res[9];
    D.logs = {}; res[10].forEach(function (l) { D.logs[l.exercise_id + '_' + l.set_number] = l; });
    D.unread = D.messages.filter(function (m) { return m.sender === 'coach' && !m.read_at; }).length;
    D.workouts = []; D.exercises = {};
    if (D.program) {
      D.workouts = await q(sb.from('workouts').select('*').eq('program_id', D.program.id).order('position'));
      if (D.workouts.length) {
        var ex = await q(sb.from('exercises').select('*').in('workout_id', D.workouts.map(function (w) { return w.id; })).order('position'));
        ex.forEach(function (e) { (D.exercises[e.workout_id] = D.exercises[e.workout_id] || []).push(e); });
        var libIds = ex.map(function (e) { return e.library_id; }).filter(Boolean);
        D.lib = {};
        if (libIds.length) { try { (await q(sb.from('exercise_library').select('id,video_url,cues').in('id', libIds))).forEach(function (l) { D.lib[l.id] = l; }); } catch (e) { console.warn(e); } }
      }
    }
    D.todayCheckin = D.checkins.find(function (c) { return c.day === TODAY; }) || null;
  }
  function sessionStats(sessions) {
    var used = 0, rolled = 0, next = null, nowMs = Date.now();
    sessions.forEach(function (s) {
      var t = new Date(s.starts_at);
      var inMonth = ymd(t) >= MONTH && ymd(t) < NEXT_MONTH;
      if (inMonth && USED.indexOf(s.status) > -1) used++;
      if (inMonth && s.status === 'Cancelled 24h+') rolled++;
      if (s.status === 'Scheduled' && t.getTime() > nowMs && (!next || t < new Date(next.starts_at))) next = s;
    });
    return { used: used, rolled: rolled, next: next };
  }
  function payStatus(payments, client) {
    if (!payments.length) return null;
    var due = payments.reduce(function (a, p) { return a + (+p.amount_due || 0); }, 0), paid = payments.reduce(function (a, p) { return a + (+p.amount_paid || 0); }, 0);
    return paid >= due ? 'Paid' : 'Due';
  }

  /* ---------- client screens ---------- */
  function noClientScreen() {
    return '<div class="empty" style="margin-top:20px"><h3>Almost there</h3><p>You are signed in as <b>' + esc(S.session.user.email) + '</b>, but your coach has not set up your account under this email yet.</p><p class="small">If you used a different email with Wade, sign out and use that one. Questions? Call or text ' + COACH.phone + '.</p><button class="btn ghost" data-act="signout">Sign out</button></div>';
  }
  function todayWorkout() {
    var D = S.data; if (!D.workouts.length) return null;
    var dows = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], d = dows[NOW.getDay()];
    return D.workouts.find(function (w) { return (w.day_label || '').slice(0, 3).toLowerCase() === d.toLowerCase(); }) ||
      D.workouts.find(function (w) { return !isDone(w.id); }) || D.workouts[0];
  }
  function isDone(wid) { return S.data.completions.some(function (c) { return c.workout_id === wid; }); }
  function clientToday() {
    var D = S.data, c = D.client, st = sessionStats(D.sessions), w = todayWorkout();
    var left = c.sessions_per_month != null ? Math.max(0, c.sessions_per_month - st.used) : '—';
    var doneN = D.workouts.filter(function (x) { return isDone(x.id); }).length;
    var last = D.messages.slice(-1)[0];
    return '<div><p class="label">' + esc(fmtDay(NOW)) + '</p><h2>Good to see you, ' + esc(c.first_name || first(c.full_name)) + '.</h2></div>' +
      (st.next ? '<div class="card dark"><p class="label">Next session with ' + COACH.name + '</p><h3>' + esc(fmtDay(st.next.starts_at)) + ' · ' + esc(fmtTime(st.next.starts_at)) + '</h3><p class="muted small">Private gym, Bend. Bring water and shoes you can take off.</p></div>'
        : '<a class="card tap" href="' + COACH.bookingLink + '" target="_blank" rel="noopener" style="text-decoration:none;color:inherit"><p class="label">Next session</p><h3>Nothing booked yet</h3><p class="muted small">Tap to book a time with ' + COACH.name + '.</p></a>') +
      (w ? '<button class="card tap" data-go="workout" data-id="' + w.id + '"><div class="row"><p class="label">Today\'s training</p><span class="chip' + (w.in_person ? ' solid' : '') + '">' + (isDone(w.id) ? 'Done' : w.in_person ? 'In person' : 'On your own') + '</span></div><h3>' + esc(w.title) + '</h3><p class="muted small">' + (D.exercises[w.id] || []).length + ' exercises' + (w.minutes ? ' · about ' + w.minutes + ' min' : '') + '</p></button>'
        : '<div class="card"><p class="label">Training</p><p class="muted">' + COACH.name + ' is building your program. It will show up here.</p></div>') +
      '<div class="stats"><div class="stat"><b>' + left + '</b><span>Sessions left</span></div><div class="stat"><b>' + st.rolled + '</b><span>Rolled over</span></div><div class="stat"><b>' + doneN + '/' + D.workouts.length + '</b><span>Workouts this week</span></div></div>' +
      '<button class="card tap" data-go="checkin"><div class="row"><div><p class="label">Daily check-in</p><h3>' + (D.todayCheckin ? 'Checked in today' : 'How are you feeling?') + '</h3></div><span class="chip ' + (D.todayCheckin ? 'ok' : 'warn') + '">' + (D.todayCheckin ? 'Done' : '30 sec') + '</span></div></button>' +
      (last ? '<button class="card tap" data-tab="chat"><p class="label">Latest message</p><p>' + esc(last.body) + '</p><p class="muted small">' + (last.sender === 'coach' ? COACH.name : 'You') + ' · ' + esc(fmtDay(last.created_at)) + '</p></button>' : '');
  }
  function clientTrain() {
    var D = S.data, p = D.program;
    if (!p) return '<div><p class="label">Your program</p><h2>Coming soon</h2></div><div class="empty">' + COACH.name + ' is building your program. You\'ll see your workouts here once it\'s ready.</div>';
    return '<div><p class="label">Your program</p><h2>' + esc(p.name) + '</h2><p class="muted small">Week ' + (p.current_week || 1) + ' of ' + (p.weeks || 4) + '</p></div>' +
      '<div class="bar"><i style="width:' + Math.min(100, (p.current_week || 1) / (p.weeks || 4) * 100) + '%"></i></div>' +
      (D.workouts.length ? D.workouts.map(function (w) {
        return '<button class="card tap" data-go="workout" data-id="' + w.id + '"><div class="row"><span class="label">' + esc(w.day_label || '') + '</span>' + (isDone(w.id) ? '<span class="chip ok">Done</span>' : '<span class="chip' + (w.in_person ? ' solid' : '') + '">' + (w.in_person ? 'In person' : 'On your own') + '</span>') + '</div><h3>' + esc(w.title) + '</h3><p class="muted small">' + esc(w.focus || '') + (w.focus ? ' · ' : '') + (D.exercises[w.id] || []).length + ' exercises</p></button>';
      }).join('') : '<div class="empty">No workouts in this program yet.</div>');
  }
  function workoutDetail(id) {
    var D = S.data, w = D.workouts.find(function (x) { return x.id === id; }); if (!w) return '';
    var ex = D.exercises[id] || [];
    return '<div><p class="label">' + esc(w.day_label || '') + (w.focus ? ' · ' + esc(w.focus) : '') + '</p><h2>' + esc(w.title) + '</h2></div>' +
      ex.map(function (e) {
        var sets = '';
        for (var s = 1; s <= (e.sets || 1); s++) {
          var k = e.id + '_' + s, lg = D.logs[k] || {}, draft = (S.drafts || {})[k] || {};
          sets += '<div class="set"><span>Set ' + s + '</span><input aria-label="Load, set ' + s + '" value="' + esc(draft.load != null ? draft.load : lg.load != null ? lg.load : (e.load || '')) + '" data-dl="' + k + '" data-f="load"><input aria-label="Reps, set ' + s + '" value="' + esc(draft.reps != null ? draft.reps : lg.reps != null ? lg.reps : (e.reps || '')) + '" data-dl="' + k + '" data-f="reps"><button class="done" aria-label="Mark set ' + s + ' done" aria-pressed="' + (lg.done ? 'true' : 'false') + '" data-act="set" data-ex="' + e.id + '" data-n="' + s + '">' + ICON.check + '</button></div>';
        }
        var L = (D.lib || {})[e.library_id] || {}, vid = e.video_url || L.video_url, cue = e.detail || L.cues;
        var thumb = vid ? '<a class="thumb" href="' + esc(vid) + '" target="_blank" rel="noopener" style="text-decoration:none">Watch<br>demo</a>' : '<div class="thumb">Demo<br>soon</div>';
        return '<div class="ex"><div class="exhead">' + thumb + '<div class="exbody"><b>' + esc(e.name) + '</b><span class="muted small">' + (e.sets || 1) + ' × ' + esc(e.reps || '') + (e.load ? ' · ' + esc(e.load) : '') + '</span>' + (cue ? '<span class="small">' + esc(cue) + '</span>' : '') + '</div></div><div class="sets"><div class="set"><span></span><span>Load</span><span>Reps</span><span></span></div>' + sets + '</div></div>';
      }).join('') +
      '<div class="fld"><label for="wnote">Notes for ' + COACH.name + '</label><textarea id="wnote" rows="2" placeholder="How did it feel? Anything hurt?"></textarea></div>' +
      (isDone(id) ? '<p class="ok">Completed this week ✓</p>' : '<button class="btn block" data-act="complete" data-id="' + id + '">Finish workout</button>');
  }
  function checkinScreen() {
    var c = S.ck || {};
    function scale(key, label) { return '<div class="fld"><label>' + label + '</label><div class="scale">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (n) { return '<button aria-pressed="' + (c[key] === n ? 'true' : 'false') + '" data-act="ck" data-k="' + key + '" data-v="' + n + '">' + n + '</button>'; }).join('') + '</div></div>'; }
    return '<div><p class="label">Daily check-in</p><h2>How are you today?</h2></div>' +
      '<div class="fld"><label for="ckw">Morning bodyweight (lb)</label><input id="ckw" inputmode="decimal" value="' + esc(c.weight || '') + '" placeholder="e.g. 210.2"></div>' +
      scale('sleep', 'Sleep quality') + scale('energy', 'Energy') + scale('soreness', 'Soreness') + scale('stress', 'Stress') +
      '<div class="fld"><label for="ckn">Anything ' + COACH.name + ' should know?</label><textarea id="ckn" rows="2">' + esc(c.note || '') + '</textarea></div>' +
      '<button class="btn block" data-act="saveck">Save check-in</button>';
  }
  function clientFood() {
    var D = S.data, n = D.nutrition;
    var plan = n ? '<div><p class="label">Nutrition plan</p><h2>' + esc(n.title || 'Your nutrition plan') + '</h2>' + (n.summary ? '<p class="muted small">' + esc(n.summary) + '</p>' : '') + '</div>' +
      ((n.guidelines || []).length ? '<div class="card"><p class="label">Your guidelines</p><ul style="margin:0;padding-left:18px">' + n.guidelines.map(function (g) { return '<li style="margin-bottom:6px">' + esc(g) + '</li>'; }).join('') + '</ul></div>' : '') +
      ((n.sample_day || []).length ? '<div class="card"><p class="label">Sample day</p>' + n.sample_day.map(function (m) { return '<div class="row small"><b>' + esc(m.meal) + '</b><span class="muted" style="text-align:right">' + esc(m.food) + '</span></div>'; }).join('') + '</div>' : '')
      : (D.client.nutrition_plan ? '<div><p class="label">Nutrition plan</p><h2>Coming soon</h2></div><div class="empty">' + COACH.name + ' is putting your nutrition plan together.</div>' : '<div><p class="label">Food</p><h2>Food log</h2></div>');
    return plan +
      '<div class="row"><h3>Today\'s food log</h3><button class="btn ghost mini" data-go="addfood">+ Add</button></div>' +
      '<div class="list">' + (D.food.length ? D.food.map(function (f) { return '<div class="meal"><span class="when">' + esc(f.meal || '') + '</span><span>' + esc(f.description) + '</span><span class="muted small">' + esc(fmtTime(f.logged_at)) + '</span></div>'; }).join('') : '<p class="muted small" style="padding:12px 0">Nothing logged yet today.</p>') + '</div>' +
      '<div class="card"><div class="row"><p class="label">Water</p><span class="muted small">' + D.water + ' of 8 glasses</span></div><div class="bar"><i style="width:' + Math.min(100, D.water / 8 * 100) + '%"></i></div><div class="row"><button class="btn ghost mini" data-act="water" data-d="-1">−</button><button class="btn mini" data-act="water" data-d="1">+ Glass</button></div></div>' +
      '<p class="muted small">Nutrition coaching is general guidance, not medical nutrition therapy. Check with your doctor if you have a medical condition.</p>';
  }
  function addFood() {
    return '<div><p class="label">Food log</p><h2>Add a meal</h2></div><div class="form"><div class="fld"><label for="fw">Meal</label><select id="fw"><option>Breakfast</option><option>Lunch</option><option>Snack</option><option>Dinner</option></select></div>' +
      '<div class="fld"><label for="fd">What did you eat?</label><textarea id="fd" rows="3" placeholder="e.g. 8 oz steak, potatoes, butter"></textarea></div><button class="btn block" data-act="savefood">Save meal</button></div>';
  }
  function chatView(messages, asCoach, cid) {
    return '<div class="chat">' + (messages.length ? messages.map(function (m) {
      var mine = asCoach ? m.sender === 'coach' : m.sender === 'client';
      return '<div class="msg ' + (mine ? 'me' : 'them') + '">' + esc(m.body) + '<time>' + esc(fmtDay(m.created_at)) + ' · ' + esc(fmtTime(m.created_at)) + '</time></div>';
    }).join('') : '<p class="muted">No messages yet. Say hi.</p>') + '</div>' +
      '<form class="composer" data-send="' + (cid || '') + '"><input aria-label="Message" id="msgin" placeholder="Message' + (asCoach ? '' : ' ' + COACH.name) + '…" autocomplete="off"><button type="submit">Send</button></form>';
  }
  function spark(vals) {
    if (vals.length < 2) return '<p class="muted small">Log your bodyweight in your daily check-in to see your trend here.</p>';
    var w = 320, h = 110, p = 18, min = Math.min.apply(null, vals) - 0.5, max = Math.max.apply(null, vals) + 0.5;
    var pts = vals.map(function (v, i) { return [p + i * (w - 2 * p) / (vals.length - 1), h - p - (v - min) / (max - min) * (h - 2 * p)]; });
    var d = pts.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' ');
    var last = pts[pts.length - 1];
    return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Bodyweight trend"><line x1="' + p + '" x2="' + (w - p) + '" y1="' + (h - p) + '" y2="' + (h - p) + '" stroke="#E3E0DA"/><path d="' + d + ' L' + last[0] + ' ' + (h - p) + ' L' + pts[0][0] + ' ' + (h - p) + ' Z" fill="#A4471E" fill-opacity=".08"/><path d="' + d + '" fill="none" stroke="#A4471E" stroke-width="2.5"/><circle cx="' + last[0] + '" cy="' + last[1] + '" r="4.5" fill="#A4471E"/><text x="' + (last[0] - 6) + '" y="' + (last[1] - 10) + '" text-anchor="end" font-family="IBM Plex Mono, monospace" font-size="11" fill="#15130F">' + vals[vals.length - 1] + ' lb</text></svg>';
  }
  function clientMe() {
    var D = S.data, c = D.client, st = sessionStats(D.sessions), ps = payStatus(D.payments, c);
    var wts = D.checkins.filter(function (x) { return x.weight != null; }).map(function (x) { return +x.weight; });
    return '<div class="row"><div><p class="label">Your plan</p><h2>' + esc(c.plan || 'Coaching') + '</h2></div>' + (ps ? '<span class="chip ' + (ps === 'Paid' ? 'ok' : 'warn') + '">' + (ps === 'Paid' ? 'Paid this month' : 'Payment due') + '</span>' : '') + '</div>' +
      '<div class="stats"><div class="stat"><b>' + (c.sessions_per_month != null ? Math.max(0, c.sessions_per_month - st.used) : '—') + '</b><span>Sessions left</span></div><div class="stat"><b>' + (c.sessions_per_month != null ? c.sessions_per_month : '—') + '</b><span>Per month</span></div><div class="stat"><b>' + (c.monthly_price != null ? money(c.monthly_price) : '—') + '</b><span>Per month</span></div></div>' +
      '<a class="btn block" href="' + COACH.bookingLink + '" target="_blank" rel="noopener">Book a session</a>' +
      '<div class="card"><p class="label">Progress</p><div class="row"><h3>Bodyweight</h3>' + (wts.length > 1 ? '<span class="chip">' + (wts[wts.length - 1] - wts[0] > 0 ? '+' : '') + (wts[wts.length - 1] - wts[0]).toFixed(1) + ' lb</span>' : '') + '</div>' + spark(wts) + '</div>' +
      (c.goal ? '<div class="card"><p class="label">Your goal</p><p>' + esc(c.goal) + '</p></div>' : '') +
      '<div class="card"><p class="label">Documents</p>' + (D.documents.length ? '<div class="list">' + D.documents.map(function (d) { return '<div class="li">' + (d.url ? '<a href="' + esc(d.url) + '" target="_blank" rel="noopener">' + esc(d.name) + '</a>' : '<span>' + esc(d.name) + '</span>') + '<span class="muted small">' + (d.signed_on ? esc(fmtShort(d.signed_on)) : '') + '</span></div>'; }).join('') + '</div>' : '<p class="muted small">Your signed forms will show here.</p>') + '</div>' +
      '<div class="card"><p class="label">Plan details</p><div class="list"><div class="li"><span>Term</span><b>' + esc(c.term || '—') + '</b></div><div class="li"><span>Schedule</span><b>' + esc(c.schedule || '—') + '</b></div><div class="li"><span>Payment</span><b>' + esc(c.payment_method || '—') + '</b></div></div><p class="muted small">Cancel or reschedule at least 24 hours ahead and the session rolls over. Questions? Call or text ' + COACH.phone + '.</p></div>' +
      '<button class="btn ghost block" data-act="signout">Sign out</button>';
  }

  /* ---------- coach data ---------- */
  async function loadCoach() {
    var D = S.data = {};
    var res = await Promise.all([
      q(sb.from('clients').select('*').order('full_name')),
      q(sb.from('sessions').select('*').gte('starts_at', new Date(MONTH + 'T00:00:00').toISOString()).order('starts_at')),
      q(sb.from('payments').select('*').eq('month', MONTH)),
      q(sb.from('checkins').select('client_id,day').order('day', { ascending: false }).limit(1000)),
      q(sb.from('messages').select('*').order('created_at').limit(2000)),
      q(sb.from('exercise_library').select('*').order('category').order('name')).catch(function () { return []; }),
      q(sb.from('workout_templates').select('*').order('name')).catch(function () { return []; }),
      q(sb.from('template_exercises').select('*').order('position')).catch(function () { return []; })
    ]);
    D.library = res[5]; D.templates = res[6]; D.tplEx = {};
    res[7].forEach(function (e) { (D.tplEx[e.template_id] = D.tplEx[e.template_id] || []).push(e); });
    D.clients = res[0]; D.sessions = res[1]; D.payments = res[2];
    D.lastCheckin = {}; res[3].forEach(function (c) { if (!D.lastCheckin[c.client_id]) D.lastCheckin[c.client_id] = c.day; });
    D.threads = {}; D.unread = {};
    res[4].forEach(function (m) { (D.threads[m.client_id] = D.threads[m.client_id] || []).push(m); if (m.sender === 'client' && !m.read_at) D.unread[m.client_id] = (D.unread[m.client_id] || 0) + 1; });
  }
  function cById(id) { return S.data.clients.find(function (c) { return c.id === id; }); }
  function clientMeta(c) {
    var D = S.data, ss = D.sessions.filter(function (s) { return s.client_id === c.id; }), st = sessionStats(ss);
    var ps = payStatus(D.payments.filter(function (p) { return p.client_id === c.id; }), c);
    var lc = D.lastCheckin[c.id], days = lc ? Math.round((parseYmd(TODAY) - parseYmd(lc)) / 864e5) : null;
    return { st: st, pay: ps, checkinDays: days };
  }
  async function loadDetail(id) {
    var res = await Promise.all([
      q(sb.from('coach_notes').select('*').eq('client_id', id).order('created_at', { ascending: false })),
      q(sb.from('messages').select('*').eq('client_id', id).order('created_at')),
      q(sb.from('programs').select('*').eq('client_id', id).eq('active', true).order('created_at', { ascending: false }).limit(1)),
      q(sb.from('nutrition_plans').select('*').eq('client_id', id).maybeSingle()),
      q(sb.from('documents').select('*').eq('client_id', id).order('signed_on', { ascending: false })),
      q(sb.from('checkins').select('*').eq('client_id', id).order('day', { ascending: false }).limit(14)),
      q(sb.from('workout_completions').select('*').eq('client_id', id).order('completed_at', { ascending: false }).limit(10)),
      q(sb.from('food_logs').select('*').eq('client_id', id).order('logged_at', { ascending: false }).limit(15)),
      q(sb.from('sessions').select('*').eq('client_id', id).order('starts_at', { ascending: false }).limit(40)),
      q(sb.from('payments').select('*').eq('client_id', id).order('month', { ascending: false }).limit(24))
    ]);
    var d = { client: cById(id), notes: res[0], messages: res[1], program: res[2][0] || null, nutrition: res[3], documents: res[4], checkins: res[5], completions: res[6], food: res[7], sessions: res[8], payments: res[9], workouts: [], exercises: {} };
    if (d.program) {
      d.workouts = await q(sb.from('workouts').select('*').eq('program_id', d.program.id).order('position'));
      if (d.workouts.length) {
        var ex = await q(sb.from('exercises').select('*').in('workout_id', d.workouts.map(function (w) { return w.id; })).order('position'));
        ex.forEach(function (e) { (d.exercises[e.workout_id] = d.exercises[e.workout_id] || []).push(e); });
      }
    }
    S.data.detail = d;
  }

  /* ---------- coach screens ---------- */
  function coachToday() {
    var D = S.data, now = Date.now(), week = now + 7 * 864e5;
    var up = D.sessions.filter(function (s) { var t = new Date(s.starts_at).getTime(); return s.status === 'Scheduled' && t > now && t < week; });
    var active = D.clients.filter(function (c) { return c.status === 'Active'; });
    var flags = active.map(function (c) { var m = clientMeta(c), why = [];
      if (c.parq_status === 'Needs clearance') why.push('PAR-Q clearance needed');
      if (m.pay === 'Due') why.push('Payment due'); else if (m.pay === null && c.monthly_price) why.push('No payment logged this month');
      if (m.checkinDays == null) why.push('No check-ins yet'); else if (m.checkinDays >= 4) why.push('No check-in for ' + m.checkinDays + ' days');
      return { c: c, why: why }; }).filter(function (x) { return x.why.length; });
    var unread = Object.keys(D.unread).reduce(function (a, k) { return a + D.unread[k]; }, 0);
    return '<div><p class="label">' + esc(fmtDay(NOW)) + '</p><h2>Coach dashboard</h2></div>' +
      '<div class="stats"><div class="stat"><b>' + active.length + '</b><span>Active clients</span></div><div class="stat"><b>' + up.length + '</b><span>Sessions next 7 days</span></div><div class="stat"><b>' + unread + '</b><span>Unread messages</span></div></div>' +
      (D.clients.length ? '' : '<div class="empty"><h3>Add your first client</h3><p class="small">Add them with the email they\'ll sign in with. When they go to primalroots.fit/app and sign in, their account connects automatically.</p><button class="btn" data-go="addclient">+ Add client</button></div>') +
      (flags.length ? '<div class="card"><p class="label">Needs attention</p>' + flags.map(function (x) { return '<button class="li tap" data-client="' + x.c.id + '"><span><b>' + esc(x.c.full_name) + '</b><br><span class="small muted">' + esc(x.why.join(' · ')) + '</span></span><span class="chip warn">Open</span></button>'; }).join('') + '</div>' : '') +
      '<div class="card"><div class="row"><p class="label">Upcoming sessions</p><button class="btn ghost mini" data-tab="schedule">Schedule</button></div>' + (up.length ? '<div class="list">' + up.map(function (s) { var c = cById(s.client_id) || { full_name: '?' }; return '<button class="li tap" data-client="' + s.client_id + '"><span><b>' + esc(c.full_name) + '</b><br><span class="small muted">' + esc(c.plan || '') + '</span></span><span class="small" style="text-align:right">' + esc(fmtDay(s.starts_at)) + '<br>' + esc(fmtTime(s.starts_at)) + '</span></button>'; }).join('') + '</div>' : '<p class="muted small">No sessions in the next 7 days.</p>') + '</div>' +
      '<button class="btn ghost block" data-act="signout">Sign out</button>';
  }
  function coachClients() {
    var D = S.data;
    return '<div class="row"><div><p class="label">Roster</p><h2>Clients</h2></div><button class="btn mini" data-go="addclient">+ Add</button></div>' +
      (D.clients.length ? '<div class="list">' + D.clients.map(function (c) {
        var m = clientMeta(c), chip = c.parq_status === 'Needs clearance' ? ['warn', 'Clearance'] : c.status !== 'Active' ? ['', c.status] : m.pay === 'Paid' ? ['ok', 'Paid'] : m.pay === 'Due' ? ['warn', 'Due'] : ['', 'No payment'];
        return '<button class="li tap" data-client="' + c.id + '"><span style="display:flex;gap:12px;align-items:center"><span class="avatar">' + esc((c.first_name || c.full_name || '?')[0]) + '</span><span><b>' + esc(c.full_name) + '</b><br><span class="small muted">' + esc(c.plan || 'No plan set') + (c.sessions_per_month != null ? ' · ' + Math.max(0, c.sessions_per_month - m.st.used) + ' sessions left' : '') + (c.profile_id ? '' : ' · not signed in yet') + '</span></span></span><span class="chip ' + chip[0] + '">' + esc(chip[1]) + '</span></button>';
      }).join('') + '</div>' : '<div class="empty">No clients yet.</div>');
  }
  var PLANS = ['The Full Root', 'The Root', 'Custom', 'Coaching only', 'Plans only'];
  var TERMS = ['Month to month', '3-month prepaid', '6-month prepaid'];
  var METHODS = ['Card', 'Cash', 'Zelle', 'ACH bank transfer'];
  function opt(list, cur) { return '<option value=""></option>' + list.map(function (o) { return '<option' + (o === cur ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join(''); }
  function clientForm(c) {
    c = c || {};
    return '<div class="form">' +
      '<div class="fld"><label for="cf_name">Full name *</label><input id="cf_name" value="' + esc(c.full_name || '') + '"></div>' +
      '<div class="fld"><label for="cf_email">Email they\'ll sign in with *</label><input id="cf_email" type="email" value="' + esc(c.email || '') + '"></div>' +
      '<div class="two"><div class="fld"><label for="cf_phone">Phone</label><input id="cf_phone" value="' + esc(c.phone || '') + '"></div><div class="fld"><label for="cf_status">Status</label><select id="cf_status">' + ['Active', 'Lead', 'Paused', 'Former'].map(function (o) { return '<option' + (o === (c.status || 'Active') ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="two"><div class="fld"><label for="cf_plan">Plan</label><select id="cf_plan">' + opt(PLANS, c.plan) + '</select></div><div class="fld"><label for="cf_spm">Sessions / month</label><input id="cf_spm" inputmode="numeric" value="' + esc(c.sessions_per_month != null ? c.sessions_per_month : '') + '"></div></div>' +
      '<div class="two"><label class="opt"><input type="checkbox" id="cf_wp"' + (c.workout_plan ? ' checked' : '') + '><span>Workout plan</span></label><label class="opt"><input type="checkbox" id="cf_np"' + (c.nutrition_plan ? ' checked' : '') + '><span>Nutrition plan</span></label></div>' +
      '<div class="two"><div class="fld"><label for="cf_price">Monthly price ($)</label><input id="cf_price" inputmode="decimal" value="' + esc(c.monthly_price != null ? c.monthly_price : '') + '"></div><div class="fld"><label for="cf_method">Payment method</label><select id="cf_method">' + opt(METHODS, c.payment_method) + '</select></div></div>' +
      '<div class="two"><div class="fld"><label for="cf_term">Term</label><select id="cf_term">' + opt(TERMS, c.term) + '</select></div><div class="fld"><label for="cf_bill">Billing day</label><input id="cf_bill" inputmode="numeric" value="' + esc(c.billing_day || '') + '"></div></div>' +
      '<div class="two"><div class="fld"><label for="cf_start">Start date</label><input id="cf_start" type="date" value="' + esc(c.start_date || '') + '"></div><div class="fld"><label for="cf_end">Term end</label><input id="cf_end" type="date" value="' + esc(c.term_end || '') + '"></div></div>' +
      '<div class="fld"><label for="cf_sched">Recurring schedule</label><input id="cf_sched" placeholder="e.g. Mon/Wed 6:00am" value="' + esc(c.schedule || '') + '"></div>' +
      '<div class="fld"><label for="cf_parq">PAR-Q status</label><select id="cf_parq">' + ['Cleared', 'Needs clearance', 'Clearance received'].map(function (o) { return '<option' + (o === (c.parq_status || 'Cleared') ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select></div>' +
      '<div class="fld"><label for="cf_goal">Main goal</label><textarea id="cf_goal" rows="2">' + esc(c.goal || '') + '</textarea></div>' +
      '<div class="fld"><label for="cf_avoid">Injuries / movements to avoid</label><textarea id="cf_avoid" rows="2">' + esc(c.avoid || '') + '</textarea></div>' +
      '<div class="fld"><label for="cf_ec">Emergency contact (name, phone)</label><input id="cf_ec" value="' + esc(c.emergency_contact || '') + '"></div>' +
      '<button class="btn block" data-act="saveclient" data-id="' + (c.id || '') + '">' + (c.id ? 'Save changes' : 'Add client') + '</button></div>';
  }
  function readClientForm() {
    var n = function (id) { var v = val(id); return v === '' ? null : +v; };
    var name = val('cf_name');
    return { full_name: name, first_name: first(name), email: val('cf_email').toLowerCase(), phone: val('cf_phone') || null, status: val('cf_status') || 'Active',
      plan: val('cf_plan') || null, sessions_per_month: n('cf_spm'), workout_plan: checked('cf_wp'), nutrition_plan: checked('cf_np'), monthly_price: n('cf_price'),
      payment_method: val('cf_method') || null, term: val('cf_term') || null, billing_day: n('cf_bill'), start_date: val('cf_start') || null, term_end: val('cf_end') || null,
      schedule: val('cf_sched') || null, parq_status: val('cf_parq') || 'Cleared', goal: val('cf_goal') || null, avoid: val('cf_avoid') || null, emergency_contact: val('cf_ec') || null };
  }
  function coachClient() {
    var d = S.data.detail; if (!d) return '<div class="loading">Loading…</div>';
    var c = d.client, m = clientMeta(c), tab = S.ctab || 'overview';
    var tabs = [['overview', 'Overview'], ['training', 'Training'], ['nutrition', 'Nutrition'], ['sessions', 'Sessions'], ['money', 'Payments'], ['notes', 'Notes'], ['chat', 'Messages'], ['docs', 'Paperwork'], ['edit', 'Edit']];
    var head = '<div class="row"><div><p class="label">' + esc(c.plan || 'No plan') + ' · ' + esc(c.status) + '</p><h2>' + esc(c.full_name) + '</h2><p class="muted small">' + esc(c.email) + (c.phone ? ' · ' + esc(c.phone) : '') + '</p></div><span class="avatar">' + esc((c.first_name || c.full_name)[0]) + '</span></div>' +
      (c.parq_status === 'Needs clearance' ? '<div class="flag"><b>PAR-Q:</b> needs physician clearance (Form 5) before training.</div>' : '') +
      (c.profile_id ? '' : '<div class="flag" style="border-color:var(--gold);background:#fbf6e6">Not signed in yet. Tell them to go to <b>primalroots.fit/app</b> and sign in with <b>' + esc(c.email) + '</b>.</div>') +
      '<div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px">' + tabs.map(function (t) { return '<button class="chip" style="cursor:pointer;' + (t[0] === tab ? 'background:var(--ink);color:#fff;border-color:var(--ink)' : '') + '" data-ct="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
    var body = '';
    if (tab === 'overview') {
      var ck = d.checkins[0];
      body = '<div class="stats"><div class="stat"><b>' + m.st.used + (c.sessions_per_month != null ? '/' + c.sessions_per_month : '') + '</b><span>Sessions used</span></div><div class="stat"><b>' + m.st.rolled + '</b><span>Rolled over</span></div><div class="stat"><b style="color:' + (m.pay === 'Paid' ? 'var(--ok)' : 'var(--rust)') + '">' + (m.pay || '—') + '</b><span>This month</span></div></div>' +
        (c.avoid ? '<div class="card"><p class="label">Watch for</p><p>' + esc(c.avoid) + '</p></div>' : '') +
        (c.goal ? '<div class="card"><p class="label">Goal</p><p>' + esc(c.goal) + '</p></div>' : '') +
        '<div class="card"><p class="label">Plan</p><div class="list"><div class="li"><span>Next session</span><b>' + (m.st.next ? esc(fmtDay(m.st.next.starts_at) + ' · ' + fmtTime(m.st.next.starts_at)) : 'Not booked') + '</b></div><div class="li"><span>Schedule</span><b>' + esc(c.schedule || '—') + '</b></div><div class="li"><span>Price</span><b>' + (c.monthly_price != null ? money(c.monthly_price) + '/mo' : '—') + (c.payment_method ? ' · ' + esc(c.payment_method) : '') + '</b></div><div class="li"><span>Term</span><b>' + esc(c.term || '—') + (c.term_end ? ' (ends ' + esc(fmtShort(c.term_end)) + ')' : '') + '</b></div><div class="li"><span>Emergency contact</span><b>' + esc(c.emergency_contact || '—') + '</b></div></div></div>' +
        '<div class="card"><p class="label">Latest check-in</p>' + (ck ? '<p><b>' + esc(fmtShort(ck.day)) + '</b> · ' + (ck.weight != null ? ck.weight + ' lb · ' : '') + 'Sleep ' + (ck.sleep || '—') + ' · Energy ' + (ck.energy || '—') + ' · Soreness ' + (ck.soreness || '—') + ' · Stress ' + (ck.stress || '—') + '</p>' + (ck.note ? '<p class="small">"' + esc(ck.note) + '"</p>' : '') : '<p class="muted small">No check-ins yet.</p>') + '</div>' +
        '<div class="card"><p class="label">Recent workouts</p>' + (d.completions.length ? d.completions.map(function (x) { var w = d.workouts.find(function (y) { return y.id === x.workout_id; }); return '<div class="li"><span>' + esc(w ? w.title : 'Workout') + (x.note ? '<br><span class="small muted">"' + esc(x.note) + '"</span>' : '') + '</span><span class="muted small">' + esc(fmtShort(ymd(new Date(x.completed_at)))) + '</span></div>'; }).join('') : '<p class="muted small">None yet.</p>') + '</div>' +
        '<div class="card"><p class="label">Recent food log</p>' + (d.food.length ? d.food.map(function (f) { return '<div class="li"><span><span class="tag">' + esc(f.meal || '') + '</span> ' + esc(f.description) + '</span><span class="muted small">' + esc(fmtShort(ymd(new Date(f.logged_at)))) + '</span></div>'; }).join('') : '<p class="muted small">Nothing logged yet.</p>') + '</div>';
    } else if (tab === 'training') body = programEditor(d);
    else if (tab === 'nutrition') body = nutritionEditor(d);
    else if (tab === 'sessions') {
      body = '<div class="ed"><p class="label">Add a session</p><div class="two" style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><input id="ss_at" type="datetime-local" aria-label="Date and time"><select id="ss_status" aria-label="Status">' + ['Scheduled', 'Attended', 'Late cancel', 'No-show', 'Cancelled 24h+', 'Coach cancelled'].map(function (o) { return '<option>' + o + '</option>'; }).join('') + '</select></div><button class="btn mini" data-act="addsession">Add session</button></div>' +
        '<div class="list">' + (d.sessions.length ? d.sessions.map(function (s) { return '<div class="li"><span><b>' + esc(fmtDay(s.starts_at)) + '</b> ' + esc(fmtTime(s.starts_at)) + '</span><select class="inline" data-sstatus="' + s.id + '" aria-label="Session status">' + ['Scheduled', 'Attended', 'Late cancel', 'No-show', 'Cancelled 24h+', 'Coach cancelled'].map(function (o) { return '<option' + (o === s.status ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select></div>'; }).join('') : '<p class="muted small" style="padding:12px 0">No sessions logged.</p>') + '</div>' +
        '<p class="muted small">Late cancels and no-shows count as used. "Cancelled 24h+" rolls over.</p>';
    } else if (tab === 'money') {
      body = '<div class="ed"><p class="label">Log a payment</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><label class="small">Month<input id="pm_month" type="month" value="' + MONTH.slice(0, 7) + '"></label><label class="small">Method<select id="pm_method">' + opt(METHODS, c.payment_method) + '</select></label><label class="small">Amount due ($)<input id="pm_due" inputmode="decimal" value="' + esc(c.monthly_price != null ? c.monthly_price : '') + '"></label><label class="small">Amount paid ($)<input id="pm_paid" inputmode="decimal"></label><label class="small">Date paid<input id="pm_date" type="date" value="' + TODAY + '"></label><label class="small">Note<input id="pm_note"></label></div><button class="btn mini" data-act="addpayment">Save payment</button></div>' +
        '<div class="list">' + (d.payments.length ? d.payments.map(function (p) { var ok = +p.amount_paid >= +p.amount_due; return '<div class="li"><span><b>' + esc(parseYmd(p.month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })) + '</b><br><span class="small muted">' + money(p.amount_paid) + ' of ' + money(p.amount_due) + (p.method ? ' · ' + esc(p.method) : '') + (p.paid_on ? ' · ' + esc(fmtShort(p.paid_on)) : '') + (p.notes ? ' · ' + esc(p.notes) : '') + '</span></span><span class="chip ' + (ok ? 'ok' : 'warn') + '">' + (ok ? 'Paid' : +p.amount_paid > 0 ? 'Partial' : 'Unpaid') + '</span></div>'; }).join('') : '<p class="muted small" style="padding:12px 0">No payments logged.</p>') + '</div>';
    } else if (tab === 'notes') {
      body = '<div class="ed"><div class="fld"><label for="nt_body">Add a private note</label><textarea id="nt_body" rows="2"></textarea></div><div class="row"><select id="nt_cat" class="inline" aria-label="Category">' + ['General', 'Progress', 'Injury / pain', 'Nutrition', 'Programming', 'Personal', 'Billing'].map(function (o) { return '<option>' + o + '</option>'; }).join('') + '</select><button class="btn mini" data-act="addnote">Save note</button></div></div>' +
        '<div class="list">' + (d.notes.length ? d.notes.map(function (n) { return '<div class="li" style="align-items:flex-start"><span><span class="chip">' + esc(n.category) + '</span><br>' + esc(n.body) + '</span><span class="muted small">' + esc(fmtShort(ymd(new Date(n.created_at)))) + '</span></div>'; }).join('') : '<p class="muted small" style="padding:12px 0">No notes yet. Clients never see these.</p>') + '</div>';
    } else if (tab === 'chat') {
      body = '<button class="btn block" data-act="openchat" data-id="' + c.id + '">Open conversation</button>';
    } else if (tab === 'docs') {
      body = '<p class="muted small">Paste the Google Drive link to each signed form (from Primal Roots / Clients / ' + esc(c.full_name) + '). Clients can see these.</p>' +
        '<div class="ed"><div class="fld"><label for="dc_name">Document</label><select id="dc_name">' + ['Intake forms (Forms 1–4)', 'Client agreement (Form 7)', 'Physician clearance (Form 5)', 'Other'].map(function (o) { return '<option>' + o + '</option>'; }).join('') + '</select></div><div class="fld"><label for="dc_url">Link</label><input id="dc_url" placeholder="https://drive.google.com/…"></div><div class="fld"><label for="dc_date">Signed on</label><input id="dc_date" type="date" value="' + TODAY + '"></div><button class="btn mini" data-act="adddoc">Add document</button></div>' +
        '<div class="list">' + (d.documents.length ? d.documents.map(function (x) { return '<div class="li">' + (x.url ? '<a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.name) + '</a>' : esc(x.name)) + '<span class="muted small">' + (x.signed_on ? esc(fmtShort(x.signed_on)) : '') + '</span></div>'; }).join('') : '<p class="muted small" style="padding:12px 0">No documents linked yet.</p>') + '</div>';
    } else if (tab === 'edit') body = clientForm(c);
    return head + body;
  }
  function programEditor(d) {
    if (!d.program) return '<div class="ed"><p class="label">Create a program</p><div class="fld"><label for="pg_name">Program name</label><input id="pg_name" value="Ground Up — Phase 1"></div><div class="fld"><label for="pg_weeks">Weeks</label><input id="pg_weeks" inputmode="numeric" value="4"></div><button class="btn mini" data-act="createprogram">Create program</button></div>';
    var p = d.program;
    return '<div class="ed"><div class="row"><p class="label">Program</p></div><div class="fld"><label for="pg_name">Name</label><input id="pg_name" value="' + esc(p.name) + '"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><label class="small">Current week<input id="pg_cur" inputmode="numeric" value="' + esc(p.current_week || 1) + '"></label><label class="small">Total weeks<input id="pg_weeks" inputmode="numeric" value="' + esc(p.weeks || 4) + '"></label></div><button class="btn mini ghost" data-act="saveprogram">Save program</button></div>' +
      d.workouts.map(function (w) {
        var ex = d.exercises[w.id] || [];
        return '<div class="ed" data-wid="' + w.id + '"><div style="display:grid;grid-template-columns:80px 1fr;gap:8px"><input aria-label="Day" data-w="day_label" value="' + esc(w.day_label || '') + '" placeholder="Mon"><input aria-label="Workout title" data-w="title" value="' + esc(w.title) + '" placeholder="Workout title"></div>' +
          '<div style="display:grid;grid-template-columns:1fr 70px;gap:8px"><input aria-label="Focus" data-w="focus" value="' + esc(w.focus || '') + '" placeholder="Focus, e.g. Lower body"><input aria-label="Minutes" data-w="minutes" inputmode="numeric" value="' + esc(w.minutes || '') + '" placeholder="Min"></div>' +
          '<label class="opt"><input type="checkbox" data-w="in_person"' + (w.in_person ? ' checked' : '') + '><span>In-person session</span></label>' +
          '<div class="exrow tag"><span>Exercise</span><span>Sets</span><span>Reps</span><span class="ld">Load</span><span></span></div>' +
          ex.map(function (e) { return exRow(e); }).join('') +
          '<div data-newex></div><div class="row" style="flex-wrap:wrap"><button class="btn mini" data-act="pick">+ From library</button><button class="btn ghost mini" data-act="addexrow">+ Blank</button><button class="btn mini gold" data-act="saveworkout" data-id="' + w.id + '">Save workout</button></div><div class="row"><button class="x" style="width:auto;padding:0 10px" data-act="savetpl" data-id="' + w.id + '">Save as template</button><button class="x" style="width:auto;padding:0 10px" data-act="delworkout" data-id="' + w.id + '">Delete workout</button></div></div>';
      }).join('') +
      '<button class="btn ghost block" data-act="addworkout">+ Add blank workout</button>' +
      ((S.data.templates || []).length ? '<div class="ed"><p class="label">Add a workout from a template</p><select id="tpl_pick">' + S.data.templates.map(function (t) { return '<option value="' + t.id + '">' + esc(t.name) + ' (' + ((S.data.tplEx[t.id] || []).length) + ' exercises)</option>'; }).join('') + '</select><button class="btn mini" data-act="applytpl">Add to this program</button></div>' : '<p class="muted small">Tip: save a workout as a template to reuse it for other clients in one tap.</p>');
  }
  function exRow(e) {
    e = e || {};
    return '<div class="exgroup" data-eid="' + (e.id || '') + '" data-lib="' + esc(e.library_id || '') + '" style="display:grid;gap:4px"><div class="exrow"><input aria-label="Exercise name" data-e="name" value="' + esc(e.name || '') + '" placeholder="Exercise"><input aria-label="Sets" data-e="sets" inputmode="numeric" value="' + esc(e.sets || 3) + '"><input aria-label="Reps" data-e="reps" value="' + esc(e.reps || '') + '" placeholder="10"><input class="ld" aria-label="Load" data-e="load" value="' + esc(e.load || '') + '" placeholder="16 kg"><button class="x" aria-label="Remove exercise" data-act="rmex">×</button></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px"><input style="border:1px solid #c9c4ba;padding:7px;font-size:13px;min-width:0" aria-label="Coaching cue" data-e="detail" value="' + esc(e.detail || '') + '" placeholder="Coaching cue"><input style="border:1px solid #c9c4ba;padding:7px;font-size:13px;min-width:0" aria-label="Demo video link" data-e="video_url" value="' + esc(e.video_url || '') + '" placeholder="Demo video link (optional)"></div></div>';
  }
  function nutritionEditor(d) {
    var n = d.nutrition || {};
    return '<div class="form"><div class="fld"><label for="nu_title">Plan title</label><input id="nu_title" value="' + esc(n.title || 'Ancestral basics') + '"></div>' +
      '<div class="fld"><label for="nu_sum">Summary</label><textarea id="nu_sum" rows="2">' + esc(n.summary || '') + '</textarea></div>' +
      '<div class="fld"><label for="nu_g">Guidelines (one per line)</label><textarea id="nu_g" rows="6">' + esc((n.guidelines || []).join('\n')) + '</textarea></div>' +
      '<div class="fld"><label for="nu_s">Sample day (one per line, "Meal: food")</label><textarea id="nu_s" rows="4" placeholder="Breakfast: 4 eggs, berries">' + esc((n.sample_day || []).map(function (m) { return m.meal + ': ' + m.food; }).join('\n')) + '</textarea></div>' +
      '<button class="btn block" data-act="savenutrition">Save nutrition plan</button></div>';
  }
  function coachSchedule() {
    var D = S.data, days = [];
    for (var i = 0; i < 7; i++) { var d = new Date(NOW); d.setDate(d.getDate() + i); days.push(d); }
    return '<div><p class="label">Next 7 days</p><h2>Schedule</h2></div>' +
      '<div class="ed"><p class="label">Add a session</p><select id="sc_client" aria-label="Client">' + D.clients.filter(function (c) { return c.status === 'Active'; }).map(function (c) { return '<option value="' + c.id + '">' + esc(c.full_name) + '</option>'; }).join('') + '</select><input id="sc_at" type="datetime-local" aria-label="Date and time"><button class="btn mini" data-act="schedadd">Add</button></div>' +
      days.map(function (d) {
        var ss = D.sessions.filter(function (s) { return new Date(s.starts_at).toDateString() === d.toDateString(); });
        return '<div class="card"><p class="label">' + esc(fmtDay(d)) + '</p>' + (ss.length ? ss.map(function (s) { var c = cById(s.client_id) || { full_name: '?' }; return '<button class="li tap" data-client="' + s.client_id + '"><b>' + esc(fmtTime(s.starts_at)) + '</b><span>' + esc(c.full_name) + ' <span class="chip">' + esc(s.status) + '</span></span></button>'; }).join('') : '<p class="muted small">Open</p>') + '</div>';
      }).join('') + '<p class="muted small">Sessions booked through Google Calendar still live there for now. Log them here to track sessions used.</p>';
  }
  function coachInbox() {
    var D = S.data;
    if (S.chatWith) return chatView(D.threads[S.chatWith] || [], true, S.chatWith);
    return '<div><p class="label">Messages</p><h2>Inbox</h2></div>' + (D.clients.length ? '<div class="list">' + D.clients.map(function (c) {
      var m = (D.threads[c.id] || []).slice(-1)[0];
      return '<button class="li tap" data-act="openchat" data-id="' + c.id + '"><span style="display:flex;gap:12px;align-items:center"><span class="avatar">' + esc((c.first_name || c.full_name)[0]) + '</span><span><b>' + esc(c.full_name) + '</b><br><span class="small muted">' + esc(m ? m.body.slice(0, 48) + (m.body.length > 48 ? '…' : '') : 'No messages yet') + '</span></span></span>' + (D.unread[c.id] ? '<span class="chip solid">' + D.unread[c.id] + ' new</span>' : '') + '</button>';
    }).join('') + '</div>' : '<div class="empty">Add a client to start messaging.</div>');
  }


  /* ---------- exercise library ---------- */
  var CATS = ['Feet & ankles', 'Legs', 'Chest', 'Back', 'Shoulders', 'Arms', 'Core', 'Plyos', 'Rotation', 'Static holds', 'Carries', 'Mobility', 'Conditioning'];
  function libMatches(e, f, qy) { return (!f || e.category === f) && (!qy || (e.name + ' ' + (e.equipment || '') + ' ' + (e.cues || '')).toLowerCase().indexOf(qy) > -1); }
  function coachLibrary() {
    var D = S.data, lib = D.library || [], f = S.libCat || '', qy = (S.libQ || '').toLowerCase();
    var list = lib.filter(function (e) { return libMatches(e, f, qy); });
    var withVid = lib.filter(function (e) { return e.video_url; }).length;
    return '<div class="row"><div><p class="label">' + lib.length + ' exercises · ' + withVid + ' with video</p><h2>Library</h2></div><button class="btn mini" data-act="newlib">+ New</button></div>' +
      '<div class="seg" role="group" style="grid-template-columns:1fr 1fr"><button aria-pressed="' + (S.libView !== 'tpl' ? 'true' : 'false') + '" data-act="libview" data-v="ex">Exercises</button><button aria-pressed="' + (S.libView === 'tpl' ? 'true' : 'false') + '" data-act="libview" data-v="tpl">Templates (' + (D.templates || []).length + ')</button></div>' +
      (S.libView === 'tpl' ? templatesList() :
      '<input id="libq" class="libsearch" type="search" placeholder="Search exercises" value="' + esc(S.libQ || '') + '" aria-label="Search exercises">' +
      '<div class="cats"><button class="chip' + (!f ? ' on' : '') + '" data-act="libcat" data-v="">All</button>' + CATS.map(function (c) { var n = lib.filter(function (e) { return e.category === c; }).length; return n ? '<button class="chip' + (f === c ? ' on' : '') + '" data-act="libcat" data-v="' + esc(c) + '">' + esc(c) + ' ' + n + '</button>' : ''; }).join('') + '</div>' +
      '<div class="list">' + (list.length ? list.map(function (e) { return '<button class="li tap" data-act="editlib" data-id="' + e.id + '"><span><b>' + esc(e.name) + '</b><br><span class="small muted">' + esc(e.category) + (e.equipment ? ' · ' + esc(e.equipment) : '') + ' · ' + (e.default_sets || '') + ' × ' + esc(e.default_reps || '') + '</span></span>' + (e.video_url ? '<span class="chip ok">Video</span>' : '<span class="chip">No video</span>') + '</button>'; }).join('') : '<p class="muted small" style="padding:12px 0">' + (lib.length ? 'No exercises match.' : 'Your library is empty. Run the library setup code in Supabase, or add exercises with + New.') + '</p>') + '</div>' +
      '<button class="btn ghost block" data-act="libimport">Import from spreadsheet</button>');
  }
  function libForm() {
    var e = (S.data.library || []).find(function (x) { return x.id === S.libEditId; }) || {};
    return '<div><p class="label">' + (e.id ? 'Edit exercise' : 'New exercise') + '</p><h2>' + esc(e.name || 'New exercise') + '</h2></div><div class="form">' +
      '<div class="fld"><label for="lb_name">Name *</label><input id="lb_name" value="' + esc(e.name || '') + '"></div>' +
      '<div class="two"><div class="fld"><label for="lb_cat">Section *</label><select id="lb_cat">' + CATS.map(function (c) { return '<option' + (c === (e.category || S.libCat) ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select></div><div class="fld"><label for="lb_eq">Equipment</label><input id="lb_eq" value="' + esc(e.equipment || '') + '" placeholder="Kettlebell"></div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px"><div class="fld"><label for="lb_sets">Sets</label><input id="lb_sets" inputmode="numeric" value="' + esc(e.default_sets || 3) + '"></div><div class="fld"><label for="lb_reps">Reps</label><input id="lb_reps" value="' + esc(e.default_reps || '') + '" placeholder="10"></div><div class="fld"><label for="lb_load">Load</label><input id="lb_load" value="' + esc(e.default_load || '') + '" placeholder="16 kg"></div></div>' +
      '<div class="fld"><label for="lb_cues">Coaching cues</label><textarea id="lb_cues" rows="3">' + esc(e.cues || '') + '</textarea></div>' +
      '<div class="fld"><label for="lb_vid">Demo video link</label><input id="lb_vid" value="' + esc(e.video_url || '') + '" placeholder="Unlisted YouTube or Google Drive link"></div>' +
      '<button class="btn block" data-act="savelib" data-id="' + (e.id || '') + '">Save exercise</button>' +
      (e.id ? '<button class="x" style="width:auto;padding:0 10px;justify-self:start" data-act="dellib" data-id="' + e.id + '">Delete from library</button>' : '') + '</div>';
  }
  function importScreen() {
    return '<div><p class="label">Bulk add</p><h2>Import exercises</h2><p class="muted small">In Google Sheets or Excel, select your rows (with or without the header row), copy, and paste below. Columns in this order:</p></div>' +
      '<div class="card small"><b>Name · Section · Equipment · Sets · Reps · Load · Cues · Video link</b><span class="muted">Section must be one of: ' + esc(CATS.join(', ')) + '. Empty cells are fine.</span></div>' +
      '<div class="fld"><label for="imp">Paste rows</label><textarea id="imp" rows="10" placeholder="Goblet squat	Legs	Kettlebell	3	10	16 kg	Heels down, chest tall	https://youtu.be/..."></textarea></div>' +
      '<p class="err" id="imperr" hidden></p><button class="btn block" data-act="doimport">Import</button>';
  }
  function templatesList() {
    var D = S.data, t = D.templates || [];
    return '<button class="btn block" data-act="newtpl">+ New template</button>' +
      (t.length ? '<div class="list">' + t.map(function (x) { var ex = D.tplEx[x.id] || []; return '<button class="li tap" data-act="edittpl" data-id="' + x.id + '"><span><b>' + esc(x.name) + '</b><br><span class="small muted">' + ex.length + ' exercises' + (x.focus ? ' · ' + esc(x.focus) : '') + '</span></span><span class="chip' + (x.in_person ? ' solid' : '') + '">' + (x.in_person ? 'In person' : 'Own') + '</span></button>'; }).join('') + '</div>' : '<div class="empty">No templates yet. Build one here, or open any client workout and tap "Save as template".</div>');
  }
  function templateEditor() {
    var D = S.data, t = (D.templates || []).find(function (x) { return x.id === S.tplId; }) || {}, ex = t.id ? (D.tplEx[t.id] || []) : [];
    return '<div><p class="label">' + (t.id ? 'Edit template' : 'New template') + '</p><h2>' + esc(t.name || 'New template') + '</h2></div>' +
      '<div class="ed" id="tplcard"><div class="fld"><label for="tp_name">Template name *</label><input id="tp_name" value="' + esc(t.name || '') + '" placeholder="Feet + Hinge A"></div>' +
      '<div style="display:grid;grid-template-columns:1fr 70px;gap:8px"><input id="tp_focus" aria-label="Focus" value="' + esc(t.focus || '') + '" placeholder="Focus, e.g. Lower body"><input id="tp_min" aria-label="Minutes" inputmode="numeric" value="' + esc(t.minutes || '') + '" placeholder="Min"></div>' +
      '<label class="opt"><input type="checkbox" id="tp_ip"' + (t.in_person !== false ? ' checked' : '') + '><span>In-person session</span></label>' +
      '<div class="exrow tag"><span>Exercise</span><span>Sets</span><span>Reps</span><span class="ld">Load</span><span></span></div>' +
      ex.map(function (e) { return exRow(e); }).join('') + '<div data-newex></div>' +
      '<div class="row" style="flex-wrap:wrap"><button class="btn mini" data-act="pick">+ From library</button><button class="btn ghost mini" data-act="addexrow">+ Blank</button><button class="btn mini gold" data-act="savetplform" data-id="' + (t.id || '') + '">Save template</button></div>' +
      (t.id ? '<button class="x" style="width:auto;padding:0 10px;justify-self:start" data-act="deltpl" data-id="' + t.id + '">Delete template</button>' : '') + '</div>';
  }
  function libRowToEx(e) { return { name: e.name, sets: e.default_sets || 3, reps: e.default_reps || '', load: e.default_load || '', detail: e.cues || '', video_url: e.video_url || '', library_id: e.id }; }
  function openPicker(container) {
    var lib = S.data.library || [], sel = {}, cat = '', qy = '';
    var ov = document.createElement('div'); ov.className = 'picker'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Pick exercises');
    function render() {
      var list = lib.filter(function (e) { return libMatches(e, cat, qy); }), n = Object.keys(sel).length;
      ov.innerHTML = '<div class="pk"><div class="row"><h3>Add from library</h3><button class="x" data-pk="close" aria-label="Close">×</button></div>' +
        '<input type="search" data-pk="q" placeholder="Search" value="' + esc(qy) + '" aria-label="Search">' +
        '<div class="cats"><button class="chip' + (!cat ? ' on' : '') + '" data-pk="cat" data-v="">All</button>' + CATS.map(function (c) { return lib.some(function (e) { return e.category === c; }) ? '<button class="chip' + (cat === c ? ' on' : '') + '" data-pk="cat" data-v="' + esc(c) + '">' + esc(c) + '</button>' : ''; }).join('') + '</div>' +
        '<div class="pklist">' + (list.length ? list.map(function (e) { return '<label class="pkrow"><input type="checkbox" data-pk="sel" value="' + e.id + '"' + (sel[e.id] ? ' checked' : '') + '><span><b>' + esc(e.name) + '</b><br><span class="small muted">' + esc(e.category) + ' · ' + (e.default_sets || '') + ' × ' + esc(e.default_reps || '') + (e.default_load ? ' · ' + esc(e.default_load) : '') + (e.video_url ? ' · video' : '') + '</span></span></label>'; }).join('') : '<p class="muted small">No exercises match. Add them in the Library tab.</p>') + '</div>' +
        '<button class="btn block" data-pk="add"' + (n ? '' : ' disabled') + '>Add ' + (n || '') + ' exercise' + (n === 1 ? '' : 's') + '</button></div>';
    }
    ov.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pk]'); if (!b) { if (e.target === ov) ov.remove(); return; }
      var k = b.dataset.pk;
      if (k === 'close') ov.remove();
      else if (k === 'cat') { cat = b.dataset.v; render(); }
      else if (k === 'add') { Object.keys(sel).forEach(function (id) { var le = lib.find(function (x) { return x.id === id; }); if (le) container.insertAdjacentHTML('beforeend', exRow(libRowToEx(le))); }); ov.remove(); toastLite('Added. Adjust sets and reps, then tap Save.'); }
    });
    ov.addEventListener('change', function (e) { if (e.target.dataset.pk === 'sel') { if (e.target.checked) sel[e.target.value] = 1; else delete sel[e.target.value]; render(); } });
    ov.addEventListener('input', function (e) { if (e.target.dataset.pk === 'q') { qy = e.target.value.toLowerCase(); var pos = e.target.selectionStart; render(); var i = ov.querySelector('[data-pk="q"]'); i.focus(); i.setSelectionRange(pos, pos); } });
    render(); document.body.appendChild(ov);
  }
  /* A toast that doesn't re-render the screen, so unsaved edits in open forms are kept. */
  function toastLite(t) { var el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = t; document.body.appendChild(el); setTimeout(function () { el.remove(); }, 2200); }
  function readExRows(card) {
    var out = [], pos = 0;
    card.querySelectorAll('.exgroup').forEach(function (gp) {
      if (gp.dataset.remove === '1') return;
      var ef = {}; gp.querySelectorAll('[data-e]').forEach(function (i) { ef[i.dataset.e] = i.value.trim(); });
      if (!ef.name) return;
      out.push({ name: ef.name, sets: +ef.sets || 1, reps: ef.reps || null, load: ef.load || null, detail: ef.detail || null, video_url: ef.video_url || null, library_id: gp.dataset.lib || null, position: pos++ });
    });
    return out;
  }

  /* ---------- shell ---------- */
  var CLIENT_TABS = [['today', 'Today', 'today'], ['train', 'Train', 'train'], ['food', 'Food', 'food'], ['chat', 'Chat', 'chat'], ['me', 'Me', 'me']];
  var COACH_TABS = [['today', 'Today', 'today'], ['clients', 'Clients', 'clients'], ['library', 'Library', 'train'], ['schedule', 'Schedule', 'cal'], ['inbox', 'Inbox', 'chat']];
  function loginScreen() {
    return '<div class="login">' + MARK + '<div><p class="label">Primal Roots</p><h2>Sign in</h2><p class="muted">Enter your email and we\'ll send you a sign-in link. No password needed.</p></div>' +
      (S.linkSent ? '<div class="card"><p class="ok">Check your email.</p><p>We sent a sign-in link to <b>' + esc(S.linkSent) + '</b>. Open it on this device. It can take a minute, and check spam if you don\'t see it.</p><button class="btn ghost" data-act="resetlogin">Use a different email</button></div>'
        : '<form class="form" id="loginform"><div class="fld"><label for="em">Email</label><input id="em" type="email" autocomplete="email" required placeholder="you@example.com"></div><p class="err" id="lerr" hidden></p><button class="btn block" type="submit">Send sign-in link</button></form>') +
      '<p class="muted small">New here? Book a free intro session at <a href="/book.html">primalroots.fit</a>. Questions? Call or text ' + COACH.phone + '.</p></div>';
  }
  function title() {
    if (S.role !== 'coach') { if (S.sub === 'workout') return 'Workout'; if (S.sub === 'checkin') return 'Check-in'; if (S.sub === 'addfood') return 'Food log';
      return { today: 'Primal Roots', train: 'Train', food: 'Food', chat: COACH.name, me: 'My plan' }[S.tab]; }
    if (S.sub === 'client') return 'Client'; if (S.sub === 'addclient') return 'Add client'; if (S.sub === 'libedit') return 'Exercise'; if (S.sub === 'libimport') return 'Import'; if (S.sub === 'tpledit') return 'Template';
    if (S.tab === 'inbox' && S.chatWith) { var c = cById(S.chatWith); return c ? c.full_name : 'Chat'; }
    return { today: 'Primal Roots', clients: 'Clients', library: 'Library', schedule: 'Schedule', inbox: 'Inbox' }[S.tab];
  }
  function draw() {
    if (S.loading) { root.innerHTML = '<div class="loading">Loading…</div>'; return; }
    if (!S.session) { root.innerHTML = loginScreen() + toastHtml(); return; }
    var isCoach = S.role === 'coach', body;
    if (!isCoach && !S.data.client) body = noClientScreen();
    else if (!isCoach) body = S.sub === 'workout' ? workoutDetail(S.subId) : S.sub === 'checkin' ? checkinScreen() : S.sub === 'addfood' ? addFood() :
      ({ today: clientToday, train: clientTrain, food: clientFood, chat: function () { return chatView(S.data.messages, false, S.data.client.id); }, me: clientMe })[S.tab]();
    else body = S.sub === 'client' ? coachClient() : S.sub === 'addclient' ? '<div><p class="label">New client</p><h2>Add client</h2></div>' + clientForm(null) :
      S.sub === 'libedit' ? libForm() : S.sub === 'libimport' ? importScreen() : S.sub === 'tpledit' ? templateEditor() :
      ({ today: coachToday, clients: coachClients, library: coachLibrary, schedule: coachSchedule, inbox: coachInbox })[S.tab]();
    var back = !!S.sub || (isCoach && S.tab === 'inbox' && S.chatWith);
    var tabs = isCoach ? COACH_TABS : CLIENT_TABS, showTabs = isCoach || S.data.client;
    root.innerHTML = '<header class="top">' + (back ? '<button class="back" data-act="back">← Back</button>' : MARK) + '<h1>' + esc(title()) + '</h1></header>' +
      '<main class="screen">' + body + '</main>' +
      (showTabs ? '<nav class="tabs' + (tabs.length === 4 ? ' four' : '') + '" aria-label="Main">' + tabs.map(function (t) {
        var dot = isCoach ? (t[0] === 'inbox' && Object.keys(S.data.unread || {}).some(function (k) { return S.data.unread[k]; })) : (t[0] === 'chat' && S.data.unread > 0);
        return '<button class="tab" data-tab="' + t[0] + '"' + (S.tab === t[0] ? ' aria-current="page"' : '') + '>' + ICON[t[2]] + t[1] + (dot ? '<i class="dot"></i>' : '') + '</button>';
      }).join('') + '</nav>' : '') + toastHtml();
    if (root.querySelector('.chat')) window.scrollTo(0, document.body.scrollHeight);
  }
  function toastHtml() { return S.toast ? '<div class="toast" role="status">' + esc(S.toast) + '</div>' : ''; }

  /* ---------- actions ---------- */
  async function markRead(cid, sender) {
    try { await q(sb.from('messages').update({ read_at: new Date().toISOString() }).eq('client_id', cid).eq('sender', sender).is('read_at', null)); } catch (e) { console.warn(e); }
  }
  root.addEventListener('submit', async function (e) {
    e.preventDefault();
    var f = e.target;
    if (f.id === 'loginform') {
      var em = val('em'), err = document.getElementById('lerr'), btn = f.querySelector('button');
      btn.disabled = true; btn.textContent = 'Sending…';
      try { await sendLink(em); S.linkSent = em; draw(); }
      catch (x) { err.textContent = x.message || 'Could not send the link. Check the email and try again.'; err.hidden = false; btn.disabled = false; btn.textContent = 'Send sign-in link'; }
      return;
    }
    if (f.dataset.send != null) {
      var inp = document.getElementById('msgin'), body = inp.value.trim(); if (!body) return;
      var cid = f.dataset.send, isCoach = S.role === 'coach';
      inp.value = '';
      try {
        var row = await q(sb.from('messages').insert({ client_id: cid, sender: isCoach ? 'coach' : 'client', body: body }).select().single());
        var list = isCoach ? (S.data.threads[cid] = S.data.threads[cid] || []) : S.data.messages;
        if (!list.some(function (x) { return x.id === row.id; })) list.push(row);
        draw(); var ni = document.getElementById('msgin'); if (ni) ni.focus();
      } catch (x) { inp.value = body; fail(x); }
    }
  });
  root.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'libq') { S.libQ = t.value; var pos = t.selectionStart; draw(); var li = document.getElementById('libq'); if (li) { li.focus(); li.setSelectionRange(pos, pos); } return; }
    if (t.dataset.dl) { S.drafts = S.drafts || {}; (S.drafts[t.dataset.dl] = S.drafts[t.dataset.dl] || {})[t.dataset.f] = t.value; }
  });
  root.addEventListener('change', async function (e) {
    var t = e.target;
    if (t.dataset.sstatus) {
      try { await q(sb.from('sessions').update({ status: t.value }).eq('id', t.dataset.sstatus)); var s = S.data.sessions.find(function (x) { return x.id === t.dataset.sstatus; }); if (s) s.status = t.value; var s2 = S.data.detail && S.data.detail.sessions.find(function (x) { return x.id === t.dataset.sstatus; }); if (s2) s2.status = t.value; toast('Session updated.'); }
      catch (x) { fail(x); }
    }
  });
  root.addEventListener('click', async function (e) {
    var t = e.target.closest('button,a'); if (!t) return;
    var d = t.dataset, D = S.data;
    if (t.tagName === 'A') return;
    try {
      if (d.tab) { S.tab = d.tab; S.sub = null; S.chatWith = null; window.scrollTo(0, 0);
        if (S.role !== 'coach' && d.tab === 'chat' && D.unread) { D.unread = 0; markRead(D.client.id, 'coach'); }
        return draw(); }
      if (d.go) { S.sub = d.go; S.subId = d.id; if (d.go === 'checkin') { var tc = D.todayCheckin; S.ck = tc ? { weight: tc.weight, sleep: tc.sleep, energy: tc.energy, soreness: tc.soreness, stress: tc.stress, note: tc.note } : {}; } window.scrollTo(0, 0); return draw(); }
      if (d.client) { S.sub = 'client'; S.ctab = 'overview'; D.detail = null; draw(); await loadDetail(d.client); window.scrollTo(0, 0); return draw(); }
      if (d.ct) { S.ctab = d.ct; return draw(); }
      switch (d.act) {
        case 'back': if (S.sub) S.sub = null; else S.chatWith = null; window.scrollTo(0, 0); return draw();
        case 'signout': await sb.auth.signOut(); S.session = null; S.linkSent = null; return draw();
        case 'resetlogin': S.linkSent = null; return draw();
        /* client */
        case 'set': {
          var k = d.ex + '_' + d.n, cur = D.logs[k], dr = (S.drafts || {})[k] || {};
          var ex = Object.keys(D.exercises).reduce(function (a, w) { return a || D.exercises[w].find(function (x) { return x.id === d.ex; }); }, null) || {};
          var row = { exercise_id: d.ex, client_id: D.client.id, set_number: +d.n, logged_on: TODAY, done: !(cur && cur.done),
            load: dr.load != null ? dr.load : cur && cur.load != null ? cur.load : ex.load, reps: dr.reps != null ? dr.reps : cur && cur.reps != null ? cur.reps : ex.reps };
          D.logs[k] = row; draw();
          await q(sb.from('set_logs').upsert(row, { onConflict: 'exercise_id,set_number,logged_on' }));
          return;
        }
        case 'complete': {
          var note = val('wnote');
          var c = await q(sb.from('workout_completions').insert({ workout_id: d.id, client_id: D.client.id, note: note || null }).select().single());
          D.completions.push(c); S.sub = null; S.tab = 'train'; window.scrollTo(0, 0); return toast('Workout saved. ' + COACH.name + ' can see it.');
        }
        case 'ck': S.ck = S.ck || {}; S.ck[d.k] = +d.v; S.ck.weight = val('ckw') || S.ck.weight; S.ck.note = val('ckn') || S.ck.note; return draw();
        case 'saveck': {
          var w = parseFloat(val('ckw'));
          var row2 = { client_id: D.client.id, day: TODAY, weight: isNaN(w) ? null : w, sleep: S.ck.sleep || null, energy: S.ck.energy || null, soreness: S.ck.soreness || null, stress: S.ck.stress || null, note: val('ckn') || null };
          var saved = await q(sb.from('checkins').upsert(row2, { onConflict: 'client_id,day' }).select().single());
          D.checkins = D.checkins.filter(function (x) { return x.day !== TODAY; }).concat([saved]); D.todayCheckin = saved;
          S.sub = null; return toast('Check-in saved.');
        }
        case 'water': {
          D.water = Math.max(0, Math.min(16, D.water + (+d.d))); draw();
          await q(sb.from('water_logs').upsert({ client_id: D.client.id, day: TODAY, glasses: D.water }, { onConflict: 'client_id,day' }));
          return;
        }
        case 'savefood': {
          var what = val('fd'); if (!what) return toast('Add what you ate first.');
          var fr = await q(sb.from('food_logs').insert({ client_id: D.client.id, meal: val('fw'), description: what }).select().single());
          D.food.push(fr); S.sub = null; return toast('Meal logged.');
        }
        /* coach */
        case 'saveclient': {
          var data = readClientForm();
          if (!data.full_name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return toast('Name and a valid email are required.');
          if (d.id) {
            var up = await q(sb.from('clients').update(data).eq('id', d.id).select().single());
            D.clients = D.clients.map(function (c) { return c.id === up.id ? up : c; }); if (D.detail) D.detail.client = up; S.ctab = 'overview'; toast('Saved.');
          } else {
            var ins = await q(sb.from('clients').insert(data).select().single());
            D.clients.push(ins); D.clients.sort(function (a, b) { return a.full_name.localeCompare(b.full_name); });
            S.sub = 'client'; S.ctab = 'overview'; await loadDetail(ins.id); toast('Client added. Tell them to sign in at primalroots.fit/app.');
          }
          return draw();
        }
        case 'addnote': {
          var nb = val('nt_body'); if (!nb) return toast('Type a note first.');
          var n = await q(sb.from('coach_notes').insert({ client_id: D.detail.client.id, category: val('nt_cat'), body: nb }).select().single());
          D.detail.notes.unshift(n); toast('Note saved.'); return draw();
        }
        case 'openchat': {
          S.tab = 'inbox'; S.sub = null; S.chatWith = d.id; D.unread[d.id] = 0; markRead(d.id, 'client'); window.scrollTo(0, 0); return draw();
        }
        case 'addsession': case 'schedadd': {
          var at = val(d.act === 'addsession' ? 'ss_at' : 'sc_at'); if (!at) return toast('Pick a date and time.');
          var cid2 = d.act === 'addsession' ? D.detail.client.id : val('sc_client');
          var srow = await q(sb.from('sessions').insert({ client_id: cid2, starts_at: new Date(at).toISOString(), status: d.act === 'addsession' ? val('ss_status') : 'Scheduled' }).select().single());
          D.sessions.push(srow); if (D.detail && D.detail.client.id === cid2) D.detail.sessions.unshift(srow);
          toast('Session added.'); return draw();
        }
        case 'addpayment': {
          var mo = val('pm_month'); if (!mo) return toast('Pick a month.');
          var prow = await q(sb.from('payments').insert({ client_id: D.detail.client.id, month: mo + '-01', amount_due: +val('pm_due') || 0, amount_paid: +val('pm_paid') || 0, paid_on: val('pm_date') || null, method: val('pm_method') || null, notes: val('pm_note') || null }).select().single());
          D.detail.payments.unshift(prow); if (prow.month === MONTH) D.payments.push(prow); toast('Payment saved.'); return draw();
        }
        case 'adddoc': {
          var drow = await q(sb.from('documents').insert({ client_id: D.detail.client.id, name: val('dc_name'), url: val('dc_url') || null, signed_on: val('dc_date') || null }).select().single());
          D.detail.documents.unshift(drow); toast('Document added.'); return draw();
        }
        case 'savenutrition': {
          var lines = val('nu_g').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
          var sd = val('nu_s').split('\n').map(function (s) { return s.trim(); }).filter(Boolean).map(function (s) { var i = s.indexOf(':'); return i > 0 ? { meal: s.slice(0, i).trim(), food: s.slice(i + 1).trim() } : { meal: '', food: s }; });
          var nrow = await q(sb.from('nutrition_plans').upsert({ client_id: D.detail.client.id, title: val('nu_title'), summary: val('nu_sum') || null, guidelines: lines, sample_day: sd, updated_at: new Date().toISOString() }, { onConflict: 'client_id' }).select().single());
          D.detail.nutrition = nrow; return toast('Nutrition plan saved.');
        }
        case 'createprogram': {
          var pr = await q(sb.from('programs').insert({ client_id: D.detail.client.id, name: val('pg_name') || 'Program', weeks: +val('pg_weeks') || 4, current_week: 1, active: true }).select().single());
          D.detail.program = pr; D.detail.workouts = []; toast('Program created. Add workouts below.'); return draw();
        }
        case 'saveprogram': {
          var pu = await q(sb.from('programs').update({ name: val('pg_name'), current_week: +val('pg_cur') || 1, weeks: +val('pg_weeks') || 4 }).eq('id', D.detail.program.id).select().single());
          D.detail.program = pu; return toast('Program saved.');
        }
        case 'addworkout': {
          var wr = await q(sb.from('workouts').insert({ program_id: D.detail.program.id, client_id: D.detail.client.id, position: D.detail.workouts.length, title: 'New workout', in_person: false }).select().single());
          D.detail.workouts.push(wr); D.detail.exercises[wr.id] = []; return draw();
        }
        case 'addexrow': { var box = t.closest('.ed').querySelector('[data-newex]'); box.insertAdjacentHTML('beforeend', exRow(null)); return; }
        case 'rmex': { var g = t.closest('.exgroup'); if (g.dataset.eid) { g.hidden = true; g.dataset.remove = '1'; } else g.remove(); return; }
        case 'delworkout': {
          if (t.dataset.confirm !== '1') { t.dataset.confirm = '1'; t.textContent = 'Tap again to delete'; return; }
          await q(sb.from('workouts').delete().eq('id', d.id));
          D.detail.workouts = D.detail.workouts.filter(function (w) { return w.id !== d.id; }); toast('Workout deleted.'); return draw();
        }
        case 'libview': S.libView = d.v; return draw();
        case 'libcat': S.libCat = d.v; return draw();
        case 'newlib': S.sub = 'libedit'; S.libEditId = null; window.scrollTo(0, 0); return draw();
        case 'editlib': S.sub = 'libedit'; S.libEditId = d.id; window.scrollTo(0, 0); return draw();
        case 'libimport': S.sub = 'libimport'; window.scrollTo(0, 0); return draw();
        case 'savelib': {
          var lrow = { name: val('lb_name'), category: val('lb_cat'), equipment: val('lb_eq') || null, default_sets: +val('lb_sets') || 3, default_reps: val('lb_reps') || null, default_load: val('lb_load') || null, cues: val('lb_cues') || null, video_url: val('lb_vid') || null };
          if (!lrow.name) return toast('Give the exercise a name.');
          var lsaved = d.id ? await q(sb.from('exercise_library').update(lrow).eq('id', d.id).select().single()) : await q(sb.from('exercise_library').insert(lrow).select().single());
          D.library = (D.library || []).filter(function (x) { return x.id !== lsaved.id; }).concat([lsaved]).sort(function (a, b) { return a.category.localeCompare(b.category) || a.name.localeCompare(b.name); });
          S.sub = null; S.tab = 'library'; return toast('Exercise saved.');
        }
        case 'dellib': {
          if (t.dataset.confirm !== '1') { t.dataset.confirm = '1'; t.textContent = 'Tap again to delete'; return; }
          await q(sb.from('exercise_library').delete().eq('id', d.id)); D.library = D.library.filter(function (x) { return x.id !== d.id; }); S.sub = null; return toast('Deleted. Client workouts keep their copy.');
        }
        case 'doimport': {
          var raw = document.getElementById('imp').value, rows = [], bad = [];
          raw.split(/\r?\n/).forEach(function (line, i) {
            if (!line.trim()) return;
            var c = line.indexOf('\t') > -1 ? line.split('\t') : line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(function (x) { return x.replace(/^"|"$/g, ''); });
            c = c.map(function (x) { return (x || '').trim(); });
            if (/^name$/i.test(c[0])) return;
            var cat = CATS.find(function (k) { return k.toLowerCase() === (c[1] || '').toLowerCase(); });
            if (!c[0] || !cat) { bad.push(i + 1); return; }
            rows.push({ name: c[0], category: cat, equipment: c[2] || null, default_sets: +c[3] || 3, default_reps: c[4] || null, default_load: c[5] || null, cues: c[6] || null, video_url: c[7] || null });
          });
          var ie = document.getElementById('imperr');
          if (!rows.length) { ie.textContent = 'Nothing to import. Check that each row has a name and a valid section.'; ie.hidden = false; return; }
          var ins2 = await q(sb.from('exercise_library').insert(rows).select());
          D.library = (D.library || []).concat(ins2).sort(function (a, b) { return a.category.localeCompare(b.category) || a.name.localeCompare(b.name); });
          S.sub = null; S.tab = 'library'; return toast('Imported ' + ins2.length + ' exercises' + (bad.length ? '. Skipped rows ' + bad.join(', ') + ' (missing name or section).' : '.'));
        }
        case 'pick': { var cont = t.closest('.ed').querySelector('[data-newex]'); if (!(D.library || []).length) return toastLite('Your library is empty. Add exercises in the Library tab first.'); openPicker(cont); return; }
        case 'newtpl': S.sub = 'tpledit'; S.tplId = null; window.scrollTo(0, 0); return draw();
        case 'edittpl': S.sub = 'tpledit'; S.tplId = d.id; window.scrollTo(0, 0); return draw();
        case 'savetplform': {
          var tname = val('tp_name'); if (!tname) return toastLite('Name the template first.');
          var trow = { name: tname, focus: val('tp_focus') || null, minutes: +val('tp_min') || null, in_person: checked('tp_ip') };
          var texs0 = readExRows(document.getElementById('tplcard'));
          var tsaved = d.id ? await q(sb.from('workout_templates').update(trow).eq('id', d.id).select().single()) : await q(sb.from('workout_templates').insert(trow).select().single());
          var texs = texs0.map(function (r) { return Object.assign(r, { template_id: tsaved.id }); });
          await q(sb.from('template_exercises').delete().eq('template_id', tsaved.id));
          D.tplEx[tsaved.id] = texs.length ? await q(sb.from('template_exercises').insert(texs).select()) : [];
          D.templates = (D.templates || []).filter(function (x) { return x.id !== tsaved.id; }).concat([tsaved]).sort(function (a, b) { return a.name.localeCompare(b.name); });
          S.sub = null; S.tab = 'library'; S.libView = 'tpl'; return toast('Template saved.');
        }
        case 'deltpl': {
          if (t.dataset.confirm !== '1') { t.dataset.confirm = '1'; t.textContent = 'Tap again to delete'; return; }
          await q(sb.from('workout_templates').delete().eq('id', d.id)); D.templates = D.templates.filter(function (x) { return x.id !== d.id; }); S.sub = null; return toast('Template deleted.');
        }
        case 'savetpl': {
          var wk = D.detail.workouts.find(function (w) { return w.id === d.id; }), wex = D.detail.exercises[d.id] || [];
          if (!wex.length) return toastLite('Save the workout with exercises first.');
          var nt = await q(sb.from('workout_templates').insert({ name: wk.title, focus: wk.focus, minutes: wk.minutes, in_person: wk.in_person }).select().single());
          D.tplEx[nt.id] = await q(sb.from('template_exercises').insert(wex.map(function (e, i) { return { template_id: nt.id, library_id: e.library_id || null, position: i, name: e.name, sets: e.sets, reps: e.reps, load: e.load, detail: e.detail, video_url: e.video_url }; })).select());
          D.templates = (D.templates || []).concat([nt]).sort(function (a, b) { return a.name.localeCompare(b.name); });
          return toastLite('Saved "' + wk.title + '" as a template.');
        }
        case 'applytpl': {
          var tid = val('tpl_pick'), tp = D.templates.find(function (x) { return x.id === tid; }), tex = D.tplEx[tid] || [];
          var nw = await q(sb.from('workouts').insert({ program_id: D.detail.program.id, client_id: D.detail.client.id, position: D.detail.workouts.length, title: tp.name, focus: tp.focus, minutes: tp.minutes, in_person: tp.in_person }).select().single());
          D.detail.workouts.push(nw);
          D.detail.exercises[nw.id] = tex.length ? await q(sb.from('exercises').insert(tex.map(function (e, i) { return { workout_id: nw.id, client_id: D.detail.client.id, library_id: e.library_id, position: i, name: e.name, sets: e.sets, reps: e.reps, load: e.load, detail: e.detail, video_url: e.video_url }; })).select()) : [];
          toast('Added "' + tp.name + '". Adjust it for this client if needed.'); return draw();
        }
        case 'saveworkout': {
          var card = t.closest('.ed'), wf = {};
          card.querySelectorAll('[data-w]').forEach(function (i) { wf[i.dataset.w] = i.type === 'checkbox' ? i.checked : i.value.trim(); });
          wf.minutes = wf.minutes ? +wf.minutes : null; if (!wf.title) wf.title = 'Workout';
          var wu = await q(sb.from('workouts').update(wf).eq('id', d.id).select().single());
          var pos = 0, ops = [];
          card.querySelectorAll('.exgroup').forEach(function (gp) {
            var ef = {}; gp.querySelectorAll('[data-e]').forEach(function (i) { ef[i.dataset.e] = i.value.trim(); });
            if (gp.dataset.remove === '1') { ops.push(q(sb.from('exercises').delete().eq('id', gp.dataset.eid))); return; }
            if (!ef.name) return;
            var rowx = { name: ef.name, sets: +ef.sets || 1, reps: ef.reps || null, load: ef.load || null, detail: ef.detail || null, video_url: ef.video_url || null, library_id: gp.dataset.lib || null, position: pos++ };
            if (gp.dataset.eid) ops.push(q(sb.from('exercises').update(rowx).eq('id', gp.dataset.eid)));
            else ops.push(q(sb.from('exercises').insert(Object.assign(rowx, { workout_id: d.id, client_id: D.detail.client.id }))));
          });
          await Promise.all(ops);
          D.detail.workouts = D.detail.workouts.map(function (w) { return w.id === wu.id ? wu : w; });
          D.detail.exercises[d.id] = await q(sb.from('exercises').select('*').eq('workout_id', d.id).order('position'));
          toast('Workout saved.'); return draw();
        }
      }
    } catch (x) { fail(x); }
  });

  boot().catch(function (e) { S.loading = false; fail(e); draw(); });
})();
