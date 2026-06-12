export type PassageLine = {
 id: string;
 zh: string;
 pinyin?: string;
 vi?: string;
};

export type ClozeAnswer = {
 key: string;
 label: string;
 answer: string;
 pinyin?: string;
 note?: string;
};
