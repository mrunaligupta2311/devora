import React,{useMemo} from 'react';
import ProjectListView from '../../components/ProjectListView.jsx';
import {useApp} from '../../context/AppContext.jsx';
import './SavedProjects.css';
export default function SavedProjects({go}){const{projectState,projects:allProjects=[]}=useApp();const projects=useMemo(()=>allProjects.filter(p=>projectState.statuses[p.id]==='Saved'),[allProjects,projectState]);return <ProjectListView go={go} title="Saved Projects" eyebrow="YOUR COLLECTION" description="Good ideas are worth keeping. Pick up one whenever you're ready." projects={projects} mode="workspace" statusTitle="Saved" emptyTitle="Nothing here yet" emptyDescription="Explore the library and move projects here when you are ready." emptyAction="Explore projects"/>;}