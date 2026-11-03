import useRepositorySnapshot from "../data/useRepositorySnapshot";
import { createId } from "../lib/id";

export default function useProjects() {
  const [projects, repository] = useRepositorySnapshot("projects");

  function addProject(name, dueDate = "") {
    const project = { id: createId(), name };

    if (dueDate) {
      project.dueDate = dueDate;
    }

    repository.create(project);
  }

  function updateProject(id, changes) {
    repository.update(id, changes);
  }

  function deleteProject(id) {
    repository.remove(id);
  }

  return {
    projects,
    addProject,
    updateProject,
    deleteProject,
  };
}
