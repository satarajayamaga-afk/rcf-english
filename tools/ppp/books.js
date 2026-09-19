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
const drive = (id, key) => ({
  view: `https://drive.google.com/file/d/${id}/view${key ? "?resourcekey=" + key : ""}`,
  dl: `https://drive.google.com/uc?export=download&id=${id}${key ? "&resourcekey=" + key : ""}`
});

exports.BOOKS = [
  ["Grade 1", "ABOE Activity Book", "Administrator/English/1/activity G1 E/ABOE Gr 1 Final Book 20.08.24.pdf", null],
  ["Grade 1", "ABOE Song Book", "Administrator/English/1/song book g1/Song Book G-1 (E) - Inner_V2.pdf", null],
  ["Grade 2", "ABOE Activity Book (My Active Book)", "Administrator/English/2/activity G2 E/My Active Book G-2 (E) Inner_V1.pdf", null],
  ["Grade 2", "ABOE Song Book", "Administrator/English/2/song book g2/Song Book G-2 (E) Inner_V2.pdf", null],
  ["Grade 3", "Pupil's Book", "Administrator/English/3/english PB G-3/english PB G-3.pdf", drive("1cPdUU3ghQO3gUmKXLWTY7X40FZtK_pyr")],
  ["Grade 3", "Workbook", "Administrator/English/3/english wb G-3/english WB. 3.pdf", null],
  ["Grade 3", "Writing Practice book", "Administrator/English/3/en writing prac G-3/26454 - SB Writing Practice Grade 3 English.pdf", null],
  ["Grade 4", "Pupil's Book", "Administrator/English/4/en pb G-4/english PB G-4.pdf", null],
  ["Grade 4", "Workbook", "Administrator/English/4/english WB G-4/english WB G-4.pdf", null],
  ["Grade 5", "Pupil's Book", "Administrator/English/5/english pb G-5/English PB G-5.pdf", null],
  ["Grade 5", "Workbook", "Administrator/English/5/english WB G-5/english G-5 WB.pdf", null],
  ["Grade 5", "Workbook Part I (earlier edition)", "Administrator/English/5/english wb G-5 P-I/English WB Gra.-5 Part-I.pdf", null],
  ["Grade 5", "Workbook Part II (earlier edition)", "Administrator/English/5/english wb G-5 P-II/English WB Gra.-5 Part -II.pdf", null],
  ["Grade 6", "Pupil's Book", "Administrator/English/6/english PB G-6/english PB G-6.pdf", drive("1Ta5sHpYrp23ywq4HugdEG1BrqB8tWCdl")],
  ["Grade 6", "Workbook", "Administrator/English/6/english wb G-6/A94779_ENGLISH WORKBOOK - GRADE 06.pdf", null],
  ["Grade 7", "Workbook", "Administrator/English/7/en wb g-7/en WB G-7.pdf", null],
  ["Grade 8", "Pupil's Book", "Administrator/English/8/en pb g-8/en PB g-8.pdf", null],
  ["Grade 8", "Workbook", "Administrator/English/8/en wb g-8/english WB g-8.pdf", null],
  ["Grade 9", "Pupil's Book", "Administrator/English/9/en pb g-9/english pb G-9.pdf", drive("16q5Qcc5jNowFBg-u04rAAXIEE1IgnouF")],
  ["Grade 9", "Workbook", "Administrator/English/9/en wb g-9/en wb g-9.pdf", null],
  ["Grade 10", "Workbook", "Administrator/English/10/English Work Book G 10 E/english WB G-10.pdf", null],
  ["Grade 10", "Appreciation of English Literary Texts", "Administrator/English/10/en ap g-10/English Literary texts.pdf", null],
  ["Grade 11", "Pupil's Book", "Administrator/English/11/english PB G-11/book.pdf", null],
  ["Grade 11", "Workbook", "Administrator/English/11/en wb g-11/english WBg-11.pdf", null]
];

// Books the department publishes one unit at a time.
exports.BY_UNIT = [
  {
    title: "Grade 7 English Reading Book",
    note: "The department publishes this book one unit at a time.",
    units: [
      ["Unit 1: What You See", "Administrator/English/7/English Reading Book G7/Unit 1 - What You see - ok.pdf"],
      ["Unit 2: Friends Indeed", "Administrator/English/7/English Reading Book G7/Unit 2 - Friends In Deed - ok.pdf"],
      ["Unit 3: Pleasure", "Administrator/English/7/English Reading Book G7/Unit 3 - pleasure - ok.pdf"],
      ["Unit 4: A Busy Day", "Administrator/English/7/English Reading Book G7/Unit 4 - A busy day - ok.pdf"],
      ["Unit 5: Once Upon a Time", "Administrator/English/7/English Reading Book G7/Unit 5 - once upon a time - ok.pdf"],
      ["Unit 6: Better Safe Than Sorry", "Administrator/English/7/English Reading Book G7/Unit 6 - Better be safe than sorry - ok.pdf"],
      ["Unit 7: Around the Country", "Administrator/English/7/English Reading Book G7/Unit 7 - Around the country - ok.pdf"],
      ["Unit 8: Wonders Around Us", "Administrator/English/7/English Reading Book G7/Unit 8 - Wonders Around Us - ok.pdf"],
      ["Unit 9: Our Beautiful World", "Administrator/English/7/English Reading Book G7/Unit 9 - our beautiful world - ok.pdf"],
      ["Unit 10: Future", "Administrator/English/7/English Reading Book G7/Unit 10 - Future - ok.pdf"]
    ]
  },
  {
    title: "Grade 10 English Pupil's Book",
    note: "The department publishes this book one unit at a time.",
    units: [
      ["Unit 1: People", "Administrator/English/10/English Pupils Book G 10 - E/Unit 1 pdf People.pdf"],
      ["Unit 2: On Your Way", "Administrator/English/10/English Pupils Book G 10 - E/Unit 2 pdf ok on your way.pdf"],
      ["Unit 3: Travel", "Administrator/English/10/English Pupils Book G 10 - E/Unit 3 Travel.pdf"],
      ["Unit 4: Let's Talk", "Administrator/English/10/English Pupils Book G 10 - E/Unit 4 Lets talk.pdf"],
      ["Unit 5: Best Practices", "Administrator/English/10/English Pupils Book G 10 - E/Unit 5 Best Practices.pdf"],
      ["Unit 6: Information", "Administrator/English/10/English Pupils Book G 10 - E/Unit 6 Information.pdf"],
      ["Unit 7: Learning Is Fun", "Administrator/English/10/English Pupils Book G 10 - E/Unit 7 Learning is fun.pdf"],
      ["Unit 8: Healthy Food", "Administrator/English/10/English Pupils Book G 10 - E/Unit 8 Healthy Food.pdf"],
      ["Unit 9: Nature", "Administrator/English/10/English Pupils Book G 10 - E/Unit 9 Nature.pdf"],
      ["Unit 10: Personality", "Administrator/English/10/English Pupils Book G 10 - E/Unit 10 Personality.pdf"],
      ["Unit 11: The Right Career", "Administrator/English/10/English Pupils Book G 10 - E/Unit 11 The right career.pdf"],
      ["Unit 12: Success", "Administrator/English/10/English Pupils Book G 10 - E/Unit 12 Success.pdf"],
      ["Unit 13: Future", "Administrator/English/10/English Pupils Book G 10 - E/Unit 13 Future.pdf"],
      ["Unit 14: Sports", "Administrator/English/10/English Pupils Book G 10 - E/Unit 14 Sports.pdf"]
    ]
  }
];

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
  ["Grade 7 Pupil's Book (whole book)", "Only the Reading Book (unit by unit) and the Workbook are published."],
  ["Grade 10 Pupil's Book (whole book)", "Published unit by unit; the fourteen units are listed below."],
  ["A/L General English textbook", "The department's download page has no books for Grades 12 and 13. The Teachers' Guide is above."],
  ["New 2026 Grade 6 book", "The Grade 6 book on the department's site has the same units as the 2014 to 2019 edition (Hello, Leisure Lesson, ... Eco Friends). The new 2026 book was not on the site when we checked."],
  ["Literature texts (O/L and A/L)", "Prescribed novels, plays and poems are copyright works and are not published free. Grade 10 Appreciation of English Literary Texts is the one exception, and it is listed above."]
];
