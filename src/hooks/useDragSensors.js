import { MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";

// Lists announce moves themselves through their own status region.
export const SILENT_ANNOUNCEMENTS = {
  onDragStart: () => undefined,
  onDragOver: () => undefined,
  onDragEnd: () => undefined,
  onDragCancel: () => undefined,
};

// Mouse drags start after a short move, touch drags after a long press so
// scrolling still works. Extra sensors are appended in order.
export default function useDragSensors(mouseDistance = 8, ...extraSensors) {
  return useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: mouseDistance },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    ...extraSensors,
  );
}
