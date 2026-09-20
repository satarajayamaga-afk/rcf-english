// Official Pupil's Books, Workbooks and Teachers' Guides.
//
// Each entry is [grade, title, path on edupub.gov.lk (or null), RCF Drive link
// (or null)]. Where we have a Drive copy, that is the link teachers get: the
// Educational Publications Department server is often slow and frequently
// drops large downloads half way. The department link is kept beside it as a
// second option.
//
// A Drive file is only listed here after checking that it is shared as
// "anyone with the link can VIEW". Never list a file that is private (the
// link fails for visitors) or that anyone can edit (a stranger could replace
// the book teachers download).
//
// Check every link with: node tools/ppp/check-book-links.js
const EPD = "http://www.edupub.gov.lk/";
// Brackets must be percent-encoded too: a bare ")" in a URL ends a
// markdown link early.
const enc = (p) => p.split("/").map((part) => encodeURIComponent(part).replace(/\(/g, "%28").replace(/\)/g, "%29")).join("/");
const NIE = "https://nie.lk";
exports.epdUrl = (p) => EPD + enc(p);
exports.nieUrl = (p) => NIE + "/" + enc(p.replace(/^\//, ""));
exports.SEARCH = "http://www.edupub.gov.lk/BooksDownload.php";
exports.TG_SEARCH = "https://nie.lk/seletguide";
// Two links per Drive file: a direct download (what most teachers want) and
// the Drive page, which previews the book in the browser.
//
// The download must use drive.usercontent.google.com, not the older
// drive.google.com/uc?export=download. The old address works when nobody is
// signed in, which is why it passed our checks, but a visitor signed into a
// Google account gets "400. That's an error." from it. authuser=0 says "the
// first signed-in account", which stops the same error when someone is signed
// into several at once.
const drive = (id, key) => ({
  view: `https://drive.google.com/file/d/${id}/view${key ? "?resourcekey=" + key : ""}`,
  dl: `https://drive.usercontent.google.com/download?id=${id}&export=download&authuser=0${key ? "&resourcekey=" + key : ""}`
});

exports.BOOKS = [
  ["Grades 1 and 2", "Activity Book", null, drive("1uJ8pCge69CcWol6QUoR4JU053nl6PjXw")],
  ["Grade 1", "ABOE Song Book", "Administrator/English/1/song book g1/Song Book G-1 (E) - Inner_V2.pdf", null],
  ["Grade 2", "ABOE Song Book", "Administrator/English/2/song book g2/Song Book G-2 (E) Inner_V2.pdf", null],
  ["Grade 3", "Pupil's Book", "Administrator/English/3/english PB G-3/english PB G-3.pdf", drive("1cPdUU3ghQO3gUmKXLWTY7X40FZtK_pyr")],
  ["Grade 3", "Workbook", null, drive("1qUq2MD3dP4DQuGA-O1WdeLS056Bl8qMa")],
  ["Grade 3", "Writing Practice book", "Administrator/English/3/en writing prac G-3/26454 - SB Writing Practice Grade 3 English.pdf", null],
  ["Grade 4", "Pupil's Book", "Administrator/English/4/en pb G-4/english PB G-4.pdf", null],
  ["Grade 4", "Workbook", null, drive("1Fu3sVegKHsXQsOWfqdig8tZu2x_h63Lu")],
  ["Grade 5", "Pupil's Book", "Administrator/English/5/english pb G-5/English PB G-5.pdf", null],
  ["Grade 5", "Workbook", "Administrator/English/5/english WB G-5/english G-5 WB.pdf", null],
  ["Grade 6", "Pupil's Book", "Administrator/English/6/english PB G-6/english PB G-6.pdf", drive("1Ta5sHpYrp23ywq4HugdEG1BrqB8tWCdl")],
  ["Grade 6", "Workbook", null, drive("1s-n0UJnVMJLJHZ44YgXFrJvWDSi7FwOg")],
  ["Grade 7", "Pupil's Book", null, drive("12L0ScUF3RSINuvZdVrsK7hU7Ur8N9AlW")],
  ["Grade 7", "Workbook", "Administrator/English/7/en wb g-7/en WB G-7.pdf", null],
  ["Grade 8", "Pupil's Book", null, drive("1Tp65gVlBCRXABpcULpujXtc5UAT6Nqzr")],
  ["Grade 8", "Workbook", "Administrator/English/8/en wb g-8/english WB g-8.pdf", null],
  ["Grade 9", "Pupil's Book", "Administrator/English/9/en pb g-9/english pb G-9.pdf", drive("16q5Qcc5jNowFBg-u04rAAXIEE1IgnouF")],
  ["Grade 9", "Workbook", "Administrator/English/9/en wb g-9/en wb g-9.pdf", null],
  ["Grade 10", "Pupil's Book (scanned copy)", null, drive("1H5WeTVEAtNjvfXpO6iupB9ei58z8TJrx")],
  ["Grade 10", "Workbook", "Administrator/English/10/English Work Book G 10 E/english WB G-10.pdf", null],
  ["Grade 10", "Appreciation of English Literary Texts", null, drive("0B5Dat0QJWfuUN3U3ODRCLUNQVXc", "0-NzCvpFm0a0cgjv-0Ksr9Ow")],
  ["Grade 11", "Pupil's Book", null, drive("1Tzl1n6QFrK55gbzaSmQMfWvhYO_V_70B")],
  ["Grade 11", "Workbook", "Administrator/English/11/en wb g-11/english WBg-11.pdf", null]
];

// We list whole books only. Where the department publishes a book one unit
// at a time (the Grade 7 Reading Book and the Grade 10 Pupil's Book), we do
// not list the parts at all; see MISSING below.
exports.BY_UNIT = [];

// [grades, guide title, path on nie.lk, RCF Drive link or null]
exports.GUIDES = [
  ["Grades 1 and 2", "Activity Based Oral English (2018)", "/pdffiles/tg/eGr1_2TG ActBasedOrelEng.pdf", null],
  ["Grade 1", "Activity Based Oral English (earlier edition)", "/pdffiles/tg/e1tim5.pdf", null],
  ["Grade 2", "Activity Based Oral English (earlier edition)", "/pdffiles/tg/e2tim5.pdf", null],
  ["Grade 3", "English (2018)", "/pdffiles/tg/eGr03TG English.pdf", drive("1tXItWDWlgtezo1J7bPx3uIx7m_RIDiCd")],
  ["Grade 5", "English (2020)", "/pdffiles/tg/eGr05TG English.pdf", drive("17C5Uf0i3mmePWXx2h1UpW0KaPAH7935R")],
  ["Grade 6", "English (2015)", "/pdffiles/tg/e6tim107.pdf", drive("1Spyt3mr2rXvh4-HwhjGEoAcx-u2r1FNi")],
  ["Grade 7", "English (2016)", "/pdffiles/tg/eGr07TG English.pdf", drive("1Mb4MlXQi6xdv3_Rg68PkzQ92MT4T4DCj")],
  ["Grade 7", "English Language (2007)", "/pdffiles/tg/e7tim4.pdf", null],
  ["Grade 8", "English (2017)", "/pdffiles/tg/eGr8_TG English.pdf", null],
  ["Grade 9", "English Language (2018)", "/pdffiles/tg/eGr09TG English.pdf", drive("1V1sOydQCHmoJO-DfVEFn76-0kY6CbS8x")],
  ["Grade 9", "English Language (2009)", "/pdffiles/tg/e9tim4.pdf", null],
  ["Grade 10", "English (2015)", "/pdffiles/tg/e10tim107.pdf", drive("1miKnI4IFffmvJy0z22r-wu9fJOzoQXcA")],
  ["Grade 10", "Appreciation of English Literary Texts (2015)", "/pdffiles/tg/e10tim130.pdf", null],
  ["Grade 11", "English Language (2016)", "/pdffiles/tg/eGr11TG English.pdf", drive("1aFF9iR4m8ls6BprYXKM6yCZ17VUfhRuX")],
  ["Grades 12 and 13", "General English (2017)", "/pdffiles/tg/eALTG GenEng.pdf", drive("0B5Dat0QJWfuUbkhpa0RHRWM4NXM", "0-GkdNq03ksCxbWidqsa4H6Q")],
  ["Grades 12 and 13", "English, the A/L Literature subject (2017)", "/pdffiles/tg/eALTG English.pdf", null],
  ["Grade 12", "English (2009, earlier edition)", "/pdffiles/tg/e12tim46.pdf", null],
  ["Grade 13", "English (2010, earlier edition)", "/pdffiles/tg/e13tim46.pdf", null]
];

// Things a teacher may look for and not find on the official sites.
exports.MISSING = [
  ["Grade 4 Teachers' Guide", "The NIE guide list has no English guide for Grade 4. Grades 3 and 5 are there."],
  ["Grade 7 and Grade 10 Pupil's Books", "The department publishes these two only one unit at a time, never as a whole book. The complete books above are copies held in the RCF English Drive."],
  ["A/L General English textbook", "There is no free copy of this book to download. The Teachers' Guide for it is above."],
  ["New 2026 Grade 6 book", "The Grade 6 book here is the earlier edition, with the units Hello, Leisure Lesson ... Eco Friends. We do not have a copy of the new 2026 book."],
  ["Literature texts (O/L and A/L)", "Prescribed novels, plays and poems are copyright works and are not published free. Grade 10 Appreciation of English Literary Texts is the one exception, and it is listed above."]
];
