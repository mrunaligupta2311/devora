import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

import { apiRequest } from '../services/api.js';
import {
  restoreSession,
  logoutDemo,
  updateDemoProfile
} from '../services/authService.js';

const AppContext = createContext(null);

const DEFAULT_PREFERENCES = {
  fields: [],
  level: 'Intermediate',
  techStack: [],
  goal: 'Portfolio building',
  onboarded: false
};

const EMPTY_PROJECT_STATE = {
  statuses: {},
  hidden: [],
  milestones: {}
};

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const [projects, setProjects] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [dashboard, setDashboard] = useState(null);

  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [projectState, setProjectState] = useState(EMPTY_PROJECT_STATE);
  const [onboarded, setOnboarded] = useState(false);

  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const loadProjects = useCallback(async () => {
    const firstPage = await apiRequest('/projects?page=1&limit=100');

    const allProjects = [...(firstPage?.projects || [])];
    const totalPages = firstPage?.pagination?.pages || 1;

    for (let page = 2; page <= totalPages; page += 1) {
      const result = await apiRequest(
        `/projects?page=${page}&limit=100`
      );

      allProjects.push(...(result?.projects || []));
    }

    setProjects(allProjects);
    return allProjects;
  }, []);

  const loadUserData = useCallback(async () => {
    setLoading(true);

    try {
      const [
        profile,
        userPreferences,
        userProjects,
        dashboardData,
        recommendationData
      ] = await Promise.all([
        apiRequest('/users/profile'),
        apiRequest('/users/preferences'),
        apiRequest('/users/projects'),
        apiRequest('/users/dashboard'),
        apiRequest('/projects/recommendations')
      ]);

      setUser(profile);
      setPreferences(userPreferences || DEFAULT_PREFERENCES);
      setOnboarded(Boolean(userPreferences?.onboarded));
      setDashboard(dashboardData);
      setRecommendations(recommendationData || []);

      const statuses = {};
      const hidden = {};

      (userProjects || []).forEach(item => {
        statuses[item.id] = item.status;

        if (item.status === 'Hidden') {
          hidden[item.id] = true;
        }
      });

      setProjectState({
        statuses,
        hidden: Object.keys(hidden),
        milestones: {}
      });

      await loadProjects();
    } finally {
      setLoading(false);
    }
  }, [loadProjects]);

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      try {
        const restoredUser = await restoreSession();

        if (!active) return;

        if (restoredUser) {
          setUser(restoredUser);
          await loadUserData();
        }
      } catch (error) {
        console.error('Devora initialization failed:', error);
      } finally {
        if (active) setAuthReady(true);
      }
    };

    initialize();

    return () => {
      active = false;
    };
  }, [loadUserData]);

  const refreshProjects = useCallback(async () => {
    await loadProjects();

    if (user) {
      const [userProjects, dashboardData, recommendationData] =
        await Promise.all([
          apiRequest('/users/projects'),
          apiRequest('/users/dashboard'),
          apiRequest('/projects/recommendations')
        ]);

      const statuses = {};
      const hidden = [];

      (userProjects || []).forEach(item => {
        statuses[item.id] = item.status;
        if (item.status === 'Hidden') hidden.push(item.id);
      });

      setProjectState({
        statuses,
        hidden,
        milestones: {}
      });

      setDashboard(dashboardData);
      setRecommendations(recommendationData || []);
    }
  }, [loadProjects, user]);

  const login = useCallback(async account => {
    setUser(account);
    await loadUserData();
  }, [loadUserData]);

  const updateProfile = useCallback(async next => {
    const updated = await updateDemoProfile(next);
    setUser(previous => ({ ...previous, ...updated }));
    return updated;
  }, []);

  const updatePreferences = useCallback(async next => {
    const updated = await apiRequest('/users/preferences', {
      method: 'PUT',
      body: next
    });

    setPreferences(updated);
    setOnboarded(Boolean(updated?.onboarded));
    return updated;
  }, []);

  const finishOnboarding = useCallback(async nextPreferences => {
    const updated = await updatePreferences({
      ...nextPreferences,
      onboarded: true
    });

    notify('Your preferences have been saved.');
    return updated;
  }, [notify, updatePreferences]);

  const changeStatus = useCallback(async (id, status) => {
    const updated = await apiRequest(`/users/projects/${id}/status`, {
      method: 'PUT',
      body: { status }
    });

    setProjectState(previous => {
      const statuses = { ...previous.statuses, [id]: status };
      const hidden = status === 'Hidden'
        ? [...new Set([...previous.hidden, id])]
        : previous.hidden.filter(projectId => projectId !== id);

      return { ...previous, statuses, hidden };
    });

    notify(`Project moved to ${status}.`);
    await refreshProjects();
    return updated;
  }, [notify, refreshProjects]);

  const updateMilestone = useCallback(async (projectId, milestoneId, complete) => {
    await apiRequest(
      `/users/projects/${projectId}/milestones/${milestoneId}`,
      {
        method: 'PUT',
        body: { completed: Boolean(complete) }
      }
    );

    notify('Roadmap progress updated.');
  }, [notify]);

  const logout = useCallback(async () => {
    try {
      await logoutDemo();
    } finally {
      setUser(null);
      setProjects([]);
      setRecommendations([]);
      setDashboard(null);
      setProjectState(EMPTY_PROJECT_STATE);
      setPreferences(DEFAULT_PREFERENCES);
      setOnboarded(false);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    authReady,
    loading,
    login,
    logout,
    updateProfile,
    preferences,
    updatePreferences,
    projects,
    recommendations,
    dashboard,
    projectState,
    refreshProjects,
    changeStatus,
    updateMilestone,
    onboarded,
    finishOnboarding,
    toast,
    notify,
    setToast
  }), [
    user,
    authReady,
    loading,
    login,
    logout,
    updateProfile,
    preferences,
    updatePreferences,
    projects,
    recommendations,
    dashboard,
    projectState,
    refreshProjects,
    changeStatus,
    updateMilestone,
    onboarded,
    finishOnboarding,
    toast,
    notify
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp must be used inside AppProvider.');
  }

  return context;
}
