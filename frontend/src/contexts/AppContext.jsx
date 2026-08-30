import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, setCsrfToken } from '../services/frappeApi';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.session(), api.settings()])
      .then(([sessionData, settingsData]) => {
        setSession(sessionData);
        setCsrfToken(sessionData.csrf_token);
        setSettings(settingsData);
      })
      .catch((err) => {
        if (err.status === 401 || err.status === 403) {
          window.location.href = `/login?redirect-to=${encodeURIComponent('/alist')}`;
          return;
        }
        setError(err);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({ session, settings, setSettings }), [session, settings]);
  return <AppContext.Provider value={value}>{loading ? null : error ? <div>{error.message}</div> : children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
