// shared.jsx — Données mock, composants communs
// Exporte vers window: CATS, ARTICLES, TUTOS, GLOSSARY, TAGS, SOURCES,
// fmtTime, fmtDate, renderBody, PatBg, TagBadge, ImgSlot,
// ArticleHero, ArticleCard, ArticleRow, Ticker, NavBar, CmdPalette, SecHead, Footer

const { useState, useEffect, useRef } = React;

/* ── Catégories ─────────────────────────────────────────── */
const CATS = {
  llm:      { label:'LLM',       cls:'t-llm',  color:'var(--c-llm)' },
  robotics: { label:'Robotique', cls:'t-rob',  color:'var(--c-rob)' },
  tools:    { label:'Outils',    cls:'t-tool', color:'var(--c-tool)' },
  research: { label:'Recherche', cls:'t-res',  color:'var(--c-res)' },
  business: { label:'Business',  cls:'t-biz',  color:'var(--c-biz)' },
  policy:   { label:'Politique', cls:'t-pol',  color:'var(--c-pol)' },
};

/* ── Articles ───────────────────────────────────────────── */
const ARTICLES = [
  {
    id:1, cat:'llm',
    title:'GPT-5 Turbo : OpenAI dévoile son modèle le plus rapide à ce jour',
    summary:'Le nouveau modèle revendique une latence divisée par trois par rapport à GPT-4o, avec des performances maintenues sur les benchmarks de raisonnement.',
    points:[
      'Latence réduite de 67 % par rapport à GPT-4o, visant les applications temps réel.',
      'Context window porté à 256 k tokens, supportant des documents entiers.',
      'Disponible en API dès aujourd\'hui ; intégration ChatGPT dans les 30 jours.',
    ],
    tags:['OpenAI','GPT-5','API','Performance'],
    date:'2026-06-14T08:30:00', readTime:4,
    sources:['TechCrunch','OpenAI Blog','The Verge'], views:12400, featured:true,
    body:`OpenAI a officiellement présenté GPT-5 Turbo lors d'un livestream surprise ce matin. Le modèle, optimisé pour la vitesse plutôt que pour la puissance brute, s'inscrit dans une stratégie claire : rendre les applications IA grand public plus réactives.

## Ce qui change

La principale avancée tient dans l'architecture de l'inférence. OpenAI a réduit la taille effective du modèle via une technique de distillation avancée, tout en conservant les capacités de raisonnement de GPT-5. Résultat : le temps de réponse moyen passe de 2,3 secondes à 0,8 seconde sur les requêtes standard.

> « Nous voulons que chaque interaction soit aussi naturelle qu'une conversation humaine. La latence est le dernier obstacle. » — Sam Altman

La fenêtre de contexte portée à 256 k tokens permet désormais de soumettre des documents longs sans découpage préalable. Les développeurs de RAG s'en réjouissent particulièrement.

## Benchmarks

Sur MMLU, GPT-5 Turbo maintient 92,4 % (contre 91,8 % pour GPT-4o). Sur HumanEval coding, il atteint 88,1 %. Les gains de vitesse ne s'accompagnent donc pas de régression notable sur les capacités de raisonnement.

## Disponibilité et tarifs

L'accès API est ouvert dès aujourd'hui pour les plans Team et Enterprise. Le tarif : 0,15 $/1 M tokens en entrée, 0,60 $/1 M en sortie — soit 40 % moins cher que GPT-4o. L'intégration dans ChatGPT débutera dans 30 jours.`,
  },
  {
    id:2, cat:'robotics',
    title:'Figure 02 : Boston Dynamics entre dans la danse des robots humanoïdes',
    summary:'Le géant de la robotique annonce son premier humanoïde commercial, en partenariat avec BMW pour une mise en production dès le T4 2026.',
    points:[
      'Partenariat industriel avec BMW : 1 000 unités commandées pour les chaînes de montage.',
      'Autonomie de 6 heures, charge utile de 20 kg, navigation sans infrastructure RFID.',
      'Architecture neuronale inspirée des travaux DeepMind sur la manipulation dextre.',
    ],
    tags:['Robotique','Boston Dynamics','BMW','Industrie'],
    date:'2026-06-14T07:15:00', readTime:5,
    sources:['IEEE Spectrum','Boston Dynamics Blog','Reuters'], views:9800, featured:false,
    body:`Boston Dynamics change de stratégie. Après des années de robots spectaculaires mais inaccessibles commercialement, l'entreprise présente Figure 02 : son premier humanoïde pensé pour l'industrie.

## Un partenariat stratégique

BMW a commandé 1 000 unités pour ses chaînes de montage en Bavière. Le déploiement commencera par des tâches répétitives : assemblage de pièces, contrôle qualité visuel, manutention légère.

## Caractéristiques techniques

Figure 02 pèse 68 kg pour 1,70 m. Son autonomie de 6 heures est permise par une batterie Li-S de nouvelle génération. La charge utile de 20 kg en fait un outil polyvalent pour l'industrie légère.

> « Nous passons de la démonstration au déploiement. C'est le moment. » — Robert Playter, CEO Boston Dynamics`,
  },
  {
    id:3, cat:'llm',
    title:'Mistral Large 3 passe en open weights sur HuggingFace',
    summary:'La startup française libère les poids de son meilleur modèle sous licence Apache 2.0, défiant directement Meta et Google sur le terrain open-source.',
    points:[
      'Modèle 70B disponible en 4-bit et 8-bit quantization dès maintenant.',
      'Performances surpassant Llama 3 70B sur les tâches de code et raisonnement.',
      'Licence Apache 2.0 : usage commercial sans restriction.',
    ],
    tags:['Mistral','Open-source','HuggingFace'],
    date:'2026-06-13T16:00:00', readTime:3,
    sources:['Mistral Blog','HuggingFace'], views:8100, featured:false,
    body:`Mistral AI frappe un grand coup. En libérant les poids de Mistral Large 3 sous Apache 2.0, la startup française repositionne son offre face à Meta et Google.

## Pourquoi c'est important

C'est la première fois qu'un modèle de cette qualité est disponible sans restriction commerciale. Pour les entreprises qui veulent fine-tuner ou déployer en local, c'est un changement majeur de l'équation.

## Disponibilité

Les poids sont sur HuggingFace en FP16, GPTQ 4-bit et GGUF. Le modèle tourne sur un H100 standard ou localement avec 2× RTX 4090.`,
  },
  {
    id:4, cat:'tools',
    title:'Cursor 2.0 : l\'IDE IA repensé de fond en comble',
    summary:'La version majeure apporte un agent multi-fichiers, un contexte persistant entre sessions et l\'intégration native des MCP servers.',
    points:[
      'Agent multi-fichiers : refactorisation sur tout un repo en une commande.',
      'Contexte persistant : l\'IA se souvient des décisions d\'architecture entre sessions.',
      'MCP servers natifs : branchez n\'importe quelle source externe en 2 lignes.',
    ],
    tags:['Cursor','IDE','Dev','MCP'],
    date:'2026-06-13T10:00:00', readTime:4,
    sources:['Cursor Blog','The Register'], views:7200, featured:false,
    body:`Cursor 2.0 est là. La mise à jour la plus importante depuis le lancement transforme l'IDE en environnement de développement IA-native.

## Agent multi-fichiers

L'agent navigue dans tout un repo, refactorise des dizaines de fichiers en cohérence, et maintient un journal des changements. C'est la fonctionnalité la plus attendue depuis la v1.

## MCP natif

La prise en charge native des Model Context Protocol servers permet de brancher BDD, APIs et outils internes directement dans le contexte de l'IA, sans plugin tiers.`,
  },
  {
    id:5, cat:'research',
    title:'Google DeepMind publie AlphaFold 4 avec prédiction de dynamique',
    summary:'La quatrième itération intègre la dynamique moléculaire, ouvrant la voie à la conception de médicaments IA-native.',
    points:[
      'Prédiction de la dynamique conformationnelle : comment une protéine bouge dans le temps.',
      'Couverture étendue aux complexes ARN/protéines, précédemment hors de portée.',
      'Open access pour la recherche académique dès la publication.',
    ],
    tags:['DeepMind','AlphaFold','Biologie'],
    date:'2026-06-12T14:00:00', readTime:6,
    sources:['Nature','DeepMind Blog'], views:5400, featured:false,
    body:`DeepMind continue de repousser les frontières de la biologie computationnelle avec AlphaFold 4, qui intègre pour la première fois la dynamique moléculaire dans ses prédictions.`,
  },
  {
    id:6, cat:'business',
    title:'Anthropic lève 5 Mds$ supplémentaires, valorisation à 75 Mds',
    summary:'Le tour Series F mené par Amazon et Google consolide la position d\'Anthropic comme troisième acteur mondial de l\'IA.',
    points:[
      'Tour mené conjointement par Amazon (3 Mds) et Google (2 Mds).',
      'Financement orienté infrastructure de calcul et sécurité IA.',
      'Claude 4 annoncé pour le T3 2026.',
    ],
    tags:['Anthropic','Financement','Claude'],
    date:'2026-06-12T09:00:00', readTime:3,
    sources:['Bloomberg','Reuters','WSJ'], views:6800, featured:false,
    body:`La course aux capitaux continue. Anthropic annonce un tour Series F de 5 milliards de dollars, portant sa valorisation à 75 milliards.`,
  },
  {
    id:7, cat:'tools',
    title:'Meta AI Studio : créer son agent personnalisé en 5 minutes',
    summary:'Meta déploie une interface no-code permettant à tout utilisateur de Facebook et Instagram de créer un agent IA personnalisé.',
    points:[
      'Création no-code : persona, instructions, outils — tout par interface graphique.',
      'Distribution intégrée : l\'agent est partageable comme un compte social classique.',
      'Monétisation via Meta Business Suite dès août 2026.',
    ],
    tags:['Meta','Agents','No-code'],
    date:'2026-06-11T18:00:00', readTime:3,
    sources:['The Verge','Meta Blog'], views:4900, featured:false,
    body:`Meta change d'approche sur l'IA grand public. Avec AI Studio, n'importe qui peut créer et partager un agent IA en quelques minutes.`,
  },
  {
    id:8, cat:'policy',
    title:'Le Parlement européen vote l\'AI Act amendé avec nouvelles exemptions PME',
    summary:'L\'amendement introduit un régime simplifié pour les PME et durcit les exigences sur les modèles frontière.',
    points:[
      'PME < 250 salariés exemptées des audits pour les systèmes IA de faible risque.',
      'Nouveaux seuils de compute (10²⁶ FLOPs) déclenchant l\'obligation de notification.',
      'Entrée en vigueur complète en janvier 2028.',
    ],
    tags:['EU AI Act','Régulation','Europe'],
    date:'2026-06-11T11:30:00', readTime:5,
    sources:['Euractiv','Next INpact'], views:3800, featured:false,
    body:`La législation européenne sur l'IA continue d'évoluer. L'amendement adopté à 482 voix contre 91 clarifie le régime pour les PME.`,
  },
  {
    id:9, cat:'tools',
    title:'Perplexity Pro cite désormais jusqu\'à 100 sources par réponse',
    summary:'La mise à jour étend la profondeur de recherche et introduit un mode rapport produisant des analyses de 3 000 mots entièrement citées.',
    points:[
      'Mode Rapport : analyse longue avec table des matières et bibliographie.',
      'Slider de profondeur : de 10 à 100 sources selon le niveau souhaité.',
      'Export PDF et Markdown direct depuis l\'interface.',
    ],
    tags:['Perplexity','Recherche','RAG'],
    date:'2026-06-10T15:00:00', readTime:3,
    sources:['Perplexity Blog',"Ben's Bites"], views:4200, featured:false,
    body:`Perplexity continue d'améliorer son moteur de recherche augmenté. Le nouveau mode Rapport représente un saut qualitatif pour les cas d'usage professionnels.`,
  },
  {
    id:10, cat:'tools',
    title:'Stability AI : Stable Video 3D disponible pour tous',
    summary:'Après six mois de bêta, Stable Video 3D génère des assets 3D animés à partir d\'une simple image, en accès libre.',
    points:[
      'Génération d\'un mesh 3D texturé animé à partir d\'une image en 30 secondes.',
      'Export en glTF, FBX et Alembic pour Blender, Unity, Unreal.',
      'API public à 0,08 $ par génération.',
    ],
    tags:['Stability AI','3D','Création'],
    date:'2026-06-10T09:00:00', readTime:3,
    sources:['Stability AI Blog','CG Channel'], views:3500, featured:false,
    body:`La création 3D assistée par IA franchit un nouveau cap. Stable Video 3D passe en accès libre avec une qualité surprenant les professionnels.`,
  },
];

/* ── Tutos ──────────────────────────────────────────────── */
const TUTOS = [
  { id:1, title:'Construire un RAG minimal en Python avec LangChain', diff:'intermédiaire', tags:['Python','LangChain','RAG'], readTime:18, date:'2026-06-10', desc:'Pipeline RAG de bout en bout : indexation, embedding, recherche vectorielle et génération augmentée.' },
  { id:2, title:'Fine-tuner Mistral 7B sur ses données avec LoRA', diff:'avancé', tags:['LoRA','Mistral','PEFT'], readTime:25, date:'2026-06-05', desc:'Adapter un LLM à votre domaine avec quelques milliers d\'exemples et un GPU 16 Go.' },
  { id:3, title:'Premiers pas avec l\'API Claude : streaming et tools', diff:'débutant', tags:['Claude','API','Streaming'], readTime:12, date:'2026-05-28', desc:'Intégrer Claude en moins d\'une heure, avec streaming temps réel et appels de fonctions.' },
  { id:4, title:'Déployer Ollama en local sur Mac M-series', diff:'débutant', tags:['Ollama','Local','Mac'], readTime:8, date:'2026-05-20', desc:'Faire tourner des LLMs localement sur Apple Silicon sans cloud ni frais d\'API.' },
  { id:5, title:'Agent multi-étapes avec OpenAI Assistants', diff:'intermédiaire', tags:['OpenAI','Agents','Tools'], readTime:20, date:'2026-05-15', desc:'Construire un agent capable de planifier, utiliser des outils et maintenir un état sur plusieurs interactions.' },
];

/* ── Glossaire ──────────────────────────────────────────── */
const GLOSSARY = [
  { term:'RAG', full:'Retrieval-Augmented Generation', def:'Technique combinant un LLM avec une base vectorielle pour ancrer les réponses dans des documents réels, réduisant les hallucinations.' },
  { term:'LoRA', full:'Low-Rank Adaptation', def:'Méthode de fine-tuning n\'entraînant qu\'un petit nombre de paramètres additionnels, réduisant drastiquement les besoins en VRAM.' },
  { term:'RLHF', full:'Reinforcement Learning from Human Feedback', def:'Entraînement optimisant un modèle via un signal de récompense appris à partir des préférences humaines, technique clé de l\'alignement.' },
  { term:'Transformer', full:'Architecture Transformer', def:'Architecture neuronale basée sur l\'attention, fondation des LLMs modernes depuis "Attention Is All You Need" (2017).' },
  { term:'MCP', full:'Model Context Protocol', def:'Protocole open-source d\'Anthropic permettant aux LLMs de se connecter à des sources de données et outils externes de façon standardisée.' },
  { term:'Embedding', full:'Vecteur d\'embedding', def:'Représentation numérique de texte en espace vectoriel haute dimension, permettant de mesurer la similarité sémantique entre documents.' },
  { term:'Context Window', full:'Fenêtre de contexte', def:'Quantité maximale de tokens qu\'un modèle traite en une inférence, déterminant la longueur des documents et conversations supportables.' },
  { term:'Hallucination', full:'Hallucination LLM', def:'Phénomène où un modèle génère des informations fausses avec un apparent niveau de confiance. Principal défi de fiabilité.' },
  { term:'Quantization', full:'Quantization de modèle', def:'Compression réduisant la précision des poids (ex. 32 → 4 bits), permettant un déploiement sur matériel plus modeste.' },
  { term:'Prompt Engineering', full:'Ingénierie de prompts', def:'Discipline consistant à formuler des instructions optimales pour guider le comportement d\'un LLM vers les sorties souhaitées.' },
  { term:'Fine-tuning', full:'Affinage', def:'Entraînement supplémentaire d\'un modèle pré-entraîné sur un dataset spécifique pour l\'adapter à une tâche ou un domaine.' },
  { term:'Tokenizer', full:'Tokeniseur', def:'Composant découpant le texte en tokens compréhensibles par le modèle — impacte coût d\'API et limites de contexte.' },
];

const TAGS = ['LLM','OpenAI','Mistral','Anthropic','Google DeepMind','Meta','Robotique','Agents','RAG','Fine-tuning','Open-source','API','Régulation','Business','Recherche','Multimodal','Vision','Audio','MCP','Outils Dev'];

const SOURCES = [
  { id:1, name:'OpenAI Blog',       cat:'llm',      health:'ok',   last:'5 min', count:142 },
  { id:2, name:'DeepMind Blog',     cat:'research', health:'ok',   last:'12 min',count:89 },
  { id:3, name:'Mistral AI News',   cat:'llm',      health:'ok',   last:'8 min', count:45 },
  { id:4, name:'IEEE Spectrum AI',  cat:'research', health:'ok',   last:'18 min',count:203 },
  { id:5, name:'The Verge · AI',    cat:'tools',    health:'warn', last:'2 h',   count:312 },
  { id:6, name:'Anthropic News',    cat:'llm',      health:'ok',   last:'3 min', count:67 },
  { id:7, name:'HuggingFace Blog',  cat:'tools',    health:'ok',   last:'25 min',count:178 },
  { id:8, name:'TechCrunch AI',     cat:'business', health:'err',  last:'4 h',   count:890 },
];

/* ── Helpers ────────────────────────────────────────────── */
const fmtTime = iso => new Date(iso).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
const fmtDate = iso => new Date(iso).toLocaleDateString('fr-FR',{day:'numeric',month:'short'});

function renderBody(text) {
  if (!text) return '';
  const lines = text.split('\n');
  let html = '', inP = false;
  const closeP = () => { if (inP) { html += '</p>'; inP = false; } };
  const fmt = s => s
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/`([^`]+)`/g,'<code>$1</code>');
  for (const line of lines) {
    if (line.startsWith('## ')) { closeP(); html += `<h2>${fmt(line.slice(3))}</h2>`; }
    else if (line.startsWith('> ')) { closeP(); html += `<blockquote><p>${fmt(line.slice(2))}</p></blockquote>`; }
    else if (line.trim() === '') { closeP(); }
    else { if (!inP) { html += '<p>'; inP = true; } else { html += ' '; } html += fmt(line); }
  }
  closeP();
  return html;
}

/* ── PatBg ──────────────────────────────────────────────── */
const PatBg = ({ op=0.5 }) => (
  <div style={{position:'absolute',inset:0,pointerEvents:'none',backgroundImage:'radial-gradient(circle,var(--ln) 1px,transparent 1px)',backgroundSize:'24px 24px',opacity:op}}/>
);

/* ── TagBadge ───────────────────────────────────────────── */
const TagBadge = ({ cat, text }) => {
  const c = cat && CATS[cat] ? CATS[cat] : null;
  return <span className={`tag${c?' '+c.cls:''}`}>{text || (c ? c.label : '?')}</span>;
};

/* ── ImgSlot ────────────────────────────────────────────── */
const ImgSlot = ({ label='IMAGE', h=180, badge }) => (
  <div className="has-scanlines img-vignette" style={{height:h,background:'var(--bg-d)',position:'relative',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0,minHeight:h}}>
    <PatBg op={0.7}/>
    <span style={{fontFamily:'var(--ff-m)',fontSize:10,color:'var(--ink-f)',position:'relative',zIndex:3,textAlign:'center',padding:'var(--s3)',lineHeight:1.5}}>{label}</span>
    {badge && <div style={{position:'absolute',top:10,left:10,background:'var(--ac)',color:'var(--on-ac)',fontFamily:'var(--ff-m)',fontSize:9,fontWeight:700,padding:'3px 8px',textTransform:'uppercase',letterSpacing:'.1em',zIndex:4}}>{badge}</div>}
  </div>
);

/* ── Article cards ──────────────────────────────────────── */
const ArticleHero = ({ a, nav }) => (
  <article className="hero-card" style={{cursor:'pointer'}} onClick={()=>nav('/article/'+a.id)}>
    <ImgSlot h="100%" label="IMAGE À LA UNE · 1200 × 630" badge="À la une"/>
    <div style={{padding:'var(--s7)',display:'flex',flexDirection:'column',gap:'var(--s4)',justifyContent:'center'}}>
      <TagBadge cat={a.cat}/>
      <h2 style={{fontFamily:'var(--ff-h)',fontSize:'clamp(22px,2.2vw,34px)',fontWeight:700,lineHeight:1.12,letterSpacing:'-.025em'}}>
        {a.title}
      </h2>
      <p style={{fontFamily:'var(--ff-b)',fontSize:16,color:'var(--ink-d)',lineHeight:1.68}}>
        {a.summary}
      </p>
      <div style={{display:'flex',gap:'var(--s3)',flexWrap:'wrap',paddingTop:'var(--s4)',borderTop:'1px solid var(--ln)'}}>
        <span style={{fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)'}}>{fmtTime(a.date)}</span>
        <span style={{fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)'}}>{a.readTime} min</span>
        <span style={{fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ac)'}}>{a.sources.length} sources</span>
        <span style={{fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)',marginLeft:'auto'}}>{a.views.toLocaleString()} vues</span>
      </div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
        {a.tags.slice(0,3).map(t=><span key={t} className="tag">{t}</span>)}
      </div>
    </div>
  </article>
);

const ArticleCard = ({ a, nav }) => (
  <article
    style={{background:'var(--bg-r)',border:'1px solid var(--ln)',display:'flex',flexDirection:'column',cursor:'pointer',overflow:'hidden',transition:'transform var(--d),box-shadow var(--d)'}}
    onClick={()=>nav('/article/'+a.id)}
    onMouseEnter={e=>{e.currentTarget.style.transform='translate(-2px,-2px)';e.currentTarget.style.boxShadow='var(--sha)'}}
    onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=''}}
  >
    <ImgSlot h={150}/>
    <div style={{padding:'var(--s5)',flex:1,display:'flex',flexDirection:'column',gap:'var(--s3)'}}>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <TagBadge cat={a.cat}/>
        <span style={{fontFamily:'var(--ff-m)',fontSize:10,color:'var(--ink-f)',marginLeft:'auto'}}>{fmtDate(a.date)}</span>
      </div>
      <h3 style={{fontFamily:'var(--ff-h)',fontSize:15,fontWeight:600,lineHeight:1.3,letterSpacing:'-.01em'}}>{a.title}</h3>
      <p style={{fontFamily:'var(--ff-b)',fontSize:13,color:'var(--ink-d)',lineHeight:1.6,flex:1}}>{a.summary.slice(0,100)}…</p>
      <div style={{display:'flex',gap:8,fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)'}}>
        <span>{a.readTime} min</span>
        <span style={{marginLeft:'auto',color:'var(--ac)'}}>{a.views.toLocaleString()} vues</span>
      </div>
    </div>
  </article>
);

const ArticleRow = ({ a, nav, rank }) => (
  <div
    style={{display:'flex',gap:'var(--s4)',padding:'10px 0',borderBottom:'1px solid var(--ln)',cursor:'pointer',transition:'padding-left var(--d)'}}
    onClick={()=>nav('/article/'+a.id)}
    onMouseEnter={e=>e.currentTarget.style.paddingLeft='var(--s3)'}
    onMouseLeave={e=>e.currentTarget.style.paddingLeft='0'}
  >
    {rank && <span style={{fontFamily:'var(--ff-m)',fontSize:15,fontWeight:700,color:'var(--ac)',width:22,flexShrink:0,paddingTop:2}}>{rank}</span>}
    <div style={{flex:1}}>
      <div style={{display:'flex',gap:8,marginBottom:4,flexWrap:'wrap'}}>
        <TagBadge cat={a.cat}/>
        <span style={{fontFamily:'var(--ff-m)',fontSize:10,color:'var(--ink-f)'}}>{fmtTime(a.date)}</span>
      </div>
      <div style={{fontFamily:'var(--ff-h)',fontSize:14,fontWeight:600,lineHeight:1.3}}>{a.title}</div>
      <div style={{fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)',marginTop:3}}>{a.readTime} min · {a.sources.length} sources</div>
    </div>
  </div>
);

/* ── Ticker ─────────────────────────────────────────────── */
const Ticker = () => {
  const al = [
    '🔴 BREAKING — GPT-5 Turbo : OpenAI lance son modèle le plus rapide ce matin',
    '⚡ LIVE — Conf DeepMind : AlphaFold 4 présentée dans 30 min',
    '🔴 BREAKING — Figure 02 : Boston Dynamics et BMW signent un accord historique',
    '📡 MISE À JOUR — Mistral Large 3 passe en open weights sur HuggingFace',
  ];
  const items = [...al,...al];
  return (
    <div className="has-scanlines" style={{background:'var(--bg-d)',borderBottom:'1px solid var(--ac)',overflow:'hidden',height:34,display:'flex',alignItems:'center',flexShrink:0}}>
      <div style={{flexShrink:0,padding:'0 var(--s4)',height:'100%',background:'var(--ac)',color:'var(--on-ac)',fontFamily:'var(--ff-m)',fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'.12em',display:'flex',alignItems:'center',whiteSpace:'nowrap',borderRight:'1px solid var(--on-ac)'}}>ALERTE</div>
      <div style={{overflow:'hidden',flex:1}}>
        <div className="tk-t">
          {items.map((a,i)=>(
            <span key={i} style={{fontFamily:'var(--ff-m)',fontSize:12,color:'var(--ink)',padding:'0 var(--s6)',whiteSpace:'nowrap'}}>
              {a}<span style={{color:'var(--ln-h)',marginLeft:'var(--s5)'}}>·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── NavBar ─────────────────────────────────────────────── */
const NAV_LINKS = [['Actus','/actus'],['Tutos','/tutos'],['Glossaire','/glossaire'],['Cette semaine','/cette-semaine'],['Tendances','/tendances'],['Sources','/sources']];

const NavBar = ({ path, nav, theme, toggleTheme, openCmd }) => {
  const [mob,setMob] = useState(false);
  const active = p => path===p || path.startsWith(p+'/');
  return (
    <>
      <header className="has-scanlines" style={{position:'sticky',top:0,zIndex:100,background:'var(--bg-d)',borderBottom:'1px solid var(--ln)',backdropFilter:'blur(8px)'}}>
        <nav style={{maxWidth:'var(--mw)',margin:'0 auto',padding:'0 var(--s5)',display:'flex',alignItems:'center',gap:'var(--s3)',height:52}}>
          <button onClick={()=>nav('/')} style={{fontFamily:'var(--ff-h)',fontWeight:700,fontSize:19,letterSpacing:'-.03em',padding:0,minHeight:44,background:'none',border:'none',cursor:'pointer',flexShrink:0}}>
            <span style={{color:'var(--ac)'}}>signal</span><span style={{color:'var(--ink-f)'}}>·</span><span>ia</span>
          </button>
          <div className="hm" style={{display:'flex',gap:0,flex:1,overflow:'hidden'}}>
            {NAV_LINKS.map(([l,p])=>(
              <button key={p} onClick={()=>nav(p)} style={{fontFamily:'var(--ff-h)',fontSize:13,fontWeight:500,padding:'0 9px',color:active(p)?'var(--ac)':'var(--ink-d)',borderBottom:active(p)?'2px solid var(--ac)':'2px solid transparent',borderTop:'none',borderLeft:'none',borderRight:'none',minHeight:52,transition:'color var(--d)',background:'none',cursor:'pointer',whiteSpace:'nowrap'}}
                onMouseEnter={e=>{if(!active(p))e.currentTarget.style.color='var(--ink)'}}
                onMouseLeave={e=>{if(!active(p))e.currentTarget.style.color='var(--ink-d)'}}
              >{l}</button>
            ))}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:4,marginLeft:'auto',flexShrink:0}}>
            <button className="hm" onClick={openCmd} style={{display:'flex',alignItems:'center',gap:6,padding:'0 10px',height:32,background:'var(--bg-r)',border:'1px solid var(--ln)',cursor:'pointer',fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)',minHeight:32}}>
              <svg width="12" height="12" fill="none"><circle cx="5.5" cy="5.5" r="3.5" stroke="currentColor" strokeWidth="1.4"/><path d="M8.5 8.5l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square"/></svg>
              ⌘K
            </button>
            <button onClick={openCmd} className="btn-g btn" style={{width:44,padding:0,minHeight:44}} title="Rechercher">
              <svg width="15" height="15" fill="none"><circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/></svg>
            </button>
            <button onClick={()=>nav('/favoris')} className="btn-g btn" style={{width:44,padding:0,minHeight:44}} title="Favoris">
              <svg width="15" height="15" fill="none"><path d="M7.5 12.5L2.5 8.5C1.2 7.5 1.2 5.5 2.5 4.5 3.8 3.5 5.5 4 7.5 6 9.5 4 11.2 3.5 12.5 4.5 13.8 5.5 13.8 7.5 12.5 8.5L7.5 12.5Z" stroke="currentColor" strokeWidth="1.5"/></svg>
            </button>
            <button onClick={toggleTheme} className="btn-g btn" style={{width:44,padding:0,minHeight:44,fontSize:15}} title="Thème">{theme==='dark'?'○':'●'}</button>
            <button className="hm btn-g btn" onClick={()=>nav('/admin')} style={{fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)',padding:'0 8px',minHeight:44}}>admin ↗</button>
            <button className="hd" onClick={()=>setMob(true)} style={{width:44,height:44,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,background:'none',border:'none',cursor:'pointer'}}>≡</button>
          </div>
        </nav>
      </header>
      <div className={`mob-nav${mob?' open':''}`}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'var(--s7)'}}>
          <span style={{fontFamily:'var(--ff-h)',fontWeight:700,fontSize:20,letterSpacing:'-.03em'}}><span style={{color:'var(--ac)'}}>signal</span>·ia</span>
          <button onClick={()=>setMob(false)} style={{fontSize:26,width:44,height:44,display:'flex',alignItems:'center',justifyContent:'center',background:'none',border:'none',cursor:'pointer'}}>×</button>
        </div>
        {[['Accueil','/'],...NAV_LINKS].map(([l,p])=>(
          <button key={p} onClick={()=>{nav(p);setMob(false)}} style={{background:'none',border:'none',cursor:'pointer',textAlign:'left',padding:'var(--s3) 0',fontSize:22,fontWeight:600,color:active(p)?'var(--ac)':'var(--ink)',borderBottom:'1px solid var(--ln)',minHeight:56,width:'100%',display:'block'}}>{l}</button>
        ))}
        <div style={{marginTop:'auto',display:'flex',gap:'var(--s3)',paddingTop:'var(--s5)'}}>
          <button onClick={toggleTheme} className="btn" style={{flex:1,minHeight:48}}>{theme==='dark'?'Thème clair':'Thème sombre'}</button>
          <button onClick={()=>{openCmd();setMob(false)}} className="btn" style={{flex:1,minHeight:48}}>⌘ Recherche</button>
        </div>
      </div>
    </>
  );
};

/* ── CmdPalette ─────────────────────────────────────────── */
const CmdPalette = ({ open, close, nav }) => {
  const [q,setQ]=useState('');
  const [sel,setSel]=useState(0);
  const ref=useRef();
  const ql=[
    {l:'Accueil',p:'/',i:'⌂'},{l:'Toutes les actus',p:'/actus',i:'◈'},
    {l:'Tutos',p:'/tutos',i:'⊗'},{l:'Glossaire IA',p:'/glossaire',i:'A'},
    {l:'Cette semaine',p:'/cette-semaine',i:'◉'},{l:'Tendances',p:'/tendances',i:'↑'},
    {l:'Sources',p:'/sources',i:'⊂'},{l:'À propos',p:'/a-propos',i:'◎'},
    {l:'Favoris',p:'/favoris',i:'♡'},{l:'Admin dashboard',p:'/admin',i:'⊛'},
  ];
  const results = q
    ? ARTICLES.filter(a=>a.title.toLowerCase().includes(q.toLowerCase())||a.tags.some(t=>t.toLowerCase().includes(q.toLowerCase()))).slice(0,6).map(a=>({l:a.title,p:'/article/'+a.id,i:CATS[a.cat]?.label[0]||'·'}))
    : ql;
  useEffect(()=>{ if(open){setQ('');setSel(0);setTimeout(()=>ref.current?.focus(),50)} },[open]);
  useEffect(()=>{
    const h=e=>{
      if(e.key==='ArrowDown'){e.preventDefault();setSel(s=>Math.min(s+1,results.length-1))}
      if(e.key==='ArrowUp'){e.preventDefault();setSel(s=>Math.max(s-1,0))}
      if(e.key==='Enter'&&results[sel]){nav(results[sel].p);close()}
      if(e.key==='Escape')close();
    };
    if(open)window.addEventListener('keydown',h);
    return()=>window.removeEventListener('keydown',h);
  },[open,sel,results,nav,close]);
  if(!open)return null;
  return (
    <div className="cmd-bg" onClick={close}>
      <div className="cmd-box" onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',gap:'var(--s3)',padding:'0 var(--s4)',borderBottom:'1px solid var(--ln)'}}>
          <svg width="14" height="14" fill="none" style={{color:'var(--ink-f)',flexShrink:0}}><circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5"/><path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/></svg>
          <input ref={ref} value={q} onChange={e=>{setQ(e.target.value);setSel(0)}} placeholder="Rechercher un article, une page…" style={{flex:1,background:'none',border:'none',outline:'none',padding:'var(--s4) 0',fontFamily:'var(--ff-h)',fontSize:15,color:'var(--ink)'}}/>
          <span style={{fontFamily:'var(--ff-m)',fontSize:10,color:'var(--ink-f)',padding:'2px 5px',border:'1px solid var(--ln)'}}>ESC</span>
        </div>
        <div style={{maxHeight:360,overflowY:'auto'}}>
          {!q&&<div style={{padding:'var(--s2) var(--s4) var(--s1)',fontFamily:'var(--ff-m)',fontSize:9,color:'var(--ink-f)',textTransform:'uppercase',letterSpacing:'.12em'}}>Navigation rapide</div>}
          {q&&results.length===0&&<div style={{padding:'var(--s7)',textAlign:'center',color:'var(--ink-f)',fontSize:14}}>Aucun résultat pour « {q} »</div>}
          {results.map((r,i)=>(
            <button key={i} onClick={()=>{nav(r.p);close()}} onMouseEnter={()=>setSel(i)}
              style={{width:'100%',display:'flex',alignItems:'center',gap:'var(--s3)',padding:'10px var(--s4)',background:i===sel?'var(--bg-r)':'none',border:'none',borderLeft:i===sel?'2px solid var(--ac)':'2px solid transparent',cursor:'pointer',color:'var(--ink)',minHeight:44,transition:'background var(--d)'}}>
              <span style={{fontFamily:'var(--ff-m)',fontSize:12,color:'var(--ac)',width:20,textAlign:'center',flexShrink:0}}>{r.i}</span>
              <span style={{fontFamily:'var(--ff-h)',fontSize:14,flex:1,textAlign:'left'}}>{r.l}</span>
              {i===sel&&<span style={{fontFamily:'var(--ff-m)',fontSize:10,color:'var(--ink-f)'}}>↵</span>}
            </button>
          ))}
        </div>
        <div style={{padding:'6px var(--s4)',borderTop:'1px solid var(--ln)',display:'flex',gap:'var(--s5)',fontFamily:'var(--ff-m)',fontSize:10,color:'var(--ink-f)'}}>
          <span>↑↓ naviguer</span><span>↵ ouvrir</span><span>ESC fermer</span>
        </div>
      </div>
    </div>
  );
};

/* ── SecHead ────────────────────────────────────────────── */
const SecHead = ({ label, title, action, onAction }) => (
  <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:'var(--s6)',gap:'var(--s4)',flexWrap:'wrap'}}>
    <div style={{display:'flex',alignItems:'center',gap:'var(--s3)'}}>
      {label&&<span style={{fontFamily:'var(--ff-m)',fontSize:10,textTransform:'uppercase',letterSpacing:'.1em',color:'var(--ac)',borderLeft:'2px solid var(--ac)',paddingLeft:'var(--s2)'}}>{label}</span>}
      {title&&<h2 style={{fontFamily:'var(--ff-h)',fontSize:22,fontWeight:700,letterSpacing:'-.02em'}}>{title}</h2>}
    </div>
    {action&&<button onClick={onAction} className="btn btn-g" style={{fontFamily:'var(--ff-m)',fontSize:12,color:'var(--ink-d)'}}>{action} →</button>}
  </div>
);

/* ── Footer ─────────────────────────────────────────────── */
const Footer = ({ nav }) => (
  <footer className="has-scanlines" style={{background:'var(--bg-d)',borderTop:'1px solid var(--ln)',padding:'var(--s9) 0 var(--s6)',marginTop:'auto'}}>
    <div className="wrap">
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'var(--s7)',marginBottom:'var(--s8)'}}>
        <div style={{display:'flex',flexDirection:'column',gap:'var(--s4)'}}>
          <div style={{fontFamily:'var(--ff-h)',fontWeight:700,fontSize:22,letterSpacing:'-.03em'}}><span style={{color:'var(--ac)'}}>signal</span>·ia</div>
          <p style={{fontFamily:'var(--ff-b)',fontSize:14,color:'var(--ink-d)',lineHeight:1.65,maxWidth:220}}>L'essentiel de l'IA, trié, sans bruit. Indépendant, sans pub ni traceurs.</p>
          <div style={{fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ok)',display:'flex',alignItems:'center',gap:6}}>
            <span className="s-ok"/><span>Tous systèmes opérationnels</span>
          </div>
        </div>
        {[['Contenu',[['Toutes les actus','/actus'],['Tutos pratiques','/tutos'],['Glossaire','/glossaire'],['Cette semaine','/cette-semaine'],['Tendances','/tendances']]],['Média',[['À propos','/a-propos'],['Sources','/sources'],['Contact','/contact'],['Favoris','/favoris']]]].map(([sec,lks])=>(
          <div key={sec}>
            <div style={{fontFamily:'var(--ff-m)',fontSize:9,textTransform:'uppercase',letterSpacing:'.12em',color:'var(--ink-f)',marginBottom:'var(--s4)'}}>{sec}</div>
            <div style={{display:'flex',flexDirection:'column',gap:'var(--s3)'}}>
              {lks.map(([l,p])=>(
                <button key={p} onClick={()=>nav(p)} style={{background:'none',border:'none',cursor:'pointer',textAlign:'left',fontFamily:'var(--ff-h)',fontSize:14,color:'var(--ink-d)',padding:0,minHeight:28,transition:'color var(--d)'}}
                  onMouseEnter={e=>e.currentTarget.style.color='var(--ink)'}
                  onMouseLeave={e=>e.currentTarget.style.color='var(--ink-d)'}
                >{l}</button>
              ))}
            </div>
          </div>
        ))}
        <div>
          <div style={{fontFamily:'var(--ff-m)',fontSize:9,textTransform:'uppercase',letterSpacing:'.12em',color:'var(--ink-f)',marginBottom:'var(--s4)'}}>Newsletter</div>
          <p style={{fontFamily:'var(--ff-b)',fontSize:13,color:'var(--ink-d)',marginBottom:'var(--s3)',lineHeight:1.5}}>Le résumé hebdo tous les vendredis.</p>
          <div style={{display:'flex',gap:'var(--s2)'}}>
            <input type="email" placeholder="email@exemple.fr" className="inp inp-sm" style={{flex:1}}/>
            <button className="btn btn-p btn-sm" style={{flexShrink:0}}>OK</button>
          </div>
          <p style={{fontFamily:'var(--ff-m)',fontSize:10,color:'var(--ink-f)',marginTop:'var(--s2)'}}>Aucun tracker · Désabo en 1 clic</p>
        </div>
      </div>
      <div style={{paddingTop:'var(--s5)',borderTop:'1px solid var(--ln)',display:'flex',flexWrap:'wrap',gap:'var(--s4)',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)'}}>© 2026 signal·ia — Média indépendant, sans pub ni traceurs</span>
        <div style={{display:'flex',gap:'var(--s5)',fontFamily:'var(--ff-m)',fontSize:11,color:'var(--ink-f)'}}><span>RSS ↗</span><span>Mastodon ↗</span><span>JSON ↗</span></div>
      </div>
    </div>
  </footer>
);

Object.assign(window, {
  CATS, ARTICLES, TUTOS, GLOSSARY, TAGS, SOURCES,
  fmtTime, fmtDate, renderBody,
  PatBg, TagBadge, ImgSlot,
  ArticleHero, ArticleCard, ArticleRow,
  Ticker, NavBar, CmdPalette, SecHead, Footer,
});
