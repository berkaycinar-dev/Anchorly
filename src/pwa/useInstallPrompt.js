import { useSyncExternalStore } from "react";
import { getInstallPromptStore, INSTALL_STATUS } from "./installPrompt";

const noopSubscribe = () => () => {};
const unavailable = () => INSTALL_STATUS.unavailable;
const installUnavailable = async () => "unavailable";

// `store` is injectable for tests; the app uses the one main.jsx started.
export default function useInstallPrompt(store = getInstallPromptStore()) {
  const status = useSyncExternalStore(
    store ? store.subscribe : noopSubscribe,
    store ? store.getStatus : unavailable,
  );

  return { status, install: store ? store.install : installUnavailable };
}
