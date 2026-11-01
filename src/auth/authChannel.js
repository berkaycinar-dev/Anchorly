export const AUTH_CHANNEL_NAME = "anchorly-auth";
export const SIGNED_IN_MESSAGE = "signedIn";
export const SIGNED_OUT_MESSAGE = "signedOut";

export function createAuthChannel() {
  if (typeof BroadcastChannel !== "function") {
    return null;
  }

  try {
    return new BroadcastChannel(AUTH_CHANNEL_NAME);
  } catch {
    return null;
  }
}
