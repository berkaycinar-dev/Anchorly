import { useCallback, useEffect, useState } from "react";
import {
  getSidebarCollapsed,
  setSidebarCollapsed,
} from "../data/local/sidebarPreference";

export const TABLET_MEDIA_QUERY =
  "(min-width: 768px) and (max-width: 1023.98px)";

function getTabletQuery() {
  if (typeof window.matchMedia !== "function") {
    return null;
  }

  return window.matchMedia(TABLET_MEDIA_QUERY);
}

function isTypingTarget(target) {
  return (
    target instanceof Element &&
    target.closest("input, textarea, select, [contenteditable='true']") !== null
  );
}

function isToggleShortcut(event) {
  return (
    (event.ctrlKey || event.metaKey) &&
    !event.altKey &&
    !event.shiftKey &&
    typeof event.key === "string" &&
    event.key.toLowerCase() === "b"
  );
}

function useSidebar() {
  const [isTablet, setIsTablet] = useState(
    () => getTabletQuery()?.matches ?? false,
  );
  const [isCollapsed, setIsCollapsed] = useState(getSidebarCollapsed);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  useEffect(() => {
    const query = getTabletQuery();

    if (!query) {
      return;
    }

    function handleChange(event) {
      setIsTablet(event.matches);
      setIsOverlayOpen(false);
    }

    query.addEventListener("change", handleChange);

    return () => query.removeEventListener("change", handleChange);
  }, []);

  const toggle = useCallback(() => {
    if (isTablet) {
      setIsOverlayOpen((open) => !open);
      return;
    }

    const next = !isCollapsed;
    setIsCollapsed(next);
    setSidebarCollapsed(next);
  }, [isTablet, isCollapsed]);

  const closeOverlay = useCallback(() => {
    setIsOverlayOpen(false);
  }, []);

  const showOverlay = isOverlayOpen;

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && showOverlay) {
        setIsOverlayOpen(false);
        return;
      }

      if (
        !isToggleShortcut(event) ||
        isTypingTarget(event.target) ||
        event.target.closest?.("dialog")
      ) {
        return;
      }

      event.preventDefault();
      toggle();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle, showOverlay]);

  return {
    isExpanded: isTablet ? showOverlay : !isCollapsed,
    isOverlayOpen: showOverlay,
    toggle,
    closeOverlay,
  };
}

export default useSidebar;
