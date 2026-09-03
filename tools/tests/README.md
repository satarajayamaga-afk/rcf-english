# Paper Library regression tests

Two harnesses, run from the browser console on a page that has the search
index available (any page works; the search page is the natural one):

    const s = await (await fetch('/tools/tests/search-tests.js')).text();
    (0,eval)(s); await window.__runSearchTests();

    const d = await (await fetch('/tools/tests/download-tests.js')).text();
    (0,eval)(d); await window.__verifyDownloads();

`search-tests.js` asserts that search agrees with `data/papers.json`: for each
of 34 realistic queries it counts the papers the data says should match and
checks the search returns at least that many. It fails loudly if a query that
should find papers finds none.

`download-tests.js` fetches every locally hosted paper and checks it returns
200, is served as application/pdf, and actually begins with the bytes `%PDF`.
A link that resolves is not the same as a paper that opens.

Both were written during the September 2026 Paper Library audit, which found
the search index carried no grade, term or province for any paper, and that
substring matching made "OL" match "school" and "7" match "2017".
