import { useCallback } from "react";
import useLocalStorageState from "./useLocalStorageState";
import { initialTasks } from "../constants/initialData";
import {
  addFutureOccurrences,
  generateRepeatOccurrences,
} from "../utils/taskHelpers";

function normalizeStoredTasks(storedTasks) {
  return storedTasks.map((task, index) => ({
    description: "",
    steps: [],
    completedAt: null,
    order: index,
    repeat: "none",
    repeatGroupId: null,
    attachments: [],
    ...task,
  }));
}

export default function useTasks(today) {
  const [tasks, setTasks] = useLocalStorageState(
    "tasks",
    initialTasks,
    (storedTasks) =>
      addFutureOccurrences(normalizeStoredTasks(storedTasks), today),
  );

  const updateTask = useCallback(
    (taskId, updater) => {
      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === taskId ? updater(task) : task)),
      );
    },
    [setTasks],
  );

  function addTask(taskData) {
    const newTask = {
      id: crypto.randomUUID(),
      category: "Work",
      date: "",
      completed: false,
      projectId: null,
      description: "",
      steps: [],
      completedAt: null,
      order: Date.now(),
      repeat: "none",
      repeatGroupId: null,
      attachments: [],
      ...taskData,
    };

    setTasks((currentTasks) => [newTask, ...currentTasks]);
  }

  const toggleTask = useCallback(
    (id) => {
      updateTask(id, (task) => {
        const isNowCompleted = !task.completed;

        return {
          ...task,
          completed: isNowCompleted,
          completedAt: isNowCompleted ? task.date || today : null,
        };
      });
    },
    [updateTask, today],
  );

  const deleteTask = useCallback(
    (id) => {
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id));
    },
    [setTasks],
  );

  function updateTaskTitle(taskId, newTitle) {
    updateTask(taskId, (task) => ({ ...task, title: newTitle }));
  }

  function updateTaskDescription(taskId, newDescription) {
    updateTask(taskId, (task) => ({ ...task, description: newDescription }));
  }

  function updateTaskDate(taskId, newDate) {
    updateTask(taskId, (task) => {
      if (newDate === "") {
        return { ...task, date: "", repeat: "none", repeatGroupId: null };
      }

      return { ...task, date: newDate };
    });
  }

  function addTaskStep(taskId, stepText) {
    if (stepText.trim() === "") {
      return;
    }

    const newStep = { id: crypto.randomUUID(), text: stepText, done: false };

    updateTask(taskId, (task) => ({
      ...task,
      steps: [...task.steps, newStep],
    }));
  }

  function toggleTaskStep(taskId, stepId) {
    updateTask(taskId, (task) => ({
      ...task,
      steps: task.steps.map((step) =>
        step.id === stepId ? { ...step, done: !step.done } : step,
      ),
    }));
  }

  function deleteTaskStep(taskId, stepId) {
    updateTask(taskId, (task) => ({
      ...task,
      steps: task.steps.filter((step) => step.id !== stepId),
    }));
  }

  function addTaskAttachment(taskId, attachment) {
    updateTask(taskId, (task) => ({
      ...task,
      attachments: [...task.attachments, attachment],
    }));
  }

  function deleteTaskAttachment(taskId, attachmentId) {
    updateTask(taskId, (task) => ({
      ...task,
      attachments: task.attachments.filter(
        (attachment) => attachment.id !== attachmentId,
      ),
    }));
  }

  function updateTaskRepeat(taskId, newRepeat) {
    setTasks((currentTasks) => {
      const targetTask = currentTasks.find((task) => task.id === taskId);

      if (!targetTask) {
        return currentTasks;
      }

      const oldGroupId = targetTask.repeatGroupId;
      const targetDate = targetTask.date;

      const tasksWithoutStaleFuture = currentTasks.filter((task) => {
        const isStaleFutureSibling =
          oldGroupId &&
          task.repeatGroupId === oldGroupId &&
          task.id !== taskId &&
          task.date > targetDate;

        return !isStaleFutureSibling;
      });

      const updatedTasks = tasksWithoutStaleFuture.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        if (newRepeat === "none") {
          return { ...task, repeat: "none", repeatGroupId: null };
        }

        return {
          ...task,
          repeat: newRepeat,
          repeatGroupId: oldGroupId || crypto.randomUUID(),
        };
      });

      const updatedTask = updatedTasks.find((task) => task.id === taskId);

      if (!updatedTask || updatedTask.repeat === "none") {
        return updatedTasks;
      }

      const newOccurrences = generateRepeatOccurrences(
        updatedTask,
        updatedTasks,
        today,
      );

      return [...updatedTasks, ...newOccurrences];
    });
  }

  const reorderTasks = useCallback(
    (draggedId, targetId) => {
      if (draggedId === String(targetId)) {
        return;
      }

      setTasks((currentTasks) => {
        const activeTasksSorted = currentTasks
          .filter((task) => !task.completed)
          .sort((a, b) => a.order - b.order);

        const draggedIndex = activeTasksSorted.findIndex(
          (task) => String(task.id) === draggedId,
        );
        const targetIndex = activeTasksSorted.findIndex(
          (task) => task.id === targetId,
        );

        if (draggedIndex === -1 || targetIndex === -1) {
          return currentTasks;
        }

        const reordered = [...activeTasksSorted];
        const [draggedTask] = reordered.splice(draggedIndex, 1);
        reordered.splice(targetIndex, 0, draggedTask);

        const orderMap = {};
        reordered.forEach((task, index) => {
          orderMap[task.id] = index;
        });

        return currentTasks.map((task) =>
          orderMap[task.id] !== undefined
            ? { ...task, order: orderMap[task.id] }
            : task,
        );
      });
    },
    [setTasks],
  );

  function assignTaskToProject(taskId, projectId) {
    updateTask(taskId, (task) => ({ ...task, projectId }));
  }

  function clearProjectFromTasks(projectId) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.projectId === projectId ? { ...task, projectId: null } : task,
      ),
    );
  }

  return {
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    updateTaskTitle,
    updateTaskDescription,
    updateTaskDate,
    updateTaskRepeat,
    addTaskStep,
    toggleTaskStep,
    deleteTaskStep,
    addTaskAttachment,
    deleteTaskAttachment,
    reorderTasks,
    assignTaskToProject,
    clearProjectFromTasks,
  };
}