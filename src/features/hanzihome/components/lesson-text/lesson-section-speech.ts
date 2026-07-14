import type { Section } from "@/features/hanzihome/static-json/schemas/hanyuLesson.schema";

export function speechTextForSections(sections: readonly Section[]) {
 return sections
  .filter((section) => section.type === "text")
  .flatMap((section) =>
   section.blocks
    .toSorted((left, right) => left.order - right.order)
    .flatMap((block) => {
     if (block.type === "text_dialogue") {
      const sceneLines = block.scenes
       .toSorted((left, right) => left.order - right.order)
       .flatMap((scene) => scene.lines.toSorted((left, right) => left.order - right.order));
      const lines = sceneLines.length > 0 ? sceneLines : block.lines;
      return lines.toSorted((left, right) => left.order - right.order).map((line) => line.zh);
     }

     const paragraphs = block.paragraphs.toSorted((left, right) => left.order - right.order);
     const lines = block.lines.toSorted((left, right) => left.order - right.order);
     return (paragraphs.length > 0 ? paragraphs : lines).map((item) => item.zh);
    }),
  )
  .filter(Boolean)
  .join("\n");
}
