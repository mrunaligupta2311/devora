import React,{useMemo} from 'react';
import ProjectListView from '../../components/ProjectListView.jsx';
import {useApp} from '../../context/AppContext.jsx';
import './CompletedProjects.css';
export default function CompletedProjects({go}){const{projectState,projects:allProjects=[]}=useApp();const projects=useMemo(()=>allProjects.filter(p=>projectState.statuses[p.id]==='Completed'),[allProjects,projectState]);return <ProjectListView go={go} title="Completed Projects" eyebrow="LOOK HOW FAR YOU'VE COME" description="A record of ideas you turned into something real." projects={projects} mode="workspace" statusTitle="Done" emptyTitle="Nothing here yet" emptyDescription="Explore the library and move projects here when you are ready." emptyAction="Explore projects"/>;}