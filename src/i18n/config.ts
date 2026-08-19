export const appLocales = ["vi", "en", "zh-CN"] satisfies readonly ["vi", "en", "zh-CN"];

export type AppLocale = (typeof appLocales)[number];

export const defaultAppLocale: AppLocale = "vi";

const appLocaleSet = new Set<string>(appLocales);

export function isAppLocale(value: string | null | undefined): value is AppLocale {
 return Boolean(value && appLocaleSet.has(value));
}

function splitPathSuffix(value: string) {
 const hashIndex = value.indexOf("#");
 const beforeHash = hashIndex >= 0 ? value.slice(0, hashIndex) : value;
 const hash = hashIndex >= 0 ? value.slice(hashIndex) : "";
 const queryIndex = beforeHash.indexOf("?");

 return {
  pathname: queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash,
  search: queryIndex >= 0 ? beforeHash.slice(queryIndex) : "",
  hash,
 };
}

export function getLocaleFromPathname(value: string): AppLocale | null {
 const { pathname } = splitPathSuffix(value);
 const segment = pathname.split("/").filter(Boolean)[0];
 return isAppLocale(segment) ? segment : null;
}

export function stripLocaleFromPathname(value: string) {
 const { pathname, search, hash } = splitPathSuffix(value);
 const segments = pathname.split("/").filter(Boolean);
 const rest = isAppLocale(segments[0]) ? segments.slice(1) : segments;
 const logicalPathname = rest.length > 0 ? `/${rest.join("/")}` : "/";

 return `${logicalPathname}${search}${hash}`;
}

export function localizePathname(value: string, locale: AppLocale) {
 const logical = stripLocaleFromPathname(value);
 const { pathname, search, hash } = splitPathSuffix(logical);
 const localizedPathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
 return `${localizedPathname}${search}${hash}`;
}
