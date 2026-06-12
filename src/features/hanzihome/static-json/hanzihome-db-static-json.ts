type WebpackRequireContext = {
 keys(): string[];
 <T = unknown>(id: string): T;
};

type WebpackRequire = NodeRequire & {
 context(
  directory: string,
  useSubdirectories: boolean,
  regExp: RegExp,
 ): WebpackRequireContext;
};

type JsonModule = {
 default?: unknown;
};

function unwrapJsonModule(value: unknown): unknown {
 if (
  value &&
  typeof value === "object" &&
  "default" in value &&
  Object.keys(value).length === 1
 ) {
  return (value as JsonModule).default;
 }

 return value;
}

function normalizeDbPath(path: string) {
 return path.replace(/^\.?\//, "").replace(/\\/g, "/");
}

const webpackRequire = require as WebpackRequire;
const hanzihomeDbContext = webpackRequire.context(
 "../../../../data/hanzihome-db",
 true,
 /\.json$/,
);

const hanzihomeDbJsonByPath = new Map(
 hanzihomeDbContext.keys().map((key) => [
  normalizeDbPath(key),
  unwrapJsonModule(hanzihomeDbContext(key)),
 ]),
);

export function listHanziHomeDbJsonPaths(prefix = ""): string[] {
 const normalizedPrefix = normalizeDbPath(prefix);

 return Array.from(hanzihomeDbJsonByPath.keys())
  .filter((path) => !normalizedPrefix || path.startsWith(normalizedPrefix))
  .sort((a, b) => a.localeCompare(b));
}

export function getHanziHomeDbJson<T = unknown>(path: string): T | null {
 const normalizedPath = normalizeDbPath(path);
 return (hanzihomeDbJsonByPath.get(normalizedPath) as T | undefined) ?? null;
}

export function requireHanziHomeDbJson<T = unknown>(path: string): T {
 const value = getHanziHomeDbJson<T>(path);

 if (value === null) {
  throw new Error(`Missing HanziHome DB JSON module: ${normalizeDbPath(path)}`);
 }

 return value;
}
