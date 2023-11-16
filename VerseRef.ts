import { BookArray, ScriptureBookChapter } from "./Types.ts";
import {
    ScriptureToken,
    makeLanguage,
    ScriptureRef,
    AbsoluteScriptureRef,
    ContextualScriptureRef,
} from "./VerseRefParser.ts";
import Parsimmon from "./Parsimmon.ts";
import { BookInfo, BookRange, FindBook, FindChapter } from "./Types.ts";

enum ParserLevel {
    BOOK,
    CHAPTER,
    VERSE,
}

export type ScriptureBookChapters = ScriptureBookChapter[];
export type ParseResultSuccess = {
    success: true;
    sbcs: ScriptureBookChapters;
};
export type ParseResultFailure = { success: false; error: string };
export type ParseResult = ParseResultSuccess | ParseResultFailure;

type ExpandResult =
    | { success: true; sbc: ScriptureBookChapter; level: ParserLevel }
    | { success: false; error: string };

const book2sbc = (book: BookInfo): ScriptureBookChapter => {
    const c_s = book.chapters[0];
    const c_e = book.chapters[book.chapters.length - 1];
    return {
        book: book.name,
        chapter_start: c_s.chapter,
        verse_start: c_s.verses.first,
        chapter_end: c_e.chapter,
        verse_end: c_e.verses.last,
    };
};

const expand_absolute_ref = (books: BookArray, ref: AbsoluteScriptureRef): ExpandResult => {
    const book = FindBook(books, ref.book);
    if (!book) {
        return { success: false, error: `Book ${ref.book} not found.` };
    }
    const sbc = book2sbc(book);
    switch (ref.to) {
        case "book": {
            return { success: true, sbc: sbc, level: ParserLevel.BOOK };
        }
        case "book_chapter": {
            if (ref.chapter.opts === "ff") {
                const c1 = FindChapter(book, ref.chapter.n);
                if (!c1) {
                    return {
                        success: false,
                        error: `Chapter ${ref.chapter.n} not found.`,
                    };
                }
                const c2 = book.chapters[book.chapters.length - 1];
                return {
                    success: true,
                    level: ParserLevel.CHAPTER,
                    sbc: {
                        ...sbc,
                        chapter_start: c1.chapter,
                        verse_start: c1.verses.first,
                        chapter_end: c2.chapter,
                        verse_end: c2.verses.last,
                    },
                };
            } else if (ref.chapter.opts === "f") {
                const c1 = FindChapter(book, ref.chapter.n);
                const c2 = FindChapter(book, ref.chapter.n + 1);
                if (!c1) {
                    return {
                        success: false,
                        error: `Chapter ${ref.chapter.n} not found.`,
                    };
                }
                if (!c2) {
                    return {
                        success: false,
                        error: `Chapter ${ref.chapter.n + 1} not found.`,
                    };
                }
                return {
                    success: true,
                    level: ParserLevel.CHAPTER,
                    sbc: {
                        ...sbc,
                        chapter_start: c1.chapter,
                        verse_start: c1.verses.first,
                        chapter_end: c2.chapter,
                        verse_end: c2.verses.last,
                    },
                };
            } else {
                const c = FindChapter(book, ref.chapter.n);
                if (!c) {
                    return {
                        success: false,
                        error: `Chapter ${ref.chapter.n} not found.`,
                    };
                }
                return {
                    success: true,
                    level: ParserLevel.CHAPTER,
                    sbc: {
                        ...sbc,
                        chapter_start: c.chapter,
                        verse_start: c.verses.first,
                        chapter_end: c.chapter,
                        verse_end: c.verses.last,
                    },
                };
            }
        }
        case "book_chapter_verse": {
            const c = FindChapter(book, ref.chapter.n);
            if (!c) {
                return { success: false, error: `Chapter ${ref.chapter.n} not found.` };
            }
            if (ref.verse.opts === "ff") {
                return {
                    success: true,
                    level: ParserLevel.VERSE,
                    sbc: {
                        ...sbc,
                        chapter_start: c.chapter,
                        chapter_end: c.chapter,
                        verse_start: ref.verse.n,
                        verse_end: c.verses.last,
                    },
                };
            } else if (ref.verse.opts === "f") {
                return {
                    success: true,
                    level: ParserLevel.VERSE,
                    sbc: {
                        ...sbc,
                        chapter_start: c.chapter,
                        chapter_end: c.chapter,
                        verse_start: ref.verse.n,
                        verse_end: ref.verse.n + 1,
                    },
                };
            } else {
                return {
                    success: true,
                    level: ParserLevel.VERSE,
                    sbc: {
                        ...sbc,
                        chapter_start: c.chapter,
                        chapter_end: c.chapter,
                        verse_start: ref.verse.n,
                        verse_end: ref.verse.n,
                    },
                };
            }
        }
    }
};

const expand_contextual_ref = (
    books: BookArray,
    from_sbc: ScriptureBookChapter,
    at_level: ParserLevel,
    ref: ContextualScriptureRef
): ExpandResult => {
    const merge_level = (ex: ExpandResult, level: ParserLevel): ExpandResult => {
        if (!ex.success) {
            return ex;
        }
        return {
            ...ex,
            level: level,
        };
    };

    switch (ref.to) {
        case "chapter_or_verse": {
            if (at_level === ParserLevel.BOOK) {
                return {
                    success: false,
                    error: "Relative verse/chapter number invalid at book level.",
                };
            } else if (at_level === ParserLevel.CHAPTER) {
                // it's a chapter
                const synthetic: AbsoluteScriptureRef = {
                    type: "ref",
                    abs: true,
                    to: "book_chapter",
                    book: from_sbc.book,
                    chapter: ref.value,
                };
                return merge_level(expand_absolute_ref(books, synthetic), at_level);
            } else {
                // it's a verse
                const synthetic: AbsoluteScriptureRef = {
                    type: "ref",
                    abs: true,
                    to: "book_chapter_verse",
                    book: from_sbc.book,
                    chapter: { n: from_sbc.chapter_end, opts: "" },
                    verse: ref.value,
                };
                return merge_level(expand_absolute_ref(books, synthetic), at_level);
            }
        }
        case "chapter_verse": {
            const synthetic: AbsoluteScriptureRef = {
                type: "ref",
                abs: true,
                to: "book_chapter_verse",
                book: from_sbc.book,
                chapter: ref.chapter,
                verse: ref.verse,
            };
            return expand_absolute_ref(books, synthetic);
        }
    }
};

const expand_ref = (
    books: BookArray,
    from_sbc: ScriptureBookChapter | undefined,
    at_level: ParserLevel,
    ref: ScriptureRef
): ExpandResult => {
    if (ref.abs) {
        return expand_absolute_ref(books, ref);
    }
    if (!from_sbc) {
        return {
            success: false,
            error: "Cannot expand relative reference without a context.",
        };
    }
    return expand_contextual_ref(books, from_sbc, at_level, ref);
};

const applyGrammar = (books: BookArray, params: ScriptureToken[]): ParseResult => {
    if (params.length === 0) {
        return { success: false, error: "No scripture referenced." };
    }

    // by definition, the first reference will be an AbsoluteScriptureRef
    const param = params[0] as AbsoluteScriptureRef;
    const first: ExpandResult = expand_absolute_ref(books, param);
    if (!first.success) {
        return { success: false, error: first.error };
    }

    // our grammar's state
    const sbcs: ScriptureBookChapters = [];
    let level = first.level;
    let pending_sbc: ScriptureBookChapter | undefined = first.sbc;
    let context_sbc: ScriptureBookChapter | undefined = pending_sbc;
    let pending_operator: string | undefined = undefined;

    for (const ref of params.slice(1)) {
        switch (ref.type) {
            case "op": {
                if (pending_operator) {
                    return { success: false, error: "Multiple operators in a row." };
                }
                pending_operator = ref.value;
                continue;
            }
            case "ref": {
                if (pending_operator === ",") {
                    // we don't need to do anything for this one
                    pending_operator = undefined;
                } else if (pending_operator === ";") {
                    // if we are at the verse level, go to the chapter level,
                    // otherwise do nothing
                    if (level === ParserLevel.VERSE) {
                        level = ParserLevel.CHAPTER;
                    }
                    pending_operator = undefined;
                }
                const expanded = expand_ref(books, context_sbc, level, ref);
                if (!expanded.success) {
                    return expanded;
                }
                level = expanded.level;
                if (pending_operator === "-") {
                    if (!pending_sbc) {
                        return {
                            success: false,
                            error: "Cannot use - operator without a context.",
                        };
                    }
                    if (pending_sbc.book === expanded.sbc.book) {
                        // we need to validate the range for in-book ranges
                        if (expanded.sbc.chapter_start < pending_sbc.chapter_start) {
                            return {
                                success: false,
                                error: "Cannot use - operator with a chapter range that starts before the context.",
                            };
                        }
                        if (
                            expanded.sbc.chapter_end === pending_sbc.chapter_end &&
                            expanded.sbc.verse_start < pending_sbc.verse_start
                        ) {
                            return {
                                success: false,
                                error: "Cannot use - operator with a chapter range that ends after the context.",
                            };
                        }
                        const merged: ScriptureBookChapter = {
                            ...pending_sbc,
                            chapter_end: expanded.sbc.chapter_end,
                            verse_end: expanded.sbc.verse_end,
                        };
                        sbcs.push(merged);
                        context_sbc = merged;
                    } else {
                        const bookRange = BookRange(books, pending_sbc.book, expanded.sbc.book);
                        if (bookRange.length < 2) {
                            return { success: false, error: "Book range out of sequence." };
                        }
                        const first = bookRange[0];
                        sbcs.push({
                            ...pending_sbc,
                            chapter_end: first.chapters[first.chapters.length - 1].chapter,
                            verse_end: first.chapters[first.chapters.length - 1].verses.last,
                        });
                        const middle = bookRange.slice(1, -1);
                        for (const b of middle) {
                            const synthetic: AbsoluteScriptureRef = {
                                abs: true,
                                type: "ref",
                                to: "book",
                                book: b.name,
                            };
                            const be = expand_absolute_ref(books, synthetic);
                            if (!be.success) {
                                return be;
                            }
                            sbcs.push(be.sbc);
                        }
                        const last = bookRange[bookRange.length - 1];
                        context_sbc = {
                            ...expanded.sbc,
                            chapter_start: last.chapters[0].chapter,
                            verse_start: last.chapters[0].verses.first,
                        };
                        sbcs.push(context_sbc);
                    }
                    pending_sbc = undefined;
                    pending_operator = undefined;
                } else {
                    if (pending_sbc) {
                        sbcs.push(pending_sbc);
                    }
                    pending_sbc = context_sbc = expanded.sbc;
                }
                continue;
            }
        }
    }
    if (pending_sbc) {
        sbcs.push(pending_sbc);
    }
    return { success: true, sbcs: sbcs };
};

export interface ModuleParser {
    readonly lang: Parsimmon.Language;
}

export const makeParser = (books: BookArray): ModuleParser => {
    return {
        lang: makeLanguage(books),
    } as const;
};

export const parseReference = (books: BookArray, parser: ModuleParser, defn: string): ParseResult => {
    // surrounding whitespace is insignificant, strip it
    defn = defn.trim();
    const result = parser.lang.value.parse(defn);
    if (!result.status) {
        return {
            success: false,
            error: `Expected ${result.expected} at ${result.index.line}, ${result.index.column}`,
        };
    }
    const ex = applyGrammar(books, result.value);
    return ex;
};

export default parseReference;
