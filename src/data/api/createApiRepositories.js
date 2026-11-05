import createApiProjectsRepository from "./projectsRepository";
import createApiRoutinesRepository from "./routinesRepository";
import createApiSettingsRepository from "./settingsRepository";
import createApiTasksRepository from "./tasksRepository";

export default function createApiRepositories({ client, today }) {
  return {
    tasks: createApiTasksRepository({ client, today }),
    routines: createApiRoutinesRepository({ client }),
    projects: createApiProjectsRepository({ client }),
    settings: createApiSettingsRepository({ client }),
  };
}
