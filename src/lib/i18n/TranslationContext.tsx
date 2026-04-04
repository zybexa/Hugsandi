'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import en from './en';
import defaultIs from './is';

type Language = 'en' | 'is';

const ERROR_MAP: Record<string, string> = {
  'This email is already in the list': 'error.emailAlreadyInList',
  'Design not found': 'error.designNotFound',
  'This newsletter has already been sent': 'error.alreadySent',
  'No email list found': 'error.noEmailList',
  'No subscribers in this list': 'error.noSubscribers',
  'No valid email addresses found in CSV': 'error.noValidEmails',
  'Invalid password': 'error.invalidPassword',
};

interface DbOverrides {
  en: Record<string, string>;
  is: Record<string, string>;
}

interface TranslationContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  tp: (key: string, count: number, vars?: Record<string, string | number>) => string;
  tError: (apiMessage: string) => string;
  dbOverrides: DbOverrides;
  saveTranslations: (overrides: DbOverrides) => Promise<boolean>;
  allKeys: string[];
  ready: boolean;
  rawDefaults: Record<string, unknown> | null;
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  let result = str;
  for (const [k, v] of Object.entries(vars)) {
    result = result.replace(`{${k}}`, String(v));
  }
  return result;
}

function resolve(key: string, lang: Language, overrides: DbOverrides): string {
  if (lang === 'is') {
    if (overrides.is[key]) return overrides.is[key];
    if (defaultIs[key]) return defaultIs[key];
  }
  if (lang === 'en') {
    if (overrides.en[key]) return overrides.en[key];
  }
  return en[key] || key;
}

const defaultContext: TranslationContextValue = {
  lang: 'en',
  setLang: () => {},
  t: (key, vars) => interpolate(en[key] || key, vars),
  tp: (key, count, vars) => {
    const suffix = count === 1 ? '_one' : '_other';
    return interpolate(en[key + suffix] || en[key] || key, { count, ...vars });
  },
  tError: (msg) => {
    const k = ERROR_MAP[msg];
    return k ? (en[k] || msg) : msg;
  },
  dbOverrides: { en: {}, is: {} },
  saveTranslations: () => Promise.resolve(false),
  allKeys: Object.keys(en),
  ready: false,
  rawDefaults: null,
};

const TranslationContext = createContext<TranslationContextValue>(defaultContext);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('is');
  const [overrides, setOverrides] = useState<DbOverrides>({ en: {}, is: {} });
  const [ready, setReady] = useState(false);
  const [rawDefaults, setRawDefaults] = useState<Record<string, unknown> | null>(null);

  // Load language + translations — use localStorage cache to avoid fetch on every navigation
  useEffect(() => {
    const CACHE_KEY = 'hugsandi_defaults';
    const CACHE_TTL = 60 * 1000; // 1 minute

    function applyDefaults(data: Record<string, unknown>) {
      setRawDefaults(data);
      if (data.language === 'is' || data.language === 'en') {
        setLangState(data.language as Language);
      }
      if (data.translations && typeof data.translations === 'object') {
        const tr = data.translations as Record<string, Record<string, string>>;
        setOverrides({
          en: (tr.en && typeof tr.en === 'object') ? tr.en : {},
          is: (tr.is && typeof tr.is === 'object') ? tr.is : {},
        });
      }
    }

    // Try cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          applyDefaults(data);
          setReady(true);
          return;
        }
      }
    } catch { /* ignore corrupted cache */ }

    // Fetch from API and cache
    fetch('/api/defaults')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          applyDefaults(data);
          try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // Sync document lang attribute and title
  useEffect(() => {
    document.documentElement.lang = lang;
    const titleKey = 'app.title';
    document.title = resolve(titleKey, lang, overrides);
  }, [lang, overrides]);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    try { localStorage.removeItem('hugsandi_defaults'); } catch {}
    fetch('/api/defaults', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'language', value: newLang }),
    }).catch(() => {});
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      return interpolate(resolve(key, lang, overrides), vars);
    },
    [lang, overrides]
  );

  const tp = useCallback(
    (key: string, count: number, vars?: Record<string, string | number>) => {
      const suffix = count === 1 ? '_one' : '_other';
      return interpolate(resolve(key + suffix, lang, overrides), { count, ...vars });
    },
    [lang, overrides]
  );

  const tError = useCallback(
    (apiMessage: string) => {
      const k = ERROR_MAP[apiMessage];
      if (k) return interpolate(resolve(k, lang, overrides));
      return apiMessage;
    },
    [lang, overrides]
  );

  const saveTranslations = useCallback(
    async (newOverrides: DbOverrides): Promise<boolean> => {
      // Filter out empty values from both languages
      const filtered: DbOverrides = { en: {}, is: {} };
      for (const [k, v] of Object.entries(newOverrides.en)) {
        if (v && v.trim()) filtered.en[k] = v;
      }
      for (const [k, v] of Object.entries(newOverrides.is)) {
        if (v && v.trim()) filtered.is[k] = v;
      }
      setOverrides(filtered);
      try { localStorage.removeItem('hugsandi_defaults'); } catch {}
      try {
        const res = await fetch('/api/defaults', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'translations', value: filtered }),
        });
        return res.ok;
      } catch {
        return false;
      }
    },
    []
  );

  return (
    <TranslationContext.Provider
      value={{
        lang,
        setLang,
        t,
        tp,
        tError,
        dbOverrides: overrides,
        saveTranslations,
        allKeys: defaultContext.allKeys,
        ready,
        rawDefaults,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  return useContext(TranslationContext);
}
