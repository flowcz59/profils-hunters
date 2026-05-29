/* =============================================================================
   views.jsx — Liste (master-détail), Tableau, Cartes
   ========================================================================= */

/* ---- Élément de liste réutilisable ------------------------------------ */
function ProfileRow({ p, active, onClick, store }) {
  const id = idOf(p);
  const fav = !!store.state.fav[id];
  const status = statusOf(store.state, p);
  return (
    <div className={'prow' + (active ? ' active' : '')} onClick={onClick} style={{ '--tc': techColor(p.tech) }}>
      <Avatar p={p} size={38} />
      <div className="prow-info">
        <div className="prow-name">{p.nom} {fav && <Icon name="star" size={12} fill="#ffc300" stroke={0} style={{ marginLeft: 2 }} />}</div>
        <div className="prow-sub">{fmtLoc(p.loc) || p.entreprise || srcShort(p.source)}</div>
        <div className="prow-badges">
          <TechBadge tech={p.tech} small />
          {p.dispo === 'Disponible' && <DispoBadge dispo={p.dispo} small />}
          {p.email && <span className="prow-mail"><Icon name="mail" size={11} /></span>}
          {status !== 'À contacter' && <StatusPill status={status} small />}
        </div>
      </div>
      <ScoreChip score={p.score} size="s" />
    </div>
  );
}

/* ---- Vue LISTE (master-détail) ---------------------------------------- */
function ListeView({ profiles, store }) {
  const [sel, setSel] = useState(0);
  useEffect(() => { setSel(0); }, [profiles]);
  const p = profiles[sel];
  const nav = (d) => setSel(i => Math.min(profiles.length - 1, Math.max(0, i + d)));

  useEffect(() => {
    const h = (e) => {
      if (e.target.matches('input,textarea,select')) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); nav(1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); nav(-1); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [profiles.length]);

  if (!profiles.length) return <Empty />;
  return (
    <div className="liste">
      <div className="liste-list">
        {profiles.map((pr, i) => (
          <ProfileRow key={idOf(pr)} p={pr} active={i === sel} onClick={() => setSel(i)} store={store} />
        ))}
      </div>
      <div className="liste-detail">
        {p ? <ProfileDetail p={p} store={store} onNav={nav} /> : <Empty />}
      </div>
    </div>
  );
}

/* ---- Vue CARTES -------------------------------------------------------- */
function CartesView({ profiles, store, onOpen }) {
  if (!profiles.length) return <Empty />;
  return (
    <div className="cartes">
      {profiles.map(p => {
        const id = idOf(p);
        const fav = !!store.state.fav[id];
        const status = statusOf(store.state, p);
        return (
          <div key={id} className="pcard" onClick={() => onOpen(p)} style={{ '--tc': techColor(p.tech) }}>
            <div className="pcard-top">
              <Avatar p={p} size={44} ring />
              <ScoreChip score={p.score} />
            </div>
            <div className="pcard-name">{p.nom}</div>
            <div className="pcard-sub">
              {p.entreprise && <span><Icon name="building" size={12} /> {p.entreprise}</span>}
              {p.loc && <span><Icon name="pin" size={12} /> {fmtLoc(p.loc)}</span>}
            </div>
            {p.bio && <div className="pcard-bio">{p.bio}</div>}
            <div className="pcard-foot">
              <div className="pcard-badges">
                <TechBadge tech={p.tech} small />
                {p.dispo === 'Disponible' && <DispoBadge dispo={p.dispo} small />}
              </div>
              <StarBtn active={fav} onClick={() => store.toggleFav(id)} />
            </div>
            <div className="pcard-status"><StatusPill status={status} small /></div>
          </div>
        );
      })}
    </div>
  );
}

/* ---- Vue TABLEAU ------------------------------------------------------- */
const TABLE_COLS = [
  { key: 'nom', label: 'Nom', get: p => p.nom },
  { key: 'tech', label: 'Tech', get: p => p.tech },
  { key: 'score', label: 'Score', get: p => p.score, num: true },
  { key: 'dispo', label: 'Dispo.', get: p => (p.dispo === 'Disponible' ? 1 : 0), num: true },
  { key: 'loc', label: 'Localisation', get: p => fmtLoc(p.loc) },
  { key: 'entreprise', label: 'Entreprise', get: p => p.entreprise || '' },
  { key: 'source', label: 'Source', get: p => srcShort(p.source) },
];

function TableView({ profiles, store, onOpen, selected, setSelected }) {
  const [sort, setSort] = useState({ key: 'score', dir: -1 });
  const sorted = useMemo(() => {
    const col = TABLE_COLS.find(c => c.key === sort.key) || TABLE_COLS[2];
    const arr = [...profiles].sort((a, b) => {
      let va = col.get(a), vb = col.get(b);
      if (col.num) return (va - vb) * sort.dir;
      return String(va).localeCompare(String(vb), 'fr') * sort.dir;
    });
    return arr;
  }, [profiles, sort]);

  const toggleSort = (k) => setSort(s => s.key === k ? { key: k, dir: -s.dir } : { key: k, dir: k === 'nom' || k === 'loc' ? 1 : -1 });
  const allIds = sorted.map(idOf);
  const allSel = allIds.length > 0 && allIds.every(id => selected.has(id));
  const toggleAll = () => setSelected(prev => {
    const n = new Set(prev);
    if (allSel) allIds.forEach(id => n.delete(id)); else allIds.forEach(id => n.add(id));
    return n;
  });
  const toggleOne = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  if (!profiles.length) return <Empty />;

  return (
    <div className="tablewrap">
      <table className="ptable">
        <thead>
          <tr>
            <th className="tc-check"><input type="checkbox" checked={allSel} onChange={toggleAll} /></th>
            <th className="tc-star"></th>
            {TABLE_COLS.map(c => (
              <th key={c.key} className={'sortable' + (c.num ? ' num' : '')} onClick={() => toggleSort(c.key)}>
                <span>{c.label}</span>
                {sort.key === c.key
                  ? <Icon name="chevDown" size={13} style={{ transform: sort.dir === 1 ? 'rotate(180deg)' : 'none', opacity: .9 }} />
                  : <Icon name="sort" size={13} style={{ opacity: .25 }} />}
              </th>
            ))}
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(p => {
            const id = idOf(p);
            const isSel = selected.has(id);
            const fav = !!store.state.fav[id];
            return (
              <tr key={id} className={isSel ? 'rowsel' : ''} onClick={() => onOpen(p)}>
                <td className="tc-check" onClick={e => e.stopPropagation()}><input type="checkbox" checked={isSel} onChange={() => toggleOne(id)} /></td>
                <td className="tc-star"><StarBtn active={fav} onClick={() => store.toggleFav(id)} size={16} /></td>
                <td className="tc-name">
                  <div className="tname">
                    <Avatar p={p} size={28} />
                    <span className="tname-t">{p.nom}</span>
                  </div>
                </td>
                <td><TechBadge tech={p.tech} small /></td>
                <td className="num"><span className="tscore" style={{ color: scoreColor(p.score) }}>{p.score}</span></td>
                <td className="num">{p.dispo === 'Disponible' ? <span className="tdispo">●</span> : <span className="tdispo-no">–</span>}</td>
                <td className="muted2">{fmtLoc(p.loc) || '—'}</td>
                <td className="muted2">{p.entreprise || '—'}</td>
                <td className="muted2">{srcShort(p.source)}</td>
                <td onClick={e => e.stopPropagation()}><StatusSelect value={statusOf(store.state, p)} onChange={v => store.setStatus(id, v)} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---- Empty state ------------------------------------------------------- */
function Empty({ msg }) {
  return (
    <div className="emptyv">
      <div className="emptyv-ic"><Icon name="search" size={30} /></div>
      <p>{msg || 'Aucun profil ne correspond à vos filtres'}</p>
    </div>
  );
}

Object.assign(window, { ListeView, CartesView, TableView, ProfileRow, Empty });
