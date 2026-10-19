import { ApiError } from "../api/client";
import { label } from "../format";
export function StateBadge({ state }: { state: string }) {
  return <span className={`state state-${state}`}>{label(state)}</span>;
}
export function ErrorNotice({ error }: { error?: Error }) {
  if (!error) return null;
  const code = error instanceof ApiError ? error.code : "REQUEST_FAILED";
  const help =
    code === "REVISION_CONFLICT" || code === "STATE_CONFLICT"
      ? "Refresh the claim and review its current actions. Nothing was resubmitted."
      : code === "CLAIM_NOT_FOUND"
        ? "This claim is unavailable to the selected actor."
        : code === "DEMO_IDENTITY_DISABLED"
          ? "Start the backend with NODE_ENV=development and DEMO_IDENTITY_ENABLED=true."
          : "";
  return (
    <div className="notice error" role="alert">
      <strong>{code}</strong>
      <p>{error.message}</p>
      {help && <p>{help}</p>}
    </div>
  );
}
export function Pager({
  offset,
  count,
  disabled,
  onChange,
  name,
}: {
  offset: number;
  count: number;
  disabled: boolean;
  onChange: (offset: number) => void;
  name: string;
}) {
  return (
    <nav className="pager" aria-label={`${name} pagination`}>
      <span>Page {offset / 10 + 1}</span>
      <div>
        <button
          className="button secondary small"
          disabled={disabled || offset === 0}
          onClick={() => onChange(Math.max(0, offset - 10))}
        >
          Previous {name}
        </button>
        <button
          className="button secondary small"
          disabled={disabled || count < 10}
          onClick={() => onChange(offset + 10)}
        >
          Next {name}
        </button>
      </div>
    </nav>
  );
}
