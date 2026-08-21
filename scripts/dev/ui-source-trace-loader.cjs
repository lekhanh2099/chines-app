const path = require("node:path");
const ts = require("typescript");

const TRACE_ATTRIBUTE = "data-ui-source";
const REACT_INFRASTRUCTURE_TAGS = new Set([
 "Fragment",
 "React.Fragment",
 "StrictMode",
 "React.StrictMode",
 "Suspense",
 "React.Suspense",
 "Profiler",
 "React.Profiler",
]);

function normalizeProjectPath(resourcePath, rootContext) {
 const root = rootContext || process.cwd();
 return path.relative(root, resourcePath).split(path.sep).join("/");
}

function jsxTagNameText(tagName) {
 if (ts.isIdentifier(tagName)) return tagName.text;
 if (ts.isPropertyAccessExpression(tagName)) {
  const owner = jsxTagNameText(tagName.expression);
  return owner ? `${owner}.${tagName.name.text}` : tagName.name.text;
 }
 if (ts.isJsxNamespacedName(tagName)) {
  return `${tagName.namespace.text}:${tagName.name.text}`;
 }
 return "";
}

function hasTraceAttribute(node) {
 return node.attributes.properties.some(
  (attribute) =>
   ts.isJsxAttribute(attribute) &&
   ts.isIdentifier(attribute.name) &&
   attribute.name.text === TRACE_ATTRIBUTE,
 );
}

function shouldTraceTag(tagName) {
 if (!tagName || REACT_INFRASTRUCTURE_TAGS.has(tagName)) return false;
 if (tagName.endsWith(".Provider") || tagName.endsWith(".Consumer")) return false;
 return true;
}

function transformUiSource(source, { resourcePath, rootContext }) {
 const relativePath = normalizeProjectPath(resourcePath, rootContext);
 const extension = path.extname(resourcePath);
 const scriptKind = extension === ".jsx" ? ts.ScriptKind.JSX : ts.ScriptKind.TSX;
 const sourceFile = ts.createSourceFile(
  resourcePath,
  source,
  ts.ScriptTarget.Latest,
  true,
  scriptKind,
 );
 const insertions = [];

 function visit(node) {
  if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
   const tagName = jsxTagNameText(node.tagName);
   if (shouldTraceTag(tagName) && !hasTraceAttribute(node)) {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(
     node.getStart(sourceFile),
    );
    insertions.push({
     position: node.tagName.end,
     text: ` ${TRACE_ATTRIBUTE}=${JSON.stringify(`${relativePath}:${line + 1}:${character + 1}`)}`,
    });
   }
  }
  ts.forEachChild(node, visit);
 }

 visit(sourceFile);

 let output = source;
 for (const insertion of insertions.sort((left, right) => right.position - left.position)) {
  output = `${output.slice(0, insertion.position)}${insertion.text}${output.slice(insertion.position)}`;
 }
 return output;
}

function uiSourceTraceLoader(source) {
 if (typeof this.cacheable === "function") this.cacheable();
 if (typeof this.resourcePath !== "string" || this.resourcePath.length === 0) {
  return source;
 }
 return transformUiSource(String(source), {
  resourcePath: this.resourcePath,
  rootContext: this.rootContext,
 });
}

uiSourceTraceLoader.transformUiSource = transformUiSource;
module.exports = uiSourceTraceLoader;
