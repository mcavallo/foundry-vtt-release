/**
 * Masks a token, revealing only the first and last 6 characters.
 */
export const maskToken = (token: string): string =>
  token.length <= 12
    ? '*'.repeat(token.length)
    : `${token.slice(0, 6)}${'*'.repeat(token.length - 12)}${token.slice(-6)}`;

/**
 * Formats Foundry API release errors into a readable string.
 */
export const formatReleaseErrors = (errors: Record<string, unknown>): string =>
  Object.entries(errors)
    .flatMap(([field, messages]) =>
      Array.isArray(messages)
        ? messages.map((m: { message: string }) => `${field}: ${m.message}`)
        : [`${field}: ${String(messages)}`]
    )
    .join('; ');

/**
 * Maps a tagged error to a user-friendly failure message.
 */
export const toUserMessage = (error: { readonly _tag: string }): string => {
  const e = error as Record<string, unknown>;
  switch (error._tag) {
    case 'InputValidationError':
      return `Invalid inputs: ${e.message}`;
    case 'ManifestNotFoundError':
      return `Manifest not found: ${e.path}`;
    case 'ManifestParseError':
      return `Manifest is not valid JSON: ${e.path}`;
    case 'ManifestSchemaError':
      return `Manifest schema invalid: ${e.issue}`;
    case 'ApiRequestError':
      return `API request failed: ${String(e.cause)}`;
    case 'ApiResponseError':
      return `API returned HTTP ${e.status}`;
    case 'ApiResponseSchemaError':
      return `Unexpected API response: ${e.issue}`;
    case 'ApiRateLimitError':
      return `Rate limited. Retry after ${e.retryAfter}s`;
    case 'ApiUnauthorizedError':
      return `Unauthorized (HTTP ${e.status}). Check your release token.`;
    case 'ApiReleaseError':
      return `Release failed: ${formatReleaseErrors(e.errors as Record<string, unknown>)}`;
    default:
      return `Unexpected error: ${JSON.stringify(error)}`;
  }
};
