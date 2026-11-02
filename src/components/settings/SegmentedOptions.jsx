export default function SegmentedOptions({ label, options, value, onChange }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="segmented settings-segmented"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          style={
            option.fontFamily ? { fontFamily: option.fontFamily } : undefined
          }
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
