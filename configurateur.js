/* EL SIGNATURE : configurateur « Construisez votre signature »
   Outil de qualification de demande. Aucun prix calculé, aucune réservation automatique.
   La demande est enregistrée dans la table `requests` existante, via le client Supabase de site.js. */
(function () {
  'use strict';
  var root = document.getElementById('cfg');
  if (!root) return;

  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }

  /* ---------------------------------------------------------------- données */
  var ADVICE = 'Je ne sais pas encore — conseillez-moi';
  var REGIONS = [
    { id: 'madagascar', label: 'Madagascar', items: ['Madagascar', 'Nosy Be', 'Sainte-Marie', 'Isalo', 'Andasibe', 'Tsingy', 'Autre destination à Madagascar'] },
    { id: 'ocean', label: 'Océan Indien', items: ['Maurice', 'Seychelles', 'Maldives', 'Zanzibar', 'Autre destination'] },
    { id: 'afrique', label: 'Afrique', items: ['Afrique du Sud', 'Kenya', 'Tanzanie', 'Maroc', 'Autre destination'] },
    { id: 'europe', label: 'Europe', items: ['France', 'Italie', 'Espagne', 'Grèce', 'Portugal', 'Suisse', 'Autre destination'] },
    { id: 'moyen-orient', label: 'Moyen-Orient', items: ['Dubaï', 'Abu Dhabi', 'Qatar', 'Oman', 'Autre destination'] },
    { id: 'asie', label: 'Asie', items: ['Japon', 'Thaïlande', 'Indonésie', 'Singapour', 'Autre destination'] },
    { id: 'autre', label: 'Autre', items: ['Une autre destination'] }
  ];
  var VOYAGE = ['Vols', 'Hébergement', 'Villa privée', 'Transferts', 'Chauffeur privé', 'Location de voiture', 'Itinéraire sur mesure'];
  var CONCIERGERIE = ['Réservations', 'Restaurants', 'Billetterie', 'Transport', 'Assistance pendant le séjour', 'Organisation personnalisée'];
  var PRIVE = ['Chef privé', 'Dîner privé', 'Événement privé', 'Anniversaire', 'Demande en mariage', 'Surprise personnalisée', 'Shooting photo', 'Organisation spéciale'];
  var EXPS = ['Excursion privée', 'Yacht / bateau', 'Safari', 'Plongée', 'Gastronomie', 'Spa & bien-être', 'Culture & patrimoine', 'Nature & découverte', 'Activité exclusive'];
  var STYLES = ['Évasion', 'Découverte', 'Repos', 'Aventure', 'Gastronomie', 'Romance', 'Famille', 'Affaires', 'Célébration', 'Expérience exclusive'];
  var LEVELS = [
    { id: 'ESSENTIAL', name: 'SIGNATURE ESSENTIAL', tag: 'Les essentiels, parfaitement organisés.', ex: 'Exemple : destination + hébergement + transferts + expérience.' },
    { id: 'BESPOKE', name: 'SIGNATURE BESPOKE', tag: 'Une expérience construite autour de vos envies.', ex: 'Exemple : transport + hébergement + expériences + restauration + conciergerie.' },
    { id: 'PRIVATE', name: 'EL SIGNATURE PRIVATE', tag: 'Une organisation entièrement personnalisée, avec une attention particulière portée à chaque détail.', ex: '' }
  ];
  var STEPS = ['Destination', 'Services', 'Expériences', 'Style', 'Niveau', 'Votre signature'];

  function destLabel(region, item) { return item === 'Autre destination' ? 'Autre destination (' + region.label + ')' : item; }
  function isOther(l) { return /^(Autre destination|Une autre destination)/.test(l); }
  var ALL_DEST = [ADVICE];
  REGIONS.forEach(function (r) { r.items.forEach(function (i) { ALL_DEST.push(destLabel(r, i)); }); });
  function levelName(id) { for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].id === id) return LEVELS[i].name; return ''; }

  /* ------------------------------------------------------------------ état */
  var KEY = 'el-signature-config-v1';
  var S = { step: 0, dest: [], autre: '', voyage: [], conciergerie: [], prive: [], exp: [], style: [], styleAdvice: false, niveau: '' };
  var openRegions = {};

  function keep(arr, allowed) { return (Array.isArray(arr) ? arr : []).filter(function (x) { return allowed.indexOf(x) >= 0; }); }
  function load() {
    try {
      var raw = sessionStorage.getItem(KEY); if (!raw) return;
      var d = JSON.parse(raw);
      S.dest = keep(d.dest, ALL_DEST); S.voyage = keep(d.voyage, VOYAGE); S.conciergerie = keep(d.conciergerie, CONCIERGERIE);
      S.prive = keep(d.prive, PRIVE); S.exp = keep(d.exp, EXPS); S.style = keep(d.style, STYLES);
      S.styleAdvice = d.styleAdvice === true; S.autre = typeof d.autre === 'string' ? d.autre.slice(0, 120) : '';
      S.niveau = LEVELS.some(function (l) { return l.id === d.niveau; }) ? d.niveau : '';
      S.step = Math.min(Math.max(parseInt(d.step, 10) || 0, 0), STEPS.length - 1);
    } catch (e) { /* stockage indisponible : on continue sans */ }
  }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
  function has(a, v) { return a.indexOf(v) >= 0; }
  function toggle(a, v) { var i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); }

  /* ------------------------------------------------------- composants simples */
  var focusKey = null;
  function chip(key, label, on, fn) {
    var b = el('button', 'cfg-chip', label);
    b.type = 'button'; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.setAttribute('data-k', key);
    b.addEventListener('click', function () { focusKey = key; fn(); });
    return b;
  }
  function group(title, items, arr, prefix) {
    var g = el('div', 'cfg-group');
    if (title) g.appendChild(el('h3', null, title));
    var w = el('div', 'cfg-chips');
    items.forEach(function (it) { w.appendChild(chip(prefix + it, it, has(arr, it), function () { toggle(arr, it); refresh(); })); });
    g.appendChild(w); return g;
  }
  function heading(t, lead) {
    var wrap = el('div');
    var h = el('h2', 'cfg-h', t); h.id = 'cfg-heading'; h.tabIndex = -1; wrap.appendChild(h);
    if (lead) wrap.appendChild(el('p', 'lead', lead));
    return wrap;
  }

  /* ------------------------------------------------------------------ étapes */
  function stepDestination() {
    var box = el('div');
    box.appendChild(heading('Où souhaitez-vous aller ?', 'Quelques exemples parmi bien d\'autres : si votre destination n\'est pas listée, choisissez « Autre destination » et précisez-la. Plusieurs choix possibles.'));
    var adv = chip('dest-advice', ADVICE, has(S.dest, ADVICE), function () { S.dest = has(S.dest, ADVICE) ? [] : [ADVICE]; refresh(); });
    adv.classList.add('cfg-advice');
    box.appendChild(adv);
    var acc = el('div', 'cfg-acc');
    REGIONS.forEach(function (r) {
      var sel = S.dest.filter(function (d) { return r.items.some(function (i) { return destLabel(r, i) === d; }); });
      if (openRegions[r.id] === undefined) openRegions[r.id] = sel.length > 0 || r.id === 'madagascar';
      var open = openRegions[r.id];
      var sec = el('div', 'cfg-region');
      var hb = el('button', null); hb.type = 'button'; hb.setAttribute('aria-expanded', open ? 'true' : 'false'); hb.setAttribute('data-k', 'reg-' + r.id);
      hb.appendChild(el('span', null, r.label));
      var right = el('span', 'cfg-reg-r');
      if (sel.length) right.appendChild(el('span', 'cfg-badge', String(sel.length)));
      right.appendChild(el('span', 'cfg-chev', ''));
      hb.appendChild(right);
      hb.addEventListener('click', function () { openRegions[r.id] = !open; focusKey = 'reg-' + r.id; refresh(); });
      sec.appendChild(hb);
      if (open) {
        var w = el('div', 'cfg-chips cfg-reg-body');
        r.items.forEach(function (it) {
          var lab = destLabel(r, it);
          w.appendChild(chip('d-' + lab, it, has(S.dest, lab), function () {
            S.dest = S.dest.filter(function (x) { return x !== ADVICE; }); toggle(S.dest, lab); refresh();
          }));
        });
        sec.appendChild(w);
      }
      acc.appendChild(sec);
    });
    box.appendChild(acc);
    if (S.dest.some(isOther)) {
      var f = el('div', 'cfg-other');
      var l = el('label', null, 'Précisez votre destination'); l.setAttribute('for', 'cfg-autre');
      var inp = el('input'); inp.id = 'cfg-autre'; inp.type = 'text'; inp.maxLength = 120; inp.placeholder = 'Ex. : Sicile, Kyoto, Patagonie…'; inp.value = S.autre;
      inp.addEventListener('input', function () { S.autre = inp.value.slice(0, 120); save(); paintSummaries(); });
      f.appendChild(l); f.appendChild(inp); box.appendChild(f);
    }
    return box;
  }
  function stepServices() {
    var box = el('div');
    box.appendChild(heading('De quoi avez-vous besoin ?', 'Choisissez tout ce qui vous intéresse. Vous pouvez aussi n\'en choisir aucun : nous construirons avec vous.'));
    box.appendChild(group('VOYAGE', VOYAGE, S.voyage, 'v-'));
    box.appendChild(group('CONCIERGERIE', CONCIERGERIE, S.conciergerie, 'c-'));
    box.appendChild(group('PRIVÉ', PRIVE, S.prive, 'p-'));
    return box;
  }
  function stepExperiences() {
    var box = el('div');
    box.appendChild(heading('Quelles expériences vous font envie ?', 'Des moments choisis pour leur caractère et leur authenticité.'));
    box.appendChild(group('', EXPS, S.exp, 'e-'));
    return box;
  }
  function stepStyle() {
    var box = el('div');
    box.appendChild(heading('Quelle est votre intention ?', 'Plusieurs choix possibles.'));
    box.appendChild(group('', STYLES, S.style, 's-'));
    var g = el('div', 'cfg-group');
    g.appendChild(chip('s-advice', 'Je souhaite être conseillé', S.styleAdvice, function () { S.styleAdvice = !S.styleAdvice; refresh(); }));
    box.appendChild(g);
    return box;
  }
  function stepLevel() {
    var box = el('div');
    box.appendChild(heading('Quel niveau d\'accompagnement ?', 'Aucun prix automatique : nous préparons une proposition personnalisée.'));
    var wrap = el('div', 'cfg-levels'); wrap.setAttribute('role', 'radiogroup'); wrap.setAttribute('aria-label', 'Niveau de service');
    LEVELS.forEach(function (lv) {
      var on = S.niveau === lv.id;
      var b = el('button', 'cfg-level'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', on ? 'true' : 'false'); b.setAttribute('data-k', 'l-' + lv.id);
      b.appendChild(el('strong', null, lv.name)); b.appendChild(el('span', 'tg', lv.tag));
      if (lv.ex) b.appendChild(el('span', 'ex', lv.ex));
      b.addEventListener('click', function () { focusKey = 'l-' + lv.id; S.niveau = on ? '' : lv.id; refresh(); });
      wrap.appendChild(b);
    });
    box.appendChild(wrap);
    return box;
  }

  /* ------------------------------------------------------------------ résumé */
  function groups() {
    var g = [];
    var d = S.dest.slice(); if (S.autre.trim() && S.dest.some(isOther)) d.push('« ' + S.autre.trim() + ' »');
    if (d.length) g.push({ k: 'Destination', v: d, step: 0 });
    if (S.voyage.length) g.push({ k: 'Voyage', v: S.voyage, step: 1 });
    if (S.conciergerie.length) g.push({ k: 'Conciergerie', v: S.conciergerie, step: 1 });
    if (S.prive.length) g.push({ k: 'Privé', v: S.prive, step: 1 });
    if (S.exp.length) g.push({ k: 'Expériences', v: S.exp, step: 2 });
    var st = S.style.slice(); if (S.styleAdvice) st.push('Je souhaite être conseillé');
    if (st.length) g.push({ k: 'Style', v: st, step: 3 });
    if (S.niveau) g.push({ k: 'Niveau', v: [levelName(S.niveau)], step: 4 });
    return g;
  }
  function count() { return S.dest.length + S.voyage.length + S.conciergerie.length + S.prive.length + S.exp.length + S.style.length + (S.styleAdvice ? 1 : 0) + (S.niveau ? 1 : 0); }
  function renderSummary(target, withEdit) {
    target.textContent = '';
    target.appendChild(el('h3', 'cfg-sum-t', 'VOTRE SIGNATURE'));
    var g = groups();
    if (!g.length) { target.appendChild(el('p', 'cfg-empty', 'Votre sélection apparaîtra ici, au fil de vos choix.')); return; }
    g.forEach(function (x) {
      var b = el('div', 'cfg-sum-g');
      var head = el('div', 'cfg-sum-h'); head.appendChild(el('span', null, x.k));
      if (withEdit) { var e = el('button', 'cfg-link', 'Modifier'); e.type = 'button'; e.addEventListener('click', function () { closeSheet(); go(x.step); }); head.appendChild(e); }
      b.appendChild(head); b.appendChild(el('p', null, x.v.join(' · '))); target.appendChild(b);
    });
  }
  function paintSummaries() {
    var side = $('cfg-side'); if (side) renderSummary(side, false);
    var sh = $('cfg-sheet-body'); if (sh) renderSummary(sh, true);
    var c = $('cfg-count'); if (c) c.textContent = 'Ma sélection · ' + count();
  }

  /* ------------------------------------------------------------- navigation */
  var RENDER = [stepDestination, stepServices, stepExperiences, stepStyle, stepLevel, stepFinal];
  function stepFinal() {
    var box = el('div');
    box.appendChild(heading('Votre signature', 'Voici le projet que nous recevrons. Vous pourrez le préciser dans le message qui suit.'));
    var sum = el('div', 'cfg-final'); sum.id = 'cfg-final'; renderSummary(sum, true); box.appendChild(sum);
    var act = el('div', 'cfg-final-act'); act.id = 'cfg-final-act';
    var ask = el('button', 'btn', 'DEMANDER MON PROJET'); ask.type = 'button'; ask.addEventListener('click', openForm);
    var mod = el('button', 'btn line-dark', 'MODIFIER MA SÉLECTION'); mod.type = 'button'; mod.addEventListener('click', function () { go(0); });
    act.appendChild(ask); act.appendChild(mod); box.appendChild(act);
    return box;
  }
  function refresh() {
    var y = window.scrollY;
    var host = $('cfg-step'); host.textContent = ''; host.appendChild(RENDER[S.step]());
    window.scrollTo(0, y);
    if (focusKey) { var t = host.querySelector('[data-k="' + focusKey.replace(/"/g, '') + '"]'); if (t) t.focus({ preventScroll: true }); focusKey = null; }
    save(); paintSummaries(); paintChrome();
  }
  function paintChrome() {
    var n = S.step + 1;
    $('cfg-prog-t').textContent = 'ÉTAPE ' + n + ' SUR ' + STEPS.length + ' · ' + STEPS[S.step].toUpperCase();
    $('cfg-prog-i').style.width = (n / STEPS.length * 100) + '%';
    $('cfg-back').hidden = S.step === 0;
    var next = $('cfg-next');
    if (S.step === STEPS.length - 1) { next.textContent = 'Demander mon projet'; next.hidden = !!$('cfg-form-wrap') && !$('cfg-form-wrap').hidden; }
    else { next.hidden = false; next.textContent = 'Continuer'; }
  }
  function go(n) {
    S.step = Math.min(Math.max(n, 0), STEPS.length - 1);
    var f = $('cfg-form-wrap'); if (f) f.hidden = true;
    refresh();
    var h = $('cfg-heading'); var top = root.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: top, behavior: 'smooth' }); if (h) h.focus({ preventScroll: true });
  }
  function closeSheet() { var s = $('cfg-sheet'); if (s) s.hidden = true; }

  /* ---------------------------------------------------------------- formulaire */
  var tForm = 0;
  function openForm() {
    if (count() === 0 && !S.autre.trim()) {
      var a = $('cfg-final-act'); if (a && !$('cfg-warn')) { var w = el('p', 'cfg-warn', 'Choisissez au moins un élément, ou indiquez « Je ne sais pas encore — conseillez-moi », pour que nous comprenions votre projet.'); w.id = 'cfg-warn'; w.setAttribute('role', 'alert'); a.parentNode.insertBefore(w, a); }
      return;
    }
    var w0 = $('cfg-warn'); if (w0) w0.parentNode.removeChild(w0);
    var f = $('cfg-form-wrap'); f.hidden = false; tForm = Date.now();
    paintChrome();
    f.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var first = $('cf-prenom'); if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 300);
  }
  function configuration() {
    return {
      version: 1, source: 'configurateur',
      destinations: S.dest.slice(), autre_destination: S.dest.some(isOther) ? S.autre.trim().slice(0, 120) : '',
      voyage: S.voyage.slice(), conciergerie: S.conciergerie.slice(), prive: S.prive.slice(), experiences: S.exp.slice(),
      style: S.style.slice(), style_conseil: S.styleAdvice, niveau: S.niveau ? levelName(S.niveau) : '',
      conseil_demande: !!($('cf-conseil') && $('cf-conseil').checked)
    };
  }
  function clean(v, max) { v = (v || '').trim(); return v ? v.slice(0, max) : null; }
  async function submit(e) {
    e.preventDefault();
    if ($('cf-hp').value || Date.now() - tForm < 1500) { done(); return; }          // robots : succès silencieux
    var btn = $('cf-btn'), er = $('cf-err'); er.hidden = true;
    var sb = window.EL_SB; if (!sb) { er.textContent = 'Le service d\'envoi est momentanément indisponible. Écrivez-nous à contact@elsignature.com.'; er.hidden = false; return; }
    btn.disabled = true; btn.textContent = 'Envoi en cours…';
    var ok = false;
    try {
      var r = await sb.from('requests').insert({
        full_name: ($('cf-prenom').value.trim() + ' ' + $('cf-nom').value.trim()).trim().slice(0, 200),
        email: $('cf-email').value.trim().slice(0, 320),
        offer: 'Construisez votre signature',
        message: clean($('cf-message').value, 5000),
        urgent: false,
        phone: clean($('cf-tel').value, 40),
        travel_dates: clean($('cf-dates').value, 200),
        travelers: clean($('cf-voy').value, 60),
        budget: clean($('cf-budget').value, 100),
        configuration: configuration()
      });
      ok = !r.error;
    } catch (x) { ok = false; }
    if (!ok) {
      er.textContent = 'Votre demande n\'a pas pu être envoyée. Votre sélection est conservée : réessayez dans un instant, ou écrivez-nous à contact@elsignature.com.';
      er.hidden = false; btn.disabled = false; btn.textContent = 'Envoyer mon projet'; return;
    }
    done();
  }
  function done() {
    try { sessionStorage.removeItem(KEY); } catch (e) { }
    root.hidden = true; closeSheet(); $('cfg-done').hidden = false;
    renderSummary($('cfg-done-sum'), false);
    window.scrollTo({ top: $('cfg-done').getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
  }

  /* ------------------------------------------------------------------ départ */
  load();
  var qs = new URLSearchParams(location.search), zone = qs.get('zone');
  if (zone) { REGIONS.forEach(function (r) { if (r.id === zone) { openRegions[r.id] = true; S.step = 0; } else if (openRegions[r.id] === undefined) openRegions[r.id] = false; }); }
  $('cfg-back').addEventListener('click', function () { go(S.step - 1); });
  $('cfg-next').addEventListener('click', function () { if (S.step === STEPS.length - 1) openForm(); else go(S.step + 1); });
  $('cfg-count').addEventListener('click', function () { var s = $('cfg-sheet'); s.hidden = false; paintSummaries(); $('cfg-sheet-close').focus(); });
  $('cfg-sheet-close').addEventListener('click', closeSheet);
  $('cfg-sheet').addEventListener('click', function (e) { if (e.target === this) closeSheet(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
  $('cfg-form').addEventListener('submit', submit);
  refresh();
})();
