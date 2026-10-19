import type { Action, Claim, Discovery, AuditPage } from "../api/contracts";
export const claim: Claim = {
  id: "11111111-1111-4111-8111-111111111111",
  ownerActorId: "claimant-1",
  workflowId: "claims",
  workflowVersion: 1,
  state: "under_review",
  title: "Laptop damage",
  description: "Screen damaged during transport.",
  revision: 2,
  informationRequestCount: 0,
  createdAt: "2026-10-19T10:00:00.000Z",
  updatedAt: "2026-10-19T10:01:00.000Z",
};
export const action: Action = {
  id: "request_information",
  label: "Request information",
  from: "under_review",
  to: "awaiting_information",
  eligible: true,
  reasonCode: null,
  inputFields: [
    {
      name: "message",
      label: "Message",
      required: true,
      minLength: 5,
      maxLength: 2000,
    },
  ],
};
export const discovery: Discovery = {
  claimId: claim.id,
  workflowId: "claims",
  workflowVersion: 1,
  state: claim.state,
  revision: claim.revision,
  informationRequestCount: 0,
  informationRequestLimit: 3,
  transitions: [action],
};
export const audit: AuditPage = {
  claimId: claim.id,
  workflowId: "claims",
  workflowVersion: 1,
  limit: 10,
  offset: 0,
  items: [],
};
