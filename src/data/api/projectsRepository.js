import createOptimisticStore from "./createOptimisticStore";

const PROJECTS_PATH = "/projects";

function overlay(projects, serverProject) {
  return projects.map((project) =>
    project.id === serverProject.id
      ? { ...project, ...serverProject }
      : project,
  );
}

export default function createApiProjectsRepository({ client }) {
  const store = createOptimisticStore({
    initialState: [],
    load: () => client.request("GET", PROJECTS_PATH),
  });

  function findProject(id) {
    return store.getSnapshot().find((project) => project.id === id) ?? null;
  }

  function create(project) {
    return store
      .mutate({
        apply: (projects) => [...projects, project],
        send: () =>
          client.request("POST", PROJECTS_PATH, {
            body: { id: project.id, name: project.name },
          }),
        settle: overlay,
      })
      .then(() => findProject(project.id));
  }

  function update(id, changes) {
    if (!findProject(id)) {
      return Promise.resolve(null);
    }

    const sendsName = Object.hasOwn(changes, "name");

    return store
      .mutate({
        apply: (projects) =>
          projects.map((project) =>
            project.id === id ? { ...project, ...changes, id } : project,
          ),
        send: sendsName
          ? () =>
              client.request("PATCH", `${PROJECTS_PATH}/${id}`, {
                body: { name: changes.name },
              })
          : undefined,
        settle: overlay,
      })
      .then(() => findProject(id));
  }

  function remove(id) {
    if (!findProject(id)) {
      return Promise.resolve();
    }

    return store.mutate({
      apply: (projects) => projects.filter((project) => project.id !== id),
      send: () => client.request("DELETE", `${PROJECTS_PATH}/${id}`),
    });
  }

  return {
    getStatus: store.getStatus,
    getSnapshot: store.getSnapshot,
    subscribe: store.subscribe,
    start: store.start,
    create,
    update,
    remove,
  };
}
