export const cx = (...parts) => parts.filter(Boolean).join(' ');
export const titleCase = (s='') => s.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
export const formatDate = (value) => value ? new Date(value).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' }) : '—';
export const getProjectStatus = (project, state) => state?.hidden?.includes(project.id) ? 'Hidden' : state?.statuses?.[project.id] || '';
export const matchScore = (project, prefs={}) => {
  let score = 58;
  if (prefs.fields?.includes(project.field)) score += 18;
  if (prefs.level && prefs.level === project.level) score += 10;
  if (prefs.techStack?.some(t => project.techStack.includes(t))) score += 8;
  if (prefs.goal && prefs.goal === project.goal) score += 6;
  return Math.min(99, score);
};
export const initials = (name='Devora User') => name.trim().split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()).join('') || 'DU';
