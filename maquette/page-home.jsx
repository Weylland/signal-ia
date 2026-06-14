// page-home.jsx — Page d'accueil
const { useState } = React;

const PageHome = ({ nav }) => {
  const featured = ARTICLES.find(a=>a.featured)||ARTICLES[0];
  const last24   = ARTICLES.filter(a=>a.id!==featured.id).slice(0,5);
  const grid     = ARTICLES.filter(a=>a.id!==featured.id).slice(0,5);
  const topRead  = [...ARTICLES].sort((a,b)=>b.views-a.views).slice(0,5);
  const [email,setEmail]=useState('');
  const [subbed,setSubbed]=useState(false);

  return (
    <div>
      <Ticker/>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section style={{padding:'var(--s6) 0 0'}}>
        <div className="wrap">
          <ArticleHero a={featured} nav={nav}/>
        </div>
      </section>

      {/* ── Dernières 24 h ───────────────────────────────── */}
      <section className="band">
        <div className="wrap">
          <div className="digest-grid">
            <div>
              <SecHead label="Dernières 24 heures" title="Ce matin" action="Toutes les actus" onAction={()=>nav('/actus')}/>
              {last24.map(a=><ArticleRow key={a.id} a={a} nav={nav}/>)}
            </div>
            <div className="digest-side">
              {/* Catégories */}
              <div style={{fontFamily:'var(--ff-m)',fontSize:9,textTransform:'uppercase',letterSpacing:'.12em',color:'var(--ink-f)',marginBottom:'var(--s4)',borderLeft:'2px solid var(--ln-h)',paddingLeft:'var(--s2)'}}>
                Explorer par catégorie
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'var(--s2)',marginBottom:'var(--s6)'}}>
                {Object.entries(CATS).map(([k,c])=>(
                  <button key={k} onClick={()=>nav('/actus?cat='+k)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px var(--s4)',background:'var(--bg-r)',border:'1px solid var(--ln)',cursor:'pointer',transition:'transform var(--d),box-shadow var(--d)',minHeight:44,fontFamily:'var(--ff-h)',fontSize:13,fontWeight:500,color:'var(--ink)'}}
                    onMouseEnter={e=>{e.currentTarget.style.transform='translate(-2px,-2px)';e.currentTarget.style.boxShadow='2px 2px 0 '+c.color}}
                    onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=''}}
                  >
                    <span>{c.label}</span>
                    <span className={`tag ${c.cls}`}>{ARTICLES.filter(a=>a.cat===k).length}</span>
                  </button>
                ))}
              </div>
              {/* Stats du jour */}
              <div style={{border:'1px solid var(--ln)',background:'var(--bg-r)',padding:'var(--s4)'}}>
                <div style={{fontFamily:'var(--ff-m)',fontSize:9,textTransform:'uppercase',letterSpacing:'.12em',color:'var(--ink-f)',marginBottom:'var(--s3)'}}>Chiffres du jour</div>
                {[['Articles publiés','12'],['Sources actives','8'],['Abonnés newsletter','4 231'],['Vues (24 h)','28 400']].map(([l,v])=>(
                  <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'var(--s2) 0',borderBottom:'1px solid var(--ln)'}}>
                    <span style={{fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-d)'}}>{l}</span>
                    <span style={{fontFamily:'var(--ff-h)',fontSize:13,fontWeight:700,color:'var(--ac)'}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Magazine grid ────────────────────────────────── */}
      <section className="band band-alt">
        <div className="wrap">
          <SecHead label="Sélection" title="À ne pas manquer" action="Voir tout" onAction={()=>nav('/actus')}/>
          <div className="mag">
            {grid.slice(0,2).map((a,i)=>(
              <div key={a.id} className={i===0?'c2':''}>
                <ArticleCard a={a} nav={nav}/>
              </div>
            ))}
            {grid.slice(2,5).map(a=><ArticleCard key={a.id} a={a} nav={nav}/>)}
          </div>
        </div>
      </section>

      {/* ── Tutos ────────────────────────────────────────── */}
      <section className="band band-deep">
        <div className="wrap">
          <SecHead label="Pratique" title="Tutoriels" action="Tous les tutos" onAction={()=>nav('/tutos')}/>
          <div style={{display:'flex',flexDirection:'column',gap:'var(--s4)'}}>
            {TUTOS.slice(0,3).map(t=>(
              <div key={t.id} onClick={()=>nav('/tutos')} style={{display:'flex',gap:'var(--s5)',padding:'var(--s5)',background:'var(--bg-r)',border:'1px solid var(--ln)',cursor:'pointer',alignItems:'flex-start',transition:'transform var(--d),box-shadow var(--d)',flexWrap:'wrap'}}
                onMouseEnter={e=>{e.currentTarget.style.transform='translate(-2px,-2px)';e.currentTarget.style.boxShadow='var(--sha)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=''}}
              >
                <div style={{width:56,height:56,flexShrink:0,background:'var(--bg-d)',display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid var(--ln)'}}>
                  <span style={{fontFamily:'var(--ff-m)',fontSize:18,color:'var(--ac)',fontWeight:600}}>{String(t.id).padStart(2,'0')}</span>
                </div>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{display:'flex',gap:'var(--s2)',marginBottom:'var(--s2)',flexWrap:'wrap',alignItems:'center'}}>
                    <span style={{fontFamily:'var(--ff-m)',fontSize:10,padding:'2px 6px',border:'1px solid currentColor',textTransform:'uppercase',letterSpacing:'.08em',color:t.diff==='avancé'?'var(--wn)':t.diff==='débutant'?'var(--ok)':'var(--ac)'}}>{t.diff}</span>
                    {t.tags.slice(0,3).map(tg=><span key={tg} className="tag">{tg}</span>)}
                  </div>
                  <h3 style={{fontFamily:'var(--ff-h)',fontSize:16,fontWeight:600,letterSpacing:'-.01em',lineHeight:1.3,marginBottom:'var(--s2)'}}>{t.title}</h3>
                  <p style={{fontFamily:'var(--ff-b)',fontSize:13,color:'var(--ink-d)',lineHeight:1.55}}>{t.desc}</p>
                </div>
                <div style={{flexShrink:0,textAlign:'right'}}>
                  <div style={{fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)'}}>{t.readTime} min</div>
                  <div style={{fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ac)',marginTop:4}}>Lire →</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tags + Plus lus ──────────────────────────────── */}
      <section className="band">
        <div className="wrap">
          <div className="two-col">
            <div>
              <SecHead label="Explorer" title="Tous les tags"/>
              <div style={{display:'flex',flexWrap:'wrap',gap:'var(--s2)'}}>
                {TAGS.map(t=>(
                  <button key={t} onClick={()=>nav('/actus?q='+encodeURIComponent(t))} className="tag" style={{cursor:'pointer',fontSize:11,padding:'4px 8px'}}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <SecHead label="Popularité" title="Les plus lus"/>
              {topRead.map((a,i)=><ArticleRow key={a.id} a={a} nav={nav} rank={i+1}/>)}
            </div>
          </div>
        </div>
      </section>

      {/* ── Newsletter ───────────────────────────────────── */}
      <section style={{borderTop:'1px solid var(--ac)',background:'var(--bg-d)',padding:'var(--s9) 0',position:'relative',overflow:'hidden'}}>
        <PatBg op={0.3}/>
        <div className="wrap" style={{position:'relative',zIndex:1}}>
          <div style={{maxWidth:560,margin:'0 auto',textAlign:'center',display:'flex',flexDirection:'column',gap:'var(--s5)',alignItems:'center'}}>
            <span style={{fontFamily:'var(--ff-m)',fontSize:10,textTransform:'uppercase',letterSpacing:'.12em',color:'var(--ac)',border:'1px solid var(--ac)',padding:'3px 10px'}}>Newsletter hebdo</span>
            <h2 style={{fontFamily:'var(--ff-h)',fontSize:'clamp(28px,4vw,40px)',fontWeight:700,letterSpacing:'-.025em',lineHeight:1.1}}>L'IA de la semaine, condensée.</h2>
            <p style={{fontFamily:'var(--ff-b)',fontSize:17,color:'var(--ink-d)',lineHeight:1.72}}>
              Chaque vendredi — actus majeures, tutos récents, chiffres clés. Aucun tracker. Désabonnement en un clic.
            </p>
            {subbed ? (
              <div style={{fontFamily:'var(--ff-m)',fontSize:14,color:'var(--ok)',border:'1px solid var(--ok)',padding:'var(--s3) var(--s6)'}}>✓ Inscription confirmée — à vendredi !</div>
            ) : (
              <form onSubmit={e=>{e.preventDefault();email&&setSubbed(true)}} style={{display:'flex',gap:'var(--s3)',width:'100%',maxWidth:420}}>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="votre@email.fr" className="inp" style={{flex:1}} required/>
                <button type="submit" className="btn btn-p btn-lg" style={{flexShrink:0}}>S'abonner</button>
              </form>
            )}
            <span style={{fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)'}}>4 231 abonnés · Dernier envoi : vendredi 13 juin</span>
          </div>
        </div>
      </section>
    </div>
  );
};

Object.assign(window, { PageHome });
