export function getDisplayName(user) {
  const name = user.displayName?.trim();

  if (name) {
    return name;
  }

  return user.email.split("@")[0];
}

export function getInitials(name) {
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  const letters =
    parts.length > 1
      ? parts[0][0] + parts[parts.length - 1][0]
      : name.slice(0, 2);

  return letters.toLocaleUpperCase();
}
