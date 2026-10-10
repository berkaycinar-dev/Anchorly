const KIND_PRIORITY = ["unavailable", "quota", "read"];

let issues = [];
const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener());
}

export function reportStorageError({ key, kind }) {
  const alreadyReported = issues.some(
    (issue) => issue.key === key && issue.kind === kind,
  );

  if (alreadyReported) {
    return;
  }

  issues = [...issues, { key, kind }];
  notify();
}

export function dismiss() {
  if (issues.length === 0) {
    return;
  }

  issues = [];
  notify();
}

export function subscribe(listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot() {
  return issues;
}

export function getPrimaryIssueKind(currentIssues) {
  return (
    KIND_PRIORITY.find((kind) =>
      currentIssues.some((issue) => issue.kind === kind),
    ) ?? null
  );
}