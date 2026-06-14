// app.jsx — Routeur React principal
const { useState, useEffect } = React;

const App = () => {
  const [path,  setPath]  = useState(()=>window.location.hash.replace('#','') || '/');
  const [theme, setTheme] = useState(()=>localStorage.getItem('sig-theme')||'dark');
  const [cmdOpen,setCmdOpen] = useState(false);

  /* Sync theme with HTML attribute */
  useEffect(()=>{
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sig-theme', theme);
  }, [theme]);

  /* Hash routing */
  useEffect(()=>{
    const onHash = () => {
      const p = window.location.hash.replace('#','') || '/';
      setPath(p);
      window.scrollTo({top:0, behavior:'instant'});
    };
    window.addEventListener('hashchange', onHash);
    return ()=>window.removeEventListener('hashchange', onHash);
  }, []);

  /* Global Cmd+K */
  useEffect(()=>{
    const onKey = e => {
      if((e.metaKey||e.ctrlKey) && e.key==='k'){
        e.preventDefault();
        setCmdOpen(o=>!o);
      }
    };
    window.addEventListener('keydown', onKey);
    return ()=>window.removeEventListener('keydown', onKey);
  }, []);

  const nav = p => { window.location.hash = p; };
  const toggleTheme = () => setTheme(t=>t==='dark'?'light':'dark');

  /* ── Public page router ──────────────────────────────── */
  const renderPublic = () => {
    if (path==='/')             { const C=window.PageHome;        return <C nav={nav}/>;  }
    if (path==='/actus')        { const C=window.PageActus;       return <C nav={nav}/>;  }
    if (path==='/tutos')        { const C=window.PageTutos;       return <C nav={nav}/>;  }
    if (path==='/glossaire')    { const C=window.PageGlossaire;   return <C nav={nav}/>;  }
    if (path==='/cette-semaine'){ const C=window.PageCetteSemaine;return <C nav={nav}/>;  }
    if (path==='/tendances')    { const C=window.PageTendances;   return <C nav={nav}/>;  }
    if (path==='/recherche')    { const C=window.PageRecherche;   return <C nav={nav}/>;  }
    if (path==='/sources')      { const C=window.PageSources;     return <C nav={nav}/>;  }
    if (path==='/a-propos')     { const C=window.PageAPropos;     return <C nav={nav}/>;  }
    if (path==='/contact')      { const C=window.PageContact;     return <C nav={nav}/>;  }
    if (path==='/favoris')      { const C=window.PageFavoris;     return <C nav={nav}/>;  }
    if (path.startsWith('/article/')) {
      const id = parseInt(path.split('/')[2], 10);
      const C=window.PageArticle;
      return <C id={id} nav={nav}/>;
    }
    const C=window.Page404;
    return <C nav={nav}/>;
  };

  /* ── Admin page router ───────────────────────────────── */
  const renderAdmin = () => {
    if (path==='/admin')                 { const C=window.PageAdminDash;       return <C nav={nav}/>;  }
    if (path==='/admin/articles')        { const C=window.PageAdminArticles;   return <C nav={nav}/>;  }
    if (path.startsWith('/admin/editeur')){ const C=window.PageAdminEditeur;   return <C nav={nav}/>;  }
    if (path==='/admin/pipeline')        { const C=window.PageAdminPipeline;   return <C nav={nav}/>;  }
    if (path==='/admin/sources')         { const C=window.PageAdminSources;    return <C nav={nav}/>;  }
    if (path==='/admin/newsletter')      { const C=window.PageAdminNewsletter; return <C nav={nav}/>;  }
    if (path==='/admin/messages')        { const C=window.PageAdminMessages;   return <C nav={nav}/>;  }
    if (path==='/admin/analytics')       { const C=window.PageAdminAnalytics;  return <C nav={nav}/>;  }
    if (path==='/admin/tags')            { const C=window.PageAdminTags;       return <C nav={nav}/>;  }
    if (path==='/admin/reglages')        { const C=window.PageAdminReglages;   return <C nav={nav}/>;  }
    if (path==='/admin/backup')          { const C=window.PageAdminBackup;     return <C nav={nav}/>;  }
    const C=window.PageAdminDash;
    return <C nav={nav}/>;
  };

  const isAdmin = path.startsWith('/admin');
  const NavBar      = window.NavBar;
  const Footer      = window.Footer;
  const CmdPalette  = window.CmdPalette;
  const AdminLayout = window.AdminLayout;

  return (
    <>
      <CmdPalette open={cmdOpen} close={()=>setCmdOpen(false)} nav={nav}/>

      {isAdmin ? (
        <AdminLayout path={path} nav={nav} theme={theme} toggleTheme={toggleTheme}>
          {renderAdmin()}
        </AdminLayout>
      ) : (
        <div style={{display:'flex',flexDirection:'column',minHeight:'100vh'}}>
          <NavBar path={path} nav={nav} theme={theme} toggleTheme={toggleTheme} openCmd={()=>setCmdOpen(true)}/>
          <main style={{flex:1}}>
            {renderPublic()}
          </main>
          <Footer nav={nav}/>
        </div>
      )}
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
