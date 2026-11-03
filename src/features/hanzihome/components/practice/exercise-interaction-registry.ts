import type { ComponentType } from "react";
import type { InteractionComponentProps, UniversalInteraction } from "./universal-exercise.types";
import { ClozeInteractionView } from "./interactions/ClozeInteractionView";
import { ChoiceInteractionView } from "./interactions/ChoiceInteractionView";
import { ReorderInteractionView } from "./interactions/ReorderInteractionView";
import { OpenInteractionView } from "./interactions/OpenInteractionView";

export const INTERACTION_REGISTRY: {
 readonly [K in UniversalInteraction["type"]]: ComponentType<InteractionComponentProps>;
} = {
 cloze: ClozeInteractionView,
 choice: ChoiceInteractionView,
 reorder: ReorderInteractionView,
 open: OpenInteractionView,
};
