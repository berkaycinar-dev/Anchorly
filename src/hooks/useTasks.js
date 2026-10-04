import { useEffect } from "react";
import useLocalStorageState from "./useLocalStorageState";
import { initialTasks } from "../constants/initialData";
import { generateRepeatOccurrences } from "../utils/taskHelpers";

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
    normalizeStoredTasks,
  );

  useEffect(() => {
    const latestByGroup = {};

    tasks.forEach((task) => {
      if (task.repeat !== "none" && task.repeatGroupId && task.date) {
        const current = latestByGroup[task.repeatGroupId];

        if (!current || task.date > current.date) {
          latestByGroup[task.repeatGroupId] = task;
        }
      }
    });

    let allNewOccurrences = [];

    Object.values(latestByGroup).forEach((latestTask) => {
      const occurrences = generateRepeatOccurrences(latestTask, [
        ...tasks,
        ...allNewOccurrences,
      ]);

      allNewOccurrences = [...allNewOccurrences, ...occurrences];
    });

    if (allNewOccurrences.length > 0) {
      setTasks((currentTasks) => [...currentTasks, ...allNewOccurrences]);
    }
  }, []);

  function updateTask(taskId, updater) {
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? updater(task) : task)),
    );
  }

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

  function toggleTask(id) {
    updateTask(id, (task) => {
      const isNowCompleted = !task.completed;

      return {
        ...task,
        completed: isNowCompleted,
        completedAt: isNowCompleted ? task.date || today : null,
      };
    });
  }

  function deleteTask(id) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id));
  }

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
      );

      return [...updatedTasks, ...newOccurrences];
    });
  }

  function reorderTasks(draggedId, targetId) {
    if (draggedId === String(targetId)) {
      return;
    }

    const activeTasksSorted = tasks
      .filter((task) => !task.completed)
      .sort((a, b) => a.order - b.order);

    const draggedIndex = activeTasksSorted.findIndex(
      (task) => String(task.id) === draggedId,
    );
    const targetIndex = activeTasksSorted.findIndex(
      (task) => task.id === targetId,
    );

    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    const reordered = [...activeTasksSorted];
    const [draggedTask] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedTask);

    const orderMap = {};
    reordered.forEach((task, index) => {
      orderMap[task.id] = index;
    });

    setTasks(
      tasks.map((task) =>
        orderMap[task.id] !== undefined
          ? { ...task, order: orderMap[task.id] }
          : task,
      ),
    );
  }

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