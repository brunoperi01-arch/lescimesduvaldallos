// Opérations de liste IMMUABLES : renvoient un nouveau tableau, sans permuter
// les valeurs entre éléments (chaque objet garde son identité).
export const move = (arr, from, to) => {
  if (to < 0 || to >= arr.length || from < 0 || from >= arr.length) return arr;
  const a = arr.slice();
  const [x] = a.splice(from, 1);
  a.splice(to, 0, x);
  return a;
};
export const removeAt = (arr, i) => arr.filter((_, idx) => idx !== i);
export const duplicateAt = (arr, i) => {
  const a = arr.slice();
  a.splice(i + 1, 0, { ...arr[i] });
  return a;
};
export const updateAt = (arr, i, patch) => arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
