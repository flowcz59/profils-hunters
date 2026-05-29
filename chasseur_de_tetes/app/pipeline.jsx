/* =============================================================================
   pipeline.jsx — vue kanban par statut (drag & drop)
   ========================================================================= */
function KanbanCard({ p, store, onOpen, onDragStart }) {
  const id = idOf(p);
  const fav = !!store.state.fav[id];
  return (
    <div className="kcard" draggable onDragStart={(e) => onDragStart(e, id)} onClick={() => onOpen(p)}
      style={{ '--tc': techColor(p.tech) }}>
      <div className="kcard-top">
        <Avatar p={p} size={32} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="kcard-name">{p.nom}</div>
          <div className="kcard-sub">{fmtLoc(p.loc) || srcShort(p.source)}</div>
        </div>
        <ScoreChip score={p.score} size="s" />
      </div>
      <div className="kcard-foot">
        <TechBadge tech={p.tech} small />
        {p.dispo === 'Disponible' && <DispoBadge dispo={p.dispo} small />}
        {p.email && <span className="prow-mail"><Icon name="mail" size={11} /></span>}
        <span style={{ flex: 1 }} />
        {fav && <Icon name="star" size={13} fill="#ffc300" stroke={0} />}
      </div>
    </div>
  );
}

function PipelineView({ profiles, store, onOpen }) {
  const [over, setOver] = useState(null);
  const dragId = useRef(null);

  const groups = useMemo(() => {
    const g = {}; STATUSES.forEach(s => g[s] = []);
    profiles.forEach(p => { g[statusOf(store.state, p)].push(p); });
    STATUSES.forEach(s => g[s].sort((a, b) => b.score - a.score));
    return g;
  }, [profiles, store.state]);

  const onDragStart = (e, id) => { dragId.current = id; e.dataTransfer.effectAllowed = 'move'; };
  const onDrop = (status) => { if (dragId.current) { store.setStatus(dragId.current, status); dragId.current = null; } setOver(null); };

  return (
    <div className="kanban">
      {STATUSES.map(s => {
        const m = statusMeta(s);
        const list = groups[s];
        return (
          <div key={s} className={'kcol' + (over === s ? ' over' : '')}
            onDragOver={(e) => { e.preventDefault(); setOver(s); }}
            onDragLeave={() => setOver(o => o === s ? null : o)}
            onDrop={() => onDrop(s)}>
            <div className="kcol-head" style={{ '--sc': m.c }}>
              <span className="kcol-dot" style={{ background: m.dot }} />
              <span className="kcol-title">{s}</span>
              <span className="kcol-count">{list.length}</span>
            </div>
            <div className="kcol-body">
              {list.map(p => <KanbanCard key={idOf(p)} p={p} store={store} onOpen={onOpen} onDragStart={onDragStart} />)}
              {!list.length && <div className="kcol-empty">Déposez un profil ici</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { PipelineView });
