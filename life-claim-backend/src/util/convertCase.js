function camelToSnakeCase(obj) {
  const newObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).toUpperCase();
      newObj[snakeKey] = obj[key];
    }
  }
  return newObj;
}

function snakeToCamelCase(obj){
  const newObj = {}
  for(const key in obj){
    const camelKey = key.toLowerCase().replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    newObj[camelKey] = obj[key];
  }
  return newObj;
}

/** MySQL DATE/DATEONLY — null out NA, blank, and unparseable values. */
function sanitizeDbDate(value) {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s || s === "NA" || s === "N/A" || s.toLowerCase() === "invalid date") return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function sanitizeDateFields(obj, keys) {
  if (!obj || typeof obj !== "object") return obj;
  const out = { ...obj };
  for (const key of keys) {
    if (key in out) out[key] = sanitizeDbDate(out[key]);
  }
  return out;
}

module.exports = { camelToSnakeCase, snakeToCamelCase, sanitizeDbDate, sanitizeDateFields };
