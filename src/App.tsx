import { useEffect, lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { useStore } from "./store/useStore";
import { useI18n } from "./i18n";
import { Layout } from "./components/layout/Layout";
import { Login } from "./pages/Login";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "./components/ui/Toaster";

// Code-split: each route (and heavy deps like React Flow) loads on demand,
// keeping the initial bundle small.
const Dashboard = lazy(() => import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const StackMap = lazy(() => import("./pages/StackMap").then((m) => ({ default: m.StackMap })));
const LayerAssessment = lazy(() => import("./pages/LayerAssessment").then((m) => ({ default: m.LayerAssessment })));
const RiskRegister = lazy(() => import("./pages/RiskRegister").then((m) => ({ default: m.RiskRegister })));
const ControlLibrary = lazy(() => import("./pages/ControlLibrary").then((m) => ({ default: m.ControlLibrary })));
const ArchitectureBuilder = lazy(() => import("./pages/ArchitectureBuilder").then((m) => ({ default: m.ArchitectureBuilder })));
const FileGateway = lazy(() => import("./pages/FileGateway").then((m) => ({ default: m.FileGateway })));
const LakeraGuard = lazy(() => import("./pages/LakeraGuard").then((m) => ({ default: m.LakeraGuard })));
const ModelCoverage = lazy(() => import("./pages/ModelCoverage").then((m) => ({ default: m.ModelCoverage })));
const Integrations = lazy(() => import("./pages/Integrations").then((m) => ({ default: m.Integrations })));
const Compliance = lazy(() => import("./pages/Compliance").then((m) => ({ default: m.Compliance })));
const ReportGenerator = lazy(() => import("./pages/ReportGenerator").then((m) => ({ default: m.ReportGenerator })));
const Settings = lazy(() => import("./pages/Settings").then((m) => ({ default: m.Settings })));

function PageFallback() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-gray-500">
      Loading…
    </div>
  );
}

export default function App() {
  const init = useStore((s) => s.init);
  const authReady = useStore((s) => s.authReady);
  const backend = useStore((s) => s.backend);
  const currentUser = useStore((s) => s.currentUser);
  const userLocale = useStore((s) => s.settings.locale);
  const { setLocale } = useI18n();

  // Startup: detect backend, restore session, or fall back to local mode.
  useEffect(() => {
    init();
  }, [init]);

  // Apply the signed-in user's saved language preference.
  useEffect(() => {
    if (userLocale) setLocale(userLocale);
  }, [userLocale, setLocale]);

  if (!authReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-base-bg text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  if (backend === "online" && !currentUser) {
    return (
      <ErrorBoundary>
        <Login />
        <Toaster />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Layout>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stack-map" element={<StackMap />} />
            <Route path="/assessment" element={<LayerAssessment />} />
            <Route path="/risks" element={<RiskRegister />} />
            <Route path="/controls" element={<ControlLibrary />} />
            <Route path="/builder" element={<ArchitectureBuilder />} />
            <Route path="/file-gateway" element={<FileGateway />} />
            <Route path="/lakera" element={<LakeraGuard />} />
            <Route path="/models" element={<ModelCoverage />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/report" element={<ReportGenerator />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Suspense>
        <Toaster />
      </Layout>
    </ErrorBoundary>
  );
}
