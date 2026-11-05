import React from 'react';
import ProjectListView from '../../components/ProjectListView.jsx';
import './ExploreProjects.css';
export default function ExploreProjects({go}){return <ProjectListView go={go} title="Explore Projects" eyebrow="DISCOVER SOMETHING NEW" description="A curated library of practical ideas across nine fields. Filter by what you know, what you want to learn, and what you want to build." mode="explore"/>;}