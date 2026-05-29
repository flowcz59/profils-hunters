/* =============================================================================
   dashboard.jsx — vue d'ensemble / statistiques
   ========================================================================= */
function KPI({ label, value, sub, accent, icon }) {
  return (
    <div className="kpi">
      <div className="kpi-top">
        <span className="kpi-icon" style={{ color: accent }}><Icon name={icon} size={18} /></span>
        <span className="kpi-label">{label}</span>
      </div>
      <div className="kpi-val" style={{ color: accent }}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function BarRow({ label, value, max, color, onClick, suffix }) {
  const pct = max ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className={'barrow' + (onClick ? ' clickable' : '')} onClick={onClick}>
      <div className="barrow-l" title={label}>{label}</div>
      <div className="barrow-track"><div className="barrow-fill" style={{ width: pct + '%', background: color }} /></div>
      <div className="barrow-v">{value}{suffix || ''}</div>
    </div>
  );
}

function Panel({ title, action, children, span }) {
  return (
    <div className="panel" style={span ? { gridColumn: `span ${span}` } : null}>
      <div className="panel-head">
        <h3>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Dashboard({ profiles, store, onOpen, onJump }) {
  const st = store.state;
  const total = profiles.length;
  const dispo = profiles.filter(p => p.dispo === 'Disponible').length;
  const withEmail = profiles.filter(p => p.email).length;
  const favs = profiles.filter(p => st.fav[idOf(p)]).length;
  const inPipe = profiles.filter(p => statusOf(st, p) !== 'À contacter').length;
  const hot = profiles.filter(p => p.score >= 5).length;

  // par techno
  const byTech = ['Java', 'COBOL'].map(t => ({ label: t, value: profiles.filter(p => p.tech === t).length, color: techColor(t) }));
  // pipeline
  const byStatus = STATUSES.map(s => ({ label: s, value: profiles.filter(p => statusOf(st, p) === s).length, color: statusMeta(s).c }));
  const maxStatus = Math.max(...byStatus.map(s => s.value), 1);
  // sources
  const srcMap = {};
  profiles.forEach(p => { const s = srcShort(p.source); srcMap[s] = (srcMap[s] || 0) + 1; });
  const sources = Object.entries(srcMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({ label, value }));
  const maxSrc = Math.max(...sources.map(s => s.value), 1);
  // villes
  const cityMap = {};
  profiles.forEach(p => { const c = fmtLoc(p.loc) || 'Non précisé'; cityMap[c] = (cityMap[c] || 0) + 1; });
  const cities = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({ label, value }));
  const maxCity = Math.max(...cities.map(s => s.value), 1);
  // scores histogram (buckets)
  const buckets = [{ k: '0', lo: 0, hi: 0 }, { k: '1–2', lo: 1, hi: 2 }, { k: '3–4', lo: 3, hi: 4 }, { k: '5–6', lo: 5, hi: 6 }, { k: '7+', lo: 7, hi: 99 }];
  const hist = buckets.map(b => ({ label: b.k, value: profiles.filter(p => p.score >= b.lo && p.score <= b.hi).length, color: scoreColor(b.lo) }));
  const maxHist = Math.max(...hist.map(h => h.value), 1);

  // shortlist prioritaire (score puis dispo puis email)
  const shortlist = [...profiles].sort((a, b) =>
    b.score - a.score || (b.dispo === 'Disponible') - (a.dispo === 'Disponible') || (!!b.email - !!a.email)
  ).slice(0, 6);

  return (
    <div className="dash">
      <div className="kpi-row">
        <KPI label="Profils sourcés" value={total} accent="#0e1114" icon="user" sub={`${byTech[0].value} Java · ${byTech[1].value} COBOL`} />
        <KPI label="Disponibles" value={dispo} accent="#0b9962" icon="check" sub={`${Math.round(dispo / total * 100)}% du vivier`} />
        <KPI label="Emails trouvés" value={withEmail} accent="#2c69f6" icon="mail" sub={`${Math.round(withEmail / total * 100)}% contactables`} />
        <KPI label="Priorité (score ≥ 5)" value={hot} accent="#fa794e" icon="flame" sub="à traiter en premier" />
        <KPI label="Dans le pipeline" value={inPipe} accent="#b748ab" icon="kanban" sub={`${favs} favoris`} />
      </div>

      <div className="dash-grid">
        <Panel title="Pipeline" span={2} action={<button className="linkbtn" onClick={() => onJump('pipeline')}>Ouvrir le kanban <Icon name="arrowRight" size={14} /></button>}>
          <div className="funnel">
            {byStatus.map(s => (
              <div key={s.label} className="funnel-col" onClick={() => onJump('pipeline')}>
                <div className="funnel-bar" style={{ height: 8 + (s.value / maxStatus) * 110, background: s.color }} />
                <div className="funnel-val">{s.value}</div>
                <div className="funnel-lab">{s.label}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Répartition par techno">
          {byTech.map(t => <BarRow key={t.label} {...t} max={total} />)}
          <div className="donut-wrap">
            {byTech.map((t, i) => {
              const pct = Math.round(t.value / total * 100);
              return <div key={t.label} className="donut-leg"><span style={{ background: t.color }} />{t.label} · {pct}%</div>;
            })}
          </div>
        </Panel>

        <Panel title="Distribution des scores">
          <div className="hist">
            {hist.map(h => (
              <div key={h.label} className="hist-col">
                <div className="hist-val">{h.value}</div>
                <div className="hist-bar" style={{ height: 10 + (h.value / maxHist) * 90, background: h.color }} />
                <div className="hist-lab">{h.label}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Top sources">
          {sources.map(s => <BarRow key={s.label} {...s} max={maxSrc} color="#2c69f6" onClick={() => onJump('table', { source: s.label })} />)}
        </Panel>

        <Panel title="Top localisations">
          {cities.map(c => <BarRow key={c.label} {...c} max={maxCity} color="#007a97" onClick={() => onJump('table', { q: c.label })} />)}
        </Panel>

        <Panel title="Profils prioritaires" span={3} action={<button className="linkbtn" onClick={() => onJump('table')}>Tout voir <Icon name="arrowRight" size={14} /></button>}>
          <div className="short-grid">
            {shortlist.map(p => (
              <div key={idOf(p)} className="short-card" onClick={() => onOpen(p)}>
                <Avatar p={p} size={40} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="short-name">{p.nom}</div>
                  <div className="short-sub">{fmtLoc(p.loc) || srcShort(p.source)}</div>
                  <div className="short-badges">
                    <TechBadge tech={p.tech} small />
                    {p.dispo === 'Disponible' && <DispoBadge dispo={p.dispo} small />}
                  </div>
                </div>
                <ScoreChip score={p.score} size="s" />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard });
