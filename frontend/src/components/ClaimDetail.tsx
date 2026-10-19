import { useCallback, useState } from "react";
import { api } from "../api/client";
import type { DemoActorId } from "../api/contracts";
import { useRemote } from "../useRemote";
import { label } from "../format";
import { TransitionActions } from "./TransitionActions";
import { ErrorNotice, Pager, StateBadge } from "./Common";
export function ClaimDetail({
  actor,
  id,
  locked,
  onBack,
  onLock,
  created,
}: {
  actor: DemoActorId;
  id: string;
  locked: boolean;
  onBack: () => void;
  onLock: (value: boolean) => void;
  created: boolean;
}) {
  const [auditOffset, setAuditOffset] = useState(0);
  const [success, setSuccess] = useState(
    created ? "Claim created. Your workflow is ready." : "",
  );
  const load = useCallback(
    async (signal: AbortSignal) => {
      const [claim, discovery, audit] = await Promise.all([
        api.claim(actor, id, signal),
        api.actions(actor, id, signal),
        api.audit(actor, id, auditOffset, signal),
      ]);
      return { claim, discovery, audit };
    },
    [actor, id, auditOffset],
  );
  const detail = useRemote(load);
  function transitioned() {
    setSuccess(
      "Transition recorded. Claim, actions, and audit history are refreshing.",
    );
    setAuditOffset(0);
    detail.refresh();
  }
  const data = detail.data;
  const inconsistent = data && data.claim.revision !== data.discovery.revision;
  return (
    <>
      <div className="detail-nav">
        <button className="back-link" disabled={locked} onClick={onBack}>
          ← All claims
        </button>
        <button
          className="button secondary small"
          disabled={detail.loading}
          onClick={detail.refresh}
        >
          Refresh claim
        </button>
      </div>
      {success && (
        <div className="notice success" role="status">
          {success}
        </div>
      )}
      <ErrorNotice error={detail.error} />
      {detail.loading && (
        <p className="loading" role="status">
          Loading claim details…
        </p>
      )}
      {data && (
        <>
          <div className="page-heading">
            <div>
              <span className="eyebrow">CLAIM DETAILS</span>
              <h1>{data.claim.title}</h1>
              <p className="mono claim-id">{data.claim.id}</p>
            </div>
            <StateBadge state={data.claim.state} />
          </div>
          <div className="detail-layout">
            <div className="detail-main">
              <section className="panel">
                <div className="panel-heading">
                  <h2>Claim summary</h2>
                  <span className="subtle-badge">Live record</span>
                </div>
                <div className="panel-body">
                  <p className="description">{data.claim.description}</p>
                  <dl className="metadata">
                    <div>
                      <dt>Owner</dt>
                      <dd>
                        {data.claim.ownerActorId ?? "Unowned legacy claim"}
                      </dd>
                    </div>
                    <div>
                      <dt>Pinned workflow</dt>
                      <dd>
                        {data.claim.workflowId} · v{data.claim.workflowVersion}
                      </dd>
                    </div>
                    <div>
                      <dt>Revision</dt>
                      <dd>{data.claim.revision}</dd>
                    </div>
                    <div>
                      <dt>Created</dt>
                      <dd>{new Date(data.claim.createdAt).toLocaleString()}</dd>
                    </div>
                  </dl>
                  <div className="cycle-box">
                    <div>
                      <strong>Information requests</strong>
                      <span>
                        {data.claim.informationRequestCount} /{" "}
                        {data.discovery.informationRequestLimit} used
                      </span>
                    </div>
                    <progress
                      aria-label="Information-request cycles"
                      max={data.discovery.informationRequestLimit}
                      value={data.claim.informationRequestCount}
                    />
                    <p>A successful request consumes one lifetime cycle.</p>
                  </div>
                </div>
              </section>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">ACCOUNTABILITY</span>
                    <h2>Audit history</h2>
                  </div>
                  <span className="muted small-text">
                    Successful transitions
                  </span>
                </div>
                <ol className="timeline">
                  {data.audit.items.map((event) => (
                    <li key={event.id}>
                      <span className="timeline-dot" aria-hidden="true" />
                      <div>
                        <div className="event-heading">
                          <h3>{label(event.transitionId)}</h3>
                          <span className="subtle-badge">
                            Revision {event.resultingRevision}
                          </span>
                        </div>
                        <p>
                          {label(event.fromState)} → {label(event.toState)}
                        </p>
                        <small>
                          {event.actor.id} · {event.actor.role} ·{" "}
                          <time dateTime={event.createdAt}>
                            {new Date(event.createdAt).toLocaleString()}
                          </time>
                        </small>
                      </div>
                    </li>
                  ))}
                </ol>
                {!data.audit.items.length && (
                  <div className="empty compact">
                    <h3>No transitions on this page</h3>
                    <p>Successful workflow actions will appear here.</p>
                  </div>
                )}
                <Pager
                  name="audit events"
                  offset={auditOffset}
                  count={data.audit.items.length}
                  disabled={detail.loading || locked}
                  onChange={setAuditOffset}
                />
              </section>
            </div>
            <aside className="detail-actions">
              {inconsistent && (
                <p className="notice error" role="alert">
                  The claim changed during refresh. Refresh again before
                  choosing an action.
                </p>
              )}
              <TransitionActions
                actor={actor}
                discovery={data.discovery}
                refreshing={
                  detail.loading ||
                  Boolean(detail.error) ||
                  Boolean(inconsistent)
                }
                onSuccess={transitioned}
                onLock={onLock}
              />
            </aside>
          </div>
        </>
      )}
    </>
  );
}
