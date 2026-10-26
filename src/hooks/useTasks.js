import { useCallback } from "react";
import useRepositorySnapshot from "../data/useRepositorySnapshot";
import { createId } from "../lib/id";
import {
  generateRepeatOccurrences,
  getReorderedActiveTaskIds,
} from "../utils/taskHelpers";

export default function useTasks(today) {
  const [tasks, repository] = useRepositorySnapshot("tasks");

  const updateTask = useCallback(
    (taskId, updater) => {
      const task = repository
        .getSnapshot()
        .find((currentTask) => currentTask.id === taskId);

      if (!task) {
        return;
      }

      repository.update(taskId, updater(task));
    },
    [repository],
  );

  function addTask(taskData) {
    const newTask = {
      id: createId(),
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

    repository.create(newTask);
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
      repository.remove(id);
    },
    [repository],
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

    const newStep = { id: createId(), text: stepText, done: false };

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
    const currentTasks = repository.getSnapshot();
    const targetTask = currentTasks.find((task) => task.id === taskId);

    if (!targetTask) {
      return;
    }

    const oldGroupId = targetTask.repeatGroupId;
    const staleFutureIds = currentTasks
      .filter(
        (task) =>
          oldGroupId &&
          task.repeatGroupId === oldGroupId &&
          task.id !== taskId &&
          task.date > targetTask.date,
      )
      .map((task) => task.id);

    if (staleFutureIds.length > 0) {
      repository.removeMany(staleFutureIds);
    }

    if (newRepeat === "none") {
      repository.update(taskId, { repeat: "none", repeatGroupId: null });
      return;
    }

    repository.update(taskId, {
      repeat: newRepeat,
      repeatGroupId: oldGroupId || createId(),
    });

    const updatedTasks = repository.getSnapshot();
    const updatedTask = updatedTasks.find((task) => task.id === taskId);
    const newOccurrences = generateRepeatOccurrences(
      updatedTask,
      updatedTasks,
      today,
    );

    if (newOccurrences.length > 0) {
      repository.createMany(newOccurrences);
    }
  }

  const reorderTasks = useCallback(
    (draggedId, targetId) => {
      if (draggedId === targetId) {
        return;
      }

      const orderedIds = getReorderedActiveTaskIds(
        repository.getSnapshot(),
        draggedId,
        targetId,
      );

      if (orderedIds) {
        repository.reorder(orderedIds);
      }
    },
    [repository],
  );

  function assignTaskToProject(taskId, projectId) {
    updateTask(taskId, (task) => ({ ...task, projectId }));
  }

  function clearProjectFromTasks(projectId) {
    const updates = repository
      .getSnapshot()
      .filter((task) => task.projectId === projectId)
      .map((task) => ({ id: task.id, patch: { projectId: null } }));

    if (updates.length > 0) {
      repository.updateMany(updates);
    }
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