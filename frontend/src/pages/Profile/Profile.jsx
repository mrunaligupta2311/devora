import React, { useMemo, useState } from 'react';
import {
  Database, LogOut, Save, SlidersHorizontal,
  UserRound, Mail, CircleUserRound
} from 'lucide-react';
import PageHeader from '../../components/PageHeader.jsx';
import Button from '../../components/Button.jsx';
import FieldPill from '../../components/FieldPill.jsx';
import { useApp } from '../../context/AppContext.jsx';
import './Profile.css';

const fields = [
  'Frontend', 'Full-stack', 'Backend', 'AI/ML',
  'Mobile App Development', 'Cybersecurity', 'Data Science',
  'Game Development', 'UI/UX Design'
];

const goals = [
  'Portfolio building', 'Practical problem solving',
  'Technical depth', 'Product thinking', 'Interview preparation'
];

export default function Profile({ go }) {
  const {
    user, updateProfile, preferences, updatePreferences,
    notify, logout, projects = []
  } = useApp();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [chosen, setChosen] = useState(preferences.fields || []);
  const [level, setLevel] = useState(preferences.level || 'Intermediate');
  const [goal, setGoal] = useState(preferences.goal || 'Portfolio building');
  const [tech, setTech] = useState(preferences.techStack || []);

  const techs = useMemo(() => [...new Set(projects.flatMap(p => p.techStack || []))].slice(0, 35), [projects]);

  const toggle = (arr, set, value) => {
    set(arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value]);
  };

  const saveProfile = async () => {
    try {
      const updated = await updateProfile({ name: name.trim() });
      setName(updated.name);
      notify('Profile details updated successfully.');
    } catch (error) {
      notify(error.message || 'Could not update your profile.', 'error');
    }
  };

  const savePreferences = async () => {
    try {
      await updatePreferences({ fields: chosen, level, goal, techStack: tech });
      notify('Preferences saved. Your project matches are updated.');
    } catch (error) {
      notify(error.message || 'Could not save preferences.', 'error');
    }
  };


  return (
    <div className="profile-page">
      <PageHeader
        eyebrow="YOUR SPACE, YOUR RULES"
        title="Profile & preferences"
        description="Manage your account details, skills and project recommendations."
      />

      <div className="profile-layout">
        <div className="profile-main">
          <section className="profile-panel">
            <div className="profile-section-head">
              <span className="profile-section-icon"><UserRound size={17} /></span>
              <div>
                <h2>Profile details</h2>
                <p>Update the name shown in your account. Your verified email is read-only.</p>
              </div>
            </div>

            <div className="profile-identity">
              <div className="profile-big-avatar">
                {(name || 'D').trim().slice(0, 1).toUpperCase()}
              </div>
              <div>
                <b>{name.trim() || 'Your name'}</b>
                <span>{email || 'Your email address'}</span>
              </div>
            </div>

            <div className="profile-input-grid">
              <label className="profile-input-field">
                <span><CircleUserRound size={14} /> Full name</span>
                <input
                  className="profile-input"
                  type="text"
                  autoComplete="name"
                  value={name}
                  maxLength={80}
                  onChange={event => setName(event.target.value)}
                  placeholder="Enter your name"
                />
              </label>

              <label className="profile-input-field">
                <span><Mail size={14} /> Email address</span>
                <input
                  className="profile-input"
                  type="email"
                  autoComplete="email"
                  value={email}
                  maxLength={160}
                  readOnly
                  placeholder="you@example.com"
                />
              </label>
            </div>

            <div className="profile-save-row">
              <Button onClick={saveProfile} icon={Save}>Save profile</Button>
            </div>
          </section>

          <section className="profile-panel">
            <div className="profile-section-head">
              <span className="profile-section-icon"><SlidersHorizontal size={17} /></span>
              <div>
                <h2>Recommendation preferences</h2>
                <p>Choose what you want to learn and build next.</p>
              </div>
            </div>

            <div className="profile-field-block">
              <b>Fields of interest</b>
              <div className="profile-pills">
                {fields.map(field => (
                  <FieldPill
                    key={field}
                    active={chosen.includes(field)}
                    onClick={() => toggle(chosen, setChosen, field)}
                  >
                    {field}
                  </FieldPill>
                ))}
              </div>
            </div>

            <div className="profile-field-block">
              <b>Current skill level</b>
              <div className="profile-pills">
                {['Beginner', 'Intermediate', 'Advanced'].map(item => (
                  <FieldPill
                    key={item}
                    active={level === item}
                    onClick={() => setLevel(item)}
                  >
                    {item}
                  </FieldPill>
                ))}
              </div>
            </div>

            <div className="profile-field-block">
              <b>Main goal</b>
              <div className="profile-pills">
                {goals.map(item => (
                  <FieldPill
                    key={item}
                    active={goal === item}
                    onClick={() => setGoal(item)}
                  >
                    {item}
                  </FieldPill>
                ))}
              </div>
            </div>

            <div className="profile-field-block">
              <b>Preferred technologies</b>
              <p className="profile-field-hint">Select the technologies you want to work with.</p>
              <div className="profile-pills">
                {techs.map(item => (
                  <FieldPill
                    key={item}
                    active={tech.includes(item)}
                    onClick={() => toggle(tech, setTech, item)}
                  >
                    {item}
                  </FieldPill>
                ))}
              </div>
            </div>

            <Button onClick={savePreferences} icon={Save}>Save preferences</Button>
          </section>
        </div>

        <aside className="profile-aside">
          <section className="profile-panel">
            <div className="profile-section-head">
              <span className="profile-section-icon"><Database size={17} /></span>
              <div>
                <h2>Workspace data</h2>
                <p>Connected to your Devora account</p>
              </div>
            </div>
            <div className="profile-info-row">
              <span>Curated projects</span><b>{projects.length}</b>
            </div>
            <div className="profile-storage-note">
Your project catalogue, preferences, statuses and roadmap progress are connected to your account and stored in the database.
            </div>
          </section>

          <Button variant="ghost" onClick={async () => { await logout(); go('/login'); }} icon={LogOut}>
            Sign out
          </Button>
        </aside>
      </div>


    </div>
  );
}
