import React from 'react';
import ProjectCard from './ProjectCard.jsx';
import './ProjectGrid.css';
export default function ProjectGrid({projects,onOpen,onStatus,projectState,scoreFor}) { return <div className="project-grid">{projects.map(p=><ProjectCard key={p.id} project={p} onOpen={onOpen} onStatus={onStatus} status={projectState?.hidden?.includes(p.id)?'Hidden':projectState?.statuses?.[p.id]} score={scoreFor?.(p)}/>)}</div>; }