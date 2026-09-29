export const emailInitials = (email: string): string => {
  const local = email.split("@")[0]?.trim() ?? email.trim();
  const compact = local.replace(/[^a-zA-Z0-9]/g, "");
  const source = compact.length > 0 ? compact : local;
  if (source.length === 0) {
    return "U";
  }
  if (source.length === 1) {
    return source.toUpperCase().repeat(2);
  }
  return source.slice(0, 2).toUpperCase();
};
