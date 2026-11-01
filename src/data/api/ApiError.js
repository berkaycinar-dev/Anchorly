export const NETWORK_ERROR = "NETWORK_ERROR";
export const TIMEOUT = "TIMEOUT";
export const INVALID_RESPONSE = "INVALID_RESPONSE";
export const UNKNOWN_ERROR = "UNKNOWN_ERROR";

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
