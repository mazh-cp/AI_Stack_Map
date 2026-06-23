// Lightweight i18n — a dictionary + context, no external dependency. Strings are
// keyed; `t(key, fallback)` falls back to English then the key. Adding a locale
// = adding a dictionary entry. Remaining hardcoded strings convert by wrapping
// them in t() the same way the nav/header do.

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

export type Locale = "en" | "es";

export const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
];

const DICT: Record<Locale, Record<string, string>> = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.stackMap": "LLM Stack Map",
    "nav.assessment": "Layer Assessment",
    "nav.risks": "Risk Register",
    "nav.controls": "Control Library",
    "nav.builder": "Architecture Builder",
    "nav.fileGateway": "File Security Gateway",
    "nav.lakera": "Lakera Guard",
    "nav.models": "Model Coverage",
    "nav.integrations": "Integrations",
    "nav.compliance": "Compliance",
    "nav.report": "Report Generator",
    "nav.settings": "Settings",
    "nav.section.integrations": "Integrations",
    "nav.section.reporting": "Reporting",
    "nav.section.account": "Account",
    "header.search": "Search controls & risks…",
    "header.signout": "Sign out",
    "sidebar.socActive": "SOC monitoring active",
    "conn.online": "Backend online",
    "conn.local": "Local mode",
    "conn.connecting": "Connecting…",
  },
  es: {
    "nav.dashboard": "Panel",
    "nav.stackMap": "Mapa del Stack LLM",
    "nav.assessment": "Evaluación por Capa",
    "nav.risks": "Registro de Riesgos",
    "nav.controls": "Biblioteca de Controles",
    "nav.builder": "Constructor de Arquitectura",
    "nav.fileGateway": "Puerta de Seguridad de Archivos",
    "nav.lakera": "Lakera Guard",
    "nav.models": "Cobertura de Modelos",
    "nav.integrations": "Integraciones",
    "nav.compliance": "Cumplimiento",
    "nav.report": "Generador de Informes",
    "nav.settings": "Configuración",
    "nav.section.integrations": "Integraciones",
    "nav.section.reporting": "Informes",
    "nav.section.account": "Cuenta",
    "header.search": "Buscar controles y riesgos…",
    "header.signout": "Cerrar sesión",
    "sidebar.socActive": "Monitoreo SOC activo",
    "conn.online": "Backend conectado",
    "conn.local": "Modo local",
    "conn.connecting": "Conectando…",
  },
};

interface Ctx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(
    () => (localStorage.getItem("assm-locale") as Locale) || "en"
  );
  const setLocale = (l: Locale) => {
    localStorage.setItem("assm-locale", l);
    document.documentElement.lang = l;
    setLocaleState(l);
  };
  const t = useCallback(
    (key: string, fallback?: string) =>
      DICT[locale][key] ?? DICT.en[key] ?? fallback ?? key,
    [locale]
  );
  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): Ctx {
  const c = useContext(I18nContext);
  if (!c) throw new Error("useI18n must be used within I18nProvider");
  return c;
}
