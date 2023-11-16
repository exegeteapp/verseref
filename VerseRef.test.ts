import {
    makeParser,
    parseReference,
    ParseResultFailure,
    ParseResultSuccess,
    ScriptureBookChapters,
} from "./VerseRef.ts";
import { assertEquals, assertObjectMatch } from "./testfuncs.ts";
import { NETBibleBooks } from "./catalog/NETBible.ts";

const makeAndParseExpectingSuccess = (s: string): ParseResultSuccess => {
    const parser = makeParser(NETBibleBooks);
    const res = parseReference(NETBibleBooks, parser, s);
    if (!res.success) {
        console.log(res);
    }
    assertEquals(res.success, true);
    return res as ParseResultSuccess;
};

const makeAndParseExpectingFailure = (s: string): ParseResultFailure => {
    const parser = makeParser(NETBibleBooks);
    const res = parseReference(NETBibleBooks, parser, s);
    if (res.success) {
        console.log(res);
    }
    assertEquals(res.success, false);
    return res as ParseResultFailure;
};

Deno.test("empty string fails", () => {
    makeAndParseExpectingFailure("");
});

Deno.test("just whitespace fails", () => {
    makeAndParseExpectingFailure("   ");
});

Deno.test("book", () => {
    const res = makeAndParseExpectingSuccess("Matthew");
    assertEquals(res.sbcs.length, 1);
    assertObjectMatch(res.sbcs[0], {
        book: "Matthew",
        chapter_start: 1,
        verse_start: 1,
        chapter_end: 28,
        verse_end: 20,
    });
});

Deno.test("book range - two books", () => {
    const res = makeAndParseExpectingSuccess("Matthew - Mark");
    const sbcs: ScriptureBookChapters = [
        {
            book: "Matthew",
            chapter_start: 1,
            verse_start: 1,
            chapter_end: 28,
            verse_end: 20,
        },
        {
            book: "Mark",
            chapter_start: 1,
            verse_start: 1,
            chapter_end: 16,
            verse_end: 20,
        },
    ];
    assertEquals(res.sbcs.length, 2);
    assertEquals(res.sbcs, sbcs);
});

Deno.test("book comma operator", () => {
    const res = makeAndParseExpectingSuccess("Matthew,1 Corinthians");
    assertEquals(res.sbcs.length, 2);
    assertEquals(res.sbcs, [
        {
            book: "Matthew",
            chapter_start: 1,
            verse_start: 1,
            chapter_end: 28,
            verse_end: 20,
        },
        {
            book: "1 Corinthians",
            chapter_start: 1,
            verse_start: 1,
            chapter_end: 16,
            verse_end: 24,
        },
    ]);
});

Deno.test("book semicolon operator", () => {
    const res = makeAndParseExpectingSuccess("Matthew;1 Corinthians");
    assertEquals(res.sbcs.length, 2);
    assertEquals(res.sbcs, [
        {
            book: "Matthew",
            chapter_start: 1,
            verse_start: 1,
            chapter_end: 28,
            verse_end: 20,
        },
        {
            book: "1 Corinthians",
            chapter_start: 1,
            verse_start: 1,
            chapter_end: 16,
            verse_end: 24,
        },
    ]);
});

Deno.test("book comma comma", () => {
    makeAndParseExpectingFailure("Matthew,,1 Corinthians");
});

Deno.test("book comma semicolon", () => {
    makeAndParseExpectingFailure("Matthew,;1 Corinthians");
});

Deno.test("book semicolon semicolon", () => {
    makeAndParseExpectingFailure("Matthew;;1 Corinthians");
});

Deno.test("book range - torah", () => {
    const res = makeAndParseExpectingSuccess("Genesis - Deut");
    assertEquals(res.sbcs.length, 5);
    assertEquals(res.sbcs, [
        {
            book: "Genesis",
            chapter_start: 1,
            verse_start: 1,
            chapter_end: 50,
            verse_end: 26,
        },
        {
            book: "Exodus",
            chapter_start: 1,
            verse_start: 1,
            chapter_end: 40,
            verse_end: 38,
        },
        {
            book: "Leviticus",
            chapter_start: 1,
            verse_start: 1,
            chapter_end: 27,
            verse_end: 34,
        },
        {
            book: "Numbers",
            chapter_start: 1,
            verse_start: 1,
            chapter_end: 36,
            verse_end: 13,
        },
        {
            book: "Deuteronomy",
            chapter_start: 1,
            verse_start: 1,
            chapter_end: 34,
            verse_end: 12,
        },
    ]);
});

Deno.test("book with whitespace in name", () => {
    const res = makeAndParseExpectingSuccess("1 Corinthians");
    assertEquals(res.sbcs.length, 1);
    assertObjectMatch(res.sbcs[0], {
        book: "1 Corinthians",
        chapter_start: 1,
        verse_start: 1,
        chapter_end: 16,
        verse_end: 24,
    });
});

Deno.test("book with unambiguous abbreviation", () => {
    const res = makeAndParseExpectingSuccess("Matthe");
    assertEquals(res.sbcs.length, 1);
    assertObjectMatch(res.sbcs[0], {
        book: "Matthew",
        chapter_start: 1,
        verse_start: 1,
        chapter_end: 28,
        verse_end: 20,
    });
    assertObjectMatch(makeAndParseExpectingSuccess("Matthe"), res);
    assertObjectMatch(makeAndParseExpectingSuccess("Matth"), res);
    assertObjectMatch(makeAndParseExpectingSuccess("Matt"), res);
    assertObjectMatch(makeAndParseExpectingSuccess("Mat"), res);
});

Deno.test("book with ambiguous abbreviation", () => {
    makeAndParseExpectingFailure("Ma");
    makeAndParseExpectingFailure("M");
});

Deno.test("book that does not exist", () => {
    makeAndParseExpectingFailure("My Little Pony");
});

Deno.test("unambiguous book with numerical abbreviation should not be accepted", () => {
    makeAndParseExpectingFailure("3 ");
    makeAndParseExpectingFailure("3");
});

Deno.test("book with trailing space", () => {
    makeAndParseExpectingSuccess("Matthew ");
});

Deno.test("book and chapter", () => {
    const res = makeAndParseExpectingSuccess("Matthew 1");
    assertEquals(res.sbcs.length, 1);
    assertObjectMatch(res.sbcs[0], {
        book: "Matthew",
        chapter_start: 1,
        verse_start: 1,
        chapter_end: 1,
        verse_end: 25,
    });
});

Deno.test("book and chapter range", () => {
    const res = makeAndParseExpectingSuccess("Matthew 1-5");
    assertEquals(res.sbcs.length, 1);
    assertObjectMatch(res.sbcs[0], {
        book: "Matthew",
        chapter_start: 1,
        verse_start: 1,
        chapter_end: 5,
        verse_end: 48,
    });
});

Deno.test("book and chapter semicolon different book and chapter", () => {
    const res = makeAndParseExpectingSuccess("Matthew 3;1 John 2");
    assertEquals(res.sbcs.length, 2);
    assertEquals(res.sbcs, [
        {
            book: "Matthew",
            chapter_start: 3,
            verse_start: 1,
            chapter_end: 3,
            verse_end: 17,
        },
        {
            book: "1 John",
            chapter_start: 2,
            verse_start: 1,
            chapter_end: 2,
            verse_end: 29,
        },
    ]);
});

Deno.test("book and chapter semicolon same book", () => {
    const res = makeAndParseExpectingSuccess("Matthew 3;10");
    assertEquals(res.sbcs.length, 2);
    assertEquals(res.sbcs, [
        {
            book: "Matthew",
            chapter_start: 3,
            verse_start: 1,
            chapter_end: 3,
            verse_end: 17,
        },
        {
            book: "Matthew",
            chapter_start: 10,
            verse_start: 1,
            chapter_end: 10,
            verse_end: 42,
        },
    ]);
});

Deno.test("book and chapter comma different book and chapter", () => {
    const res = makeAndParseExpectingSuccess("Matthew 3,1 John 2");
    assertEquals(res.sbcs.length, 2);
    assertEquals(res.sbcs, [
        {
            book: "Matthew",
            chapter_start: 3,
            verse_start: 1,
            chapter_end: 3,
            verse_end: 17,
        },
        {
            book: "1 John",
            chapter_start: 2,
            verse_start: 1,
            chapter_end: 2,
            verse_end: 29,
        },
    ]);
});

Deno.test("book and chapter comma same book", () => {
    const res = makeAndParseExpectingSuccess("Matthew 3,10");
    assertEquals(res.sbcs.length, 2);
    assertEquals(res.sbcs, [
        {
            book: "Matthew",
            chapter_start: 3,
            verse_start: 1,
            chapter_end: 3,
            verse_end: 17,
        },
        {
            book: "Matthew",
            chapter_start: 10,
            verse_start: 1,
            chapter_end: 10,
            verse_end: 42,
        },
    ]);
});

Deno.test("book and book/chapter range", () => {
    const res = makeAndParseExpectingSuccess("Matthew 1 - Mark 5");
    assertEquals(res.sbcs.length, 2);
    assertEquals(res.sbcs, [
        {
            book: "Matthew",
            chapter_start: 1,
            verse_start: 1,
            chapter_end: 28,
            verse_end: 20,
        },
        {
            book: "Mark",
            chapter_start: 1,
            verse_start: 1,
            chapter_end: 5,
            verse_end: 43,
        },
    ]);
});

Deno.test("book and chapter (opt: f)", () => {
    const res = makeAndParseExpectingSuccess("Matthew 2f");
    assertEquals(res.sbcs.length, 1);
    assertObjectMatch(res.sbcs[0], {
        book: "Matthew",
        chapter_start: 2,
        verse_start: 1,
        chapter_end: 3,
        verse_end: 17,
    });
});

Deno.test("book and chapter (opt: ff)", () => {
    const res = makeAndParseExpectingSuccess("Matthew 2ff");
    assertEquals(res.sbcs.length, 1);
    assertObjectMatch(res.sbcs[0], {
        book: "Matthew",
        chapter_start: 2,
        verse_start: 1,
        chapter_end: 28,
        verse_end: 20,
    });
});

Deno.test("book and chapter and verse", () => {
    const res = makeAndParseExpectingSuccess("Matthew 1:4");
    assertEquals(res.sbcs.length, 1);
    assertObjectMatch(res.sbcs[0], {
        book: "Matthew",
        chapter_start: 1,
        verse_start: 4,
        chapter_end: 1,
        verse_end: 4,
    });
});

Deno.test("book and chapter and verse dots", () => {
    const res = makeAndParseExpectingSuccess("Matthew 1.4");
    assertEquals(res.sbcs.length, 1);
    assertEquals(res.sbcs[0], {
        book: "Matthew",
        chapter_start: 1,
        verse_start: 4,
        chapter_end: 1,
        verse_end: 4,
    });
});

Deno.test("book and chapter and verse (opt: f)", () => {
    const res = makeAndParseExpectingSuccess("Matthew 1:4f");
    assertEquals(res.sbcs.length, 1);
    assertObjectMatch(res.sbcs[0], {
        book: "Matthew",
        chapter_start: 1,
        verse_start: 4,
        chapter_end: 1,
        verse_end: 5,
    });
});

Deno.test("book and chapter and verse (opt: ff)", () => {
    const res = makeAndParseExpectingSuccess("Matthew 1:4ff");
    assertEquals(res.sbcs.length, 1);
    assertObjectMatch(res.sbcs[0], {
        book: "Matthew",
        chapter_start: 1,
        verse_start: 4,
        chapter_end: 1,
        verse_end: 25,
    });
});

Deno.test("book and chapter to book and chapter and verse (opt: ff)", () => {
    const res = makeAndParseExpectingSuccess("Matthew 2:4-3:2ff");
    assertEquals(res.sbcs.length, 1);
    assertObjectMatch(res.sbcs[0], {
        book: "Matthew",
        chapter_start: 2,
        verse_start: 4,
        chapter_end: 3,
        verse_end: 17,
    });
});

Deno.test("book and chapter to book and chapter and verse (opt: ff at start)", () => {
    const res = makeAndParseExpectingSuccess("Matthew 2:4ff-3:9");
    assertEquals(res.sbcs.length, 1);
    assertObjectMatch(res.sbcs[0], {
        book: "Matthew",
        chapter_start: 2,
        verse_start: 4,
        chapter_end: 3,
        verse_end: 9,
    });
});

Deno.test("book and chapter to book and chapter and verse (opt: ff at start) dots", () => {
    const res = makeAndParseExpectingSuccess("Matthew 2.4ff-3.9");
    assertEquals(res.sbcs.length, 1);
    assertObjectMatch(res.sbcs[0], {
        book: "Matthew",
        chapter_start: 2,
        verse_start: 4,
        chapter_end: 3,
        verse_end: 9,
    });
});

Deno.test("book and chapter to book and chapter and verse", () => {
    const res = makeAndParseExpectingSuccess("Matthew 2-3:9");
    assertEquals(res.sbcs.length, 1);
    assertObjectMatch(res.sbcs[0], {
        book: "Matthew",
        chapter_start: 2,
        verse_start: 1,
        chapter_end: 3,
        verse_end: 9,
    });
});

Deno.test("book and chapter verse to invalid range [starting verse==0]", () => {
    makeAndParseExpectingFailure("Matthew 2:0");
});

Deno.test("book and chapter verse to invalid range [ending verse==0]", () => {
    makeAndParseExpectingFailure("Matthew 2:5-0");
});

Deno.test("book and chapter verse to invalid range [starting==ending verse==0]", () => {
    makeAndParseExpectingFailure("Matthew 2:0-0");
});

Deno.test("book and chapter verse to invalid range [verse limits reversed]", () => {
    makeAndParseExpectingFailure("Matthew 2:8-6");
});

Deno.test("book and chapter to invalid range [starting chapter==0]", () => {
    makeAndParseExpectingFailure("Matthew 0-4");
});

Deno.test("book and chapter to invalid range [starting==ending chapter==0]", () => {
    makeAndParseExpectingFailure("Matthew 4-0");
});

Deno.test("book and chapter to invalid range [chapter limits reversed]", () => {
    makeAndParseExpectingFailure("Matthew 8-6");
});

Deno.test("book and chapter verse to book and chapter verse", () => {
    const res = makeAndParseExpectingSuccess("Matthew 2:8-6:2");
    assertEquals(res.sbcs.length, 1);
    assertObjectMatch(res.sbcs[0], {
        book: "Matthew",
        chapter_start: 2,
        verse_start: 8,
        chapter_end: 6,
        verse_end: 2,
    });
});

Deno.test("book and chapter and verse, comma", () => {
    const res = makeAndParseExpectingSuccess("Matthew 1:4,6");
    assertEquals(res.sbcs.length, 2);
    assertEquals(res.sbcs, [
        {
            book: "Matthew",
            chapter_start: 1,
            verse_start: 4,
            chapter_end: 1,
            verse_end: 4,
        },
        {
            book: "Matthew",
            chapter_start: 1,
            verse_start: 6,
            chapter_end: 1,
            verse_end: 6,
        },
    ]);
});

Deno.test("book and chapter and verse, semicolon chapter", () => {
    const res = makeAndParseExpectingSuccess("Matthew 1:4;6");
    assertEquals(res.sbcs.length, 2);
    assertEquals(res.sbcs, [
        {
            book: "Matthew",
            chapter_start: 1,
            verse_start: 4,
            chapter_end: 1,
            verse_end: 4,
        },
        {
            book: "Matthew",
            chapter_start: 6,
            verse_start: 1,
            chapter_end: 6,
            verse_end: 34,
        },
    ]);
});

Deno.test("book and chapter and verse, semicolon chapter verse", () => {
    const res = makeAndParseExpectingSuccess("Matthew 1:4;6:2");
    assertEquals(res.sbcs.length, 2);
    assertEquals(res.sbcs, [
        {
            book: "Matthew",
            chapter_start: 1,
            verse_start: 4,
            chapter_end: 1,
            verse_end: 4,
        },
        {
            book: "Matthew",
            chapter_start: 6,
            verse_start: 2,
            chapter_end: 6,
            verse_end: 2,
        },
    ]);
});
