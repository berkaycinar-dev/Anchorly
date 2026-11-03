const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export function validateEmail(value, t) {
  const email = value.trim();

  if (email === "") {
    return t.authEmailRequired;
  }

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return t.authEmailInvalid;
  }

  return "";
}

export function validatePassword(value, t, { checkLength = false } = {}) {
  if (value === "") {
    return t.authPasswordRequired;
  }

  if (checkLength && value.length < PASSWORD_MIN_LENGTH) {
    return t.authPasswordTooShort;
  }

  if (value.length > PASSWORD_MAX_LENGTH) {
    return t.authPasswordTooLong;
  }

  return "";
}
