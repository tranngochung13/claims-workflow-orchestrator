import { useState } from "react";
import type { FormEvent } from "react";
import { api } from "../api/client";
import type { DemoActorId } from "../api/contracts";
import { ErrorNotice } from "./Common";
export function CreateClaim({
  actor,
  onCreated,
  onBack,
  onLock,
}: {
  actor: DemoActorId;
  onCreated: (id: string) => void;
  onBack: () => void;
  onLock: (value: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error>();
  const [validation, setValidation] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (
      !title.trim() ||
      !description.trim() ||
      title.length > 120 ||
      description.length > 2000
    ) {
      setValidation(
        "Enter a title (1–120 characters) and description (1–2000 characters).",
      );
      return;
    }
    setBusy(true);
    onLock(true);
    setError(undefined);
    setValidation("");
    try {
      const claim = await api.create(actor, {
        title: title.trim(),
        description: description.trim(),
      });
      onCreated(claim.id);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure
          : new Error("Unable to create claim."),
      );
    } finally {
      setBusy(false);
      onLock(false);
    }
  }
  return (
    <>
      <button className="back-link" disabled={busy} onClick={onBack}>
        ← All claims
      </button>
      <div className="page-heading">
        <div>
          <span className="eyebrow">START A WORKFLOW</span>
          <h1>New claim</h1>
          <p>Your claim starts in the configured initial state.</p>
        </div>
      </div>
      <form
        className="panel form-panel"
        onSubmit={submit}
        noValidate
        aria-label="Create claim"
      >
        <ErrorNotice error={error} />
        {error && (
          <p className="footnote">
            Creation has no idempotency receipt. Check the claims list before
            submitting again if the outcome is uncertain.
          </p>
        )}
        {validation && (
          <p role="alert" className="field-error">
            {validation}
          </p>
        )}
        <label htmlFor="claim-title">
          Title <span>Required</span>
        </label>
        <input
          id="claim-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={busy}
          maxLength={120}
          required
          placeholder="A short description of the claim"
        />
        <label htmlFor="claim-description">
          Description <span>Required</span>
        </label>
        <textarea
          id="claim-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          disabled={busy}
          maxLength={2000}
          required
          rows={6}
          placeholder="Tell the reviewer what happened."
        />
        <div className="form-footer">
          <span>Owner: {actor}</span>
          <button className="button" disabled={busy}>
            {busy ? "Creating…" : "Create claim"}
          </button>
        </div>
      </form>
    </>
  );
}
