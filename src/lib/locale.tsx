import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { labels, type Labels, type Locale } from "./i18n.ts";

const STORAGE_KEY = "adutha-bus-locale";

function readStoredLocale(): Locale {
  return localStorage.getItem(STORAGE_KEY) === "ta" ? "ta" : "en";
}

type LocaleContextValue = {
  locale: Locale;
  toggleLocale: () => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => readStoredLocale());

  const toggleLocale = useCallback(() => {
    const next = locale === "en" ? "ta" : "en";
    setLocale(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => ({ locale, toggleLocale }), [locale, toggleLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}

export function useLabels(): Labels {
  return labels[useLocale().locale];
}
