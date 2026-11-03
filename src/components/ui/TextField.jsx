import { useId, useState } from "react";
import { Check, CircleAlert, Eye, EyeOff } from "lucide-react";
import Icon from "../Icon";

function TextField({
  label,
  optionalLabel,
  labelAction,
  error,
  hint,
  hintDone = false,
  type = "text",
  showPasswordLabel,
  hidePasswordLabel,
  id,
  className = "",
  ref,
  ...inputProps
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === "password";
  const message = error ? "error" : hint ? "hint" : null;
  const describedBy =
    message === "error" ? errorId : message === "hint" ? hintId : undefined;
  const inputClasses = [
    "text-field-input",
    isPassword ? "text-field-input-with-toggle" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className ? `text-field ${className}` : "text-field"}>
      <div className="text-field-label-row">
        <label htmlFor={inputId} className="text-field-label">
          {label}
          {optionalLabel ? (
            <span className="text-field-optional"> {optionalLabel}</span>
          ) : null}
        </label>
        {labelAction ?? null}
      </div>
      <div className="text-field-control">
        <input
          {...inputProps}
          ref={ref}
          id={inputId}
          type={isPassword && passwordVisible ? "text" : type}
          className={inputClasses}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        {isPassword ? (
          <button
            type="button"
            className="text-field-toggle"
            aria-label={passwordVisible ? hidePasswordLabel : showPasswordLabel}
            onClick={() => setPasswordVisible((visible) => !visible)}
          >
            <Icon icon={passwordVisible ? EyeOff : Eye} size="lg" />
          </button>
        ) : null}
      </div>
      {message === "error" ? (
        <p id={errorId} className="text-field-message text-field-error">
          <Icon icon={CircleAlert} size="sm" />
          {error}
        </p>
      ) : null}
      {message === "hint" ? (
        <p
          id={hintId}
          className="text-field-message text-field-hint"
          data-done={hintDone || undefined}
        >
          {hintDone ? <Icon icon={Check} size="sm" /> : null}
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export default TextField;
