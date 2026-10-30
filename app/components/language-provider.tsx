"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  isLanguage,
  translations,
  type Language,
  type Localized,
  type TranslationKey,
} from "@/lib/translations";

type TranslateParams = Record<string, string | number>;

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  /** Translate a static UI string, replacing `{param}` placeholders. */
  t: (key: TranslationKey, params?: TranslateParams) => string;
  /** Pick the current language from a bilingual value (e.g. product data). */
  l: (value: Localized) => string;
  /** Format a number with the digits/grouping of the current language. */
  formatNumber: (value: number) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

// A tiny external store keeps every consumer on the same language and avoids
// hydration mismatches: the server snapshot is always the default language,
// and React re-renders with the stored value right after hydration.
const listeners = new Set<() => void>();
let memoryLanguage: Language | null = null;

function readLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLanguage(stored)) return stored;
  } catch {
    // localStorage can be unavailable (private mode, blocked storage).
  }
  return memoryLanguage ?? DEFAULT_LANGUAGE;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function writeLanguage(language: Language) {
  memoryLanguage = language;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Fall back to the in-memory value for this session.
  }
  listeners.forEach((listener) => listener());
}

const getServerSnapshot = (): Language => DEFAULT_LANGUAGE;

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(
    subscribe,
    readLanguage,
    getServerSnapshot,
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback(
    (key: TranslationKey, params?: TranslateParams) => {
      const text = translations[language][key];
      if (!params) return text;
      return text.replace(/\{(\w+)\}/g, (match, name: string) =>
        name in params ? String(params[name]) : match,
      );
    },
    [language],
  );

  const l = useCallback((value: Localized) => value[language], [language]);

  const formatNumber = useCallback(
    (value: number) =>
      value.toLocaleString(language === "bn" ? "bn-BD" : "en-BD"),
    [language],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage: writeLanguage, t, l, formatNumber }),
    [language, t, l, formatNumber],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
