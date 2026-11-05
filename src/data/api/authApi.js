export const EXPORT_TIMEOUT_MS = 60000;

export default function createAuthApi(client) {
  function startSession(session) {
    client.setAccessToken(session.accessToken);
    return session;
  }

  function clearSession() {
    client.setAccessToken(null);
  }

  return {
    client,
    clearSession,

    async register(input) {
      return startSession(
        await client.request("POST", "/auth/register", {
          auth: false,
          body: input,
        }),
      );
    },

    async login(input) {
      return startSession(
        await client.request("POST", "/auth/login", {
          auth: false,
          body: input,
        }),
      );
    },

    refreshSession() {
      return client.refreshSession();
    },

    async logout() {
      try {
        await client.request("POST", "/auth/logout");
      } finally {
        clearSession();
      }
    },

    async verifyEmail(token) {
      const { user } = await client.request("POST", "/auth/verify-email", {
        auth: false,
        body: { token },
      });
      return user;
    },

    async resendVerification() {
      await client.request("POST", "/auth/resend-verification");
    },

    async forgotPassword(email) {
      await client.request("POST", "/auth/forgot-password", {
        auth: false,
        body: { email },
      });
    },

    async resetPassword({ token, password }) {
      await client.request("POST", "/auth/reset-password", {
        auth: false,
        body: { token, password },
      });
    },

    async getMe() {
      const { user } = await client.request("GET", "/me");
      return user;
    },

    async updateMe(patch) {
      const { user } = await client.request("PATCH", "/me", { body: patch });
      return user;
    },

    async changePassword({ currentPassword, newPassword }) {
      await client.request("POST", "/me/password", {
        body: { currentPassword, newPassword },
      });
    },

    async deleteAccount(password) {
      await client.request("DELETE", "/me", { body: { password } });
      clearSession();
    },

    listSessions() {
      return client.request("GET", "/me/sessions");
    },

    async revokeSession(sessionId) {
      await client.request(
        "DELETE",
        `/me/sessions/${encodeURIComponent(sessionId)}`,
      );
    },

    async revokeOtherSessions() {
      await client.request("DELETE", "/me/sessions");
    },

    exportData() {
      return client.request("GET", "/me/export", {
        timeoutMs: EXPORT_TIMEOUT_MS,
      });
    },
  };
}
