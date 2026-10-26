import { initialProjects } from "../../constants/initialData";
import createLocalStore from "./createLocalStore";

export default function createLocalProjectsRepository() {
  const store = createLocalStore("projects", initialProjects);

  function start() {
    store.persistInitialState();
    return Promise.resolve();
  }

  function create(project) {
    store.set((currentProjects) => [...currentProjects, project]);
    return Promise.resolve(project);
  }

  function remove(id) {
    store.set((currentProjects) =>
      currentProjects.filter((project) => project.id !== id),
    );
    return Promise.resolve();
  }

  return {
    getStatus: () => "ready",
    getSnapshot: store.getSnapshot,
    subscribe: store.subscribe,
    start,
    create,
    remove,
  };
}
