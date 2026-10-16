import useLocalStorageState from "./useLocalStorageState";
import { createId } from "../lib/id";
import { initialProjects } from "../constants/initialData";

export default function useProjects() {
  const [projects, setProjects] = useLocalStorageState(
    "projects",
    initialProjects,
  );

  function addProject(name) {
    setProjects((currentProjects) => [
      ...currentProjects,
      { id: createId(), name },
    ]);
  }

  function deleteProject(id) {
    setProjects((currentProjects) =>
      currentProjects.filter((project) => project.id !== id),
    );
  }

  return {
    projects,
    addProject,
    deleteProject,
  };
}