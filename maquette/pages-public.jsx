// pages-public.jsx — 11 pages publiques
const { useState, useEffect, useRef } = React;

/* ── Toutes les actus ───────────────────────────────────── */
const PageActus = ({ nav }) => {
  const [cat,setCat]   = useState('');
  const [src,setSrc]   = useState('');
  const [q,setQ]       = useState('');
  const [page,setPage] = useState(1);
  const PER = 6;
  const filtered = ARTICLES.filter(a=>{
    if(cat&&a.cat!==cat)return false;
    if(q&&!a.title.toLowerCase().includes(q.toLowerCase())&&!a.tags.some(t=>t.toLowerCase().includes(q.toLowerCase())))return false;
    return true;
  });
  const total = Math.ceil(filtered.length/PER);
  const shown = filtered.slice((page-1)*PER,page*PER);
  return (
    <div>
      <div className="band-deep" style={{padding:'var(--s7) 0',borderBottom:'1px solid var(--ln)'}}>
        <div className="wrap">
          <h1 style={{fontFamily:'var(--ff-h)',fontSize:'clamp(28px,4vw,42px)',fontWeight:700,letterSpacing:'-.025em',marginBottom:'var(--s2)'}}>Toutes les actus</h1>
          <p style={{fontFamily:'var(--ff-b)',fontSize:16,color:'var(--ink-d)'}}>{ARTICLES.length} articles · mis à jour en continu</p>
        </div>
      </div>
      <div className="band">
        <div className="wrap">
          {/* Filtres */}
          <div style={{display:'flex',gap:'var(--s3)',marginBottom:'var(--s7)',flexWrap:'wrap',alignItems:'center'}}>
            <input value={q} onChange={e=>{setQ(e.target.value);setPage(1)}} placeholder="Rechercher…" className="inp inp-sm" style={{width:220}}/>
            <select value={cat} onChange={e=>{setCat(e.target.value);setPage(1)}} className="inp inp-sm" style={{width:'auto'}}>
              <option value="">Toutes catégories</option>
              {Object.entries(CATS).map(([k,c])=><option key={k} value={k}>{c.label}</option>)}
            </select>
            {(cat||q)&&<button onClick={()=>{setCat('');setQ('');setPage(1)}} className="btn btn-sm btn-g" style={{color:'var(--ink-f)'}}>× Réinitialiser</button>}
            <span style={{fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)',marginLeft:'auto'}}>{filtered.length} résultats</span>
          </div>
          {/* Tags rapides */}
          <div style={{display:'flex',gap:'var(--s2)',flexWrap:'wrap',marginBottom:'var(--s6)'}}>
            {Object.entries(CATS).map(([k,c])=>(
              <button key={k} onClick={()=>{setCat(cat===k?'':k);setPage(1)}} className={`tag ${c.cls}`} style={{cursor:'pointer',padding:'4px 10px',fontSize:11,background:cat===k?c.color:'',color:cat===k?'var(--bg-d)':''}}>{c.label}</button>
            ))}
          </div>
          {/* Grid */}
          {shown.length===0 ? (
            <div style={{textAlign:'center',padding:'var(--s9)',color:'var(--ink-f)',fontFamily:'var(--ff-m)',fontSize:14}}>Aucun article correspondant.</div>
          ) : (
            <div className="mag" style={{marginBottom:'var(--s7)'}}>
              {shown.map(a=><ArticleCard key={a.id} a={a} nav={nav}/>)}
            </div>
          )}
          {/* Pagination */}
          {total>1&&(
            <div style={{display:'flex',gap:'var(--s2)',justifyContent:'center'}}>
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="btn btn-sm" style={{opacity:page===1?.4:1}}>← Préc.</button>
              {Array.from({length:total},(_,i)=>i+1).map(p=>(
                <button key={p} onClick={()=>setPage(p)} className={`btn btn-sm${page===p?' btn-p':''}`}>{p}</button>
              ))}
              <button onClick={()=>setPage(p=>Math.min(total,p+1))} disabled={page===total} className="btn btn-sm" style={{opacity:page===total?.4:1}}>Suiv. →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Tutos ──────────────────────────────────────────────── */
const PageTutos = ({ nav }) => {
  const [diff,setDiff] = useState('');
  const filtered = TUTOS.filter(t=>!diff||t.diff===diff);
  return (
    <div>
      <div className="band-deep" style={{padding:'var(--s7) 0',borderBottom:'1px solid var(--ln)'}}>
        <div className="wrap">
          <h1 style={{fontFamily:'var(--ff-h)',fontSize:'clamp(28px,4vw,42px)',fontWeight:700,letterSpacing:'-.025em',marginBottom:'var(--s2)'}}>Tutoriels pratiques</h1>
          <p style={{fontFamily:'var(--ff-b)',fontSize:16,color:'var(--ink-d)'}}>Guides écrits à la main. Du code qui tourne vraiment.</p>
        </div>
      </div>
      <div className="band">
        <div className="wrap">
          <div style={{display:'flex',gap:'var(--s3)',marginBottom:'var(--s7)',flexWrap:'wrap'}}>
            {['','débutant','intermédiaire','avancé'].map(d=>(
              <button key={d} onClick={()=>setDiff(d)} className={`btn btn-sm${diff===d?' btn-p':''}`}>{d||'Tous niveaux'}</button>
            ))}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'var(--s5)'}}>
            {filtered.map(t=>(
              <article key={t.id} style={{display:'grid',gridTemplateColumns:'80px 1fr auto',gap:'var(--s5)',padding:'var(--s6)',background:'var(--bg-r)',border:'1px solid var(--ln)',cursor:'pointer',alignItems:'start',transition:'transform var(--d),box-shadow var(--d)'}}
                onClick={()=>nav('/tutos')}
                onMouseEnter={e=>{e.currentTarget.style.transform='translate(-2px,-2px)';e.currentTarget.style.boxShadow='var(--sha)'}}
                onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=''}}
              >
                <div style={{textAlign:'center',paddingTop:'var(--s2)'}}>
                  <div style={{fontFamily:'var(--ff-m)',fontSize:28,fontWeight:700,color:'var(--ac)',lineHeight:1}}>{String(t.id).padStart(2,'0')}</div>
                  <div style={{fontFamily:'var(--ff-m)',fontSize:10,color:'var(--ink-f)',marginTop:4}}>{t.readTime} min</div>
                </div>
                <div>
                  <div style={{display:'flex',gap:'var(--s2)',marginBottom:'var(--s3)',flexWrap:'wrap',alignItems:'center'}}>
                    <span style={{fontFamily:'var(--ff-m)',fontSize:10,padding:'2px 6px',border:'1px solid currentColor',textTransform:'uppercase',letterSpacing:'.08em',color:t.diff==='avancé'?'var(--wn)':t.diff==='débutant'?'var(--ok)':'var(--ac)'}}>{t.diff}</span>
                    {t.tags.map(tg=><span key={tg} className="tag">{tg}</span>)}
                  </div>
                  <h2 style={{fontFamily:'var(--ff-h)',fontSize:18,fontWeight:600,letterSpacing:'-.01em',lineHeight:1.3,marginBottom:'var(--s3)'}}>{t.title}</h2>
                  <p style={{fontFamily:'var(--ff-b)',fontSize:14,color:'var(--ink-d)',lineHeight:1.6}}>{t.desc}</p>
                  <div style={{fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)',marginTop:'var(--s3)'}}>{new Date(t.date).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</div>
                </div>
                <div style={{fontFamily:'var(--ff-m)',fontSize:12,color:'var(--ac)',paddingTop:'var(--s2)',whiteSpace:'nowrap'}}>Lire →</div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Glossaire ──────────────────────────────────────────── */
const PageGlossaire = ({ nav }) => {
  const [q,setQ] = useState('');
  const [letter,setLetter] = useState('');
  const letters = [...new Set(GLOSSARY.map(g=>g.term[0]))].sort();
  const filtered = GLOSSARY.filter(g=>{
    if(letter&&g.term[0]!==letter)return false;
    if(q&&!g.term.toLowerCase().includes(q.toLowerCase())&&!g.full.toLowerCase().includes(q.toLowerCase()))return false;
    return true;
  });
  return (
    <div>
      <div className="band-deep" style={{padding:'var(--s7) 0',borderBottom:'1px solid var(--ln)'}}>
        <div className="wrap">
          <h1 style={{fontFamily:'var(--ff-h)',fontSize:'clamp(28px,4vw,42px)',fontWeight:700,letterSpacing:'-.025em',marginBottom:'var(--s2)'}}>Glossaire IA</h1>
          <p style={{fontFamily:'var(--ff-b)',fontSize:16,color:'var(--ink-d)'}}>Les termes essentiels, expliqués simplement.</p>
        </div>
      </div>
      <div className="band">
        <div className="wrap">
          <div style={{display:'flex',gap:'var(--s3)',marginBottom:'var(--s5)',flexWrap:'wrap',alignItems:'center'}}>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Chercher un terme…" className="inp inp-sm" style={{width:260}}/>
            <div style={{display:'flex',gap:'var(--s1)',flexWrap:'wrap'}}>
              <button onClick={()=>setLetter('')} className={`btn btn-sm${!letter?' btn-p':''}`}>Tous</button>
              {letters.map(l=><button key={l} onClick={()=>setLetter(letter===l?'':l)} className={`btn btn-sm${letter===l?' btn-p':''}`}>{l}</button>)}
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'var(--s1)'}}>
            {filtered.map(g=>(
              <div key={g.term} style={{padding:'var(--s5)',background:'var(--bg-r)',border:'1px solid var(--ln)',display:'grid',gridTemplateColumns:'120px 1fr',gap:'var(--s5)',alignItems:'start'}}>
                <div>
                  <div style={{fontFamily:'var(--ff-m)',fontSize:16,fontWeight:700,color:'var(--ac)',letterSpacing:'-.01em'}}>{g.term}</div>
                  <div style={{fontFamily:'var(--ff-m)',fontSize:10,color:'var(--ink-f)',marginTop:4,lineHeight:1.4}}>{g.full}</div>
                </div>
                <p style={{fontFamily:'var(--ff-b)',fontSize:15,lineHeight:1.65,color:'var(--ink-d)'}}>{g.def}</p>
              </div>
            ))}
            {filtered.length===0&&<div style={{textAlign:'center',padding:'var(--s7)',color:'var(--ink-f)',fontFamily:'var(--ff-m)',fontSize:13}}>Aucun terme trouvé.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Cette semaine ──────────────────────────────────────── */
const PageCetteSemaine = ({ nav }) => {
  const days = ['Lundi 9 juin','Mardi 10 juin','Mercredi 11 juin','Jeudi 12 juin','Vendredi 13 juin','Samedi 14 juin'];
  const byDay = days.map((d,i)=>({ day:d, articles:ARTICLES.filter((_,j)=>j>=i&&j<i+2) }));
  return (
    <div>
      <div className="band-deep" style={{padding:'var(--s7) 0',borderBottom:'1px solid var(--ln)'}}>
        <div className="wrap">
          <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:'var(--s4)'}}>
            <div>
              <h1 style={{fontFamily:'var(--ff-h)',fontSize:'clamp(28px,4vw,42px)',fontWeight:700,letterSpacing:'-.025em',marginBottom:'var(--s2)'}}>Cette semaine</h1>
              <p style={{fontFamily:'var(--ff-b)',fontSize:16,color:'var(--ink-d)'}}>Semaine du 9 au 14 juin 2026</p>
            </div>
            <div style={{display:'flex',gap:'var(--s5)',flexWrap:'wrap'}}>
              {[['42','Articles'],['8','Sources'],['28 k','Vues'],['4 231','Abonnés']].map(([v,l])=>(
                <div key={l} style={{textAlign:'center'}}>
                  <div style={{fontFamily:'var(--ff-h)',fontSize:28,fontWeight:700,color:'var(--ac)',letterSpacing:'-.02em'}}>{v}</div>
                  <div style={{fontFamily:'var(--ff-m)',fontSize:10,color:'var(--ink-f)',textTransform:'uppercase',letterSpacing:'.08em'}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="band">
        <div className="wrap">
          {byDay.map(({ day, articles })=>(
            <div key={day} style={{marginBottom:'var(--s8)'}}>
              <div style={{fontFamily:'var(--ff-m)',fontSize:12,fontWeight:600,color:'var(--ac)',marginBottom:'var(--s4)',borderLeft:'2px solid var(--ac)',paddingLeft:'var(--s3)',letterSpacing:'.04em'}}>{day}</div>
              {articles.length===0 ? (
                <div style={{fontFamily:'var(--ff-m)',fontSize:12,color:'var(--ink-f)',padding:'var(--s4) 0'}}>Aucune publication ce jour.</div>
              ) : (
                articles.map(a=><ArticleRow key={a.id} a={a} nav={nav}/>)
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Tendances ──────────────────────────────────────────── */
const PageTendances = ({ nav }) => {
  const trends = [
    {tag:'GPT-5',cat:'llm',vol:1840,delta:+42},
    {tag:'Humanoïdes',cat:'robotics',vol:980,delta:+28},
    {tag:'Open-source LLM',cat:'llm',vol:760,delta:+19},
    {tag:'MCP',cat:'tools',vol:540,delta:+67},
    {tag:'AI Act',cat:'policy',vol:490,delta:+12},
    {tag:'Fine-tuning',cat:'llm',vol:420,delta:-5},
    {tag:'RAG',cat:'research',vol:380,delta:+8},
    {tag:'LoRA',cat:'tools',vol:310,delta:+3},
  ];
  const maxVol = Math.max(...trends.map(t=>t.vol));
  return (
    <div>
      <div className="band-deep" style={{padding:'var(--s7) 0',borderBottom:'1px solid var(--ln)'}}>
        <div className="wrap">
          <h1 style={{fontFamily:'var(--ff-h)',fontSize:'clamp(28px,4vw,42px)',fontWeight:700,letterSpacing:'-.025em',marginBottom:'var(--s2)'}}>Tendances</h1>
          <p style={{fontFamily:'var(--ff-b)',fontSize:16,color:'var(--ink-d)'}}>Les sujets les plus discutés cette semaine dans l'écosystème IA.</p>
        </div>
      </div>
      <div className="band">
        <div className="wrap">
          <div style={{display:'flex',flexDirection:'column',gap:'var(--s3)'}}>
            {trends.map((t,i)=>{
              const c = CATS[t.cat]||{color:'var(--ink-f)',cls:''};
              return (
                <div key={t.tag} onClick={()=>nav('/actus?q='+encodeURIComponent(t.tag))} style={{display:'flex',alignItems:'center',gap:'var(--s5)',padding:'var(--s4) var(--s5)',background:'var(--bg-r)',border:'1px solid var(--ln)',cursor:'pointer',transition:'transform var(--d),box-shadow var(--d)'}}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translate(-2px,-2px)';e.currentTarget.style.boxShadow='var(--sha)'}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=''}}
                >
                  <span style={{fontFamily:'var(--ff-m)',fontSize:18,fontWeight:700,color:'var(--ln-h)',width:32,textAlign:'right',flexShrink:0}}>{i+1}</span>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:'var(--s3)',marginBottom:4}}>
                      <span style={{fontFamily:'var(--ff-h)',fontSize:16,fontWeight:600}}>{t.tag}</span>
                      <span className={`tag ${c.cls}`}>{CATS[t.cat]?.label||t.cat}</span>
                    </div>
                    <div style={{height:6,background:'var(--bg-d)',position:'relative',overflow:'hidden'}}>
                      <div style={{position:'absolute',left:0,top:0,height:'100%',width:(t.vol/maxVol*100)+'%',background:c.color,transition:'width 0.6s var(--ease)'}}/>
                    </div>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontFamily:'var(--ff-m)',fontSize:13,fontWeight:600}}>{t.vol.toLocaleString()}</div>
                    <div style={{fontFamily:'var(--ff-m)',fontSize:11,color:t.delta>0?'var(--ok)':'var(--er)'}}>{t.delta>0?'↑':'↓'}{Math.abs(t.delta)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Recherche ──────────────────────────────────────────── */
const PageRecherche = ({ nav }) => {
  const [q,setQ]     = useState('');
  const [done,setDone]= useState(false);
  const results = done ? ARTICLES.filter(a=>q&&(a.title.toLowerCase().includes(q.toLowerCase())||a.tags.some(t=>t.toLowerCase().includes(q.toLowerCase())))) : [];
  const handleSearch = e => { e.preventDefault(); setDone(true); };
  return (
    <div>
      <div className="band-deep" style={{padding:'var(--s7) 0',borderBottom:'1px solid var(--ln)'}}>
        <div className="wrap">
          <h1 style={{fontFamily:'var(--ff-h)',fontSize:'clamp(28px,4vw,42px)',fontWeight:700,letterSpacing:'-.025em',marginBottom:'var(--s5)'}}>Recherche</h1>
          <form onSubmit={handleSearch} style={{display:'flex',gap:'var(--s3)',maxWidth:600}}>
            <input value={q} onChange={e=>{setQ(e.target.value);setDone(false)}} placeholder="Chercher un sujet, un outil, un modèle…" className="inp" style={{flex:1,fontSize:16}}/>
            <button type="submit" className="btn btn-p btn-lg" style={{flexShrink:0}}>Rechercher</button>
          </form>
        </div>
      </div>
      <div className="band">
        <div className="wrap">
          {done && q && (
            <>
              <div style={{fontFamily:'var(--ff-m)',fontSize:12,color:'var(--ink-f)',marginBottom:'var(--s5)'}}>
                {results.length} résultat{results.length!==1?'s':''} pour « {q} »
              </div>
              {results.length===0 ? (
                <div style={{textAlign:'center',padding:'var(--s9) 0',fontFamily:'var(--ff-m)',fontSize:14,color:'var(--ink-f)'}}>
                  Aucun résultat. Essayez un terme différent ou consultez le <button onClick={()=>nav('/glossaire')} className="btn-g" style={{color:'var(--ac)',fontFamily:'var(--ff-m)',fontSize:14,border:'none',cursor:'pointer',padding:0,background:'none'}}>glossaire</button>.
                </div>
              ) : (
                <div style={{display:'flex',flexDirection:'column',gap:0}}>
                  {results.map(a=><ArticleRow key={a.id} a={a} nav={nav}/>)}
                </div>
              )}
            </>
          )}
          {!done&&<div style={{fontFamily:'var(--ff-m)',fontSize:12,color:'var(--ink-f)'}}>Entrez votre recherche ci-dessus · ⌘K pour la palette de commandes</div>}
        </div>
      </div>
    </div>
  );
};

/* ── Sources ────────────────────────────────────────────── */
const PageSources = ({ nav }) => (
  <div>
    <div className="band-deep" style={{padding:'var(--s7) 0',borderBottom:'1px solid var(--ln)'}}>
      <div className="wrap">
        <h1 style={{fontFamily:'var(--ff-h)',fontSize:'clamp(28px,4vw,42px)',fontWeight:700,letterSpacing:'-.025em',marginBottom:'var(--s2)'}}>Sources</h1>
        <p style={{fontFamily:'var(--ff-b)',fontSize:16,color:'var(--ink-d)'}}>Les {SOURCES.length} flux RSS que nous suivons. Aucune sélection opaque.</p>
      </div>
    </div>
    <div className="band">
      <div className="wrap">
        <div className="mag" style={{marginBottom:'var(--s7)'}}>
          {SOURCES.map(s=>{
            const c = CATS[s.cat]||{color:'var(--ink-f)',cls:''};
            const hc = s.health==='ok'?'var(--ok)':s.health==='warn'?'var(--wn)':'var(--er)';
            return (
              <div key={s.id} style={{background:'var(--bg-r)',border:'1px solid var(--ln)',padding:'var(--s5)',display:'flex',flexDirection:'column',gap:'var(--s3)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <span className={`tag ${c.cls}`}>{CATS[s.cat]?.label||s.cat}</span>
                  <span style={{display:'flex',alignItems:'center',gap:5,fontFamily:'var(--ff-m)',fontSize:10,color:hc}}>
                    <span style={{width:7,height:7,borderRadius:'50%',background:hc,display:'inline-block'}}/>
                    {s.health==='ok'?'Opérationnel':s.health==='warn'?'Lent':'Erreur'}
                  </span>
                </div>
                <div style={{fontFamily:'var(--ff-h)',fontSize:16,fontWeight:600}}>{s.name}</div>
                <div style={{display:'flex',justifyContent:'space-between',fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)'}}>
                  <span>Dernière synchro : {s.last}</span>
                  <span style={{color:'var(--ac)'}}>{s.count} articles</span>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{padding:'var(--s5)',background:'var(--bg-d)',border:'1px solid var(--ln)',fontFamily:'var(--ff-b)',fontSize:15,color:'var(--ink-d)',lineHeight:1.7}}>
          Vous connaissez une source de qualité que nous manquons ? <button onClick={()=>nav('/contact')} className="btn-g" style={{color:'var(--ac)',fontFamily:'var(--ff-b)',fontSize:15,border:'none',cursor:'pointer',padding:0,background:'none',textDecoration:'underline',textUnderlineOffset:3}}>Suggérez-la via le formulaire de contact.</button>
        </div>
      </div>
    </div>
  </div>
);

/* ── À propos ───────────────────────────────────────────── */
const PageAPropos = ({ nav }) => (
  <div>
    <div className="band-deep" style={{padding:'var(--s7) 0',borderBottom:'1px solid var(--ln)'}}>
      <div className="wrap-n">
        <span style={{fontFamily:'var(--ff-m)',fontSize:10,textTransform:'uppercase',letterSpacing:'.12em',color:'var(--ac)',border:'1px solid var(--ac)',padding:'3px 10px',marginBottom:'var(--s5)',display:'inline-block'}}>Éditorial</span>
        <h1 style={{fontFamily:'var(--ff-h)',fontSize:'clamp(30px,5vw,52px)',fontWeight:700,letterSpacing:'-.025em',lineHeight:1.1,marginTop:'var(--s4)',marginBottom:'var(--s4)'}}>
          L'essentiel de l'IA,<br/>trié, sans bruit.
        </h1>
        <p style={{fontFamily:'var(--ff-b)',fontSize:18,color:'var(--ink-d)',lineHeight:1.72}}>signal·ia est un média de veille indépendant, sans publicité, sans traceurs. Notre promesse : vous donner ce qui compte, sans le reste.</p>
      </div>
    </div>
    <div className="band">
      <div className="wrap-n">
        <div className="prose">
          <h2>Pourquoi signal·ia</h2>
          <p>Le bruit dans l'écosystème IA est devenu insupportable. Chaque jour, des dizaines d'annonces, de benchmarks, de controverses. La majorité n'a aucune importance concrète pour ceux qui construisent ou qui veulent comprendre.</p>
          <p>signal·ia existe pour filtrer ce bruit. Chaque article publié répond à une question simple : est-ce que ça change quelque chose pour un développeur ou un curieux sérieux ? Si non, on ne le publie pas.</p>
          <h2>Notre fonctionnement</h2>
          <p>Les actus sont collectées automatiquement via un pipeline de sources RSS, résumées par un modèle de langage, puis relues et validées manuellement avant publication. Chaque article cite ses sources.</p>
          <p>Les tutoriels sont écrits à la main, testés, et mis à jour. Pas de contenu généré à la chaîne.</p>
          <h2>Indépendance</h2>
          <p>signal·ia ne dépend d'aucun investisseur, d'aucune régie publicitaire, d'aucune entreprise du secteur dont nous rendons compte. Le site est financé par la newsletter et d'éventuelles formules premium à venir.</p>
          <blockquote>
            « Sobre, crédible, sans pub ni traceurs. » C'est à la fois notre promesse éditoriale et notre modèle technique.
          </blockquote>
          <h2>Contact</h2>
          <p>Pour suggérer une source, signaler une erreur ou poser une question, utilisez le <button onClick={()=>nav('/contact')} style={{color:'var(--ac)',background:'none',border:'none',cursor:'pointer',fontFamily:'var(--ff-b)',fontSize:'inherit',textDecoration:'underline',textUnderlineOffset:3,padding:0}}>formulaire de contact</button>. Nous lisons tous les messages.</p>
        </div>
      </div>
    </div>
  </div>
);

/* ── Contact ────────────────────────────────────────────── */
const PageContact = ({ nav }) => {
  const [form,setForm] = useState({name:'',email:'',subject:'',message:''});
  const [sent,setSent] = useState(false);
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const submit = e => { e.preventDefault(); if(form.name&&form.email&&form.message) setSent(true); };
  return (
    <div>
      <div className="band-deep" style={{padding:'var(--s7) 0',borderBottom:'1px solid var(--ln)'}}>
        <div className="wrap-n">
          <h1 style={{fontFamily:'var(--ff-h)',fontSize:'clamp(28px,4vw,42px)',fontWeight:700,letterSpacing:'-.025em',marginBottom:'var(--s2)'}}>Contact</h1>
          <p style={{fontFamily:'var(--ff-b)',fontSize:16,color:'var(--ink-d)'}}>Suggestion de source, erreur à signaler, question éditoriale — on lit tout.</p>
        </div>
      </div>
      <div className="band">
        <div className="wrap-n">
          {sent ? (
            <div style={{textAlign:'center',padding:'var(--s9) 0',display:'flex',flexDirection:'column',alignItems:'center',gap:'var(--s4)'}}>
              <div style={{fontFamily:'var(--ff-m)',fontSize:32,color:'var(--ok)'}}>✓</div>
              <h2 style={{fontFamily:'var(--ff-h)',fontSize:24,fontWeight:700}}>Message envoyé</h2>
              <p style={{fontFamily:'var(--ff-b)',fontSize:16,color:'var(--ink-d)'}}>Merci. Nous répondons généralement sous 48 h.</p>
              <button onClick={()=>nav('/')} className="btn" style={{marginTop:'var(--s3)'}}>← Retour à l'accueil</button>
            </div>
          ) : (
            <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:'var(--s4)',maxWidth:560}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'var(--s4)'}}>
                <div style={{display:'flex',flexDirection:'column',gap:'var(--s2)'}}>
                  <label style={{fontFamily:'var(--ff-m)',fontSize:11,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--ink-f)'}}>Prénom / Pseudo *</label>
                  <input value={form.name} onChange={set('name')} className="inp" required placeholder="Ada"/>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'var(--s2)'}}>
                  <label style={{fontFamily:'var(--ff-m)',fontSize:11,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--ink-f)'}}>Email *</label>
                  <input type="email" value={form.email} onChange={set('email')} className="inp" required placeholder="ada@exemple.fr"/>
                </div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'var(--s2)'}}>
                <label style={{fontFamily:'var(--ff-m)',fontSize:11,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--ink-f)'}}>Sujet</label>
                <select value={form.subject} onChange={set('subject')} className="inp">
                  <option value="">Choisir…</option>
                  {['Suggestion de source','Erreur factuelle','Question éditoriale','Proposition de collaboration','Autre'].map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'var(--s2)'}}>
                <label style={{fontFamily:'var(--ff-m)',fontSize:11,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--ink-f)'}}>Message *</label>
                <textarea value={form.message} onChange={set('message')} className="inp" required placeholder="Votre message…" style={{minHeight:140,resize:'vertical',fontFamily:'var(--ff-b)',lineHeight:1.65}}/>
              </div>
              <button type="submit" className="btn btn-p btn-lg" style={{alignSelf:'flex-start'}}>Envoyer le message</button>
              <p style={{fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)'}}>Aucun tracker. Votre email n'est jamais partagé.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Favoris ────────────────────────────────────────────── */
const PageFavoris = ({ nav }) => {
  const [favIds,setFavIds] = useState(()=>JSON.parse(localStorage.getItem('sig-fav')||'[]'));
  const favs = ARTICLES.filter(a=>favIds.includes(a.id));
  const remove = id => {
    const next = favIds.filter(x=>x!==id);
    localStorage.setItem('sig-fav',JSON.stringify(next));
    setFavIds(next);
  };
  return (
    <div>
      <div className="band-deep" style={{padding:'var(--s7) 0',borderBottom:'1px solid var(--ln)'}}>
        <div className="wrap">
          <h1 style={{fontFamily:'var(--ff-h)',fontSize:'clamp(28px,4vw,42px)',fontWeight:700,letterSpacing:'-.025em',marginBottom:'var(--s2)'}}>Favoris</h1>
          <p style={{fontFamily:'var(--ff-b)',fontSize:16,color:'var(--ink-d)'}}>{favs.length} article{favs.length!==1?'s':''} sauvegardé{favs.length!==1?'s':''}. Stockage local, aucun compte requis.</p>
        </div>
      </div>
      <div className="band">
        <div className="wrap">
          {favs.length===0 ? (
            <div style={{textAlign:'center',padding:'var(--s9) 0',display:'flex',flexDirection:'column',alignItems:'center',gap:'var(--s4)'}}>
              <span style={{fontFamily:'var(--ff-m)',fontSize:48,color:'var(--ln-h)'}}>♡</span>
              <h2 style={{fontFamily:'var(--ff-h)',fontSize:20,fontWeight:600,color:'var(--ink-d)'}}>Aucun favori pour l'instant</h2>
              <p style={{fontFamily:'var(--ff-b)',fontSize:15,color:'var(--ink-f)',maxWidth:320,lineHeight:1.6}}>Cliquez sur « Sauvegarder » dans n'importe quel article pour le retrouver ici.</p>
              <button onClick={()=>nav('/actus')} className="btn btn-p" style={{marginTop:'var(--s3)'}}>Explorer les actus</button>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:0}}>
              {favs.map(a=>(
                <div key={a.id} style={{display:'flex',alignItems:'center',gap:'var(--s4)',padding:'var(--s4) 0',borderBottom:'1px solid var(--ln)'}}>
                  <div style={{flex:1,cursor:'pointer'}} onClick={()=>nav('/article/'+a.id)}>
                    <ArticleRow a={a} nav={nav}/>
                  </div>
                  <button onClick={()=>remove(a.id)} className="btn btn-sm btn-g" style={{color:'var(--ink-f)',flexShrink:0}}>× Retirer</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── 404 ────────────────────────────────────────────────── */
const Page404 = ({ nav }) => (
  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',textAlign:'center',padding:'var(--s9) var(--s5)'}}>
    <div style={{fontFamily:'var(--ff-m)',fontSize:96,fontWeight:700,color:'var(--ln-h)',lineHeight:1,letterSpacing:'-.04em',marginBottom:'var(--s4)'}}>404</div>
    <h1 style={{fontFamily:'var(--ff-h)',fontSize:28,fontWeight:700,letterSpacing:'-.02em',marginBottom:'var(--s4)'}}>Page introuvable</h1>
    <p style={{fontFamily:'var(--ff-b)',fontSize:16,color:'var(--ink-d)',maxWidth:380,lineHeight:1.7,marginBottom:'var(--s6)'}}>
      Cette page n'existe pas ou a été déplacée. Utilisez la navigation ou la recherche pour trouver ce que vous cherchez.
    </p>
    <div style={{display:'flex',gap:'var(--s3)',flexWrap:'wrap',justifyContent:'center'}}>
      <button onClick={()=>nav('/')} className="btn btn-p btn-lg">← Accueil</button>
      <button onClick={()=>nav('/actus')} className="btn btn-lg">Toutes les actus</button>
    </div>
  </div>
);

Object.assign(window, {
  PageActus, PageTutos, PageGlossaire, PageCetteSemaine, PageTendances,
  PageRecherche, PageSources, PageAPropos, PageContact, PageFavoris, Page404,
});
