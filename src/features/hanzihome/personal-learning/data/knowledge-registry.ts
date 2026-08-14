import { knowledgeNodeSchema, type KnowledgeNode, type KnowledgeNodeId } from "../domain/personal-learning.schemas";
import { aspectNode } from "./knowledge-nodes-aspect";
import { baBeiNode } from "./knowledge-nodes-ba-bei";
import { conditionalsNode } from "./knowledge-nodes-conditionals";
import { deDiDeNode } from "./knowledge-nodes-de-di-de";
import { existentialNode } from "./knowledge-nodes-existential";
import { resultPotentialNode } from "./knowledge-nodes-result-potential";

const registrySchema = knowledgeNodeSchema.array().length(6);

export const personalLearningKnowledgeNodes = registrySchema.parse([
 deDiDeNode,
 resultPotentialNode,
 aspectNode,
 baBeiNode,
 existentialNode,
 conditionalsNode,
]);

export function getKnowledgeNode(nodeId: KnowledgeNodeId): KnowledgeNode {
 const node = personalLearningKnowledgeNodes.find((entry) => entry.id === nodeId);
 if (node === undefined) throw new Error(`Knowledge node not found: ${nodeId}`);
 return node;
}
