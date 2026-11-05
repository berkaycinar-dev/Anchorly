import createLocalRepositories from "../local/createLocalRepositories";

export default function readLocalData(today) {
  const repositories = createLocalRepositories({ today });
  const { routines, checks } = repositories.routines.getSnapshot();

  return {
    tasks: repositories.tasks.getSnapshot(),
    projects: repositories.projects.getSnapshot(),
    routines,
    checks,
  };
}
