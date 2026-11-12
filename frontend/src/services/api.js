const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
).replace(/\/$/, '');

const TOKEN_KEY = 'devora.accessToken';

export const getAccessToken = () => sessionStorage.getItem(TOKEN_KEY);

export const setAccessToken = token => {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
};

let refreshPromise = null;

export const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json().catch(() => ({}));
        const token = result?.data?.accessToken;

        if (!response.ok || !token) {
          setAccessToken(null);
          return false;
        }

        setAccessToken(token);
        return true;
      } catch {
        setAccessToken(null);
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
};

export const apiRequest = async (
  path,
  { method = 'GET', body, auth = true, retry = true } = {}
) => {
  const headers = { 'Content-Type': 'application/json' };
  const token = getAccessToken();

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });

  if (response.status === 401 && auth && retry) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      return apiRequest(path, { method, body, auth, retry: false });
    }

    setAccessToken(null);
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const fieldError = Array.isArray(result.errors) ? result.errors[0] : null;
    throw new Error(
      fieldError?.message ||
      result.message ||
      'Something went wrong. Please try again.'
    );
  }

  return result.data;
};
