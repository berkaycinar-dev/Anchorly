import { useEffect } from "react";

// Keeps <meta name="theme-color"> in step with the chosen theme. In the
// installed app the browser paints the title bar (or, with Window Controls
// Overlay, the area behind the minimise/maximise/close buttons) in this
// colour, so it has to match the page instead of the default light theme.
export default function useThemeColor(theme) {
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    // The theme class sits on the app's root element, not on <html>.
    const themed = document.querySelector(
      `.app.theme-${theme}, .auth-shell.theme-${theme}`,
    );

    if (!meta || !themed) {
      return;
    }

    const color = getComputedStyle(themed)
      .getPropertyValue("--color-bg-page")
      .trim();

    if (color) {
      meta.setAttribute("content", color);
    }
  }, [theme]);
}
