export interface VerseInfo {
    readonly first: number;
    readonly last: number;
    readonly gaps: ReadonlyArray<number>;
}

export interface ChapterInfo {
    readonly chapter: number;
    readonly verses: VerseInfo;
}

export interface BookInfo {
    readonly division: string;
    readonly name: string;
    readonly chapters: ReadonlyArray<ChapterInfo>;
}

export type BookArray = ReadonlyArray<BookInfo>;

export interface ScriptureBookChapter {
    readonly book: string;
    readonly chapter_start: number;
    readonly verse_start: number;
    readonly chapter_end: number;
    readonly verse_end: number;
}

export const BookRange = (books: BookArray, from_book: string, to_book: string): BookInfo[] => {
    const matches: BookInfo[] = [];
    let in_range = false;
    for (const book of books) {
        if (book.name === from_book) {
            in_range = true;
        }
        if (in_range) {
            matches.push(book);
        }
        if (book.name === to_book) {
            in_range = false;
        }
    }
    return matches;
};

export const FindChapter = (book: BookInfo, chapter: number): ChapterInfo | undefined => {
    return book.chapters.find((c) => c.chapter === chapter);
};

export const FindBook = (books: BookArray, name: string): BookInfo | undefined => {
    return books.find((b) => b.name === name);
};
