import React from 'react';
import {
  ArrowUpRight, ArrowLeft, Bookmark, Clock3, Sparkles,
  Check, Play, CheckCircle2
} from 'lucide-react';
import Badge from './Badge.jsx';
import './ProjectCard.css';

const palette = ['violet', 'blue', 'teal', 'orange', 'pink'];

export default function ProjectCard({
  project, onOpen, onStatus, status, score, compact = false
}) {
  const color = palette[(project.title.length + project.id.length) % palette.length];
  const isSaved = status === 'Saved';

  const nextAction =
    status === 'Hidden'
      ? { label: 'Restore to Planning', status: 'Planning', icon: Play }
      : status === 'Completed'
        ? { label: 'Reopen Project', status: 'In Progress', icon: Play }
        : status === 'In Progress'
          ? { label: 'Mark as Completed', status: 'Completed', icon: CheckCircle2 }
          : status === 'Planning'
            ? { label: 'Start Project', status: 'In Progress', icon: Play }
            : { label: 'Start Planning', status: 'Planning', icon: Play };

  const backAction = status === 'In Progress'
    ? { label: 'Back to Planning', status: 'Planning' }
    : null;

  const ActionIcon = nextAction.icon;

  return (
    <article className={`project-card ${compact ? 'compact-card' : ''}`}>
      <div className={`project-art art-${color}`}>
        <div className="art-orbit orbit-one" />
        <div className="art-orbit orbit-two" />
        <div className="art-symbol">
          {project.field === 'AI/ML' ? '✳'
            : project.field === 'UI/UX Design' ? '◈'
            : project.field === 'Game Development' ? '▦'
            : project.field === 'Cybersecurity' ? '⌘'
            : project.field === 'Data Science' ? '∿' : '⌬'}
        </div>
        <span className="art-category">{project.field}</span>
        <button
          className={`card-save ${isSaved ? 'is-saved' : ''}`}
          aria-label={isSaved
            ? `Move ${project.title} to planning`
            : `Save ${project.title}`}
          title={isSaved ? 'Move to planning' : 'Save project'}
          onClick={() => onStatus(project.id, isSaved ? 'Planning' : 'Saved')}
        >
          <Bookmark size={15} />
        </button>
      </div>

      <div className="project-card-body">
        <div className="card-meta">
          <Badge tone={
            project.level === 'Beginner' ? 'green'
              : project.level === 'Advanced' ? 'amber' : 'purple'
          }>
            {project.level}
          </Badge>
          {score !== undefined && score !== null && (
            <span className="match-label"><Sparkles size={11} />{score}% match</span>
          )}
        </div>

        <button className="project-title" onClick={() => onOpen(project.id)}>
          {project.title}<ArrowUpRight size={15} />
        </button>
        <p className="project-description">{project.description}</p>

        <div className="tech-list">
          {(project.techStack || []).slice(0, 3).map(t => <span key={t}>{t}</span>)}
        </div>

        <div className="project-card-footer">
          <span><Clock3 size={13} />{project.duration}</span>
          <button onClick={() => onOpen(project.id)}>
            View details <ArrowUpRight size={13} />
          </button>
        </div>

        {status && (
          <div className={`status-strip status-${status.toLowerCase().replaceAll(' ', '-')}`}>
            <Check size={12} />{status}
          </div>
        )}

        <button
          className="card-next-action"
          onClick={() => onStatus(project.id, nextAction.status)}
        >
          <ActionIcon size={14} />
          <span>{nextAction.label}</span>
          <ArrowUpRight size={13} />
        </button>

        {backAction && (
          <button
            className="card-back-action"
            onClick={() => onStatus(project.id, backAction.status)}
          >
            <ArrowLeft size={13} />{backAction.label}
          </button>
        )}
      </div>
    </article>
  );
}
