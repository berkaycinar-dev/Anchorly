export default function ThemeSwatches({
  label,
  themes,
  names,
  value,
  onChange,
}) {
  return (
    <div role="group" aria-label={label} className="settings-swatches">
      {themes.map((theme) => (
        <button
          key={theme}
          type="button"
          className="swatch-button"
          aria-pressed={value === theme}
          aria-label={names[theme]}
          title={names[theme]}
          onClick={() => onChange(theme)}
        >
          <span className="swatch-ring">
            <span className={`swatch-dot theme-${theme}`} />
          </span>
        </button>
      ))}
    </div>
  );
}
