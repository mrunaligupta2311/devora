import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Menu, X, Search, PanelLeftClose, PanelLeftOpen, Compass,
  LayoutDashboard, Sparkles, Bookmark, CalendarDays, Hammer,
  CheckCircle2, EyeOff, LogOut, Layers3, ArrowRight, FolderKanban
} from 'lucide-react';
import './AppLayout.css';
import { useApp } from '../context/AppContext.jsx';

const navGroups = [
  {
    label: 'Workspace',
    items: [
      ['Dashboard', '/dashboard', LayoutDashboard],
      ['Explore projects', '/explore', Compass],
      ['For you', '/recommendations', Sparkles]
    ]
  },
  {
    label: 'My projects',
    items: [
      ['Saved', '/saved', Bookmark],
      ['Planning', '/planning', CalendarDays],
      ['In progress', '/in-progress', Hammer],
      ['Completed', '/completed', CheckCircle2],
      ['Hidden', '/hidden', EyeOff]
    ]
  }
];

const routeLabels = {
  '/dashboard': 'Dashboard',
  '/explore': 'Explore projects',
  '/recommendations': 'For you',
  '/saved': 'Saved projects',
  '/planning': 'Planning',
  '/in-progress': 'In progress',
  '/completed': 'Completed projects',
  '/hidden': 'Hidden projects',
  '/profile': 'Profile & preferences',
  '/onboarding': 'Your preferences'
};

function SearchDialog({ onClose, go, projects }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKeyDown = event => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects.slice(0, 6);

    return projects.filter(project => [
      project.title,
      project.description,
      project.field,
      project.level,
      ...(project.techStack || [])
    ].join(' ').toLowerCase().includes(q)).slice(0, 8);
  }, [query, projects]);

  const openProject = id => {
    onClose();
    go(`/project/${id}`);
  };

  return (
    <div className="devora-overlay" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className="devora-search-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Search projects"
      >
        <div className="devora-search-input-row">
          <Search size={19} />
          <input
            ref={inputRef}
            type="search"
            name="project-search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck="false"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search projects, technologies, fields..."
            aria-label="Search all projects"
          />
          <button className="icon-btn" onClick={onClose} aria-label="Close search">
            <X size={18} />
          </button>
        </div>

        <div className="devora-search-results">
          <div className="devora-popover-label">
            {query.trim() ? `${results.length} matching projects` : 'POPULAR PROJECT IDEAS'}
          </div>

          {results.length ? results.map(project => (
            <button
              className="devora-search-result"
              key={project.id}
              onClick={() => openProject(project.id)}
            >
              <span className="devora-result-icon"><FolderKanban size={17} /></span>
              <span className="devora-result-copy">
                <strong>{project.title}</strong>
                <small>{project.field || 'Project'} · {project.level || 'All levels'}</small>
              </span>
              <ArrowRight size={15} />
            </button>
          )) : (
            <div className="devora-popover-empty">
              <Search size={22} />
              <strong>No matching projects</strong>
              <span>Try another project name, field or technology.</span>
            </div>
          )}
        </div>

        <div className="devora-search-footer">
          <button onClick={() => { onClose(); go('/explore'); }}>
            Open Explore <ArrowRight size={13} />
          </button>
        </div>
      </section>
    </div>
  );
}

export default function AppLayout({ page, go, children }) {
  const { user, logout, projects = [] } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (!showLogoutConfirm) return;
    const handleEscape = event => {
      if (event.key === 'Escape') setShowLogoutConfirm(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showLogoutConfirm]);

  const nav = path => {
    setMobileOpen(false);
    go(path);
  };

  useEffect(() => {
    const onKeyDown = event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);


  const doLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    setMobileOpen(false);
    await logout();
    go('/login', true);
  };

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {mobileOpen && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark"><Layers3 size={22} /></div>
          {!collapsed && (
            <div className="brand-copy">
              <strong>devora<span>.</span></strong>
              <small>PROJECT DISCOVERY</small>
            </div>
          )}
          <button
            className="icon-btn collapse-btn"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setCollapsed(value => !value)}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          <button
            className="icon-btn mobile-close"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {navGroups.map(group => (
          <div className="nav-group" key={group.label}>
            <div className="nav-label">{!collapsed && group.label}</div>
            {group.items.map(([label, path, Icon]) => (
              <button
                key={path}
                title={collapsed ? label : undefined}
                className={`nav-item ${page === path ? 'active' : ''}`}
                onClick={() => nav(path)}
              >
                <Icon size={18} />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
          </div>
        ))}

        <div className="sidebar-spacer" />
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            {!collapsed && (
              <>
                <span className="tip-icon"><Sparkles size={15} /></span>
                <b>Build something great</b>
                <p>Small projects make big skills.</p>
                <button onClick={() => nav('/explore')}>Find your next build <span>↗</span></button>
              </>
            )}
          </div>

          <button
            className="user-row user-logout-button"
            type="button"
            onClick={doLogout}
            title="Log out"
            aria-label={`Log out ${user?.name || 'of Devora'}`}
          >
            <span className="user-avatar">
              {(user?.name || 'D').slice(0, 1).toUpperCase()}
            </span>
            {!collapsed && (
              <>
                <span className="user-details">
                  <b>{user?.name || 'Builder'}</b>
                  <small>{user?.email || 'Account'}</small>
                </span>
                <LogOut className="user-logout-icon" size={16} />
              </>
            )}
          </button>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <button
            className="icon-btn mobile-menu"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="breadcrumb">
            <strong>{routeLabels[page] || (page.startsWith('/project/') ? 'Project details' : 'Devora')}</strong>
          </div>

          <div className="top-actions">
            <button
              className="global-search"
              onClick={() => setSearchOpen(true)}
              aria-label="Search projects (Ctrl or Command + K)"
            >
              <Search size={15} />
              <span>Search projects</span>
              <kbd>⌘ K</kbd>
            </button>

            <button
              className="top-avatar top-profile-button"
              aria-label="Open profile"
              onClick={() => nav('/profile')}
              title={user?.name || 'Profile'}
            >
              {(user?.name || 'D').slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>

        <main className="page-content">{children}</main>

        <footer className="app-footer">
          <span>© 2026 Devora</span>
          <span>Made for curious builders <span className="footer-spark">✦</span></span>
        </footer>
      </div>

      {showLogoutConfirm && (
        <div
          className="devora-overlay logout-overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              setShowLogoutConfirm(false);
            }
          }}
        >
          <section
            className="devora-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            aria-describedby="logout-description"
          >
            <div className="logout-dialog-top">
              <span className="logout-dialog-icon"><LogOut size={21} /></span>
              <button
                className="icon-btn"
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                aria-label="Close confirmation"
              >
                <X size={18} />
              </button>
            </div>

            <h2 id="logout-title">Leaving so soon?</h2>
            <p id="logout-description">
              Are you sure you want to log out? You can come back anytime.
            </p>

            <div className="logout-dialog-actions">
              <button
                className="logout-cancel-btn"
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Stay here
              </button>
              <button
                className="logout-confirm-btn"
                type="button"
                onClick={confirmLogout}
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          </section>
        </div>
      )}

      {searchOpen && <SearchDialog onClose={() => setSearchOpen(false)} go={go} projects={projects} />}
    </div>
  );
}
