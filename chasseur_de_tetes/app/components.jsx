/* =============================================================================
   components.jsx — UI partagée (icônes, badges, score, détail profil)
   ========================================================================= */

/* ---- Icônes (style Lucide, 24 / stroke 1.6) ---------------------------- */
const ICONS = {
  search: 'M11 11m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0 M21 21l-4.3-4.3',
  star: 'M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z',
  mail: 'M3 6h18v12H3z M3 7l9 6 9-6',
  copy: 'M9 9h11v11H9z M5 15H4V4h11v1',
  check: 'M5 12l4.5 4.5L19 7',
  x: 'M6 6l12 12 M18 6L6 18',
  link: 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5 M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5',
  chevDown: 'M6 9l6 6 6-6',
  chevRight: 'M9 6l6 6-6 6',
  dashboard: 'M4 4h7v7H4z M13 4h7v4h-7z M13 11h7v9h-7z M4 13h7v7H4z',
  list: 'M8 6h13 M8 12h13 M8 18h13 M3.5 6h.01 M3.5 12h.01 M3.5 18h.01',
  table: 'M3 5h18v14H3z M3 10h18 M3 15h18 M9 5v14 M15 5v14',
  kanban: 'M4 4h4v13H4z M10 4h4v9h-4z M16 4h4v16h-4z',
  grid: 'M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z',
  download: 'M12 3v12 M7 11l5 4 5-4 M4 20h16',
  filter: 'M3 5h18l-7 8v6l-4-2v-4z',
  pin: 'M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z M12 10m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0',
  building: 'M5 21V4h9v17 M14 9h5v12 M8 8h.01 M11 8h.01 M8 12h.01 M11 12h.01 M8 16h.01 M11 16h.01',
  edit: 'M4 20h4L19 9l-4-4L4 16z M14 6l4 4',
  user: 'M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0 M4 21c0-4 4-6 8-6s8 2 8 6',
  source: 'M12 3v18 M5 8l7-5 7 5 M5 16l7 5 7-5',
  crosshair: 'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0 M12 2v4 M12 18v4 M2 12h4 M18 12h4',
  sliders: 'M4 7h10 M18 7h2 M4 12h2 M10 12h10 M4 17h8 M16 17h4 M14 5v4 M6 10v4 M12 15v4',
  reset: 'M3 12a9 9 0 1 0 3-6.7L3 8 M3 4v4h4',
  send: 'M22 2L11 13 M22 2l-7 20-4-9-9-4z',
  sort: 'M8 5v14 M5 8l3-3 3 3 M16 19V5 M13 16l3 3 3-3',
  trash: 'M4 7h16 M9 7V5h6v2 M6 7l1 13h10l1-13',
  arrowRight: 'M5 12h14 M13 6l6 6-6 6',
  briefcase: 'M3 8h18v12H3z M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M3 13h18',
  clock: 'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0 M12 7v5l3 2',
  flame: 'M12 3c1 3-1.5 4-1.5 6.5A3 3 0 0 0 13 12c.5-1 .3-2 .3-2 1.5 1 2.7 2.5 2.7 4.5a4 4 0 1 1-8 0c0-2 1-3.5 2-5 .8 1 1.5 1 1.5 1',
};
function Icon({ name, size = 18, stroke = 1.6, fill = 'none', style, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={style} className={className} aria-hidden="true">
      {ICONS[name].split(' M').map((d, i) => <path key={i} d={(i ? 'M' : '') + d} />)}
    </svg>
  );
}

/* ---- Avatar ------------------------------------------------------------ */
function Avatar({ p, size = 38, ring }) {
  const c = techColor(p.tech);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.38, color: '#fff',
      background: c, letterSpacing: '-.02em',
      boxShadow: ring ? `0 0 0 3px ${techSoft(p.tech)}` : 'none',
    }}>{initials(p.nom)}</div>
  );
}

/* ---- Badge tech -------------------------------------------------------- */
function TechBadge({ tech, small }) {
  const c = techColor(tech);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: small ? '2px 8px' : '3px 10px', borderRadius: 4,
      fontWeight: 700, fontSize: small ? 11 : 12, color: c, background: techSoft(tech),
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />{tech}
    </span>
  );
}

/* ---- Badge dispo ------------------------------------------------------- */
function DispoBadge({ dispo, small }) {
  const ok = dispo === 'Disponible';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: small ? '2px 8px' : '3px 10px', borderRadius: 4, fontWeight: 600,
      fontSize: small ? 11 : 12,
      color: ok ? '#0b9962' : '#8c8e97', background: ok ? 'rgba(11,153,98,.12)' : '#f1f2f4',
    }}>
      {ok && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0b9962' }} />}
      {ok ? 'Disponible' : 'Dispo. inconnue'}
    </span>
  );
}

/* ---- Chip score -------------------------------------------------------- */
function ScoreChip({ score, size = 'm' }) {
  const c = scoreColor(score);
  const dims = size === 'l' ? { w: 46, h: 46, f: 19, s: 9 } : size === 's' ? { w: 26, h: 26, f: 12, s: 7 } : { w: 34, h: 34, f: 15, s: 8 };
  return (
    <div title={`Score ${score}/${SCORE_MAX} · ${scoreLabel(score)}`} style={{
      width: dims.w, height: dims.h, borderRadius: 9, flexShrink: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: c, color: '#fff', fontWeight: 800, fontSize: dims.f, lineHeight: 1,
    }}>{score}</div>
  );
}

/* ---- Pastille statut --------------------------------------------------- */
function StatusPill({ status, small }) {
  const m = statusMeta(status);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: small ? '2px 9px' : '4px 11px', borderRadius: 9999,
      fontWeight: 600, fontSize: small ? 11 : 12, color: m.c, background: m.soft,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot }} />{status}
    </span>
  );
}

/* ---- Bouton favori ----------------------------------------------------- */
function StarBtn({ active, onClick, size = 18 }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="iconbtn"
      title={active ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      style={{ color: active ? '#ffa51f' : '#c2c5cc' }}>
      <Icon name="star" size={size} fill={active ? '#ffc300' : 'none'} stroke={active ? 0 : 1.6} />
    </button>
  );
}

/* ---- Sélecteur de statut ---------------------------------------------- */
function StatusSelect({ value, onChange }) {
  const m = statusMeta(value);
  return (
    <div className="statwrap" style={{ borderColor: m.c }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.dot }} />
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ color: m.c }}>
        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <Icon name="chevDown" size={14} />
    </div>
  );
}

/* ---- barre de signaux du score ---------------------------------------- */
function ScoreBreakdown({ p }) {
  const sigs = scoreSignals(p);
  return (
    <div className="sigwrap">
      {sigs.map(s => (
        <div key={s.key} className={'sigrow' + (s.on ? ' on' : '')}>
          <span className="sigdot">
            <Icon name={s.on ? 'check' : 'x'} size={12} stroke={2.4} />
          </span>
          <span className="siglabel">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, {
  Icon, Avatar, TechBadge, DispoBadge, ScoreChip, StatusPill, StarBtn, StatusSelect, ScoreBreakdown,
});
