import { lazy, Suspense } from "react";
const DemoApp = import.meta.env.DEV ? lazy(() => import("./DemoApp")) : null;
export default function App() {
  if (!import.meta.env.DEV || !DemoApp)
    return (
      <main className="production-notice">
        <div className="brand-mark" aria-hidden="true">
          C
        </div>
        <h1>Claims Workflow Orchestrator</h1>
        <p>The development demo is unavailable in this build.</p>
        <p>Production access requires a real authentication adapter.</p>
      </main>
    );
  return (
    <Suspense
      fallback={
        <p className="loading" role="status">
          Opening workspace…
        </p>
      }
    >
      <DemoApp />
    </Suspense>
  );
}
