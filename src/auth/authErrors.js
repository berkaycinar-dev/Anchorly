import { ApiError, NETWORK_ERROR, TIMEOUT } from "../data/api/ApiError";

const FIELD_NAMES = ["email", "password", "displayName"];

function getFieldName(path) {
  if (typeof path !== "string") {
    return null;
  }

  const name = path.split(".").pop();
  return FIELD_NAMES.includes(name) ? name : null;
}

function getValidationMessage(field, t) {
  if (field === "email") {
    return t.authEmailInvalid;
  }

  if (field === "password") {
    return t.authPasswordTooShort;
  }

  return t.authGenericError;
}

export default function describeAuthError(error, t) {
  const result = { fields: {}, alert: null, retryAfterSeconds: 0 };

  if (!(error instanceof ApiError)) {
    result.alert = { tone: "danger", message: t.authGenericError };
    return result;
  }

  if (error.code === "INVALID_CREDENTIALS") {
    result.alert = { tone: "danger", message: t.authInvalidCredentials };
  } else if (error.code === "EMAIL_TAKEN") {
    result.alert = {
      tone: "danger",
      message: t.authEmailTaken,
      offerSignIn: true,
    };
  } else if (error.code === "VALIDATION_ERROR") {
    const details = Array.isArray(error.details) ? error.details : [];

    for (const detail of details) {
      const field = getFieldName(detail?.path);

      if (field && field !== "displayName" && !result.fields[field]) {
        result.fields[field] = getValidationMessage(field, t);
      }
    }

    if (Object.keys(result.fields).length === 0) {
      result.alert = { tone: "danger", message: t.authGenericError };
    }
  } else if (error.code === "TOO_MANY_REQUESTS" || error.status === 429) {
    const seconds =
      error.retryAfterSeconds > 0 ? Math.ceil(error.retryAfterSeconds) : 60;

    result.retryAfterSeconds = seconds;
    result.alert = {
      tone: "danger",
      message: t.authTooManyRequests(Math.floor(seconds / 60), seconds % 60),
      rateLimited: true,
    };
  } else if (error.code === NETWORK_ERROR || error.code === TIMEOUT) {
    result.alert = { tone: "danger", message: t.authNetworkError };
  } else {
    result.alert = { tone: "danger", message: t.authGenericError };
  }

  return result;
}
