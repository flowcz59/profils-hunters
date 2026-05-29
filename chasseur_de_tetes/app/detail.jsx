/* =============================================================================
   detail.jsx — fiche profil détaillée (drawer + master-détail)
   ========================================================================= */
function toast(msg) { if (window.__toast) window.__toast(msg); }

function Field({ icon, label, children }) {
  return (
    <div className="field">
      <div className="field-l">{icon && <Icon name={icon} size={13} />}<span>{label}</span></div>
      <div className="field-v">{children}</div>
    </div>
  );
}

function ProfileDetail({ p, store, onClose, onNav }) {
  if (!p) return null;
  const id = idOf(p);
  const st = store.state;
  const status = statusOf(st, p);
  const fav = !!st.fav[id];
  const note = st.notes[id] || '';

  const emailDraft = st.emails[id] || { sujet: p.email_sujet || '', corps: p.email_corps || '' };
  const hasEmailTpl = !!(p.email_corps || p.email_sujet || emailDraft.corps);

  const mailto = p.email
    ? `mailto:${p.email}?subject=${encodeURIComponent(emailDraft.sujet)}&body=${encodeURIComponent(emailDraft.corps)}`
    : '';

  const copyEmail = () => {
    navigator.clipboard.writeText(`Objet : ${emailDraft.sujet}\n\n${emailDraft.corps}`)
      .then(() => toast('Email copié dans le presse-papier'));
  };
  const markContacted = () => { store.setStatus(id, 'Contacté'); toast('Marqué comme contacté'); };

  return (
    <div className="detailpane">
      {/* En-tête */}
      <div className="dt-head" style={{ '--tc': techColor(p.tech) }}>
        {onNav && (
          <div className="dt-nav">
            <button className="iconbtn ghost" onClick={() => onNav(-1)} title="Précédent"><Icon name="chevRight" size={18} style={{ transform: 'rotate(180deg)' }} /></button>
            <button className="iconbtn ghost" onClick={() => onNav(1)} title="Suivant"><Icon name="chevRight" size={18} /></button>
          </div>
        )}
        {onClose && <button className="iconbtn ghost dt-close" onClick={onClose} title="Fermer"><Icon name="x" size={18} /></button>}
        <div className="dt-head-row">
          <Avatar p={p} size={56} ring />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="dt-name">{p.nom}</div>
            <div className="dt-sub">
              {p.entreprise && <span><Icon name="building" size={12} /> {p.entreprise}</span>}
              <span><Icon name="source" size={12} /> {srcShort(p.source)}</span>
            </div>
          </div>
          <StarBtn active={fav} onClick={() => store.toggleFav(id)} size={22} />
        </div>
        <div className="dt-head-meta">
          <TechBadge tech={p.tech} />
          <DispoBadge dispo={p.dispo} />
          <StatusSelect value={status} onChange={(v) => store.setStatus(id, v)} />
        </div>
      </div>

      <div className="dt-body">
        {/* Score */}
        <section className="dt-card score-card">
          <div className="score-top">
            <ScoreChip score={p.score} size="l" />
            <div>
              <div className="score-num">{p.score}<span>/{SCORE_MAX}</span></div>
              <div className="score-lab" style={{ color: scoreColor(p.score) }}>{scoreLabel(p.score)}</div>
            </div>
          </div>
          <div className="dt-section-l">Pourquoi ce score</div>
          <ScoreBreakdown p={p} />
        </section>

        {/* Coordonnées */}
        <section className="dt-card">
          <div className="dt-section-l">Coordonnées & profil</div>
          <div className="field-grid">
            <Field icon="pin" label="Localisation">{p.loc || '—'}</Field>
            <Field icon="briefcase" label="Entreprise">{p.entreprise || '—'}</Field>
            <Field icon="mail" label="Email">
              {p.email ? <a href={`mailto:${p.email}`}>{p.email}</a> : <span className="muted">Non public</span>}
            </Field>
            <Field icon="source" label="Source">{srcShort(p.source)}</Field>
            {p.date_dispo && <Field icon="clock" label="Disponible le">{p.date_dispo}</Field>}
          </div>
          {p.bio && <div className="biobox">{p.bio}</div>}
          <div className="dt-actions">
            {p.url && <a className="btn btn-primary" href={p.url} target="_blank" rel="noreferrer"><Icon name="link" size={15} /> Voir le profil</a>}
            <button className="btn btn-outline" onClick={markContacted}><Icon name="check" size={15} /> Marquer contacté</button>
          </div>
        </section>

        {/* Notes */}
        <section className="dt-card">
          <div className="dt-section-l">Notes privées</div>
          <textarea className="notearea" placeholder="Vos notes sur ce profil (entretien, ressenti, prochaine étape…)"
            value={note} onChange={(e) => store.setNote(id, e.target.value)} />
        </section>

        {/* Email */}
        {hasEmailTpl && (
          <section className="dt-card">
            <div className="dt-section-l-row">
              <span className="dt-section-l" style={{ margin: 0 }}>Email d'approche</span>
              <span className="editbadge"><Icon name="edit" size={12} /> éditable</span>
            </div>
            <label className="mini-l">Objet</label>
            <input className="emailsubj" value={emailDraft.sujet}
              onChange={(e) => store.setEmail(id, { ...emailDraft, sujet: e.target.value })} />
            <label className="mini-l">Corps</label>
            <textarea className="emailbody" value={emailDraft.corps}
              onChange={(e) => store.setEmail(id, { ...emailDraft, corps: e.target.value })} />
            <div className="dt-actions">
              <button className="btn btn-primary" onClick={copyEmail}><Icon name="copy" size={15} /> Copier</button>
              {mailto
                ? <a className="btn btn-outline" href={mailto}><Icon name="send" size={15} /> Ouvrir dans la messagerie</a>
                : <span className="muted" style={{ fontSize: 12, alignSelf: 'center' }}>Pas d'email pour l'envoi direct</span>}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ProfileDetail });
