hashCode = string => {
  if (!string.length) return 0;
  let hash = 0;
  for (const chr of string) {
    hash = ((hash << 5) - hash) + chr.charCodeAt(0);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}
