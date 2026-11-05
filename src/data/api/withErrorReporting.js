const READ_ONLY_MEMBERS = new Set([
  "getStatus",
  "getSnapshot",
  "subscribe",
  "start",
  "refresh",
]);

export default function withErrorReporting(repository, onError) {
  return Object.fromEntries(
    Object.entries(repository).map(([name, member]) => {
      if (READ_ONLY_MEMBERS.has(name) || typeof member !== "function") {
        return [name, member];
      }

      return [
        name,
        (...args) => {
          const result = member(...args);

          Promise.resolve(result).catch(onError);

          return result;
        },
      ];
    }),
  );
}
