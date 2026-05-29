/* =============================================================================
   store.jsx — état persistant + helpers métier
   ========================================================================= */
const { useState, useEffect, useCallback, useMemo, useRef } = React;

/* ---- identité stable d'un profil (certains n'ont pas d'url) ------------- */
function idOf(p) {
  return p.url && p.url.trim() ? p.url : `n:${p.nom}|${p.source}|${p.entreprise || ''}`;
}

/* ---- helpers d'affichage ----------------------------------------------- */
function initials(n) {
  return (n || '').split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}
function srcShort(s) { return (s || '').replace(' (public)', ''); }
function fmtLoc(l) {
  if (!l) return '';
  return l.replace(/,?\s*(France|FR)$/i, '').trim();
}

/* ---- couleurs techno --------------------------------------------------- */
const TECH_COLOR = { Java: '#2c69f6', COBOL: '#fa794e' };
const TECH_SOFT  = { Java: 'rgba(44,105,246,.10)', COBOL: 'rgba(250,121,78,.12)' };
function techColor(t) { return TECH_COLOR[t] || '#636466'; }
function techSoft(t) { return TECH_SOFT[t] || 'rgba(99,100,102,.1)'; }

/* ---- score ------------------------------------------------------------- */
const SCORE_MAX = 15;
function scoreColor(s) {
  if (s >= 7) return '#0b9962';      // success
  if (s >= 5) return '#2c69f6';      // blue
  if (s >= 3) return '#ffa51f';      // amber
  if (s >= 1) return '#fa794e';      // orange
  return '#b5b5b5';                  // neutral
}
function scoreLabel(s) {
  if (s >= 7) return 'Priorité haute';
  if (s >= 5) return 'À étudier';
  if (s >= 3) return 'Potentiel';
  if (s >= 1) return 'Faible signal';
  return 'À qualifier';
}

/* signaux qui composent le score — reconstruits depuis les données dispo */
function scoreSignals(p) {
  const bio = (p.bio || '');
  const senior = /\b(lead|senior|sénior|principal|staff|architect|architecte|expert|head|cto|tech ?lead|confirmé|10\+|15 ans|20 ans)\b/i.test(bio);
  const stack = /\b(java|spring|quarkus|jakarta|jvm|kotlin|cobol|mainframe|jcl|cics|db2|z\/os|micronaut|hibernate|microservice)\b/i.test(bio);
  const precise = !!p.loc && !/^hauts-de-france$/i.test(p.loc.trim());
  const intent = /malt|talent\.io|cooptalis|freelance|codeur|indeed|apec|cv/i.test(p.source || '');
  return [
    { key: 'dispo',  label: 'Disponibilité confirmée', on: p.dispo === 'Disponible', w: 3 },
    { key: 'email',  label: 'Email public trouvé',      on: !!p.email,               w: 3 },
    { key: 'senior', label: 'Séniorité détectée',        on: senior,                  w: 2 },
    { key: 'stack',  label: 'Stack pertinent',           on: stack,                   w: 2 },
    { key: 'loc',    label: 'Localisation précise',      on: precise,                 w: 2 },
    { key: 'intent', label: 'Canal à forte intention',   on: intent,                  w: 3 },
  ];
}

/* ---- statuts pipeline -------------------------------------------------- */
const STATUSES = ['À contacter', 'Contacté', 'En attente', 'Retenu', 'Écarté'];
const STATUS_META = {
  'À contacter': { c: '#636466', soft: '#eef0f3', dot: '#8c8e97' },
  'Contacté':    { c: '#2c69f6', soft: 'rgba(44,105,246,.10)', dot: '#2c69f6' },
  'En attente':  { c: '#ffa51f', soft: 'rgba(255,165,31,.14)', dot: '#ffa51f' },
  'Retenu':      { c: '#0b9962', soft: 'rgba(11,153,98,.12)', dot: '#0b9962' },
  'Écarté':      { c: '#d0021b', soft: 'rgba(208,2,27,.08)', dot: '#d0021b' },
};
function statusMeta(s) { return STATUS_META[s] || STATUS_META['À contacter']; }

/* =============================================================================
   useStore — persistance localStorage (statut, notes, favoris, emails édités)
   ========================================================================= */
const LS_KEY = 'cdt_state_v2';
function loadState() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
  catch (e) { return {}; }
}
function useStore() {
  const [state, setState] = useState(() => {
    const s = loadState();
    return { status: s.status || {}, notes: s.notes || {}, fav: s.fav || {}, emails: s.emails || {} };
  });
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
  }, [state]);

  const setStatus = useCallback((id, v) => setState(s => ({ ...s, status: { ...s.status, [id]: v } })), []);
  const setNote   = useCallback((id, v) => setState(s => ({ ...s, notes: { ...s.notes, [id]: v } })), []);
  const toggleFav = useCallback((id) => setState(s => {
    const fav = { ...s.fav }; if (fav[id]) delete fav[id]; else fav[id] = true; return { ...s, fav };
  }), []);
  const setEmail  = useCallback((id, v) => setState(s => ({ ...s, emails: { ...s.emails, [id]: v } })), []);
  const resetAll  = useCallback(() => setState({ status: {}, notes: {}, fav: {}, emails: {} }), []);

  return { state, setStatus, setNote, toggleFav, setEmail, resetAll };
}

/* status par défaut d'un profil */
function statusOf(state, p) { return state.status[idOf(p)] || 'À contacter'; }

/* ---- export CSV -------------------------------------------------------- */
function csvCell(v) {
  v = (v == null ? '' : String(v)).replace(/"/g, '""');
  return `"${v}"`;
}
function exportCSV(profiles, state) {
  const head = ['Nom', 'Tech', 'Score', 'Disponibilité', 'Localisation', 'Entreprise', 'Source', 'Email', 'Statut', 'Favori', 'Notes', 'URL'];
  const rows = profiles.map(p => {
    const id = idOf(p);
    return [
      p.nom, p.tech, p.score, p.dispo, p.loc, p.entreprise, srcShort(p.source),
      p.email, statusOf(state, p), state.fav[id] ? 'Oui' : '', state.notes[id] || '', p.url,
    ].map(csvCell).join(',');
  });
  const csv = '\uFEFF' + [head.map(csvCell).join(','), ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chasseur-de-tetes-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

Object.assign(window, {
  idOf, initials, srcShort, fmtLoc, techColor, techSoft, TECH_COLOR,
  SCORE_MAX, scoreColor, scoreLabel, scoreSignals,
  STATUSES, STATUS_META, statusMeta, useStore, statusOf, exportCSV,
});
