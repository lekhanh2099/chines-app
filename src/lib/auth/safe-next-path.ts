export function getSafeNextPath(value: string | null | undefined) {
 return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}
