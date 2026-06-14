// admin-shared.jsx — Composants back-office
// Exports: AdminLayout, AdminSidebar, MetricCard, StatusBadge, AdminPageHeader, Sparkline

const { useState } = React;

const ADMIN_NAV = [
  { section:'Contenu', items:[
    { l:'Dashboard',   p:'/admin',              i:'◉' },
    { l:'Articles',    p:'/admin/articles',     i:'◈' },
    { l:'Éditeur',     p:'/admin/editeur',      i:'⊗' },
    { l:'Pipeline',    p:'/admin/pipeline',     i:'⊂' },
  ]},
  { section:'Audience', items:[
    { l:'Newsletter',  p:'/admin/newsletter',   i:'◎' },
    { l:'Messages',    p:'/admin/messages',     i:'◷' },
    { l:'Analytics',   p:'/admin/analytics',    i:'↑' },
  ]},
  { section:'Système', items:[
    { l:'Tags',        p:'/admin/tags',         i:'#' },
    { l:'Sources RSS', p:'/admin/sources',      i:'⊚' },
    { l:'Réglages',    p:'/admin/reglages',     i:'⚙' },
    { l:'Sauvegarde',  p:'/admin/backup',       i:'⊞' },
  ]},
];

const getAdminLabel = p => {
  for (const g of ADMIN_NAV) for (const it of g.items) if (it.p===p) return it.l;
  if (p.startsWith('/admin/editeur')) return 'Éditeur';
  return 'Admin';
};

/* ── Sidebar ────────────────────────────────────────────── */
const AdminSidebar = ({ path, nav, open, onClose }) => (
  <>
    <div className={`adm-over${open?' show':''}`} onClick={onClose}/>
    <aside className={`adm-side${open?' open':''}`}>
      <div style={{padding:'var(--s4) var(--s5)',borderBottom:'1px solid var(--ln)',flexShrink:0}}>
        <button onClick={()=>nav('/')} style={{fontFamily:'var(--ff-h)',fontWeight:700,fontSize:17,letterSpacing:'-.03em',padding:0,minHeight:36,background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:8}}>
          <span style={{color:'var(--ac)'}}>signal</span>·ia
          <span style={{fontFamily:'var(--ff-m)',fontSize:9,color:'var(--ink-f)',border:'1px solid var(--ln)',padding:'1px 5px',letterSpacing:'.08em',textTransform:'uppercase'}}>ADMIN</span>
        </button>
      </div>
      <nav style={{flex:1,padding:'var(--s3) 0',overflowY:'auto'}}>
        {ADMIN_NAV.map(g=>(
          <div key={g.section} style={{marginBottom:'var(--s3)'}}>
            <div style={{fontFamily:'var(--ff-m)',fontSize:9,textTransform:'uppercase',letterSpacing:'.12em',color:'var(--ink-f)',padding:'var(--s2) var(--s5)',marginBottom:2}}>
              {g.section}
            </div>
            {g.items.map(it=>{
              const on = path===it.p || (it.p!=='/admin' && path.startsWith(it.p));
              return (
                <button key={it.p} onClick={()=>{nav(it.p);onClose&&onClose()}}
                  style={{width:'100%',display:'flex',alignItems:'center',gap:'var(--s3)',padding:'8px var(--s5)',background:on?'var(--bg-r)':'none',border:'none',borderLeft:on?'2px solid var(--ac)':'2px solid transparent',cursor:'pointer',color:on?'var(--ink)':'var(--ink-d)',fontFamily:'var(--ff-h)',fontSize:13,fontWeight:on?600:400,minHeight:36,transition:'background var(--d),color var(--d)',textAlign:'left'}}
                  onMouseEnter={e=>{if(!on)e.currentTarget.style.background='var(--bg-r)'}}
                  onMouseLeave={e=>{if(!on)e.currentTarget.style.background='none'}}
                >
                  <span style={{fontFamily:'var(--ff-m)',fontSize:12,color:on?'var(--ac)':'var(--ink-f)',width:16,textAlign:'center',flexShrink:0}}>{it.i}</span>
                  {it.l}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <div style={{padding:'var(--s3) var(--s5)',borderTop:'1px solid var(--ln)',flexShrink:0}}>
        <button onClick={()=>nav('/')} style={{fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)',background:'none',border:'none',cursor:'pointer',minHeight:36,padding:0,display:'flex',alignItems:'center',gap:6}}>
          ← site public
        </button>
      </div>
    </aside>
  </>
);

/* ── AdminLayout ────────────────────────────────────────── */
const AdminLayout = ({ children, path, nav, theme, toggleTheme }) => {
  const [mob,setMob]=useState(false);
  return (
    <div className="adm-wrap">
      <AdminSidebar path={path} nav={nav} open={mob} onClose={()=>setMob(false)}/>
      <div className="adm-main">
        <header style={{height:52,borderBottom:'1px solid var(--ln)',display:'flex',alignItems:'center',padding:'0 var(--s5)',gap:'var(--s4)',background:'var(--bg-d)',position:'sticky',top:0,zIndex:100,flexShrink:0}}>
          <button className="hd" onClick={()=>setMob(true)} style={{width:44,height:44,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,background:'none',border:'none',cursor:'pointer'}}>≡</button>
          <div style={{flex:1,fontFamily:'var(--ff-m)',fontSize:12,color:'var(--ink-d)'}}>
            <span style={{color:'var(--ink-f)'}}>signal·ia /</span> <span style={{color:'var(--ac)'}}>{getAdminLabel(path)}</span>
          </div>
          <button className="btn btn-p btn-sm" onClick={()=>nav('/admin/editeur')}>+ Nouvel article</button>
          <button className="btn btn-g" onClick={toggleTheme} style={{width:44,padding:0,minHeight:44,fontSize:15}}>{theme==='dark'?'○':'●'}</button>
        </header>
        <main style={{flex:1,padding:'var(--s7)',overflowY:'auto'}}>
          {children}
        </main>
      </div>
    </div>
  );
};

/* ── MetricCard ─────────────────────────────────────────── */
const MetricCard = ({ label, value, delta, unit='', accent }) => (
  <div style={{background:'var(--bg-r)',border:'1px solid var(--ln-h)',padding:'var(--s5)',boxShadow:'2px 2px 0 var(--ln-h)',display:'flex',flexDirection:'column',gap:'var(--s2)',transition:'box-shadow var(--d),transform var(--d)'}}
    onMouseEnter={e=>{e.currentTarget.style.boxShadow='var(--sha)';e.currentTarget.style.transform='translate(-1px,-1px)'}}
    onMouseLeave={e=>{e.currentTarget.style.boxShadow='2px 2px 0 var(--ln-h)';e.currentTarget.style.transform=''}}
  >
    <div style={{fontFamily:'var(--ff-m)',fontSize:10,textTransform:'uppercase',letterSpacing:'.1em',color:'var(--ink-f)'}}>{label}</div>
    <div style={{fontFamily:'var(--ff-h)',fontSize:34,fontWeight:700,letterSpacing:'-.02em',color:accent||'var(--ink)',lineHeight:1}}>{value}<span style={{fontSize:16,fontWeight:400,color:'var(--ink-d)',marginLeft:4}}>{unit}</span></div>
    {delta!=null&&<div style={{fontFamily:'var(--ff-m)',fontSize:11,color:delta>0?'var(--ok)':'var(--er)'}}>{delta>0?'↑':'↓'} {Math.abs(delta)}% vs hier</div>}
  </div>
);

/* ── StatusBadge ────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const cfg={published:{l:'Publié',c:'var(--ok)'},draft:{l:'Brouillon',c:'var(--ink-f)'},scheduled:{l:'Planifié',c:'var(--wn)'},review:{l:'Révision',c:'var(--inf)'}};
  const {l,c}=cfg[status]||{l:status,c:'var(--ink-f)'};
  return <span style={{fontFamily:'var(--ff-m)',fontSize:10,fontWeight:500,textTransform:'uppercase',letterSpacing:'.08em',padding:'2px 6px',border:'1px solid currentColor',color:c,whiteSpace:'nowrap'}}>{l}</span>;
};

/* ── AdminPageHeader ────────────────────────────────────── */
const AdminPageHeader = ({ title, sub, action, onAction, extra }) => (
  <div style={{marginBottom:'var(--s7)',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'var(--s5)',flexWrap:'wrap'}}>
    <div>
      <h1 style={{fontFamily:'var(--ff-h)',fontSize:26,fontWeight:700,letterSpacing:'-.02em'}}>{title}</h1>
      {sub&&<p style={{fontFamily:'var(--ff-m)',fontSize:12,color:'var(--ink-f)',marginTop:'var(--s2)'}}>{sub}</p>}
    </div>
    <div style={{display:'flex',gap:'var(--s3)',alignItems:'center',flexWrap:'wrap'}}>
      {extra}
      {action&&<button onClick={onAction} className="btn btn-p">{action}</button>}
    </div>
  </div>
);

/* ── Sparkline ──────────────────────────────────────────── */
const Sparkline = ({ data, color='var(--ac)', h=40, w=120 }) => {
  const max=Math.max(...data)||1;
  const pts=data.map((v,i)=>[i*(w/(data.length-1)),h-(v/max*(h-4))-2]);
  const d='M'+pts.map(p=>p.join(',')).join('L');
  const fill='M'+pts[0].join(',')+' L'+pts.map(p=>p.join(',')).join(' L')+' L'+pts[pts.length-1][0]+','+h+' L'+pts[0][0]+','+h+' Z';
  return (
    <svg width={w} height={h} style={{overflow:'visible'}}>
      <defs><linearGradient id="spk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <path d={fill} fill="url(#spk)"/>
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
};

/* ── Empty state ────────────────────────────────────────── */
const EmptyState = ({ icon='◈', title, sub, action, onAction }) => (
  <div style={{textAlign:'center',padding:'var(--s9) var(--s5)',display:'flex',flexDirection:'column',alignItems:'center',gap:'var(--s4)'}}>
    <span style={{fontFamily:'var(--ff-m)',fontSize:40,color:'var(--ln-h)'}}>{icon}</span>
    <div style={{fontFamily:'var(--ff-h)',fontSize:18,fontWeight:600,color:'var(--ink-d)'}}>{title}</div>
    {sub&&<div style={{fontFamily:'var(--ff-b)',fontSize:14,color:'var(--ink-f)',maxWidth:360,lineHeight:1.6}}>{sub}</div>}
    {action&&<button onClick={onAction} className="btn btn-p" style={{marginTop:'var(--s3)'}}>{action}</button>}
  </div>
);

Object.assign(window, {
  ADMIN_NAV, getAdminLabel,
  AdminSidebar, AdminLayout,
  MetricCard, StatusBadge, AdminPageHeader, Sparkline, EmptyState,
});
