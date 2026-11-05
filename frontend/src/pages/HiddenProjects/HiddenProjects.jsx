import React,{useMemo} from 'react';
import ProjectListView from '../../components/ProjectListView.jsx';
import {useApp} from '../../context/AppContext.jsx';
import './HiddenProjects.css';
export default function HiddenProjects({go}){const{projectState,projects:allProjects=[]}=useApp();const projects=useMemo(()=>allProjects.filter(p=>projectState.hidden.includes(p.id)),[allProjects,projectState]);return <ProjectListView go={go} title="Hidden Projects" eyebrow="OUT OF YOUR WAY" description="Ideas you've hidden stay here until you decide to bring them back." projects={projects} mode="workspace" statusTitle="Hidden" emptyTitle="Your hidden list is clear" emptyDescription="You have not hidden any ideas. Explore freely and hide anything that is not a fit." emptyAction="Explore projects"/>;}