import planImportRequests from "./planImportRequests";

const IMPORT_PATH = "/import";
const IMPORT_TIMEOUT_MS = 120000;
const COUNT_NAMES = ["projects", "routines", "routineChecks", "tasks"];

function createEmptyResult() {
  return Object.fromEntries(
    COUNT_NAMES.map((name) => [name, { imported: 0, skipped: 0 }]),
  );
}

function addResults(total, next) {
  return Object.fromEntries(
    COUNT_NAMES.map((name) => [
      name,
      {
        imported: total[name].imported + next[name].imported,
        skipped: total[name].skipped + next[name].skipped,
      },
    ]),
  );
}

export default async function runLocalImport({ client, payload }) {
  let total = createEmptyResult();

  for (const body of planImportRequests(payload)) {
    const result = await client.request("POST", IMPORT_PATH, {
      body,
      timeoutMs: IMPORT_TIMEOUT_MS,
    });

    total = addResults(total, result);
  }

  return total;
}
