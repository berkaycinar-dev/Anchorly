import { useState } from "react";
import useLocalStorageState from "./useLocalStorageState";
import { initialProjects } from "../constants/initialData";

export default function useProjects() {
  const [projects, setProjects] = useLocalStorageState(
    "projects",
    initialProjects,
  );
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) || null;

  function addProject(name) {
    setProjects((currentProjects) => [
      ...currentProjects,
      { id: crypto.randomUUID(), name },
    ]);
  }

  function deleteProject(id) {
    setProjects((currentProjects) =>
      currentProjects.filter((project) => project.id !== id),
    );
  }

  return {
    projects,
    selectedProjectId,
    setSelectedProjectId,
    selectedProject,
    addProject,
    deleteProject,
  };
}
