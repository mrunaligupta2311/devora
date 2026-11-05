import React,{useMemo} from 'react';
import ProjectListView from '../../components/ProjectListView.jsx';
import {useApp} from '../../context/AppContext.jsx';
import './Planning.css';
export default function Planning({go}){const{projectState,projects:allProjects=[]}=useApp();const projects=useMemo(()=>allProjects.filter(p=>projectState.statuses[p.id]==='Planning'),[allProjects,projectState]);return <ProjectListView go={go} title="Planning" eyebrow="YOUR NEXT BUILDS" description="Turn your saved ideas into a clear, achievable plan." projects={projects} mode="workspace" statusTitle="Planning" emptyTitle="Nothing here yet" emptyDescription="Explore the library and move projects here when you are ready." emptyAction="Explore projects"/>;}