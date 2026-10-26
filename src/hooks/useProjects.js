import useRepositorySnapshot from "../data/useRepositorySnapshot";
import { createId } from "../lib/id";

export default function useProjects() {
  const [projects, repository] = useRepositorySnapshot("projects");

  function addProject(name) {
    repository.create({ id: createId(), name });
  }

  function deleteProject(id) {
    repository.remove(id);
  }

  return {
    projects,
    addProject,
    deleteProject,
  };
}
