/* =============================================================================
   app.jsx — shell : topbar, filtres, routing des vues, drawer, sélection
   ========================================================================= */
const ALL = window.PROFILES || [];

const VIEWS = [
  { key: 'dashboard', label: "Vue d'ensemble", icon: 'dashboard' },
  { key: 'liste', label: 'Liste', icon: 'list' },
  { key: 'table', label: 'Tableau', icon: 'table' },
  { key: 'pipeline', label: 'Pipeline', icon: 'kanban' },
  { key: 'cartes', label: 'Cartes', icon: 'grid' },
];

const SOURCES = Array.from(new Set(ALL.map(p => srcShort(p.source)))).sort();
const SCORE_OPTS = [{ v: 0, l: 'Tous scores' }, { v: 3, l: 'Score ≥ 3' }, { v: 5, l: 'Score ≥ 5' }, { v: 7, l: 'Score ≥ 7' }];

function Toast({ msg }) {
  return <div className={'toast' + (msg ? ' show' : '')}>{msg && <Icon name="check" size={15} stroke={2.4} />}{msg}</div>;
}

/* ---- Drawer (détail latéral) ------------------------------------------ */
function Drawer({ p, store, onClose, onNav }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className={'drawer-scrim' + (p ? ' open' : '')} onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()}>
        {p && <ProfileDetail p={p} store={store} onClose={onClose} onNav={onNav} />}
      </div>
    </div>
  );
}

function App() {
  const store = useStore();
  const [view, setView] = useState('dashboard');
  const [q, setQ] = useState('');
  const [tech, setTech] = useState('');
  const [dispo, setDispo] = useState('');
  const [source, setSource] = useState('');
  const [status, setStatus] = useState('');
  const [scoreMin, setScoreMin] = useState(0);
  const [favOnly, setFavOnly] = useState(false);
  const [drawerId, setDrawerId] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => { window.__toast = (m) => { setToastMsg(m); setTimeout(() => setToastMsg(''), 2200); }; }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return ALL.filter(p => {
      if (tech && p.tech !== tech) return false;
      if (dispo && p.dispo !== dispo) return false;
      if (source && srcShort(p.source) !== source) return false;
      if (status && statusOf(store.state, p) !== status) return false;
      if (favOnly && !store.state.fav[idOf(p)]) return false;
      if (scoreMin && p.score < scoreMin) return false;
      if (qq && !(`${p.nom} ${p.email} ${p.loc} ${p.entreprise} ${p.bio} ${p.source}`.toLowerCase().includes(qq))) return false;
      return true;
    });
  }, [q, tech, dispo, source, status, scoreMin, favOnly, store.state]);

  const sortedFiltered = useMemo(() => [...filtered].sort((a, b) => b.score - a.score), [filtered]);

  const drawerP = drawerId ? ALL.find(p => idOf(p) === drawerId) : null;
  const openDrawer = (p) => setDrawerId(idOf(p));
  const navDrawer = (d) => {
    const i = sortedFiltered.findIndex(p => idOf(p) === drawerId);
    const ni = Math.min(sortedFiltered.length - 1, Math.max(0, i + d));
    if (sortedFiltered[ni]) setDrawerId(idOf(sortedFiltered[ni]));
  };

  const jump = (v, patch) => {
    if (patch) {
      if (patch.source !== undefined) setSource(patch.source);
      if (patch.q !== undefined) setQ(patch.q);
    }
    setView(v);
  };

  const hasFilters = tech || dispo || source || status || scoreMin || favOnly || q;
  const clearFilters = () => { setTech(''); setDispo(''); setSource(''); setStatus(''); setScoreMin(0); setFavOnly(false); setQ(''); };

  const dispoCount = ALL.filter(p => p.dispo === 'Disponible').length;

  // bulk
  const selProfiles = ALL.filter(p => selected.has(idOf(p)));
  const bulkStatus = (v) => { selProfiles.forEach(p => store.setStatus(idOf(p), v)); window.__toast(`${selProfiles.length} profils → ${v}`); };
  const bulkExport = () => { exportCSV(selProfiles.length ? selProfiles : sortedFiltered, store.state); window.__toast('Export CSV téléchargé'); };
  const clearSel = () => setSelected(new Set());

  return (
    <div className="app">
      {/* ---------- TOPBAR ---------- */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Icon name="crosshair" size={22} stroke={1.8} /></div>
          <div className="brand-txt">
            <div className="brand-title">Chasseur de têtes</div>
            <div className="brand-sub">COBOL &amp; Java · Hauts-de-France</div>
          </div>
        </div>

        <div className="searchbox">
          <Icon name="search" size={17} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher un nom, une ville, une entreprise, une compétence…" />
          {q && <button className="iconbtn ghost" onClick={() => setQ('')}><Icon name="x" size={15} /></button>}
        </div>

        <div className="topbar-stats">
          <span className="stat-chip"><b>{ALL.length}</b> profils</span>
          <span className="stat-chip ok"><b>{dispoCount}</b> dispos</span>
        </div>
        <button className="btn btn-outline btn-sm" onClick={bulkExport}><Icon name="download" size={15} /> Export</button>
      </header>

      {/* ---------- NAV + FILTRES ---------- */}
      <div className="subbar">
        <nav className="vtabs">
          {VIEWS.map(v => (
            <button key={v.key} className={'vtab' + (view === v.key ? ' active' : '')} onClick={() => setView(v.key)}>
              <Icon name={v.icon} size={16} /> <span>{v.label}</span>
            </button>
          ))}
        </nav>

        {view !== 'dashboard' && (
          <div className="filters">
            <div className="fsel">
              <select value={tech} onChange={e => setTech(e.target.value)}>
                <option value="">Toutes techs</option><option>Java</option><option>COBOL</option>
              </select><Icon name="chevDown" size={13} />
            </div>
            <div className="fsel">
              <select value={dispo} onChange={e => setDispo(e.target.value)}>
                <option value="">Toute dispo.</option><option value="Disponible">Disponibles</option><option value="Inconnu">Dispo. inconnue</option>
              </select><Icon name="chevDown" size={13} />
            </div>
            <div className="fsel">
              <select value={source} onChange={e => setSource(e.target.value)}>
                <option value="">Toutes sources</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select><Icon name="chevDown" size={13} />
            </div>
            <div className="fsel">
              <select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">Tout statut</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select><Icon name="chevDown" size={13} />
            </div>
            <div className="fsel">
              <select value={scoreMin} onChange={e => setScoreMin(+e.target.value)}>
                {SCORE_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select><Icon name="chevDown" size={13} />
            </div>
            <button className={'chiptgl' + (favOnly ? ' on' : '')} onClick={() => setFavOnly(f => !f)}>
              <Icon name="star" size={14} fill={favOnly ? '#ffc300' : 'none'} stroke={favOnly ? 0 : 1.6} /> Favoris
            </button>
            {hasFilters && <button className="linkbtn sm" onClick={clearFilters}><Icon name="reset" size={13} /> Réinitialiser</button>}
            <span className="rescount">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* ---------- CONTENU ---------- */}
      <main className="content">
        {view === 'dashboard' && <Dashboard profiles={ALL} store={store} onOpen={openDrawer} onJump={jump} />}
        {view === 'liste' && <ListeView profiles={sortedFiltered} store={store} />}
        {view === 'table' && <TableView profiles={filtered} store={store} onOpen={openDrawer} selected={selected} setSelected={setSelected} />}
        {view === 'pipeline' && <PipelineView profiles={filtered} store={store} onOpen={openDrawer} />}
        {view === 'cartes' && <CartesView profiles={sortedFiltered} store={store} onOpen={openDrawer} />}
      </main>

      <footer className="appfoot">Designé avec <span className="foot-heart">❤️</span> par Loulou</footer>

      {/* ---------- BULK BAR ---------- */}
      {selected.size > 0 && (
        <div className="bulkbar">
          <span className="bulk-n">{selected.size} sélectionné{selected.size > 1 ? 's' : ''}</span>
          <div className="bulk-sep" />
          <span className="bulk-lab">Statut :</span>
          <div className="fsel dark">
            <select defaultValue="" onChange={e => { if (e.target.value) { bulkStatus(e.target.value); e.target.value = ''; } }}>
              <option value="" disabled>Définir…</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select><Icon name="chevDown" size={13} />
          </div>
          <button className="btn btn-light btn-sm" onClick={bulkExport}><Icon name="download" size={14} /> Exporter</button>
          <button className="iconbtn ghost light" onClick={clearSel}><Icon name="x" size={16} /></button>
        </div>
      )}

      <Drawer p={drawerP} store={store} onClose={() => setDrawerId(null)} onNav={navDrawer} />
      <Toast msg={toastMsg} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
