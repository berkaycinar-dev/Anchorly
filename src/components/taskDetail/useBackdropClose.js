import { useRef } from "react";

export function useBackdropClose(dialogRef) {
  const pressStartedOnBackdrop = useRef(false);

  return {
    onMouseDown(event) {
      pressStartedOnBackdrop.current = event.target === event.currentTarget;
    },
    onClick(event) {
      const shouldClose =
        pressStartedOnBackdrop.current && event.target === event.currentTarget;

      pressStartedOnBackdrop.current = false;

      if (shouldClose) {
        dialogRef.current.close();
      }
    },
  };
}
