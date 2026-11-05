import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Bookmark, Check, CheckCircle2, Clock3,
  Code2, EyeOff, Flag, Layers3, Play, Sparkles, Target
} from 'lucide-react';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import Badge from '../../components/Badge.jsx';
import ProgressBar from '../../components/ProgressBar.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { apiRequest } from '../../services/api.js';
import { matchScore } from '../../utils/helpers.js';
import './ProjectDetails.css';

export default function ProjectDetails({ id, go }) {
  const {
    preferences,
    projectState,
    changeStatus,
    updateMilestone,
    notify
  } = useApp();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;

    const loadProject = async () => {
      setLoading(true);
      setLoadError('');

      try {
        const data = await apiRequest(`/projects/${id}`);
        if (active) setProject(data);
      } catch (error) {
        if (active) setLoadError(error.message || 'Could not load this project.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProject();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div className="app-loading" role="status">Loading project...</div>;
  }

  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        description={loadError || 'This project may have moved or the link is invalid.'}
        actionLabel="Explore projects"
        onAction={() => go('/explore')}
      />
    );
  }

  const p = project;
  const current = projectState.hidden.includes(p.id)
    ? 'Hidden'
    : projectState.statuses[p.id] || p.status || '';

  const roadmap = p.roadmap || [];
  const completed = roadmap.filter(step => step.completed).length;
  const percent = Math.round(completed / Math.max(1, roadmap.length) * 100);

  const move = async status => {
    const labels = {
      Planning: 'Project moved to Planning.',
      'In Progress': 'Project moved to In Progress.',
      Completed: 'Project marked as completed.',
      Saved: 'Project saved for later.',
      Hidden: 'Project hidden.'
    };

    try {
      await changeStatus(p.id, status);
      setProject(previous => ({ ...previous, status }));
      notify(labels[status] || 'Project status updated.');
    } catch (error) {
      notify(error.message || 'Could not update project status.', 'error');
    }
  };

  const toggle = async (milestoneId, checked) => {
    try {
      await updateMilestone(p.id, milestoneId, checked);

      setProject(previous => ({
        ...previous,
        roadmap: previous.roadmap.map(step =>
          step.id === milestoneId
            ? {
                ...step,
                completed: checked,
                completedAt: checked ? new Date().toISOString() : null
              }
            : step
        )
      }));
    } catch (error) {
      notify(error.message || 'Could not update roadmap progress.', 'error');
    }
  };

  return (
    <div className="project-details-page">
      <button className="back-link" onClick={() => go('/explore')}>
        <ArrowLeft size={14} /> Back to discovery
      </button>

      <div className="detail-hero">
        <div className="detail-art">
          <div className="detail-art-orbit" />
          <div className="detail-art-mark"><Layers3 size={48} /></div>
          <span>{p.field}</span>
        </div>

        <div className="detail-intro">
          <div className="detail-badges">
            <Badge tone="purple">{p.field}</Badge>
            <Badge tone={p.level === 'Beginner' ? 'green' : p.level === 'Advanced' ? 'amber' : 'blue'}>
              {p.level}
            </Badge>
            <span className="detail-match">
              <Sparkles size={12} /> {matchScore(p, preferences)}% match
            </span>
          </div>

          <h1>{p.title}</h1>
          <p>{p.description}</p>

          <div className="detail-facts">
            <span><Clock3 size={14} />{p.duration}</span>
            <span><Target size={14} />{p.goal}</span>
            <span><Flag size={14} />{p.portfolioValue}</span>
          </div>

          <div className="detail-actions">
            {current === 'Completed' ? (
              <Button onClick={() => move('In Progress')} icon={Play}>Move to In Progress</Button>
            ) : current === 'In Progress' ? (
              <>
                <Button onClick={() => move('Completed')} icon={CheckCircle2}>Mark as Completed</Button>
                <Button variant="secondary" onClick={() => move('Planning')} icon={ArrowLeft}>Back to Planning</Button>
              </>
            ) : current === 'Planning' ? (
              <Button onClick={() => move('In Progress')} icon={Play}>Start Project</Button>
            ) : current === 'Saved' ? (
              <Button onClick={() => move('Planning')} icon={Play}>Start Planning</Button>
            ) : current === 'Hidden' ? (
              <Button onClick={() => move('Planning')} icon={Play}>Restore to Planning</Button>
            ) : (
              <>
                <Button onClick={() => move('Planning')} icon={Play}>Start Planning</Button>
                <Button variant="secondary" onClick={() => move('Saved')} icon={Bookmark}>Save for Later</Button>
              </>
            )}

            <Button
              variant="ghost"
              onClick={() => move(current === 'Hidden' ? 'Planning' : 'Hidden')}
              icon={EyeOff}
            >
              {current === 'Hidden' ? 'Restore project' : 'Hide project'}
            </Button>
          </div>

          {current && <div className="current-status">Current status: <b>{current}</b></div>}
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          <section className="detail-panel">
            <div className="detail-panel-heading">
              <span className="detail-heading-icon"><Target size={16} /></span>
              <div><h2>The problem to solve</h2><p>Understand the why before you start building.</p></div>
            </div>
            <p className="problem-copy">{p.problem}</p>
          </section>

          <section className="detail-panel">
            <div className="detail-panel-heading">
              <span className="detail-heading-icon"><CheckCircle2 size={16} /></span>
              <div><h2>Core features</h2><p>A practical scope to get your first version shipped.</p></div>
            </div>
            <ul className="feature-list">
              {(p.features || []).map((feature, index) => (
                <li key={index}><span><Check size={13} /></span>{feature}</li>
              ))}
            </ul>
          </section>

          <section className="detail-panel">
            <div className="detail-panel-heading">
              <span className="detail-heading-icon"><Layers3 size={16} /></span>
              <div><h2>Project roadmap</h2><p>Work through each milestone at your own pace.</p></div>
            </div>

            <div className="roadmap-progress">
              <ProgressBar value={percent} label={`${completed} of ${roadmap.length} milestones completed`} />
            </div>

            <div className="roadmap-list">
              {roadmap.map((step, index) => (
                <label key={step.id} className={`roadmap-step ${step.completed ? 'complete' : ''}`}>
                  <input
                    type="checkbox"
                    checked={Boolean(step.completed)}
                    onChange={event => toggle(step.id, event.target.checked)}
                  />
                  <span className="roadmap-check">
                    {step.completed ? <Check size={14} /> : <span>{String(index + 1).padStart(2, '0')}</span>}
                  </span>
                  <span className="roadmap-step-copy">
                    <b>{step.title}</b>
                    <small>{step.description}</small>
                  </span>
                </label>
              ))}
            </div>

            {roadmap.length > 0 && completed === roadmap.length && current !== 'Completed' && (
              <div className="roadmap-complete-prompt">
                <CheckCircle2 size={17} />
                <div><b>All milestones complete!</b><p>Ready to mark this project as completed?</p></div>
                <Button size="sm" onClick={() => move('Completed')}>Mark completed</Button>
              </div>
            )}
          </section>
        </div>

        <aside className="detail-aside">
          <section className="detail-panel">
            <div className="detail-panel-heading">
              <span className="detail-heading-icon"><Code2 size={16} /></span>
              <div><h2>Tech stack</h2><p>Suggested tools to explore.</p></div>
            </div>
            <div className="detail-techs">
              {(p.techStack || []).map(tech => <span key={tech}>{tech}</span>)}
            </div>
          </section>

          <section className="detail-panel">
            <div className="detail-panel-heading">
              <span className="detail-heading-icon"><Sparkles size={16} /></span>
              <div><h2>What you'll learn</h2><p>Skills this project helps develop.</p></div>
            </div>
            <ul className="outcome-list">
              {(p.learningOutcomes || []).map((outcome, index) => (
                <li key={index}><CheckCircle2 size={14} />{outcome}</li>
              ))}
            </ul>
          </section>

          <section className="detail-tip">
            <div><Sparkles size={17} /></div>
            <b>Make it your own</b>
            <p>Start with the core features, then add one thoughtful detail that makes the project uniquely yours.</p>
            <Button variant="secondary" size="sm" onClick={() => { move('Planning'); go('/planning'); }}>
              Add to planning <ArrowRight size={13} />
            </Button>
          </section>

          <Button variant="ghost" onClick={() => go('/explore')} icon={ArrowLeft}>
            Back to all projects
          </Button>
        </aside>
      </div>
    </div>
  );
}
