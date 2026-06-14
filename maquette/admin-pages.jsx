// admin-pages.jsx — 11 pages back-office
const { useState, useEffect, useRef } = React;

/* ── Dashboard ──────────────────────────────────────────── */
const PageAdminDash = ({ nav }) => {
  const metrics = [
    { label:'Articles publiés (mois)',  value:'47',   delta:+18 },
    { label:'Vues (24 h)',              value:'28 k',  delta:+7 },
    { label:'Abonnés newsletter',       value:'4 231', delta:+12 },
    { label:'Articles en attente',      value:'3',    accent:'var(--wn)' },
  ];
  const recent = ARTICLES.slice(0,5);
  const pipeline = SOURCES.slice(0,6);
  return (
    <div>
      <AdminPageHeader title="Dashboard" sub="signal·ia — vue d'ensemble au 14 juin 2026"/>
      {/* Metrics */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'var(--s4)',marginBottom:'var(--s7)'}}>
        {metrics.map(m=><MetricCard key={m.label} {...m}/>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:'var(--s6)',alignItems:'start'}}>
        {/* Articles récents */}
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'var(--s5)'}}>
            <h2 style={{fontFamily:'var(--ff-h)',fontSize:16,fontWeight:600}}>Articles récents</h2>
            <button onClick={()=>nav('/admin/articles')} className="btn btn-g btn-sm" style={{fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)'}}>Voir tout →</button>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'2px solid var(--ln-h)'}}>
                {['Titre','Catégorie','Statut','Vues'].map(h=>(
                  <th key={h} style={{fontFamily:'var(--ff-m)',fontSize:10,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--ink-f)',padding:'var(--s2) var(--s3)',textAlign:'left',fontWeight:500}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map(a=>(
                <tr key={a.id} style={{borderBottom:'1px solid var(--ln)',cursor:'pointer',transition:'background var(--d)'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--bg-r)'}
                  onMouseLeave={e=>e.currentTarget.style.background=''}
                  onClick={()=>nav('/admin/editeur/'+a.id)}
                >
                  <td style={{padding:'var(--s3)',fontFamily:'var(--ff-h)',fontSize:13,maxWidth:280}}><div style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.title}</div></td>
                  <td style={{padding:'var(--s3)'}}><TagBadge cat={a.cat}/></td>
                  <td style={{padding:'var(--s3)'}}><StatusBadge status="published"/></td>
                  <td style={{padding:'var(--s3)',fontFamily:'var(--ff-m)',fontSize:12,color:'var(--ink-d)'}}>{a.views.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pipeline health */}
        <div>
          <div style={{fontFamily:'var(--ff-h)',fontSize:16,fontWeight:600,marginBottom:'var(--s5)'}}>Santé du pipeline RSS</div>
          <div style={{display:'flex',flexDirection:'column',gap:'var(--s2)'}}>
            {pipeline.map(s=>{
              const hc=s.health==='ok'?'var(--ok)':s.health==='warn'?'var(--wn)':'var(--er)';
              const cls=s.health==='ok'?'s-ok':s.health==='warn'?'s-wn':'s-err';
              return (
                <div key={s.id} style={{display:'flex',alignItems:'center',gap:'var(--s3)',padding:'var(--s3) var(--s4)',background:'var(--bg-r)',border:'1px solid var(--ln)'}}>
                  <span className={cls} style={{flexShrink:0}}/>
                  <span style={{fontFamily:'var(--ff-h)',fontSize:13,flex:1}}>{s.name}</span>
                  <span style={{fontFamily:'var(--ff-m)',fontSize:10,color:'var(--ink-f)'}}>{s.last}</span>
                  <span style={{fontFamily:'var(--ff-m)',fontSize:10,color:hc,textTransform:'uppercase',letterSpacing:'.06em'}}>{s.health}</span>
                </div>
              );
            })}
          </div>
          <button onClick={()=>nav('/admin/sources')} className="btn btn-sm btn-g" style={{marginTop:'var(--s4)',width:'100%',fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)'}}>Gérer les sources →</button>
        </div>
      </div>
    </div>
  );
};

/* ── Articles ────────────────────────────────────────────── */
const PageAdminArticles = ({ nav }) => {
  const [q,setQ]         = useState('');
  const [status,setStatus]= useState('');
  const [sel,setSel]      = useState([]);
  const filtered = ARTICLES.filter(a=>{
    if(q&&!a.title.toLowerCase().includes(q.toLowerCase()))return false;
    return true;
  });
  const toggleSel = id => setSel(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  const toggleAll = () => setSel(sel.length===filtered.length?[]:filtered.map(a=>a.id));
  return (
    <div>
      <AdminPageHeader title="Articles" sub={`${ARTICLES.length} articles au total`} action="+ Nouvel article" onAction={()=>nav('/admin/editeur')}/>
      {/* Filters */}
      <div style={{display:'flex',gap:'var(--s3)',marginBottom:'var(--s5)',flexWrap:'wrap',alignItems:'center'}}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher un article…" className="inp inp-sm" style={{width:260}}/>
        <select value={status} onChange={e=>setStatus(e.target.value)} className="inp inp-sm" style={{width:'auto'}}>
          <option value="">Tous statuts</option>
          <option value="published">Publiés</option>
          <option value="draft">Brouillons</option>
          <option value="scheduled">Planifiés</option>
        </select>
        {sel.length>0&&(
          <div style={{display:'flex',gap:'var(--s2)',marginLeft:'auto',alignItems:'center'}}>
            <span style={{fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)'}}>{sel.length} sélectionné{sel.length>1?'s':''}</span>
            <button className="btn btn-sm" style={{color:'var(--wn)',borderColor:'var(--wn)'}}>Archiver</button>
            <button className="btn btn-sm" style={{color:'var(--er)',borderColor:'var(--er)'}}>Supprimer</button>
          </div>
        )}
      </div>
      {/* Table */}
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:700}}>
          <thead>
            <tr style={{borderBottom:'2px solid var(--ln-h)'}}>
              <th style={{width:32,padding:'var(--s2) var(--s3)'}}>
                <input type="checkbox" checked={sel.length===filtered.length&&filtered.length>0} onChange={toggleAll} style={{width:14,height:14,cursor:'pointer',accentColor:'var(--ac)'}}/>
              </th>
              {['Titre','Catégorie','Statut','Date','Vues','Actions'].map(h=>(
                <th key={h} style={{fontFamily:'var(--ff-m)',fontSize:10,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--ink-f)',padding:'var(--s2) var(--s3)',textAlign:'left',fontWeight:500,whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(a=>(
              <tr key={a.id} style={{borderBottom:'1px solid var(--ln)',transition:'background var(--d)'}}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg-r)'}
                onMouseLeave={e=>e.currentTarget.style.background=''}
              >
                <td style={{padding:'var(--s3)'}}>
                  <input type="checkbox" checked={sel.includes(a.id)} onChange={()=>toggleSel(a.id)} style={{width:14,height:14,cursor:'pointer',accentColor:'var(--ac)'}}/>
                </td>
                <td style={{padding:'var(--s3) var(--s3)',maxWidth:300}}>
                  <div style={{fontFamily:'var(--ff-h)',fontSize:13,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',cursor:'pointer',color:'var(--ac)'}} onClick={()=>nav('/admin/editeur/'+a.id)}>{a.title}</div>
                  <div style={{fontFamily:'var(--ff-m)',fontSize:10,color:'var(--ink-f)',marginTop:2}}>{a.tags.slice(0,2).join(' · ')}</div>
                </td>
                <td style={{padding:'var(--s3)'}}><TagBadge cat={a.cat}/></td>
                <td style={{padding:'var(--s3)'}}><StatusBadge status={a.id===3?'draft':a.id===5?'scheduled':'published'}/></td>
                <td style={{padding:'var(--s3)',fontFamily:'var(--ff-m)',fontSize:12,color:'var(--ink-f)',whiteSpace:'nowrap'}}>{fmtDate(a.date)}</td>
                <td style={{padding:'var(--s3)',fontFamily:'var(--ff-m)',fontSize:12,color:'var(--ink-d)'}}>{a.views.toLocaleString()}</td>
                <td style={{padding:'var(--s3)'}}>
                  <div style={{display:'flex',gap:'var(--s2)'}}>
                    <button onClick={()=>nav('/admin/editeur/'+a.id)} className="btn btn-sm btn-g" style={{fontFamily:'var(--ff-m)',fontSize:10}}>Éditer</button>
                    <button className="btn btn-sm btn-g" style={{fontFamily:'var(--ff-m)',fontSize:10,color:a.featured?'var(--ac)':'var(--ink-f)'}}>{a.featured?'★ Épinglé':'☆ Épingler'}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ── Éditeur d'article ──────────────────────────────────── */
const PageAdminEditeur = ({ nav }) => {
  const [title,setTitle]     = useState('');
  const [body,setBody]       = useState('');
  const [cat,setCat]         = useState('llm');
  const [tags,setTags]       = useState('');
  const [status,setStatus]   = useState('draft');
  const [preview,setPreview] = useState(false);
  const [saved,setSaved]     = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(()=>setSaved(false),2000); };
  const wordCount  = body.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 52px)',overflow:'hidden',margin:'-var(--s7)',padding:0}}>
      {/* Toolbar */}
      <div style={{display:'flex',gap:'var(--s3)',padding:'var(--s4) var(--s5)',borderBottom:'1px solid var(--ln)',background:'var(--bg-d)',flexShrink:0,flexWrap:'wrap',alignItems:'center'}}>
        <button onClick={()=>nav('/admin/articles')} className="btn btn-g btn-sm" style={{fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)'}}>← Articles</button>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Titre de l'article…" style={{flex:1,minWidth:200,background:'none',border:'none',outline:'none',fontFamily:'var(--ff-h)',fontSize:16,fontWeight:600,color:'var(--ink)',padding:'4px 0'}}/>
        <div style={{display:'flex',gap:'var(--s2)',alignItems:'center',flexShrink:0}}>
          <button onClick={()=>setPreview(p=>!p)} className={`btn btn-sm${preview?' btn-p':''}`}>{preview?'◧ Formulaire':'◨ Aperçu'}</button>
          <select value={status} onChange={e=>setStatus(e.target.value)} className="inp inp-sm" style={{width:'auto'}}>
            <option value="draft">Brouillon</option>
            <option value="scheduled">Planifier</option>
            <option value="published">Publier</option>
          </select>
          <button onClick={handleSave} className="btn btn-p btn-sm">
            {saved?'✓ Sauvegardé':'Sauvegarder'}
          </button>
        </div>
      </div>
      {/* Main area */}
      <div style={{flex:1,display:'flex',overflow:'hidden',minHeight:0}}>
        {/* Form */}
        {!preview&&(
          <div style={{width:'50%',padding:'var(--s5)',overflowY:'auto',borderRight:'1px solid var(--ln)',display:'flex',flexDirection:'column',gap:'var(--s4)'}}>
            <div style={{display:'flex',gap:'var(--s3)',flexWrap:'wrap'}}>
              <div style={{flex:1,display:'flex',flexDirection:'column',gap:'var(--s2)'}}>
                <label style={{fontFamily:'var(--ff-m)',fontSize:10,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--ink-f)'}}>Catégorie</label>
                <select value={cat} onChange={e=>setCat(e.target.value)} className="inp inp-sm">
                  {Object.entries(CATS).map(([k,c])=><option key={k} value={k}>{c.label}</option>)}
                </select>
              </div>
              <div style={{flex:2,display:'flex',flexDirection:'column',gap:'var(--s2)'}}>
                <label style={{fontFamily:'var(--ff-m)',fontSize:10,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--ink-f)'}}>Tags (séparés par des virgules)</label>
                <input value={tags} onChange={e=>setTags(e.target.value)} className="inp inp-sm" placeholder="OpenAI, GPT-5, API…"/>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'var(--s2)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <label style={{fontFamily:'var(--ff-m)',fontSize:10,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--ink-f)'}}>Corps (Markdown)</label>
                <span style={{fontFamily:'var(--ff-m)',fontSize:10,color:'var(--ink-f)'}}>{wordCount} mots · ~{Math.max(1,Math.round(wordCount/200))} min</span>
              </div>
              <textarea value={body} onChange={e=>setBody(e.target.value)} className="inp" placeholder={'## Ce qui change\n\nVotre texte ici…\n\n> Une citation notable\n\n## Contexte\n\nSuite de l\'article…'} style={{minHeight:360,resize:'vertical',fontFamily:'var(--ff-m)',fontSize:13,lineHeight:1.7}}/>
            </div>
            {/* SEO */}
            <details style={{border:'1px solid var(--ln)',padding:'var(--s4)'}}>
              <summary style={{fontFamily:'var(--ff-m)',fontSize:11,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--ink-f)',cursor:'pointer',listStyle:'none'}}>▸ Réglages SEO</summary>
              <div style={{display:'flex',flexDirection:'column',gap:'var(--s3)',marginTop:'var(--s4)'}}>
                <div style={{display:'flex',flexDirection:'column',gap:'var(--s2)'}}>
                  <label style={{fontFamily:'var(--ff-m)',fontSize:10,color:'var(--ink-f)'}}>Meta description</label>
                  <textarea className="inp" style={{minHeight:72,fontFamily:'var(--ff-b)',fontSize:13,resize:'vertical'}} placeholder="Description pour les moteurs de recherche…"/>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'var(--s2)'}}>
                  <label style={{fontFamily:'var(--ff-m)',fontSize:10,color:'var(--ink-f)'}}>Slug URL</label>
                  <input className="inp inp-sm" placeholder="gpt-5-turbo-openai…" style={{fontFamily:'var(--ff-m)',fontSize:12}}/>
                </div>
              </div>
            </details>
            {/* Sources */}
            <details style={{border:'1px solid var(--ln)',padding:'var(--s4)'}}>
              <summary style={{fontFamily:'var(--ff-m)',fontSize:11,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--ink-f)',cursor:'pointer',listStyle:'none'}}>▸ Sources citées</summary>
              <div style={{display:'flex',flexDirection:'column',gap:'var(--s2)',marginTop:'var(--s4)'}}>
                {['TechCrunch','OpenAI Blog',''].map((s,i)=>(
                  <input key={i} defaultValue={s} className="inp inp-sm" placeholder="Nom de la source…" style={{fontFamily:'var(--ff-m)',fontSize:12}}/>
                ))}
                <button className="btn btn-sm btn-g" style={{alignSelf:'flex-start',fontFamily:'var(--ff-m)',fontSize:11}}>+ Ajouter</button>
              </div>
            </details>
          </div>
        )}
        {/* Preview */}
        <div style={{flex:1,overflowY:'auto',padding:'var(--s6) var(--s7)',background:'var(--bg)'}}>
          {preview && <div style={{fontFamily:'var(--ff-m)',fontSize:10,textTransform:'uppercase',letterSpacing:'.1em',color:'var(--ac)',marginBottom:'var(--s5)',borderLeft:'2px solid var(--ac)',paddingLeft:'var(--s2)'}}>Aperçu rendu</div>}
          {title ? (
            <>
              <div style={{marginBottom:'var(--s3)'}}><TagBadge cat={cat}/></div>
              <h1 style={{fontFamily:'var(--ff-h)',fontSize:'clamp(24px,3vw,38px)',fontWeight:700,lineHeight:1.1,letterSpacing:'-.025em',marginBottom:'var(--s5)'}}>{title}</h1>
              <div className="prose" dangerouslySetInnerHTML={{__html:renderBody(body)||'<p style="color:var(--ink-f);font-family:var(--ff-m);font-size:13px;">Commencez à écrire pour voir l\'aperçu…</p>'}}/>
            </>
          ) : (
            <div style={{textAlign:'center',padding:'var(--s9) 0',display:'flex',flexDirection:'column',alignItems:'center',gap:'var(--s4)'}}>
              <span style={{fontFamily:'var(--ff-m)',fontSize:36,color:'var(--ln-h)'}}>⊗</span>
              <p style={{fontFamily:'var(--ff-m)',fontSize:13,color:'var(--ink-f)'}}>Entrez un titre pour voir l'aperçu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Pipeline ────────────────────────────────────────────── */
const PageAdminPipeline = ({ nav }) => {
  const items = ARTICLES.slice(0,6).map((a,i)=>({...a,pstatus:i===1?'review':i===3?'rejected':'queued',auto_summary:'Résumé automatique généré par le pipeline. À valider avant publication.'}));
  const [list,setList] = useState(items);
  const approve = id => setList(l=>l.map(x=>x.id===id?{...x,pstatus:'approved'}:x));
  const reject  = id => setList(l=>l.map(x=>x.id===id?{...x,pstatus:'rejected'}:x));
  return (
    <div>
      <AdminPageHeader title="Pipeline" sub="File de modération des articles générés automatiquement"
        extra={<div style={{display:'flex',gap:'var(--s2)',fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)'}}>
          <span style={{color:'var(--ac)'}}>3</span> en attente · <span style={{color:'var(--ok)'}}>12</span> approuvés · <span style={{color:'var(--er)'}}>2</span> rejetés
        </div>}
      />
      <div style={{display:'flex',flexDirection:'column',gap:'var(--s4)'}}>
        {list.map(item=>(
          <div key={item.id} style={{background:'var(--bg-r)',border:'1px solid '+(item.pstatus==='rejected'?'var(--er)':item.pstatus==='approved'?'var(--ok)':'var(--ln)'),padding:'var(--s5)',display:'flex',flexDirection:'column',gap:'var(--s3)'}}>
            <div style={{display:'flex',justifyContent:'space-between',gap:'var(--s4)',flexWrap:'wrap'}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',gap:'var(--s3)',marginBottom:'var(--s2)',flexWrap:'wrap',alignItems:'center'}}>
                  <TagBadge cat={item.cat}/>
                  <span style={{fontFamily:'var(--ff-m)',fontSize:10,color:'var(--ink-f)'}}>{fmtDate(item.date)}</span>
                  <span style={{fontFamily:'var(--ff-m)',fontSize:10,padding:'2px 6px',border:'1px solid currentColor',textTransform:'uppercase',letterSpacing:'.06em',color:item.pstatus==='approved'?'var(--ok)':item.pstatus==='rejected'?'var(--er)':item.pstatus==='review'?'var(--wn)':'var(--inf)'}}>{item.pstatus}</span>
                </div>
                <h3 style={{fontFamily:'var(--ff-h)',fontSize:15,fontWeight:600,marginBottom:'var(--s2)'}}>{item.title}</h3>
                <p style={{fontFamily:'var(--ff-b)',fontSize:13,color:'var(--ink-d)',lineHeight:1.5}}>{item.auto_summary}</p>
              </div>
              <div style={{display:'flex',gap:'var(--s2)',flexShrink:0,alignItems:'flex-start',flexWrap:'wrap'}}>
                <button onClick={()=>nav('/admin/editeur/'+item.id)} className="btn btn-sm btn-g" style={{fontFamily:'var(--ff-m)',fontSize:11}}>Éditer</button>
                {item.pstatus!=='approved'&&<button onClick={()=>approve(item.id)} className="btn btn-sm" style={{borderColor:'var(--ok)',color:'var(--ok)',fontFamily:'var(--ff-m)',fontSize:11}}>✓ Approuver</button>}
                {item.pstatus!=='rejected'&&<button onClick={()=>reject(item.id)} className="btn btn-sm" style={{borderColor:'var(--er)',color:'var(--er)',fontFamily:'var(--ff-m)',fontSize:11}}>✗ Rejeter</button>}
              </div>
            </div>
            <div style={{display:'flex',gap:'var(--s3)',fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)'}}>
              <span>Sources : {item.sources.join(' · ')}</span>
              <span style={{marginLeft:'auto'}}>{item.readTime} min de lecture</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Sources RSS ────────────────────────────────────────── */
const PageAdminSources = ({ nav }) => {
  const [sources,setSources] = useState([...SOURCES,
    { id:9, name:'Wired AI',       cat:'tools',    health:'ok',   last:'1 h',  count:445 },
    { id:10,name:'MIT Tech Review',cat:'research', health:'warn', last:'3 h',  count:201 },
  ]);
  return (
    <div>
      <AdminPageHeader title="Sources RSS" sub="Santé des flux et statistiques d'ingestion" action="+ Ajouter une source"/>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:600}}>
          <thead>
            <tr style={{borderBottom:'2px solid var(--ln-h)'}}>
              {['État','Nom','Catégorie','Dernière synchro','Articles','Actions'].map(h=>(
                <th key={h} style={{fontFamily:'var(--ff-m)',fontSize:10,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--ink-f)',padding:'var(--s2) var(--s3)',textAlign:'left',fontWeight:500,whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sources.map(s=>{
              const hcls=s.health==='ok'?'s-ok':s.health==='warn'?'s-wn':'s-err';
              const hc=s.health==='ok'?'var(--ok)':s.health==='warn'?'var(--wn)':'var(--er)';
              return (
                <tr key={s.id} style={{borderBottom:'1px solid var(--ln)',transition:'background var(--d)'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--bg-r)'}
                  onMouseLeave={e=>e.currentTarget.style.background=''}
                >
                  <td style={{padding:'var(--s3)'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <span className={hcls}/>
                      <span style={{fontFamily:'var(--ff-m)',fontSize:10,color:hc,textTransform:'uppercase',letterSpacing:'.06em'}}>{s.health}</span>
                    </div>
                  </td>
                  <td style={{padding:'var(--s3)',fontFamily:'var(--ff-h)',fontSize:13,fontWeight:500}}>{s.name}</td>
                  <td style={{padding:'var(--s3)'}}><TagBadge cat={s.cat}/></td>
                  <td style={{padding:'var(--s3)',fontFamily:'var(--ff-m)',fontSize:12,color:'var(--ink-f)'}}>{s.last}</td>
                  <td style={{padding:'var(--s3)',fontFamily:'var(--ff-m)',fontSize:12,color:'var(--ac)',fontWeight:600}}>{s.count}</td>
                  <td style={{padding:'var(--s3)'}}>
                    <div style={{display:'flex',gap:'var(--s2)'}}>
                      <button className="btn btn-sm btn-g" style={{fontFamily:'var(--ff-m)',fontSize:10}}>Éditer</button>
                      <button className="btn btn-sm btn-g" style={{fontFamily:'var(--ff-m)',fontSize:10,color:'var(--er)'}}>Désactiver</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ── Newsletter ─────────────────────────────────────────── */
const PageAdminNewsletter = ({ nav }) => {
  const [subject,setSubject] = useState('');
  const [body,setBody]       = useState('');
  const [preview,setPreview] = useState(false);
  return (
    <div>
      <AdminPageHeader title="Newsletter" sub="4 231 abonnés actifs · Prochain envoi : vendredi 20 juin"/>
      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'var(--s4)',marginBottom:'var(--s7)'}}>
        {[{label:'Abonnés',value:'4 231',delta:+12},{label:'Taux d\'ouverture',value:'62 %',delta:+4},{label:'Taux de clic',value:'18 %',delta:-2},{label:'Désabonnements',value:'7',accent:'var(--er)'}].map(m=><MetricCard key={m.label} {...m}/>)}
      </div>
      {/* Composer */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--s5)',alignItems:'start'}}>
        <div>
          <h2 style={{fontFamily:'var(--ff-h)',fontSize:16,fontWeight:600,marginBottom:'var(--s4)'}}>Composer l'envoi</h2>
          <div style={{display:'flex',flexDirection:'column',gap:'var(--s4)'}}>
            <div style={{display:'flex',flexDirection:'column',gap:'var(--s2)'}}>
              <label style={{fontFamily:'var(--ff-m)',fontSize:10,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--ink-f)'}}>Objet</label>
              <input value={subject} onChange={e=>setSubject(e.target.value)} className="inp" placeholder="signal·ia — semaine du 14 juin 2026"/>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'var(--s2)'}}>
              <label style={{fontFamily:'var(--ff-m)',fontSize:10,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--ink-f)'}}>Corps (Markdown)</label>
              <textarea value={body} onChange={e=>setBody(e.target.value)} className="inp" style={{minHeight:280,resize:'vertical',fontFamily:'var(--ff-m)',fontSize:12,lineHeight:1.7}} placeholder={"## Cette semaine dans l'IA\n\nBonjour,\n\nVoici les 5 actus que vous ne devez pas manquer…"}/>
            </div>
            <div style={{display:'flex',gap:'var(--s3)'}}>
              <button onClick={()=>setPreview(p=>!p)} className="btn">{preview?'Masquer l\'aperçu':'Voir l\'aperçu'}</button>
              <button className="btn btn-p" style={{gap:6}}>⚡ Envoyer maintenant</button>
            </div>
          </div>
        </div>
        <div>
          <h2 style={{fontFamily:'var(--ff-h)',fontSize:16,fontWeight:600,marginBottom:'var(--s4)'}}>Aperçu email</h2>
          <div style={{border:'1px solid var(--ln)',background:'var(--bg-r)',padding:'var(--s6)',minHeight:300}}>
            {subject&&<div style={{fontFamily:'var(--ff-m)',fontSize:12,fontWeight:600,marginBottom:'var(--s4)',paddingBottom:'var(--s4)',borderBottom:'1px solid var(--ln)'}}><span style={{color:'var(--ink-f)'}}>Objet :</span> {subject}</div>}
            <div className="prose" dangerouslySetInnerHTML={{__html:renderBody(body)||'<p style="color:var(--ink-f);font-family:var(--ff-m);font-size:13px;">L\'aperçu apparaît ici…</p>'}}/>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Messages ───────────────────────────────────────────── */
const PageAdminMessages = ({ nav }) => {
  const msgs = [
    { id:1, from:'Sarah M.', email:'sarah@exemple.fr', subject:'Suggestion de source : Import AI', body:'Bonjour, je voulais suggérer la newsletter Import AI de Jack Clark — c\'est une des meilleures sources de veille IA. Très complémentaire à votre sélection.', date:'2026-06-14T09:00:00', read:false },
    { id:2, from:'Tom D.',   email:'tom@dev.io',       subject:'Erreur dans l\'article Mistral',   body:'Dans l\'article sur Mistral Large 3, vous écrivez que le modèle est disponible en GGUF — en fait c\'est uniquement le community qui a fait ces conversions, pas Mistral officiel.', date:'2026-06-13T14:30:00', read:false },
    { id:3, from:'Claire R.',email:'claire@ia.fr',     subject:'Bravo pour le glossaire',          body:'Super initiative que le glossaire IA ! Est-ce que vous prévoyez d\'y ajouter des termes liés à l\'IA dans l\'éducation ? Ce serait très utile pour ma communauté.', date:'2026-06-12T11:00:00', read:true },
  ];
  const [open,setOpen] = useState(null);
  const [list,setList] = useState(msgs);
  const markRead = id => setList(l=>l.map(m=>m.id===id?{...m,read:true}:m));
  const sel = list.find(m=>m.id===open);
  return (
    <div>
      <AdminPageHeader title="Messages" sub={`${list.filter(m=>!m.read).length} non lus`}/>
      <div style={{display:'grid',gridTemplateColumns:'340px 1fr',gap:0,border:'1px solid var(--ln)',minHeight:500}}>
        <div style={{borderRight:'1px solid var(--ln)',overflowY:'auto'}}>
          {list.map(m=>(
            <div key={m.id} onClick={()=>{setOpen(m.id);markRead(m.id)}} style={{padding:'var(--s4)',borderBottom:'1px solid var(--ln)',cursor:'pointer',background:open===m.id?'var(--bg-r)':'',borderLeft:!m.read?'3px solid var(--ac)':'3px solid transparent',transition:'background var(--d)'}}
              onMouseEnter={e=>{if(open!==m.id)e.currentTarget.style.background='var(--bg-r)'}}
              onMouseLeave={e=>{if(open!==m.id)e.currentTarget.style.background=''}}
            >
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontFamily:'var(--ff-h)',fontSize:13,fontWeight:m.read?400:700}}>{m.from}</span>
                <span style={{fontFamily:'var(--ff-m)',fontSize:10,color:'var(--ink-f)'}}>{fmtDate(m.date)}</span>
              </div>
              <div style={{fontFamily:'var(--ff-h)',fontSize:12,color:'var(--ink-d)',marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.subject}</div>
              <div style={{fontFamily:'var(--ff-b)',fontSize:12,color:'var(--ink-f)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.body.slice(0,60)}…</div>
            </div>
          ))}
        </div>
        <div style={{padding:'var(--s6)',overflowY:'auto'}}>
          {sel ? (
            <>
              <div style={{marginBottom:'var(--s5)',paddingBottom:'var(--s5)',borderBottom:'1px solid var(--ln)'}}>
                <h2 style={{fontFamily:'var(--ff-h)',fontSize:18,fontWeight:600,marginBottom:'var(--s2)'}}>{sel.subject}</h2>
                <div style={{display:'flex',gap:'var(--s4)',fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)'}}>
                  <span>De : <span style={{color:'var(--ink)'}}>{sel.from}</span></span>
                  <span>{sel.email}</span>
                  <span style={{marginLeft:'auto'}}>{new Date(sel.date).toLocaleString('fr-FR')}</span>
                </div>
              </div>
              <p style={{fontFamily:'var(--ff-b)',fontSize:15,lineHeight:1.72,color:'var(--ink-d)',marginBottom:'var(--s6)'}}>{sel.body}</p>
              <div style={{display:'flex',gap:'var(--s3)'}}>
                <button className="btn btn-p">Répondre par email ↗</button>
                <button className="btn" style={{color:'var(--er)',borderColor:'var(--er)'}}>Archiver</button>
              </div>
            </>
          ) : (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:'var(--s4)',color:'var(--ink-f)'}}>
              <span style={{fontFamily:'var(--ff-m)',fontSize:32}}>◷</span>
              <span style={{fontFamily:'var(--ff-m)',fontSize:12}}>Sélectionnez un message</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Analytics ──────────────────────────────────────────── */
const PageAdminAnalytics = ({ nav }) => {
  const days = ['L','M','M','J','V','S','D'];
  const vues = [3200,4100,3800,5200,6400,4800,3900];
  const maxV = Math.max(...vues);
  return (
    <div>
      <AdminPageHeader title="Analytics" sub="7 derniers jours · Données agrégées côté serveur, sans traceurs tiers"/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'var(--s4)',marginBottom:'var(--s7)'}}>
        {[{label:'Vues (7j)',value:'31,4 k',delta:+9},{label:'Articles lus',value:'8 241',delta:+14},{label:'Taux rebond',value:'38 %',delta:-6},{label:'Durée moy.',value:'3 min 42 s',delta:+11}].map(m=><MetricCard key={m.label} {...m}/>)}
      </div>
      {/* Bar chart vues */}
      <div style={{background:'var(--bg-r)',border:'1px solid var(--ln)',padding:'var(--s6)',marginBottom:'var(--s6)'}}>
        <h2 style={{fontFamily:'var(--ff-h)',fontSize:15,fontWeight:600,marginBottom:'var(--s5)'}}>Vues par jour</h2>
        <div style={{display:'flex',gap:'var(--s3)',alignItems:'flex-end',height:160}}>
          {vues.map((v,i)=>(
            <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'var(--s2)'}}>
              <span style={{fontFamily:'var(--ff-m)',fontSize:10,color:'var(--ink-f)'}}>{(v/1000).toFixed(1)}k</span>
              <div style={{width:'100%',background:'var(--ac)',height:Math.round((v/maxV)*120),transition:'height 0.6s var(--ease)',opacity:0.85}}/>
              <span style={{fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)'}}>{days[i]}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Top articles */}
      <div style={{background:'var(--bg-r)',border:'1px solid var(--ln)',padding:'var(--s5)'}}>
        <h2 style={{fontFamily:'var(--ff-h)',fontSize:15,fontWeight:600,marginBottom:'var(--s4)'}}>Top articles (7 jours)</h2>
        {[...ARTICLES].sort((a,b)=>b.views-a.views).slice(0,5).map((a,i)=>(
          <div key={a.id} style={{display:'flex',alignItems:'center',gap:'var(--s4)',padding:'var(--s3) 0',borderBottom:'1px solid var(--ln)'}}>
            <span style={{fontFamily:'var(--ff-m)',fontSize:14,fontWeight:700,color:'var(--ac)',width:20,flexShrink:0}}>{i+1}</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:'var(--ff-h)',fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.title}</div>
              <div style={{height:4,background:'var(--bg-d)',marginTop:4,position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',left:0,top:0,height:'100%',width:(a.views/ARTICLES[0].views*100)+'%',background:CATS[a.cat]?.color||'var(--ac)'}}/>
              </div>
            </div>
            <span style={{fontFamily:'var(--ff-m)',fontSize:12,color:'var(--ink-d)',flexShrink:0}}>{a.views.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Tags ───────────────────────────────────────────────── */
const PageAdminTags = ({ nav }) => {
  const [q,setQ]   = useState('');
  const tagData    = TAGS.map((t,i)=>({name:t,count:Math.floor(Math.random()*20)+1})).filter(t=>!q||t.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <AdminPageHeader title="Gestion des tags" sub={`${TAGS.length} tags au total`} action="+ Créer un tag"/>
      <div style={{marginBottom:'var(--s5)'}}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Rechercher un tag…" className="inp inp-sm" style={{width:280}}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'var(--s3)'}}>
        {tagData.map(t=>(
          <div key={t.name} style={{background:'var(--bg-r)',border:'1px solid var(--ln)',padding:'var(--s4)',display:'flex',alignItems:'center',gap:'var(--s3)'}}>
            <span className="tag" style={{fontSize:11,padding:'3px 8px'}}>{t.name}</span>
            <span style={{fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)',flex:1}}>{t.count} articles</span>
            <div style={{display:'flex',gap:'var(--s2)'}}>
              <button className="btn btn-sm btn-g" style={{fontFamily:'var(--ff-m)',fontSize:10}}>⇄</button>
              <button className="btn btn-sm btn-g" style={{fontFamily:'var(--ff-m)',fontSize:10,color:'var(--er)'}}>×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Réglages ───────────────────────────────────────────── */
const PageAdminReglages = ({ nav }) => {
  const [maint,setMaint] = useState(false);
  return (
    <div>
      <AdminPageHeader title="Réglages" sub="Identité, apparence et configuration"/>
      <div style={{display:'flex',flexDirection:'column',gap:'var(--s6)',maxWidth:600}}>
        {[{section:'Identité',fields:[['Nom du site','signal·ia'],['Tagline','L\'essentiel de l\'IA, trié, sans bruit'],['URL de base','https://signal-ia.fr'],['Email de contact','contact@signal-ia.fr']]},
          {section:'Apparence',fields:[['Couleur accent (OKLCH)','oklch(0.91 0.22 127)'],['Couleur de fond sombre','oklch(0.13 0.008 160)']]},
          {section:'Pipeline',fields:[['Intervalle de synchro RSS','30 min'],['Modèle de résumé','mistral-large-latest'],['Langue par défaut','fr']]}
        ].map(({section,fields})=>(
          <div key={section}>
            <h2 style={{fontFamily:'var(--ff-h)',fontSize:15,fontWeight:600,marginBottom:'var(--s4)',paddingBottom:'var(--s3)',borderBottom:'1px solid var(--ln)'}}>{section}</h2>
            <div style={{display:'flex',flexDirection:'column',gap:'var(--s3)'}}>
              {fields.map(([label,val])=>(
                <div key={label} style={{display:'flex',flexDirection:'column',gap:'var(--s2)'}}>
                  <label style={{fontFamily:'var(--ff-m)',fontSize:10,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--ink-f)'}}>{label}</label>
                  <input defaultValue={val} className="inp inp-sm"/>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div>
          <h2 style={{fontFamily:'var(--ff-h)',fontSize:15,fontWeight:600,marginBottom:'var(--s4)',paddingBottom:'var(--s3)',borderBottom:'1px solid var(--ln)'}}>Mode maintenance</h2>
          <div style={{display:'flex',alignItems:'center',gap:'var(--s4)'}}>
            <button onClick={()=>setMaint(m=>!m)} style={{width:44,height:24,background:maint?'var(--er)':'var(--ln-h)',border:'none',cursor:'pointer',position:'relative',transition:'background var(--d)',flexShrink:0}}>
              <span style={{position:'absolute',top:4,left:maint?22:4,width:16,height:16,background:'var(--ink)',transition:'left var(--d)',display:'block'}}/>
            </button>
            <span style={{fontFamily:'var(--ff-m)',fontSize:12,color:maint?'var(--er)':'var(--ink-f)'}}>
              {maint?'Mode maintenance ACTIF — site public inaccessible':'Désactivé'}
            </span>
          </div>
        </div>
        <div>
          <button className="btn btn-p">Sauvegarder les réglages</button>
        </div>
      </div>
    </div>
  );
};

/* ── Sauvegarde ─────────────────────────────────────────── */
const PageAdminBackup = ({ nav }) => {
  const backups = [
    { id:1, date:'2026-06-14T06:00:00', size:'12,4 Mo', type:'auto',   status:'ok' },
    { id:2, date:'2026-06-13T06:00:00', size:'12,1 Mo', type:'auto',   status:'ok' },
    { id:3, date:'2026-06-12T14:30:00', size:'11,9 Mo', type:'manuel', status:'ok' },
    { id:4, date:'2026-06-07T06:00:00', size:'11,2 Mo', type:'auto',   status:'ok' },
  ];
  return (
    <div>
      <AdminPageHeader title="Sauvegarde" sub="Backups automatiques quotidiens · Conservation 30 jours" action="+ Sauvegarde manuelle"/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'var(--s4)',marginBottom:'var(--s7)'}}>
        {[{label:'Dernière sauvegarde',value:'Il y a 2 h',delta:null},{label:'Taille totale',value:'47,6 Mo',delta:null},{label:'Backups disponibles',value:'4',delta:null}].map(m=><MetricCard key={m.label} {...m}/>)}
      </div>
      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead>
          <tr style={{borderBottom:'2px solid var(--ln-h)'}}>
            {['Date','Taille','Type','État','Actions'].map(h=>(
              <th key={h} style={{fontFamily:'var(--ff-m)',fontSize:10,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--ink-f)',padding:'var(--s2) var(--s3)',textAlign:'left',fontWeight:500}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {backups.map(b=>(
            <tr key={b.id} style={{borderBottom:'1px solid var(--ln)'}}>
              <td style={{padding:'var(--s3)',fontFamily:'var(--ff-m)',fontSize:12}}>{new Date(b.date).toLocaleString('fr-FR')}</td>
              <td style={{padding:'var(--s3)',fontFamily:'var(--ff-m)',fontSize:12,color:'var(--ink-d)'}}>{b.size}</td>
              <td style={{padding:'var(--s3)'}}><span style={{fontFamily:'var(--ff-m)',fontSize:10,padding:'2px 6px',border:'1px solid currentColor',textTransform:'uppercase',letterSpacing:'.06em',color:b.type==='manuel'?'var(--ac)':'var(--ink-f)'}}>{b.type}</span></td>
              <td style={{padding:'var(--s3)'}}><div style={{display:'flex',alignItems:'center',gap:5}}><span className="s-ok"/><span style={{fontFamily:'var(--ff-m)',fontSize:10,color:'var(--ok)'}}>OK</span></div></td>
              <td style={{padding:'var(--s3)'}}>
                <div style={{display:'flex',gap:'var(--s2)'}}>
                  <button className="btn btn-sm btn-g" style={{fontFamily:'var(--ff-m)',fontSize:10}}>Télécharger ↓</button>
                  <button className="btn btn-sm btn-g" style={{fontFamily:'var(--ff-m)',fontSize:10,color:'var(--er)'}}>Supprimer</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

Object.assign(window, {
  PageAdminDash, PageAdminArticles, PageAdminEditeur,
  PageAdminPipeline, PageAdminSources, PageAdminNewsletter,
  PageAdminMessages, PageAdminAnalytics, PageAdminTags,
  PageAdminReglages, PageAdminBackup,
});
