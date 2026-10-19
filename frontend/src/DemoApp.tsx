import { useState } from "react";
import type { DemoActorId } from "./api/contracts";
import { ClaimList } from "./components/ClaimList";
import { CreateClaim } from "./components/CreateClaim";
import { ClaimDetail } from "./components/ClaimDetail";
const actors: { id: DemoActorId; label: string }[] = [
  { id: "claimant-1", label: "Claimant 01 · claimant-1" },
  { id: "claimant-2", label: "Claimant 02 · claimant-2" },
  { id: "adjuster-1", label: "Adjuster · adjuster-1" },
];
type View =
  | { type: "list" }
  | { type: "create" }
  | { type: "detail"; id: string; created: boolean };
export default function DemoApp() {
  const [actor, setActor] = useState<DemoActorId>("claimant-1");
  const [view, setView] = useState<View>({ type: "list" });
  const [locked, setLocked] = useState(false);
  function home() {
    if (!locked) setView({ type: "list" });
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#workspace">
        Skip to workspace
      </a>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            C
          </span>
          <div>
            Claims<span>WORKFLOW ORCHESTRATOR</span>
          </div>
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <button
          className="sidebar-link active"
          onClick={home}
          disabled={locked}
        >
          <span aria-hidden="true">▤</span> Claims{" "}
          <span className="nav-arrow" aria-hidden="true">
            ↗
          </span>
        </button>
        <div className="sidebar-note">
          <span className="dot" /> DEVELOPMENT DEMO
          <p>
            A clear path from claim
            <br />
            to decision.
          </p>
          <small>Local notifications · Recorded decisions</small>
        </div>
      </aside>
      <div className="workspace-shell">
        <header className="topbar">
          <span className="breadcrumb">
            Workspace <span aria-hidden="true">/</span> <strong>Claims</strong>
          </span>
          <div className="actor-switch">
            <span className="avatar" aria-hidden="true">
              {actor === "adjuster-1" ? "AD" : "CL"}
            </span>
            <div>
              <label htmlFor="demo-actor">Demo actor</label>
              <select
                id="demo-actor"
                value={actor}
                disabled={locked}
                onChange={(event) => {
                  const next = actors.find(
                    (item) => item.id === event.target.value,
                  );
                  if (next) {
                    setActor(next.id);
                    setView({ type: "list" });
                  }
                }}
              >
                {actors.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>
        <div className="demo-banner">
          <span className="dot" /> Demo identity is not production
          authentication. Access is enforced by the backend.
        </div>
        <main id="workspace" tabIndex={-1} key={actor}>
          {view.type === "list" && (
            <ClaimList
              actor={actor}
              onCreate={() => setView({ type: "create" })}
              onOpen={(id) => setView({ type: "detail", id, created: false })}
            />
          )}
          {view.type === "create" && (
            <CreateClaim
              actor={actor}
              onBack={home}
              onLock={setLocked}
              onCreated={(id) => setView({ type: "detail", id, created: true })}
            />
          )}
          {view.type === "detail" && (
            <ClaimDetail
              key={view.id}
              actor={actor}
              id={view.id}
              created={view.created}
              locked={locked}
              onBack={home}
              onLock={setLocked}
            />
          )}
        </main>
        <footer className="app-footer">
          <span>Claims Workflow Orchestrator</span>
          <span>Every state. Every step. Accounted for.</span>
        </footer>
      </div>
    </div>
  );
}
