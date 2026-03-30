import { Context, Duration, Effect, Layer, Schema, Schedule } from 'effect';

import {
  ApiRateLimitError,
  ApiReleaseError,
  ApiRequestError,
  ApiResponseError,
  ApiResponseSchemaError,
  ApiUnauthorizedError,
} from '@/errors.ts';
import type { ReleasePayload } from '@/schemas/api.ts';
import { ReleaseResponse, type ReleaseSuccessResponse } from '@/schemas/api.ts';

type ApiError =
  | ApiRequestError
  | ApiResponseError
  | ApiResponseSchemaError
  | ApiRateLimitError
  | ApiUnauthorizedError
  | ApiReleaseError;

const BASE_URL = 'https://foundryvtt.com/_api';
const RELEASE_ENDPOINT = '/packages/release_version/';
const MAX_RETRIES = 3;

/**
 * Service for interacting with the Foundry VTT Package Release API.
 */
export class FoundryApi extends Context.Tag('FoundryApi')<
  FoundryApi,
  {
    /** Publishes a release version to the Foundry API. */
    readonly releaseVersion: (
      payload: ReleasePayload,
      isDryRun: boolean
    ) => Effect.Effect<
      ReleaseSuccessResponse,
      | ApiRequestError
      | ApiResponseError
      | ApiResponseSchemaError
      | ApiRateLimitError
      | ApiUnauthorizedError
      | ApiReleaseError
    >;
  }
>() {}

/**
 * Sends a POST request to the Foundry API.
 */
const post = (token: string, body: unknown) =>
  Effect.tryPromise({
    try: () =>
      fetch(`${BASE_URL}${RELEASE_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify(body),
      }),
    catch: (cause) => new ApiRequestError({ cause }),
  });

/**
 * Extracts the Retry-After header value in seconds.
 */
const getRetryAfter = (response: Response): number => {
  const header = response.headers.get('Retry-After');
  return header ? Number.parseInt(header, 10) || 60 : 60;
};

/**
 * Checks for unauthorized responses (401/403).
 */
const checkUnauthorized = (response: Response) =>
  response.status === 401 || response.status === 403
    ? Effect.fail(new ApiUnauthorizedError({ status: response.status }))
    : Effect.succeed(response);

/**
 * Checks for rate-limited responses (429).
 */
const checkRateLimit = (response: Response) =>
  response.status === 429
    ? Effect.fail(new ApiRateLimitError({ retryAfter: getRetryAfter(response) }))
    : Effect.succeed(response);

/**
 * Checks for non-ok HTTP responses.
 */
const checkResponseStatus = (response: Response) =>
  response.ok
    ? Effect.succeed(response)
    : Effect.tryPromise({
        try: () => response.json(),
        catch: () => undefined,
      }).pipe(
        Effect.flatMap((body) =>
          Effect.fail(new ApiResponseError({ status: response.status, body }))
        )
      );

/**
 * Parses the response body as JSON and decodes it against the schema.
 */
const decodeResponse = (response: Response) =>
  Effect.tryPromise({
    try: () => response.json() as Promise<unknown>,
    catch: (cause) => new ApiResponseSchemaError({ issue: String(cause) }),
  }).pipe(
    Effect.flatMap((data) =>
      Schema.decodeUnknown(ReleaseResponse)(data).pipe(
        Effect.mapError((e) => new ApiResponseSchemaError({ issue: String(e) }))
      )
    )
  );

/**
 * Checks for application-level errors in the decoded response.
 */
const checkReleaseError = (response: ReleaseResponse) =>
  response.status === 'error'
    ? Effect.fail(
        new ApiReleaseError({
          errors: (response.errors ?? {}) as Record<string, unknown>,
        })
      )
    : Effect.succeed(response);

/**
 * Retry schedule for rate-limited requests using exponential backoff.
 */
const rateLimitRetrySchedule = Schedule.intersect(
  Schedule.exponential(Duration.seconds(10)),
  Schedule.recurs(MAX_RETRIES)
);

/**
 * Builds the request body from a payload and dry-run flag.
 */
const makeRequestBody = (payload: ReleasePayload, isDryRun: boolean): unknown =>
  isDryRun ? { ...payload, 'dry-run': true } : payload;

/**
 * Sends and validates a single release request.
 */
const sendRequest = (token: string, payload: ReleasePayload, isDryRun: boolean) =>
  post(token, makeRequestBody(payload, isDryRun)).pipe(
    Effect.flatMap(checkUnauthorized),
    Effect.flatMap(checkRateLimit),
    Effect.flatMap(checkResponseStatus),
    Effect.flatMap(decodeResponse),
    Effect.flatMap(checkReleaseError)
  );

/**
 * Wraps a request with rate-limit retry logic.
 */
const releaseVersionWithRetry = (
  token: string,
  payload: ReleasePayload,
  isDryRun: boolean
): Effect.Effect<ReleaseSuccessResponse, ApiError> =>
  sendRequest(token, payload, isDryRun).pipe(
    Effect.catchTag('ApiRateLimitError', (e: ApiRateLimitError) =>
      sendRequest(token, payload, isDryRun).pipe(
        Effect.delay(Duration.seconds(e.retryAfter)),
        Effect.retry(rateLimitRetrySchedule)
      )
    )
  ) as Effect.Effect<ReleaseSuccessResponse, ApiError>;

/**
 * Creates a live FoundryApi layer with the given release token.
 */
export const makeFoundryApiLive = (token: string) =>
  Layer.succeed(FoundryApi, {
    releaseVersion: (payload, isDryRun) =>
      releaseVersionWithRetry(token, payload, isDryRun),
  });
