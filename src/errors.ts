import { Data } from 'effect';

/**
 * Raised when a required action input is missing or invalid.
 */
export class InputValidationError extends Data.TaggedError('InputValidationError')<{
  readonly message: string;
}> {}

/**
 * Raised when the manifest file cannot be found at the given path.
 */
export class ManifestNotFoundError extends Data.TaggedError(
  'ManifestNotFoundError'
)<{
  readonly path: string;
}> {}

/**
 * Raised when the manifest file contains invalid JSON.
 */
export class ManifestParseError extends Data.TaggedError('ManifestParseError')<{
  readonly path: string;
  readonly cause: unknown;
}> {}

/**
 * Raised when the manifest JSON does not match the expected schema.
 */
export class ManifestSchemaError extends Data.TaggedError('ManifestSchemaError')<{
  readonly issue: string;
}> {}

/**
 * Raised when the HTTP request to the Foundry API fails at the network level.
 */
export class ApiRequestError extends Data.TaggedError('ApiRequestError')<{
  readonly cause: unknown;
}> {}

/**
 * Raised when the Foundry API returns a non-ok HTTP status.
 */
export class ApiResponseError extends Data.TaggedError('ApiResponseError')<{
  readonly status: number;
  readonly body: unknown;
}> {}

/**
 * Raised when the Foundry API response does not match the expected schema.
 */
export class ApiResponseSchemaError extends Data.TaggedError(
  'ApiResponseSchemaError'
)<{
  readonly issue: string;
}> {}

/**
 * Raised when the Foundry API returns a 429 rate limit response.
 */
export class ApiRateLimitError extends Data.TaggedError('ApiRateLimitError')<{
  readonly retryAfter: number;
}> {}

/**
 * Raised when the Foundry API returns a 401 or 403 unauthorized response.
 */
export class ApiUnauthorizedError extends Data.TaggedError('ApiUnauthorizedError')<{
  readonly status: number;
}> {}

/**
 * Raised when the Foundry API returns an application-level error (status: "error").
 */
export class ApiReleaseError extends Data.TaggedError('ApiReleaseError')<{
  readonly errors: Record<string, unknown>;
}> {}
