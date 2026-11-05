import React, { useCallback, useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import Toast from './components/Toast.jsx';
import Login from './pages/Login/Login.jsx';
import SignUp from './pages/SignUp/SignUp.jsx';
import OTPVerification from './pages/OTPVerification/OTPVerification.jsx';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword.jsx';
import Onboarding from './pages/Onboarding/Onboarding.jsx';
import Dashboard from './pages/Dashboard/Dashboard.jsx';
import ExploreProjects from './pages/ExploreProjects/ExploreProjects.jsx';
import Recommendations from './pages/Recommendations/Recommendations.jsx';
import ProjectDetails from './pages/ProjectDetails/ProjectDetails.jsx';
import SavedProjects from './pages/SavedProjects/SavedProjects.jsx';
import Planning from './pages/Planning/Planning.jsx';
import InProgress from './pages/InProgress/InProgress.jsx';
import CompletedProjects from './pages/CompletedProjects/CompletedProjects.jsx';
import HiddenProjects from './pages/HiddenProjects/HiddenProjects.jsx';
import Profile from './pages/Profile/Profile.jsx';
import NotFound from './pages/NotFound/NotFound.jsx';

const authPages = ['/login', '/signup', '/otp', '/forgot-password'];

function readRoute() {
  return window.location.hash.replace(/^#/, '') || '/login';
}

function RouterApp() {
  const { user, authReady, onboarded, toast, setToast } = useApp();

  const [page, setPage] = useState(readRoute);
  const [selectedId, setSelectedId] = useState(null);

  const go = useCallback((path, replace = false) => {
    if (path.startsWith('/project/')) {
      setSelectedId(path.split('/')[2]);
    }

    setPage(path);

    const url = `${window.location.pathname}${window.location.search}#${path}`;

    if (replace) {
      window.history.replaceState(null, '', url);
    } else if (readRoute() !== path) {
      window.history.pushState(null, '', url);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!authReady) return;

    const syncRoute = () => {
      const route = readRoute();

      if (!user && !authPages.includes(route)) {
        go('/login', true);
        return;
      }

      if (user && authPages.includes(route)) {
        go(onboarded ? '/dashboard' : '/onboarding', true);
        return;
      }

      if (user && !onboarded && route !== '/onboarding') {
        go('/onboarding', true);
        return;
      }

      setPage(route);
    };

    syncRoute();

    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);

    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, [authReady, user, onboarded, go]);

  if (!authReady) {
    return (
      <div className="app-loading" role="status">
        <span>Loading Devora...</span>
      </div>
    );
  }

  const render = () => {
    if (!user || authPages.includes(page)) {
      if (page === '/signup') return <SignUp go={go} />;
      if (page === '/otp') return <OTPVerification go={go} />;
      if (page === '/forgot-password') return <ForgotPassword go={go} />;
      return <Login go={go} />;
    }

    if (!onboarded && page !== '/onboarding') {
      return <Onboarding go={go} />;
    }

    if (page === '/onboarding') return <Onboarding go={go} />;
    if (page === '/dashboard') return <Dashboard go={go} />;
    if (page === '/explore') return <ExploreProjects go={go} />;
    if (page === '/recommendations') return <Recommendations go={go} />;

    if (page.startsWith('/project/')) {
      return <ProjectDetails id={selectedId || page.split('/')[2]} go={go} />;
    }

    if (page === '/saved') return <SavedProjects go={go} />;
    if (page === '/planning') return <Planning go={go} />;
    if (page === '/in-progress') return <InProgress go={go} />;
    if (page === '/completed') return <CompletedProjects go={go} />;
    if (page === '/hidden') return <HiddenProjects go={go} />;
    if (page === '/profile') return <Profile go={go} />;

    return <NotFound go={go} />;
  };

  const isAuth = !user || authPages.includes(page);

  return (
    <>
      {isAuth ? (
        render()
      ) : (
        <AppLayout page={page} go={go}>
          {render()}
        </AppLayout>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <RouterApp />
    </AppProvider>
  );
}
