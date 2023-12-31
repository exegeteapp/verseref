import { BookArray } from "./Types.ts";

const extra_abbrevations: { [index: string]: ReadonlyArray<string> } = {
    Ecclesiastes: ["Qoheleth", "Qoh"],
    Habakkuk: ["Hah"],
    Judith: ["Jdt"],
    "Esther (Greek)": ["Add Esth"],
    "The Wisdom of Solomon": ["Wis"],
    "The Letter of Jeremiah": ["Let Jer"],
    "Azariah and the Three Jews": ["Song of Thr"],
    "The Prayer of Manasseh": ["Pr Man"],
    "Psalm 151": ["Ps 151"],
    Matthew: ["Mt"],
    Mark: ["Mk"],
    Luke: ["Lk"],
    John: ["Jn"],
    James: ["Jas"],
    "1 John": ["1 Jn"],
    "2 John": ["2 Jn"],
    "3 John": ["3 Jn"],
};

const generateAbbreviations = (books: BookArray) => {
    // books can be identified by the shortest non-ambiguous abbreviation
    const book_abbrevations = new Map<string, Set<string>>();
    const abbrevcount = new Map<string, number>();
    const number_re = /^\d+$/;
    const ends_space = /^.* $/;

    const abbrev_map = (s: string, f: (sub: string) => void) => {
        const abbrevs = new Set<string>();
        const gen = (s: string) => {
            for (let i = s.length - 1; i >= 0; i--) {
                abbrevs.add(s.substr(0, i));
            }
        };
        gen(s);
        // strip whitespace and generate new abbreviations if relevant
        const ns = s.replace(/ /g, "");
        if (s !== ns) {
            gen(ns);
        }
        abbrevs.forEach((a: string) => {
            // numeric abbreviations are excluded as they clash with verse numbers
            if (!a.match(number_re) && !a.match(ends_space)) {
                f(a);
            }
        });
    };

    for (const book of books) {
        const abbrevs = new Set<string>();
        book_abbrevations.set(book.name, abbrevs);
        // books can always be directly referenced by their name
        abbrevs.add(book.name);
        // ... and by their name without whitespace
        abbrevs.add(book.name.replace(/ /g, ""));
        abbrev_map(book.name, (abbrev) => {
            if (!abbrevcount.has(abbrev)) {
                abbrevcount.set(abbrev, 0);
            }
            abbrevcount.set(abbrev, (abbrevcount.get(abbrev) as number) + 1);
        });
    }

    for (const book of books) {
        const abbrevs = book_abbrevations.get(book.name) as Set<string>;
        abbrev_map(book.name, (abbrev) => {
            const c = abbrevcount.get(abbrev) as number;
            if (c === 1) {
                abbrevs.add(abbrev);
            }
        });
    }

    for (const book in extra_abbrevations) {
        if (!book_abbrevations.has(book)) {
            continue;
        }
        const abbrevs = book_abbrevations.get(book) as Set<string>;
        const extra = extra_abbrevations[book];
        for (const abbrev of extra) {
            abbrevs.add(abbrev);
        }
    }

    return book_abbrevations;
};

export default generateAbbreviations;
