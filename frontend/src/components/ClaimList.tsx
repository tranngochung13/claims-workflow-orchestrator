import { useCallback, useState } from "react";
import { api } from "../api/client";
import type { DemoActorId } from "../api/contracts";
import { useRemote } from "../useRemote";
import { ErrorNotice, Pager, StateBadge } from "./Common";
export function ClaimList({
  actor,
  onOpen,
  onCreate,
}: {
  actor: DemoActorId;
  onOpen: (id: string) => void;
  onCreate: () => void;
}) {
  const [offset, setOffset] = useState(0);
  const load = useCallback(
    (signal: AbortSignal) => api.list(actor, offset, signal),
    [actor, offset],
  );
  const page = useRemote(load);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR WORKSPACE</span>
          <h1>Claims overview</h1>
          <p>Move each claim forward, with every decision accounted for.</p>
        </div>
        {actor !== "adjuster-1" && (
          <button className="button" onClick={onCreate}>
            <span aria-hidden="true">＋</span> New claim
          </button>
        )}
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Claims</h2>
            <p>
              {actor === "adjuster-1"
                ? "All claims available for review"
                : "Claims owned by your selected demo actor"}
            </p>
          </div>
          <button
            className="button secondary small"
            onClick={page.refresh}
            disabled={page.loading}
          >
            Refresh list
          </button>
        </div>
        <ErrorNotice error={page.error} />
        {page.loading && (
          <p className="loading" role="status">
            Loading claims…
          </p>
        )}
        {page.data && (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Claim</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th>Workflow</th>
                    <th>Revision</th>
                    <th>
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {page.data.items.map((claim) => (
                    <tr key={claim.id}>
                      <td>
                        <button
                          className="claim-link"
                          onClick={() => onOpen(claim.id)}
                        >
                          {claim.title}
                        </button>
                        <span className="table-id">{claim.id}</span>
                      </td>
                      <td>
                        <StateBadge state={claim.state} />
                      </td>
                      <td>{claim.ownerActorId ?? "Unowned legacy claim"}</td>
                      <td>
                        {claim.workflowId}{" "}
                        <span className="muted">v{claim.workflowVersion}</span>
                      </td>
                      <td>
                        <span className="revision">{claim.revision}</span>
                      </td>
                      <td>
                        <button
                          className="open-button"
                          aria-label={`Open ${claim.title}`}
                          onClick={() => onOpen(claim.id)}
                        >
                          ↗
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!page.data.items.length && (
              <div className="empty">
                <span className="empty-icon" aria-hidden="true">
                  ▤
                </span>
                <h3>No claims on this page</h3>
                <p>
                  {offset
                    ? "Return to the previous page."
                    : actor === "adjuster-1"
                      ? "Ask a claimant to create a claim to begin the review."
                      : "Create your first claim to start the workflow."}
                </p>
              </div>
            )}
            <Pager
              offset={offset}
              count={page.data.items.length}
              disabled={page.loading}
              onChange={setOffset}
              name="claims"
            />
          </>
        )}
      </section>
      <p className="footnote">
        Live API data · Access and actions are enforced by the backend.
      </p>
    </>
  );
}
