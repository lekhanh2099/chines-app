export type ExampleItem = {
 zh: string;
 pinyin: string;
 vi: string;
 note?: string;
};

export type MeaningItem = {
 meaning: string;
 pos?: string;
 examples: ExampleItem[];
};

export type StructureComponent = {
 part?: string;
 name?: string;
 meaning?: string;
};
