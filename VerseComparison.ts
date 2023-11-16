import { ScriptureBookChapter } from "./Types.ts";

export enum CompareResult {
    BEFORE = -1,
    EQUAL = 0,
    AFTER = 1,
}

export interface ChapterVerse {
    chapter: number;
    verse: number;
}

export const chapter_verse_compare = (a: ChapterVerse, b: ChapterVerse): CompareResult => {
    if (a.chapter < b.chapter) {
        return CompareResult.BEFORE;
    } else if (a.chapter > b.chapter) {
        return CompareResult.AFTER;
    } else {
        if (a.verse < b.verse) {
            return CompareResult.BEFORE;
        } else if (a.verse > b.verse) {
            return CompareResult.AFTER;
        }
        return CompareResult.EQUAL;
    }
};
export const chapter_verse_start = (sbc: ScriptureBookChapter) => {
    return { chapter: sbc.chapter_start, verse: sbc.verse_start };
};
export const chapter_verse_end = (sbc: ScriptureBookChapter) => {
    return { chapter: sbc.chapter_end, verse: sbc.verse_end };
};
