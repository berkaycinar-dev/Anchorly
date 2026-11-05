import { describe, expect, it, vi } from "vitest";
import { ApiError } from "./ApiError";
import createAuthApi, { EXPORT_TIMEOUT_MS } from "./authApi";

const user = { id: "user-1", email: "dev@anchorly.local" };

function session(accessToken) {
  return {
    user,
    accessToken,
    accessTokenExpiresIn: 900,
    refreshTokenExpiresAt: "2026-12-01T00:00:00.000Z",
  };
}

function createFakeClient(response = null) {
  return {
    request: vi.fn(async () => response),
    refreshSession: vi.fn(async () => session("token-r")),
    setAccessToken: vi.fn(),
  };
}

describe("createAuthApi", () => {
  it("exposes the client it was built on", () => {
    const client = createFakeClient();

    expect(createAuthApi(client).client).toBe(client);
  });

  it("registers without authentication and starts the session", async () => {
    const client = createFakeClient(session("token-1"));
    const api = createAuthApi(client);
    const input = {
      email: "new@anchorly.local",
      password: "password123",
      displayName: "New",
      language: "en",
    };

    await expect(api.register(input)).resolves.toEqual(session("token-1"));
    expect(client.request).toHaveBeenCalledWith("POST", "/auth/register", {
      auth: false,
      body: input,
    });
    expect(client.setAccessToken).toHaveBeenCalledWith("token-1");
  });

  it("logs in without authentication and starts the session", async () => {
    const client = createFakeClient(session("token-2"));
    const api = createAuthApi(client);
    const input = { email: "dev@anchorly.local", password: "devpassword" };

    await expect(api.login(input)).resolves.toEqual(session("token-2"));
    expect(client.request).toHaveBeenCalledWith("POST", "/auth/login", {
      auth: false,
      body: input,
    });
    expect(client.setAccessToken).toHaveBeenCalledWith("token-2");
  });

  it("does not start a session when logging in fails", async () => {
    const client = createFakeClient();
    client.request.mockRejectedValueOnce(
      new ApiError({ status: 401, code: "INVALID_CREDENTIALS", message: "" }),
    );
    const api = createAuthApi(client);

    await expect(
      api.login({ email: "dev@anchorly.local", password: "wrong" }),
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    expect(client.setAccessToken).not.toHaveBeenCalled();
  });

  it("delegates the session refresh to the client", async () => {
    const client = createFakeClient();
    const api = createAuthApi(client);

    await expect(api.refreshSession()).resolves.toEqual(session("token-r"));
    expect(client.refreshSession).toHaveBeenCalledTimes(1);
  });

  it("logs out with authentication and clears the token", async () => {
    const client = createFakeClient();
    const api = createAuthApi(client);

    await api.logout();

    expect(client.request).toHaveBeenCalledWith("POST", "/auth/logout");
    expect(client.setAccessToken).toHaveBeenCalledWith(null);
  });

  it("clears the token even when logging out fails", async () => {
    const client = createFakeClient();
    client.request.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const api = createAuthApi(client);

    await expect(api.logout()).rejects.toThrow("Failed to fetch");
    expect(client.setAccessToken).toHaveBeenCalledWith(null);
  });

  it("clears the token on request", () => {
    const client = createFakeClient();

    createAuthApi(client).clearSession();

    expect(client.setAccessToken).toHaveBeenCalledWith(null);
  });

  it("verifies an email token without authentication and returns the user", async () => {
    const client = createFakeClient({ user });
    const api = createAuthApi(client);

    await expect(api.verifyEmail("email-token")).resolves.toEqual(user);
    expect(client.request).toHaveBeenCalledWith("POST", "/auth/verify-email", {
      auth: false,
      body: { token: "email-token" },
    });
  });

  it("asks for a new verification email with authentication", async () => {
    const client = createFakeClient();

    await createAuthApi(client).resendVerification();

    expect(client.request).toHaveBeenCalledWith(
      "POST",
      "/auth/resend-verification",
    );
  });

  it("requests a password reset without authentication", async () => {
    const client = createFakeClient();

    await createAuthApi(client).forgotPassword("dev@anchorly.local");

    expect(client.request).toHaveBeenCalledWith(
      "POST",
      "/auth/forgot-password",
      { auth: false, body: { email: "dev@anchorly.local" } },
    );
  });

  it("resets the password without authentication", async () => {
    const client = createFakeClient();

    await createAuthApi(client).resetPassword({
      token: "reset-token",
      password: "newpassword",
    });

    expect(client.request).toHaveBeenCalledWith(
      "POST",
      "/auth/reset-password",
      { auth: false, body: { token: "reset-token", password: "newpassword" } },
    );
  });

  it("reads the current user", async () => {
    const client = createFakeClient({ user });

    await expect(createAuthApi(client).getMe()).resolves.toEqual(user);
    expect(client.request).toHaveBeenCalledWith("GET", "/me");
  });

  it("updates the current user", async () => {
    const updated = { ...user, displayName: "Berkay" };
    const client = createFakeClient({ user: updated });

    await expect(
      createAuthApi(client).updateMe({ displayName: "Berkay" }),
    ).resolves.toEqual(updated);
    expect(client.request).toHaveBeenCalledWith("PATCH", "/me", {
      body: { displayName: "Berkay" },
    });
  });

  it("changes the password", async () => {
    const client = createFakeClient();

    await createAuthApi(client).changePassword({
      currentPassword: "devpassword",
      newPassword: "newpassword",
    });

    expect(client.request).toHaveBeenCalledWith("POST", "/me/password", {
      body: { currentPassword: "devpassword", newPassword: "newpassword" },
    });
  });

  it("deletes the account and clears the token", async () => {
    const client = createFakeClient();

    await createAuthApi(client).deleteAccount("devpassword");

    expect(client.request).toHaveBeenCalledWith("DELETE", "/me", {
      body: { password: "devpassword" },
    });
    expect(client.setAccessToken).toHaveBeenCalledWith(null);
  });

  it("keeps the token when deleting the account fails", async () => {
    const client = createFakeClient();
    client.request.mockRejectedValueOnce(
      new ApiError({
        status: 400,
        code: "INVALID_CURRENT_PASSWORD",
        message: "",
      }),
    );

    await expect(
      createAuthApi(client).deleteAccount("wrong"),
    ).rejects.toMatchObject({ code: "INVALID_CURRENT_PASSWORD" });
    expect(client.setAccessToken).not.toHaveBeenCalled();
  });

  it("lists the active sessions", async () => {
    const sessions = [{ id: "session-1", current: true }];
    const client = createFakeClient(sessions);

    await expect(createAuthApi(client).listSessions()).resolves.toEqual(
      sessions,
    );
    expect(client.request).toHaveBeenCalledWith("GET", "/me/sessions");
  });

  it("revokes one session with an encoded id", async () => {
    const client = createFakeClient();

    await createAuthApi(client).revokeSession("a/b");

    expect(client.request).toHaveBeenCalledWith("DELETE", "/me/sessions/a%2Fb");
  });

  it("revokes the other sessions", async () => {
    const client = createFakeClient();

    await createAuthApi(client).revokeOtherSessions();

    expect(client.request).toHaveBeenCalledWith("DELETE", "/me/sessions");
  });

  it("exports the data with a longer timeout", async () => {
    const data = { user, tasks: [] };
    const client = createFakeClient(data);

    await expect(createAuthApi(client).exportData()).resolves.toEqual(data);
    expect(client.request).toHaveBeenCalledWith("GET", "/me/export", {
      timeoutMs: EXPORT_TIMEOUT_MS,
    });
    expect(EXPORT_TIMEOUT_MS).toBeGreaterThan(15000);
  });
});
