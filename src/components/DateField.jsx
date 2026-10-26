import NavIcon from "./NavIcon";
import { parseLocalDate } from "../utils/dateHelpers";

function openNativePicker(event) {
  try {
    event.currentTarget.showPicker?.();
  } catch {
    return;
  }
}

function DateField({ id, value, onChange, label, t, className = "" }) {
  const displayText = value
    ? parseLocalDate(value).toLocaleDateString(t.dateLocale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : t.pickDatePlaceholder;

  return (
    <div className={`date-field ${className}`.trim()}>
      <span
        className={
          value ? "date-field-text" : "date-field-text date-field-placeholder"
        }
        aria-hidden="true"
      >
        {displayText}
      </span>

      <NavIcon name="Calendar" />

      <input
        id={id}
        type="date"
        className="date-field-input"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onClick={openNativePicker}
      />
    </div>
  );
}

export default DateField;
