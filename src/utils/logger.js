const formatMeta = (meta) => {
  if (!meta) return "";
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return " [meta_unserializable]";
  }
};

const log = (level, message, meta) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${level}] ${message}${formatMeta(meta)}`);
};

export const logger = {
  info: (message, meta) => log("INFO", message, meta),
  warn: (message, meta) => log("WARN", message, meta),
  error: (message, meta) => log("ERROR", message, meta)
};

