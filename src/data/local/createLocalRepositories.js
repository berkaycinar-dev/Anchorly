import createLocalProjectsRepository from "./projectsRepository";
import createLocalRoutinesRepository from "./routinesRepository";
import createLocalSettingsRepository from "./settingsRepository";
import createLocalTasksRepository from "./tasksRepository";

export default function createLocalRepositories({ today }) {
  return {
    tasks: createLocalTasksRepository({ today }),
    routines: createLocalRoutinesRepository(),
    projects: createLocalProjectsRepository(),
    settings: createLocalSettingsRepository(),
  };
}