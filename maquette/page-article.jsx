// page-article.jsx — Page article complète
const { useState, useEffect } = React;

const PageArticle = ({ id, nav }) => {
  const a = ARTICLES.find(x=>x.id===id)||ARTICLES[0];
  const [progress,setProgress] = useState(0);
  const [saved,setSaved]       = useState(false);
  const [reacts,setReacts]     = useState({fire:42,bulb:28,think:15,q:7});
  const [reacted,setReacted]   = useState({});

  useEffect(()=>{
    const favs = JSON.parse(localStorage.getItem('sig-fav')||'[]');
    setSaved(favs.includes(a.id));
    setProgress(0);
    window.scrollTo({top:0});
  },[a.id]);

  useEffect(()=>{
    const onScroll = () => {
      const el = document.documentElement;
      const pct = el.scrollHeight-el.clientHeight > 0 ? (el.scrollTop/(el.scrollHeight-el.clientHeight))*100 : 0;
      setProgress(pct);
    };
    window.addEventListener('scroll',onScroll,{passive:true});
    return ()=>window.removeEventListener('scroll',onScroll);
  },[]);

  const toggleSave = () => {
    const favs = JSON.parse(localStorage.getItem('sig-fav')||'[]');
    const next = saved ? favs.filter(x=>x!==a.id) : [...favs,a.id];
    localStorage.setItem('sig-fav',JSON.stringify(next));
    setSaved(!saved);
  };

  const react = key => {
    if(reacted[key]) return;
    setReacts(r=>({...r,[key]:r[key]+1}));
    setReacted(r=>({...r,[key]:true}));
  };

  const related = ARTICLES.filter(x=>x.id!==a.id&&x.cat===a.cat).slice(0,3);

  return (
    <>
      {/* Reading progress */}
      <div id="rprog" style={{width:progress+'%'}}/>

      {/* ── En-tête article ──────────────────────────────── */}
      <section style={{padding:'var(--s7) 0 var(--s4)'}}>
        <div className="wrap-n">
          <div style={{display:'flex',gap:'var(--s3)',marginBottom:'var(--s5)',alignItems:'center',flexWrap:'wrap'}}>
            <button onClick={()=>nav('/actus')} className="btn btn-g" style={{fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)',padding:'0 var(--s3)',minHeight:36}}>← Actus</button>
            <span style={{color:'var(--ln-h)'}}>·</span>
            <TagBadge cat={a.cat}/>
            {a.tags.slice(0,2).map(t=><span key={t} className="tag">{t}</span>)}
          </div>
          <h1 style={{fontFamily:'var(--ff-h)',fontSize:'clamp(28px,5vw,50px)',fontWeight:700,lineHeight:1.08,letterSpacing:'-.025em',marginBottom:'var(--s5)'}}>
            {a.title}
          </h1>
          <div style={{display:'flex',gap:'var(--s5)',flexWrap:'wrap',marginBottom:'var(--s5)',paddingBottom:'var(--s5)',borderBottom:'1px solid var(--ln)'}}>
            <span style={{fontFamily:'var(--ff-m)',fontSize:12,color:'var(--ink-f)'}}>
              {new Date(a.date).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
            </span>
            <span style={{fontFamily:'var(--ff-m)',fontSize:12,color:'var(--ink-f)'}}>
              {fmtTime(a.date)}
            </span>
            <span style={{fontFamily:'var(--ff-m)',fontSize:12,color:'var(--ink-f)'}}>{a.readTime} min de lecture</span>
            <span style={{fontFamily:'var(--ff-m)',fontSize:12,color:'var(--ac)'}}>{a.sources.length} sources citées</span>
            <span style={{fontFamily:'var(--ff-m)',fontSize:12,color:'var(--ink-f)',marginLeft:'auto'}}>{a.views.toLocaleString()} vues</span>
          </div>
        </div>
      </section>

      {/* ── Résumé ───────────────────────────────────────── */}
      <section style={{paddingBottom:'var(--s6)'}}>
        <div className="wrap-n">
          <div style={{borderLeft:'4px solid var(--ac)',border:'1px solid var(--ln-h)',borderLeft:'4px solid var(--ac)',background:'var(--bg-r)',padding:'var(--s5) var(--s6)',marginBottom:'var(--s7)'}}>
            <div style={{fontFamily:'var(--ff-m)',fontSize:10,textTransform:'uppercase',letterSpacing:'.12em',color:'var(--ac)',marginBottom:'var(--s4)',display:'flex',alignItems:'center',gap:'var(--s3)'}}>
              <span style={{width:6,height:6,background:'var(--ac)',display:'inline-block'}}/>
              En résumé — 3 points clés
            </div>
            <ul style={{display:'flex',flexDirection:'column',gap:'var(--s4)'}}>
              {a.points.map((pt,i)=>(
                <li key={i} style={{display:'flex',gap:'var(--s4)',alignItems:'flex-start'}}>
                  <span style={{fontFamily:'var(--ff-m)',fontSize:12,color:'var(--ac)',flexShrink:0,marginTop:3,fontWeight:600}}>0{i+1}</span>
                  <span style={{fontFamily:'var(--ff-h)',fontSize:16,lineHeight:1.5}}>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Image principale */}
          <ImgSlot label={'IMAGE PRINCIPALE\n1200 × 630'} h={380}/>
        </div>
      </section>

      {/* ── Corps ────────────────────────────────────────── */}
      <section style={{paddingBottom:'var(--s7)'}}>
        <div className="wrap-n">
          <div className="prose" dangerouslySetInnerHTML={{__html:renderBody(a.body)}}/>

          {/* ── Réactions ────────────────────────────────── */}
          <div style={{marginTop:'var(--s7)',paddingTop:'var(--s6)',borderTop:'1px solid var(--ln)',display:'flex',gap:'var(--s3)',flexWrap:'wrap',alignItems:'center'}}>
            <span style={{fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)',marginRight:'var(--s2)'}}>Réagir :</span>
            {[['🔥','fire','Utile'],['💡','bulb','Intéressant'],['🤔','think','Mitigé'],['❓','q','J\'ai une question']].map(([em,k,title])=>(
              <button key={k} onClick={()=>react(k)} title={title}
                style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:reacted[k]?'var(--bg-e)':'var(--bg-r)',border:'1px solid '+(reacted[k]?'var(--ac)':'var(--ln)'),fontFamily:'var(--ff-m)',fontSize:13,color:reacted[k]?'var(--ac)':'var(--ink-d)',minHeight:44,cursor:'pointer',transition:'all var(--d)'}}
                onMouseEnter={e=>{if(!reacted[k]){e.currentTarget.style.borderColor='var(--ac)';e.currentTarget.style.color='var(--ink)'}}}
                onMouseLeave={e=>{if(!reacted[k]){e.currentTarget.style.borderColor='var(--ln)';e.currentTarget.style.color='var(--ink-d)'}}}
              >
                {em} <span>{reacts[k]}</span>
              </button>
            ))}
            <div style={{marginLeft:'auto',display:'flex',gap:'var(--s3)'}}>
              <button onClick={toggleSave} className={`btn${saved?' btn-p':''}`} style={{minHeight:44,gap:6}}>
                {saved?'✓ Sauvegardé':'☆ Sauvegarder'}
              </button>
              <button className="btn" style={{minHeight:44}} onClick={()=>navigator.share?.({title:a.title,url:window.location.href})||null}>Partager</button>
            </div>
          </div>

          {/* ── Sources ──────────────────────────────────── */}
          <div style={{marginTop:'var(--s6)',padding:'var(--s5)',background:'var(--bg-d)',border:'1px solid var(--ln)'}}>
            <div style={{fontFamily:'var(--ff-m)',fontSize:10,textTransform:'uppercase',letterSpacing:'.1em',color:'var(--ink-f)',marginBottom:'var(--s3)'}}>Sources citées</div>
            <div style={{display:'flex',gap:'var(--s3)',flexWrap:'wrap'}}>
              {a.sources.map(s=>(
                <a key={s} href="#" onClick={e=>e.preventDefault()} style={{fontFamily:'var(--ff-m)',fontSize:12,color:'var(--ac)',border:'1px solid var(--ac)',padding:'4px 10px',display:'inline-flex',alignItems:'center',gap:4,minHeight:36,transition:'background var(--d)'}}
                  onMouseEnter={e=>e.currentTarget.style.background='oklch(from var(--ac) l c h / 0.1)'}
                  onMouseLeave={e=>e.currentTarget.style.background=''}
                >{s} ↗</a>
              ))}
            </div>
          </div>

          {/* ── Tags ─────────────────────────────────────── */}
          <div style={{marginTop:'var(--s4)',display:'flex',gap:'var(--s2)',flexWrap:'wrap'}}>
            {a.tags.map(t=><button key={t} onClick={()=>nav('/actus?q='+encodeURIComponent(t))} className="tag" style={{cursor:'pointer',fontSize:11,padding:'3px 8px'}}>{t}</button>)}
          </div>
        </div>
      </section>

      {/* ── Articles liés ────────────────────────────────── */}
      {related.length>0&&(
        <section className="band band-alt">
          <div className="wrap">
            <SecHead label="À lire aussi" title="Articles liés" action="Voir tout" onAction={()=>nav('/actus')}/>
            <div className="mag">
              {related.map(r=><ArticleCard key={r.id} a={r} nav={nav}/>)}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

Object.assign(window, { PageArticle });
