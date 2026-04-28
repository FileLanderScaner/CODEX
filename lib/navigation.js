import { Platform } from 'react-native';
import { useEffect, useMemo, useState } from 'react';

function safeWindow() {
  return typeof window !== 'undefined' ? window : null;
}

export function getWebPath() {
  const w = safeWindow();
  if (!w) {
    return '/app';
  }
  const path = w.location?.pathname || '/app';
  return path === '/' ? '/app' : path;
}

export function getWebQuery() {
  const w = safeWindow();
  if (!w) {
    return {};
  }
  const params = new URLSearchParams(w.location?.search || '');
  const entries = {};
  params.forEach((value, key) => {
    entries[key] = value;
  });
  return entries;
}

export function navigateWeb(path) {
  const w = safeWindow();
  if (!w) {
    return;
  }
  const next = path?.startsWith('/') ? path : `/${path}`;
  w.history.pushState({}, '', next);
  w.dispatchEvent(new Event('popstate'));
}

export function replaceWeb(path) {
  const w = safeWindow();
  if (!w) {
    return;
  }
  const next = path?.startsWith('/') ? path : `/${path}`;
  w.history.replaceState({}, '', next);
  w.dispatchEvent(new Event('popstate'));
}

export function useWebLocation() {
  const [path, setPath] = useState(() => getWebPath());
  const [query, setQuery] = useState(() => getWebQuery());

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return () => {};
    }

    const onChange = () => {
      setPath(getWebPath());
      setQuery(getWebQuery());
    };

    window.addEventListener('popstate', onChange);
    window.addEventListener('hashchange', onChange);
    return () => {
      window.removeEventListener('popstate', onChange);
      window.removeEventListener('hashchange', onChange);
    };
  }, []);

  const api = useMemo(
    () => ({
      path,
      query,
      navigate: (nextPath) => navigateWeb(nextPath),
      replace: (nextPath) => replaceWeb(nextPath),
    }),
    [path, query],
  );

  return api;
}
