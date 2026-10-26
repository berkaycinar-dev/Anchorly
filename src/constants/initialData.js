import { addDaysToDateString } from "../utils/dateHelpers";

export const REPEAT_HORIZON_DAYS = 120;

export function createInitialTasks(today) {
  const tomorrow = addDaysToDateString(today, 1);

  return [
    {
      id: "4cbd7450-6231-43eb-96a2-3be6d2b1d532",
      title: "Finish React Project",
      category: "Work",
      date: today,
      completed: false,
      projectId: null,
      description: "",
      steps: [],
      completedAt: null,
      order: 0,
      repeat: "none",
      repeatGroupId: null,
      attachments: [],
    },
    {
      id: "7847517c-0da1-474d-8f46-fb2f9fc009fc",
      title: "Buy groceries",
      category: "Personal",
      date: today,
      completed: false,
      projectId: null,
      description: "",
      steps: [],
      completedAt: null,
      order: 1,
      repeat: "none",
      repeatGroupId: null,
      attachments: [],
    },
    {
      id: "cf94cf95-c8f9-47e4-92fb-f82c30bf7e56",
      title: "Read 30 pages of a book",
      category: "Self Development",
      date: today,
      completed: false,
      projectId: null,
      description: "",
      steps: [],
      completedAt: null,
      order: 2,
      repeat: "none",
      repeatGroupId: null,
      attachments: [],
    },
    {
      id: "3e89aeee-8bb5-4bc2-baee-ee41f44c23d9",
      title: "Go to the gym",
      category: "Health",
      date: today,
      completed: true,
      projectId: null,
      description: "",
      steps: [],
      completedAt: today,
      order: 3,
      repeat: "none",
      repeatGroupId: null,
      attachments: [],
    },
    {
      id: "0ddd41bd-4d45-4fa4-8c46-5cf610c1f634",
      title: "Call mom",
      category: "Personal",
      date: tomorrow,
      completed: false,
      projectId: null,
      description: "",
      steps: [],
      completedAt: null,
      order: 4,
      repeat: "none",
      repeatGroupId: null,
      attachments: [],
    },
  ];
}

export const initialRoutines = [
  {
    id: "88444dfd-8be1-4578-956f-037a0b71e8b7",
    title: "water",
  },
  {
    id: "7ac7256e-fcd5-48f3-afe4-4d0e821f16be",
    title: "Read",
  },
  {
    id: "594903e0-17f9-4999-b28a-2812da40123f",
    title: "Exercise",
  },
];

export const initialProjects = [
  {
    id: "678e4529-fa35-432c-8baa-6a1298ba43f1",
    name: "ToDoApp",
  },
  {
    id: "f9eeef00-3cc4-4b6f-9f33-29dc56ba3508",
    name: "Portfolio",
  },
];
