import type {
  AuditPage,
  Claim,
  DemoActorId,
  Discovery,
  Page,
  TransitionCommand,
  TransitionResult,
} from "./contracts";
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly uncertain: boolean;
  constructor(code: string, message: string, status = 0, uncertain = false) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.uncertain = uncertain;
  }
}
async function request<T>(
  actor: DemoActorId,
  path: string,
  body?: object,
  signal?: AbortSignal,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        ...(import.meta.env.DEV ? { "X-Demo-Actor-Id": actor } : {}),
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(15000)])
        : AbortSignal.timeout(15000),
    });
  } catch {
    throw new ApiError(
      "NETWORK_ERROR",
      "Could not reach the API. Check the connection and development proxy.",
      0,
      true,
    );
  }
  let value: unknown;
  try {
    value = await response.json();
  } catch {
    throw new ApiError(
      "INVALID_RESPONSE",
      "The API returned an unreadable response.",
      response.status,
      response.ok || response.status >= 500,
    );
  }
  if (!response.ok) {
    let code = "API_ERROR";
    let message = "The request could not be completed.";
    if (
      value &&
      typeof value === "object" &&
      "error" in value &&
      value.error &&
      typeof value.error === "object"
    ) {
      if ("code" in value.error && typeof value.error.code === "string")
        code = value.error.code;
      if ("message" in value.error && typeof value.error.message === "string")
        message = value.error.message;
    }
    throw new ApiError(code, message, response.status, response.status >= 500);
  }
  return value as T;
}
export const api = {
  list: (actor: DemoActorId, offset: number, signal?: AbortSignal) =>
    request<Page<Claim>>(
      actor,
      `/claims?limit=10&offset=${offset}`,
      undefined,
      signal,
    ),
  create: (actor: DemoActorId, input: { title: string; description: string }) =>
    request<Claim>(actor, "/claims", input),
  claim: (actor: DemoActorId, id: string, signal?: AbortSignal) =>
    request<Claim>(
      actor,
      `/claims/${encodeURIComponent(id)}`,
      undefined,
      signal,
    ),
  actions: (actor: DemoActorId, id: string, signal?: AbortSignal) =>
    request<Discovery>(
      actor,
      `/claims/${encodeURIComponent(id)}/available-transitions`,
      undefined,
      signal,
    ),
  audit: (
    actor: DemoActorId,
    id: string,
    offset: number,
    signal?: AbortSignal,
  ) =>
    request<AuditPage>(
      actor,
      `/claims/${encodeURIComponent(id)}/audit?limit=10&offset=${offset}`,
      undefined,
      signal,
    ),
  transition: (actor: DemoActorId, id: string, command: TransitionCommand) =>
    request<TransitionResult>(
      actor,
      `/claims/${encodeURIComponent(id)}/transitions`,
      command,
    ),
};
