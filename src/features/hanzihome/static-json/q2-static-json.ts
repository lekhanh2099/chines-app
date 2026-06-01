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

function loadJsonDirectory(
 context: WebpackRequireContext,
 shouldInclude: (key: string) => boolean = () => true,
): unknown[] {
 return context
  .keys()
  .filter(shouldInclude)
  .sort((a, b) => a.localeCompare(b))
  .map((key) => unwrapJsonModule(context(key)));
}

const webpackRequire = require as WebpackRequire;

export const q2VocabJson = loadJsonDirectory(
 webpackRequire.context(
  "../../../../data/hanzihome/q2/vocab",
  false,
  /\.json$/,
 ),
 (key) => /^\.\/hanyu_2_/.test(key),
);

export const q2LessonJson = loadJsonDirectory(
 webpackRequire.context(
  "../../../../data/hanzihome/q2/lessons",
  false,
  /\.json$/,
 ),
 (key) => /^\.\/hanyu_2_/.test(key),
);

export const q3VocabJson = loadJsonDirectory(
 webpackRequire.context(
  "../../../../data/hanzihome/q3/vocab",
  false,
  /\.json$/,
 ),
 (key) => /^\.\/hanyu_3_/.test(key),
);

export const q3LessonJson = loadJsonDirectory(
 webpackRequire.context(
  "../../../../data/hanzihome/q3/lessons",
  false,
  /\.json$/,
 ),
 (key) => /^\.\/hanyu_3_/.test(key),
);
