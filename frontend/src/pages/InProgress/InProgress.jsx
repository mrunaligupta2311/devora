import React,{useMemo} from 'react';
import ProjectListView from '../../components/ProjectListView.jsx';
import {useApp} from '../../context/AppContext.jsx';
import './InProgress.css';
export default function InProgress({go}){const{projectState,projects:allProjects=[]}=useApp();const projects=useMemo(()=>allProjects.filter(p=>projectState.statuses[p.id]==='In Progress'),[allProjects,projectState]);return <ProjectListView go={go} title="In Progress" eyebrow="KEEP THE MOMENTUM" description="Your active builds, all in one place. Every milestone counts." projects={projects} mode="workspace" statusTitle="In Progress" emptyTitle="Nothing here yet" emptyDescription="Explore the library and move projects here when you are ready." emptyAction="Explore projects"/>;}