import { useEffect, useState } from "react";

export const WIDE_SCREEN_MEDIA_QUERY = "(min-width: 768px)";

function getMediaQueryList(query) {
  if (typeof window.matchMedia !== "function") {
    return null;
  }

  return window.matchMedia(query);
}

export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => getMediaQueryList(query)?.matches ?? false,
  );

  useEffect(() => {
    const mediaQueryList = getMediaQueryList(query);

    if (!mediaQueryList) {
      return undefined;
    }

    function handleChange(event) {
      setMatches(event.matches);
    }

    mediaQueryList.addEventListener("change", handleChange);

    return () => mediaQueryList.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}
