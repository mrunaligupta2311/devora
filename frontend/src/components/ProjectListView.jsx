import React,{useMemo,useState} from 'react';
import {ArrowRight,Filter,Search,SlidersHorizontal,Sparkles,X} from 'lucide-react';
import PageHeader from './PageHeader.jsx';
import Button from './Button.jsx';
import Badge from './Badge.jsx';
import ProjectGrid from './ProjectGrid.jsx';
import EmptyState from './EmptyState.jsx';
import FieldPill from './FieldPill.jsx';
import './ProjectListView.css';
import {useApp} from '../context/AppContext.jsx';
import {matchScore} from '../utils/helpers.js';
const fields=['Frontend','Full-stack','Backend','AI/ML','Mobile App Development','Cybersecurity','Data Science','Game Development','UI/UX Design'];
export default function ProjectListView({go,title,eyebrow,description,projects:initialProjects,mode='explore',statusTitle,emptyTitle,emptyDescription,emptyAction,allowFilters=true}) {
 const {preferences,projectState,changeStatus,projects=[]}=useApp();
 const [search,setSearch]=useState('');const [field,setField]=useState('All fields');const [level,setLevel]=useState('All levels');const [duration,setDuration]=useState('Any duration');const [sort,setSort]=useState('Recommended');const [filtersOpen,setFiltersOpen]=useState(false);
 const all=projects;
 const base=useMemo(
  ()=>initialProjects ?? all.filter(p=>mode==='hidden'?projectState.hidden.includes(p.id):!projectState.hidden.includes(p.id)),
  [initialProjects,all,mode,projectState.hidden]
 );
 const visible=useMemo(()=>base.filter(p=>{
  const q=search.toLowerCase().trim();
  return (!q||[p.title,p.description,p.field,p.level,...p.techStack].join(' ').toLowerCase().includes(q)) &&
  (field==='All fields'||p.field===field)&&(level==='All levels'||p.level===level)&&
  (duration==='Any duration'||(duration==='Quick (under a week)'&&['1–2 days','3–5 days'].includes(p.duration))||(duration==='1–2 weeks'&&p.duration==='1–2 weeks')||(duration==='Longer projects'&&['2–3 weeks','3–4 weeks'].includes(p.duration)));
 }).sort((a,b)=>{
  if(sort==='Title A–Z') return a.title.localeCompare(b.title);
  if(sort==='Shortest first') {
   const days = value => {
    const match = String(value).match(/\d+/g);
    if(!match) return Number.MAX_SAFE_INTEGER;
    const numbers = match.map(Number);
    if(/day/i.test(value)) return numbers[0];
    if(/week/i.test(value)) return numbers[0]*7;
    if(/month/i.test(value)) return numbers[0]*30;
    return numbers[0];
   };
   return days(a.duration)-days(b.duration) || a.title.localeCompare(b.title);
  }
  return matchScore(b,preferences)-matchScore(a,preferences);
 }),[base,search,field,level,duration,sort,preferences]);
 const activeFilters=field!=='All fields'||level!=='All levels'||duration!=='Any duration';
 return <div className="list-view"><PageHeader eyebrow={eyebrow} title={title} description={description} actions={mode==='explore'?<Button variant="secondary" icon={Sparkles} onClick={()=>go('/recommendations')}>Personalize</Button>:null}/>{mode==='explore'&&<div className="list-intro-banner"><div className="list-banner-icon"><Sparkles size={20}/></div><div><b>{all.length} ideas. Nine directions. One next step.</b><p>Explore projects by field, difficulty or the technologies you want to learn.</p></div><Badge tone="purple">Curated library</Badge></div>}<div className="list-toolbar"><label className="project-search"><Search size={16}/><input aria-label="Search projects" placeholder="Search projects, technologies..." value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button aria-label="Clear search" onClick={()=>setSearch('')}><X size={14}/></button>}<kbd>⌘ K</kbd></label><Button variant={filtersOpen?'primary':'secondary'} icon={SlidersHorizontal} onClick={()=>setFiltersOpen(v=>!v)}>Filters {activeFilters&&<span className="filter-dot"/>}</Button><label className="sort-control"><span>Sort by</span><select value={sort} onChange={e=>setSort(e.target.value)}><option>Recommended</option><option>Title A–Z</option><option>Shortest first</option></select></label></div>{filtersOpen&&allowFilters&&<section className="filter-panel"><div className="filter-head"><b><Filter size={14}/> Refine projects</b><button onClick={()=>{setField('All fields');setLevel('All levels');setDuration('Any duration')}}>Reset filters</button></div><div className="filter-group"><span>Field</span><div className="filter-pills"><FieldPill active={field==='All fields'} onClick={()=>setField('All fields')}>All fields</FieldPill>{fields.map(f=><FieldPill key={f} active={field===f} onClick={()=>setField(f)}>{f}</FieldPill>)}</div></div><div className="filter-selects"><label>Skill level<select value={level} onChange={e=>setLevel(e.target.value)}><option>All levels</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label><label>Estimated duration<select value={duration} onChange={e=>setDuration(e.target.value)}><option>Any duration</option><option>Quick (under a week)</option><option>1–2 weeks</option><option>Longer projects</option></select></label></div></section>}<div className="list-results-head"><div><b>{visible.length} {visible.length===1?'project':'projects'}</b><span>{activeFilters?' · Filtered results':' · Find your next build'}</span></div>{activeFilters&&<button onClick={()=>{setField('All fields');setLevel('All levels');setDuration('Any duration')}}>Clear filters</button>}</div>{visible.length?<ProjectGrid projects={visible} onOpen={id=>go('/project/'+id)} onStatus={changeStatus} projectState={projectState} scoreFor={mode==='explore'?p=>matchScore(p,preferences):undefined}/>:<EmptyState title={emptyTitle||'No projects found'} description={emptyDescription||'Try changing your search or clearing a filter.'} actionLabel={emptyAction||'Clear search'} onAction={()=>{if(initialProjects && initialProjects.length===0 && mode==='workspace'){go('/explore');return;}setSearch('');setField('All fields');setLevel('All levels');setDuration('Any duration')}}/>}</div>;
}