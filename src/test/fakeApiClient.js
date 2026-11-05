import { ApiError, UNKNOWN_ERROR } from "../data/api/ApiError";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export default function createFakeApiClient({ settings = {} } = {}) {
  let storedSettings = clone(settings);
  const calls = [];
  const gates = [];
  const failures = [];

  function holdNext() {
    let release;

    gates.push(
      new Promise((resolve) => {
        release = resolve;
      }),
    );

    return release;
  }

  function failNext(
    error = new ApiError({
      status: 500,
      code: UNKNOWN_ERROR,
      message: "The server failed",
    }),
  ) {
    failures.push(error);
  }

  async function request(method, path, options = {}) {
    calls.push({ method, path, body: options.body });

    const gate = gates.shift();

    if (gate) {
      await gate;
    }

    const failure = failures.shift();

    if (failure) {
      throw failure;
    }

    if (path === "/me/settings" && method === "GET") {
      return clone(storedSettings);
    }

    if (path === "/me/settings" && method === "PATCH") {
      storedSettings = { ...storedSettings, ...clone(options.body) };

      return clone(storedSettings);
    }

    throw new ApiError({
      status: 404,
      code: "NOT_FOUND",
      message: `No fake route for ${method} ${path}`,
    });
  }

  return {
    request,
    calls,
    holdNext,
    failNext,
    getStoredSettings: () => clone(storedSettings),
  };
}
