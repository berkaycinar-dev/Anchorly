import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

const HOURS = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, "0"),
);
const MINUTES = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0"),
);
const POPOVER_WIDTH = 176;
const POPOVER_HEIGHT = 276;
const ITEM_HEIGHT = 40;
const SETTLE_DELAY = 90;
const DEFAULT_HOUR = "09";
const DEFAULT_MINUTE = "00";
const EDGE_GAP = 8;

function splitTime(value) {
  const [hour = "", minute = ""] = (value || "").split(":");

  return { hour, minute };
}

function getPopoverPosition(trigger) {
  const rect = trigger.getBoundingClientRect();
  const maxLeft = window.innerWidth - POPOVER_WIDTH - EDGE_GAP;
  const left = Math.max(EDGE_GAP, Math.min(rect.left, maxLeft));
  const fitsBelow = rect.bottom + 4 + POPOVER_HEIGHT <= window.innerHeight;
  const top = fitsBelow
    ? rect.bottom + 4
    : Math.max(EDGE_GAP, rect.top - POPOVER_HEIGHT - 4);

  return { left, top };
}

function wrap(index, size) {
  return ((index % size) + size) % size;
}

function TimeColumn({ label, options, selected, onPick }) {
  const listRef = useRef(null);
  const timerRef = useRef(null);
  const size = options.length;
  const selectedIndex = Math.max(0, options.indexOf(selected));

  // The list is rendered three times so the wheel loops: after 23 comes 00
  // again. The person always rests in the middle copy.
  useLayoutEffect(() => {
    listRef.current.scrollTop = (size + selectedIndex) * ITEM_HEIGHT;
    // Only the first position is set instantly; later moves are animated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const list = listRef.current;
    const current = Math.round(list.scrollTop / ITEM_HEIGHT);

    if (wrap(current, size) === selectedIndex) {
      return;
    }

    let delta = wrap(selectedIndex - current, size);

    if (delta > size / 2) {
      delta -= size;
    }

    const top = (current + delta) * ITEM_HEIGHT;

    if (list.scrollTo) {
      list.scrollTo({ top, behavior: "smooth" });
    } else {
      list.scrollTop = top;
    }
  }, [selectedIndex, size]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  function handleScroll() {
    clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const list = listRef.current;

      if (!list) {
        return;
      }

      const raw = Math.round(list.scrollTop / ITEM_HEIGHT);
      const index = wrap(raw, size);

      if (raw < size || raw >= size * 2) {
        list.scrollTop = (size + index) * ITEM_HEIGHT;
      }

      if (index !== selectedIndex) {
        onPick(options[index]);
      }
    }, SETTLE_DELAY);
  }

  function handleKeyDown(event) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
      return;
    }

    event.preventDefault();

    const buttons = [
      ...listRef.current.querySelectorAll("button:not([aria-hidden])"),
    ];
    const next =
      buttons[wrap(selectedIndex + (event.key === "ArrowDown" ? 1 : -1), size)];

    next?.focus();
    next?.click();
  }

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label={label}
      className="time-field-column"
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
    >
      {[0, 1, 2].flatMap((copy) =>
        options.map((option) => {
          const isMain = copy === 1;

          return (
            <button
              key={`${copy}-${option}`}
              type="button"
              role={isMain ? "option" : undefined}
              aria-hidden={isMain ? undefined : true}
              aria-selected={isMain ? option === selected : undefined}
              className="time-field-option"
              data-selected={option === selected ? "true" : undefined}
              tabIndex={isMain && option === selected ? 0 : -1}
              onClick={() => onPick(option)}
            >
              {option}
            </button>
          );
        }),
      )}
    </div>
  );
}

function TimeField({
  id,
  value,
  onChange,
  t,
  className = "",
  ariaLabel,
  children,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const popoverId = useId();
  const stored = splitTime(value);
  const hour = stored.hour || DEFAULT_HOUR;
  const minute = stored.minute || DEFAULT_MINUTE;
  const draftRef = useRef({ hour, minute });

  // Keeps both columns consistent when they settle in the same moment.
  useLayoutEffect(() => {
    draftRef.current = { hour, minute };
  }, [hour, minute]);

  useLayoutEffect(() => {
    if (isOpen) {
      setPosition(getPopoverPosition(triggerRef.current));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (
        !popoverRef.current?.contains(event.target) &&
        !triggerRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleViewportChange(event) {
      if (!popoverRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isOpen]);

  function close() {
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function done() {
    if (!value) {
      onChange(`${hour}:${minute}`);
    }

    close();
  }

  function handlePopoverKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  }

  function pickHour(nextHour) {
    draftRef.current = { ...draftRef.current, hour: nextHour };
    onChange(`${nextHour}:${draftRef.current.minute}`);
  }

  function pickMinute(nextMinute) {
    draftRef.current = { ...draftRef.current, minute: nextMinute };
    onChange(`${draftRef.current.hour}:${nextMinute}`);
  }

  return (
    <>
      <button
        id={id}
        ref={triggerRef}
        type="button"
        className={className}
        aria-label={ariaLabel}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={isOpen ? popoverId : undefined}
        onClick={() => setIsOpen((open) => !open)}
      >
        {children ?? (value || "--:--")}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          id={popoverId}
          role="group"
          aria-label={t.timePickerLabel}
          className="time-field-popover"
          style={{ left: position.left, top: position.top }}
          onKeyDown={handlePopoverKeyDown}
        >
          <div className="time-field-columns">
            <TimeColumn
              label={t.timeHoursLabel}
              options={HOURS}
              selected={hour}
              onPick={pickHour}
            />
            <TimeColumn
              label={t.timeMinutesLabel}
              options={MINUTES}
              selected={minute}
              onPick={pickMinute}
            />
          </div>

          <button type="button" className="time-field-done" onClick={done}>
            {t.timeDoneLabel}
          </button>
        </div>
      )}
    </>
  );
}

export default TimeField;
