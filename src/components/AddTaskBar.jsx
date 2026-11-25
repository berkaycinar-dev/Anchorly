import { Clock, Calendar, Plus, Repeat, X } from "lucide-react";
import Icon from "./Icon";
import TimeField from "./TimeField";
import { formatShortDate } from "../utils/dateHelpers";

function openNativePicker(event) {
  try {
    event.currentTarget.showPicker?.();
  } catch {
    return;
  }
}

function getRepeatText(repeat, t) {
  if (repeat === "daily") {
    return t.repeatDaily;
  }

  return repeat === "weekly" ? t.repeatWeekly : "";
}

function Tool({ icon, valueText, children }) {
  return (
    <label
      className={
        valueText ? "add-task-tool add-task-tool-active" : "add-task-tool"
      }
    >
      <Icon icon={icon} size="md" />
      {valueText && <span className="add-task-tool-value">{valueText}</span>}
      {children}
    </label>
  );
}

function AddTaskBar({
  title,
  setTitle,
  date,
  setDate,
  time,
  setTime,
  repeat,
  setRepeat,
  onSubmit,
  inputRef,
  label,
  placeholder,
  submitLabel,
  showTools = true,
  autoFocus = false,
  onClose,
  t,
}) {
  function handleKeyDown(event) {
    if (onClose && event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  }

  return (
    <form className="add-task-bar" onSubmit={onSubmit}>
      <button
        type="submit"
        className="add-task-bar-submit"
        aria-label={submitLabel ?? t.addButton}
      >
        <Icon icon={Plus} size="lg" />
      </button>

      <input
        type="text"
        className="add-task-bar-input"
        enterKeyHint="done"
        autoComplete="off"
        autoFocus={autoFocus}
        aria-label={label ?? t.newTaskLabel}
        placeholder={placeholder ?? t.newTaskPlaceholder}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={handleKeyDown}
        ref={inputRef}
      />

      {onClose && (
        <button
          type="button"
          className="add-task-bar-close"
          aria-label={t.closeButton}
          title={t.closeButton}
          onClick={onClose}
        >
          <Icon icon={X} size="md" />
        </button>
      )}

      {showTools && (
        <div className="add-task-tools">
          <Tool
            icon={Calendar}
            valueText={date ? formatShortDate(date, t.dateLocale) : ""}
          >
            <input
              type="date"
              className="add-task-tool-input"
              aria-label={t.dateLabel}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              onClick={openNativePicker}
            />
          </Tool>

          <div className="add-task-tool-wrap">
            <TimeField
              value={time}
              onChange={setTime}
              ariaLabel={t.timeLabel}
              className={
                time ? "add-task-tool add-task-tool-active" : "add-task-tool"
              }
              t={t}
            >
              <Icon icon={Clock} size="md" />
              {time && <span className="add-task-tool-value">{time}</span>}
            </TimeField>
          </div>

          <Tool icon={Repeat} valueText={getRepeatText(repeat, t)}>
            <select
              className="add-task-tool-input"
              aria-label={t.repeatLabel}
              value={repeat}
              onChange={(event) => setRepeat(event.target.value)}
            >
              <option value="none">{t.repeatNone}</option>
              <option value="daily">{t.repeatDaily}</option>
              <option value="weekly">{t.repeatWeekly}</option>
            </select>
          </Tool>
        </div>
      )}
    </form>
  );
}

export default AddTaskBar;
