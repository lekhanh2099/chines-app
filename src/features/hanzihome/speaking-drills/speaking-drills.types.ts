import type {
 SpeakingDrillBook,
 SpeakingDrillLesson,
 SpeakingDrillTopic,
} from "./speaking-drills.schemas";

export type SpeakingDrillsCatalogBook = Pick<
 SpeakingDrillBook,
 "id" | "name" | "title" | "subtitle"
> & {
 lessons: (Pick<SpeakingDrillLesson, "id" | "no" | "title"> & {
  topics: Pick<SpeakingDrillTopic, "id" | "no" | "titleVi">[];
 })[];
};

export type SpeakingDrillSelection = {
 bookId: SpeakingDrillBook["id"];
 generalPrompt: SpeakingDrillBook["generalPrompt"];
 lesson: Omit<SpeakingDrillLesson, "topics">;
 topic: SpeakingDrillTopic;
};
