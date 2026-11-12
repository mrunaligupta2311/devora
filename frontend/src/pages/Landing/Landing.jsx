import React from 'react';
import {
  ArrowRight,
  Compass,
  Layers3,
  Route,
  Target,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import './Landing.css';

const features = [
  {
    icon: Compass,
    title: 'Discover projects',
    description: 'Explore practical project ideas across different development fields.'
  },
  {
    icon: Route,
    title: 'Plan your roadmap',
    description: 'Break ambitious ideas into manageable milestones and clear actions.'
  },
  {
    icon: Target,
    title: 'Track your progress',
    description: 'Organize saved projects and track your journey from idea to completion.'
  }
];

export default function Landing({ go }) {
  return (
    <main className="landing">
      <nav className="landing-nav">
        <a className="landing-brand" href="#/" aria-label="Devora home">
          <span className="landing-brand-icon"><Layers3 size={21} /></span>
          <span>devora</span>
        </a>

        <div className="landing-nav-actions">
          <button className="landing-login" onClick={() => go('/login')}>
            Log in
          </button>
          <button className="landing-nav-cta" onClick={() => go('/signup')}>
            Get started <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-eyebrow">
          <Sparkles size={15} />
          YOUR NEXT BUILD STARTS HERE
        </div>

        <h1>
          Ideas are easy.
          <span> Building is magic.</span>
        </h1>

        <p className="landing-description">
          Discover meaningful developer projects, create structured roadmaps,
          and turn your curiosity into real progress.
        </p>

        <div className="landing-hero-actions">
          <button className="landing-primary" onClick={() => go('/signup')}>
            Create your account <ArrowRight size={17} />
          </button>
          <button className="landing-secondary" onClick={() => go('/login')}>
            I already have an account
          </button>
        </div>

        <div className="landing-proof">
          <div><strong>234</strong><span>Project ideas</span></div>
          <div><strong>09</strong><span>Fields to explore</span></div>
          <div><strong>∞</strong><span>Ways to grow</span></div>
        </div>
      </section>

      <section className="landing-features" aria-labelledby="features-heading">
        <div className="landing-section-heading">
          <span>BUILT FOR YOUR JOURNEY</span>
          <h2 id="features-heading">From first idea to finished project.</h2>
        </div>

        <div className="landing-feature-grid">
          {features.map(({ icon: Icon, title, description }) => (
            <article className="landing-feature-card" key={title}>
              <div className="landing-feature-icon"><Icon size={22} /></div>
              <h3>{title}</h3>
              <p>{description}</p>
              <CheckCircle2 className="landing-feature-check" size={18} />
            </article>
          ))}
        </div>
      </section>

      <section className="landing-bottom">
        <div>
          <span>YOUR BUILDING SPACE</span>
          <h2>Make your next project count.</h2>
        </div>
        <button className="landing-primary" onClick={() => go('/signup')}>
          Start building <ArrowRight size={17} />
        </button>
      </section>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} Devora</span>
        <span>Discover. Plan. Build.</span>
      </footer>
    </main>
  );
}
