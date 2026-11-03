import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import ProjectTaskCard, { ProjectTaskCardOverlay } from "./ProjectTaskCard";
import {
  BOARD_DONE_LIMIT,
  getTaskColumn,
  groupTasksByColumn,
} from "../../utils/projectHelpers";

const SILENT_ANNOUNCEMENTS = {
  onDragStart: () => undefined,
  onDragOver: () => undefined,
  onDragEnd: () => undefined,
  onDragCancel: () => undefined,
};

const KEYBOARD_CODES = {
  start: ["Space"],
  cancel: ["Escape"],
  end: ["Space", "Enter"],
};

function collisionDetection(args) {
  const pointerCollisions = pointerWithin(args);

  return pointerCollisions.length > 0 ? pointerCollisions : closestCenter(args);
}

function columnKeyboardCoordinates(
  event,
  { context: { droppableRects, droppableContainers, collisionRect } },
) {
  if (!["ArrowLeft", "ArrowRight"].includes(event.code) || !collisionRect) {
    return undefined;
  }

  event.preventDefault();

  const columns = droppableContainers
    .getEnabled()
    .map((container) => ({
      id: container.id,
      rect: droppableRects.get(container.id),
    }))
    .filter((column) => column.rect)
    .sort((a, b) => a.rect.left - b.rect.left);

  const center = collisionRect.left + collisionRect.width / 2;
  const currentIndex = columns.findIndex(
    (column) =>
      center >= column.rect.left &&
      center <= column.rect.left + column.rect.width,
  );
  const step = event.code === "ArrowRight" ? 1 : -1;
  const target = columns[currentIndex + step];

  if (currentIndex === -1 || !target) {
    return undefined;
  }

  return {
    x: target.rect.left + (target.rect.width - collisionRect.width) / 2,
    y: collisionRect.top,
  };
}

function DraggableCard({ task, today, onSelectTask, t }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: task.id,
  });

  return (
    <ProjectTaskCard
      task={task}
      today={today}
      onSelectTask={onSelectTask}
      dragRef={setNodeRef}
      dragAttributes={attributes}
      dragListeners={listeners}
      isDragging={isDragging}
      t={t}
    />
  );
}

function BoardColumn({ columnKey, title, count, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: columnKey });

  return (
    <section
      ref={setNodeRef}
      className="board-column"
      data-column={columnKey}
      data-over={isOver ? "true" : undefined}
      aria-label={title}
    >
      <header className="board-column-header">
        <span className="board-column-dot" aria-hidden="true" />
        <h3>{title}</h3>
        <span className="board-column-count">{count}</span>
      </header>

      <div className="board-column-cards">{children}</div>
    </section>
  );
}

function ProjectBoard({ tasks, today, onSelectTask, onMoveTask, t }) {
  const [showAllDone, setShowAllDone] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      keyboardCodes: KEYBOARD_CODES,
      coordinateGetter: columnKeyboardCoordinates,
    }),
  );

  const columns = groupTasksByColumn(tasks);
  const activeTask = tasks.find((task) => task.id === activeTaskId) ?? null;

  const definitions = [
    { key: "todo", title: t.projectColumnTodo },
    { key: "doing", title: t.projectColumnDoing },
    { key: "done", title: t.projectColumnDone },
  ];

  function handleDragEnd({ active, over }) {
    setActiveTaskId(null);

    if (!over) {
      return;
    }

    const task = tasks.find((item) => item.id === active.id);

    if (!task || getTaskColumn(task) === over.id) {
      return;
    }

    onMoveTask(task.id, over.id);

    if (over.id === "done") {
      setShowAllDone(true);
    }

    const target = definitions.find((definition) => definition.key === over.id);

    setAnnouncement(t.projectTaskMovedAnnouncement(task.title, target.title));
  }

  return (
    <>
      <div className="visually-hidden" role="status">
        {announcement}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        accessibility={{
          announcements: SILENT_ANNOUNCEMENTS,
          screenReaderInstructions: { draggable: t.projectDragInstructions },
        }}
        onDragStart={({ active }) => setActiveTaskId(active.id)}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveTaskId(null)}
      >
        <div className="board" role="group" aria-label={t.projectBoardLabel}>
          {definitions.map(({ key, title }) => {
            const columnTasks = columns[key];
            const isDone = key === "done";
            const hiddenCount =
              isDone && !showAllDone
                ? Math.max(columnTasks.length - BOARD_DONE_LIMIT, 0)
                : 0;
            const visibleTasks =
              hiddenCount > 0
                ? columnTasks.slice(0, BOARD_DONE_LIMIT)
                : columnTasks;

            return (
              <BoardColumn
                key={key}
                columnKey={key}
                title={title}
                count={columnTasks.length}
              >
                {visibleTasks.map((task) => (
                  <DraggableCard
                    key={task.id}
                    task={task}
                    today={today}
                    onSelectTask={onSelectTask}
                    t={t}
                  />
                ))}

                {hiddenCount > 0 && (
                  <button
                    type="button"
                    className="board-more"
                    onClick={() => setShowAllDone(true)}
                  >
                    {t.projectDoneMore(hiddenCount)}
                  </button>
                )}
              </BoardColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <ProjectTaskCardOverlay task={activeTask} today={today} t={t} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}

export default ProjectBoard;
