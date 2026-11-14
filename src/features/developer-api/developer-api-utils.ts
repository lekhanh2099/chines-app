import { publicV1Endpoints, type PublicApiEndpoint, type PublicApiOperation } from "./api-registry";

export const apiFeatures = Array.from(new Set(publicV1Endpoints.map((endpoint) => endpoint.group)));
export const apiMethods = Array.from(
 new Set(publicV1Endpoints.flatMap((endpoint) => endpoint.methods)),
);
export const apiScopes = Array.from(new Set(publicV1Endpoints.map((endpoint) => endpoint.scope)));

export function curlForOperation(endpoint: PublicApiEndpoint, operation: PublicApiOperation) {
 const query = operation.query ? `?${operation.query}` : "";
 const requestBody = operation.requestBody
  ? ` \\
  --header "Content-Type: application/json" \\
  --data '${operation.requestBody}'`
  : "";
 const accept = operation.responseContentType === "audio/mpeg" ? "audio/mpeg" : "application/json";

 return `curl --request ${operation.method} \\
  --url "$HANZIHOME_API_BASE${endpoint.path.replace(/\[[^\]]+\]/g, "REPLACE_ME")}${query}" \\
  --header "Authorization: Bearer $HANZIHOME_INTEGRATION_KEY" \\
  --header "Accept: ${accept}"${requestBody}`;
}

export function methodLabel(operations: PublicApiOperation[]) {
 return operations.map((operation) => operation.method).join(" · ");
}

export function demoOutputForOperation(operation: PublicApiOperation) {
 if (operation.responseBody) return operation.responseBody;

 return `{
  "status": ${operation.responseStatus},
  "contentType": ${JSON.stringify(operation.responseContentType)},
  "body": "[binary stream]"
}`;
}
