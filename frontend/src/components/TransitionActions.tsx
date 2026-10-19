import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { api, ApiError } from "../api/client";
import type {
  Action,
  DemoActorId,
  Discovery,
  TransitionCommand,
} from "../api/contracts";
import { ErrorNotice } from "./Common";
const reasons: Record<string, string> = {
  TRANSITION_FORBIDDEN: "Your selected role cannot perform this action.",
  PRECONDITION_FAILED: "Required claim information is missing.",
  CYCLE_LIMIT_REACHED:
    "The lifetime information-request limit has been reached.",
  NOTIFICATION_RECIPIENT_UNAVAILABLE:
    "This legacy claim has no notification recipient.",
};
export function TransitionActions({
  actor,
  discovery,
  refreshing,
  onSuccess,
  onLock,
}: {
  actor: DemoActorId;
  discovery: Discovery;
  refreshing: boolean;
  onSuccess: () => void;
  onLock: (locked: boolean) => void;
}) {
  const [selected, setSelected] = useState<string>();
  const [values, setValues] = useState<Record<string, string>>({});
  const [validation, setValidation] = useState("");
  const [error, setError] = useState<Error>();
  const [pending, setPending] = useState<{
    command: TransitionCommand;
    label: string;
  }>();
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  async function send(attempt: { command: TransitionCommand; label: string }) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    onLock(true);
    setError(undefined);
    try {
      await api.transition(actor, discovery.claimId, attempt.command);
      setPending(undefined);
      setSelected(undefined);
      setValues({});
      onLock(false);
      onSuccess();
    } catch (failure) {
      const problem =
        failure instanceof Error
          ? failure
          : new Error("Unable to execute transition.");
      setError(problem);
      if (!(problem instanceof ApiError) || problem.uncertain) {
        setPending(attempt);
      } else {
        setPending(undefined);
        onLock(false);
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  function submit(event: FormEvent, action: Action) {
    event.preventDefault();
    if (inFlight.current || pending) return;
    const input: Record<string, string> = {};
    for (const field of action.inputFields) {
      const raw = Object.hasOwn(values, field.name) ? values[field.name] : "";
      const text = raw.trim();
      if (
        (field.required && !text) ||
        (raw.length > 0 &&
          (text.length < field.minLength || raw.length > field.maxLength))
      ) {
        setValidation(
          `${field.label}: enter ${Math.max(field.required ? 1 : 0, field.minLength)}–${field.maxLength} characters.`,
        );
        return;
      }
      if (field.required || raw.length) input[field.name] = text;
    }
    setValidation("");
    const attempt = {
      label: action.label,
      command: {
        commandId: crypto.randomUUID(),
        transitionId: action.id,
        expectedRevision: discovery.revision,
        input,
      },
    };
    setPending(attempt);
    void send(attempt);
  }
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">NEXT STEP</span>
          <h2>Workflow actions</h2>
        </div>
        <span className="subtle-badge">Revision {discovery.revision}</span>
      </div>
      <div className="panel-body">
        <p className="muted small-text">
          Availability comes from the pinned workflow. Every submission is
          checked again.
        </p>
        <ErrorNotice error={error} />
        {pending ? (
          <div className="pending-card" role="status">
            <h3>
              {busy
                ? `Submitting ${pending.label}…`
                : "Outcome not yet confirmed"}
            </h3>
            <p>
              {busy
                ? "Please keep this page open."
                : "The server may have committed this command. Retry the exact same request to recover its result."}
            </p>
            <code className="command-id">{pending.command.commandId}</code>
            {!busy && (
              <button className="button" onClick={() => void send(pending)}>
                Retry same command
              </button>
            )}
            <p className="footnote">
              Actor, navigation, and inputs stay locked until this attempt is
              resolved. Reloading discards this in-memory retry context.
            </p>
          </div>
        ) : (
          <div className="action-list">
            {discovery.transitions.map((action) => (
              <div
                className={`action-card ${action.eligible ? "" : "blocked"}`}
                key={action.id}
              >
                <div className="action-heading">
                  <div>
                    <h3>{action.label}</h3>
                    <span className="muted small-text">
                      {action.from.replaceAll("_", " ")} →{" "}
                      {action.to.replaceAll("_", " ")}
                    </span>
                  </div>
                  {action.eligible ? (
                    <button
                      className="button secondary small"
                      disabled={refreshing || busy}
                      onClick={() => {
                        setSelected(action.id);
                        setValues({});
                        setValidation("");
                        setError(undefined);
                      }}
                    >
                      {selected === action.id ? "Selected" : "Choose action"}
                    </button>
                  ) : (
                    <span className="blocked-label">Unavailable</span>
                  )}
                </div>
                {!action.eligible && (
                  <p className="blocked-reason">
                    {reasons[action.reasonCode ?? ""] ??
                      "This action is currently unavailable."}
                  </p>
                )}
                {action.eligible && selected === action.id && (
                  <form
                    aria-label={`${action.label} form`}
                    noValidate
                    onSubmit={(event) => submit(event, action)}
                  >
                    {action.inputFields.map((field) => (
                      <div key={field.name}>
                        <label htmlFor={`input-${action.id}-${field.name}`}>
                          {field.label}{" "}
                          <span>
                            {field.required ? "Required" : "Optional"}
                          </span>
                        </label>
                        <textarea
                          id={`input-${action.id}-${field.name}`}
                          value={
                            Object.hasOwn(values, field.name)
                              ? values[field.name]
                              : ""
                          }
                          onChange={(event) =>
                            setValues((previous) => ({
                              ...previous,
                              [field.name]: event.target.value,
                            }))
                          }
                          maxLength={field.maxLength}
                          required={field.required}
                          rows={3}
                        />
                        <p className="input-hint">
                          {field.minLength}–{field.maxLength} characters
                        </p>
                      </div>
                    ))}
                    {validation && (
                      <p className="field-error" role="alert">
                        {validation}
                      </p>
                    )}
                    <button className="button" disabled={refreshing || busy}>
                      Confirm {action.label.toLowerCase()}
                    </button>
                  </form>
                )}
              </div>
            ))}
            {!discovery.transitions.length && (
              <div className="empty compact">
                <h3>No further actions</h3>
                <p>The current workflow state has no outgoing transitions.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
