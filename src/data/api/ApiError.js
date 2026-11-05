export const NETWORK_ERROR = "NETWORK_ERROR";
export const TIMEOUT = "TIMEOUT";
export const INVALID_RESPONSE = "INVALID_RESPONSE";
export const UNKNOWN_ERROR = "UNKNOWN_ERROR";

export const UNREACHABLE_STATUSES = [502, 503, 504];

export class ApiError extends Error {
  constructor({ status, code, message, details, retryAfterSeconds }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function isUnreachable(error) {
  if (!(error instanceof ApiError)) {
    return false;
  }

  if (error.code === NETWORK_ERROR || error.code === TIMEOUT) {
    return true;
  }

  return (
    UNREACHABLE_STATUSES.includes(error.status) ||
    (error.status >= 500 && error.code === UNKNOWN_ERROR)
  );
}
