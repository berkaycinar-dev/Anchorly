const CATEGORY_STRING_KEYS = {
  Work: "categoryWork",
  Personal: "categoryPersonal",
  "Self Development": "categorySelfDevelopment",
  Other: "categoryOther",
  Health: "categoryHealth",
  Project: "categoryProject",
};

export function getCategoryLabel(category, t) {
  const key = CATEGORY_STRING_KEYS[category];

  return key ? t[key] : category;
}