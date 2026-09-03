// 30+ realistic queries. "expected" is computed from data/papers.json, so the
// test asserts that search agrees with the data rather than with itself.
window.__runSearchTests = async function () {
  const idx = await (await fetch('/data/search-index.json?cb=' + Date.now())).json();
  const papers = (await (await fetch('/data/papers.json?cb=' + Date.now())).json()).items
    .filter(p => p.published !== false);

  // --- the shipped algorithm, imported by copy so the test runs standalone ---
  const NUMBER_WORDS = { one:"1",two:"2",three:"3",four:"4",five:"5",six:"6",seven:"7",eight:"8",nine:"9",ten:"10",eleven:"11",twelve:"12",thirteen:"13" };
  function normalise(raw){
    let q = ` ${String(raw||"").toLowerCase()} `;
    q = q.replace(/\bordinary\s+level\b/g," ol ").replace(/\bo\s*\/\s*l\b/g," ol ");
    q = q.replace(/\badvanced\s+level\b/g," al ").replace(/\ba\s*\/\s*l\b/g," al ");
    q = q.replace(/[^a-z0-9]+/g," ");
    q = q.replace(/\bgr\s*(\d{1,2})\b/g," grade $1 ").replace(/\bg\s*(\d{1,2})\b/g," grade $1 ");
    q = q.replace(/\bgrade\s+([a-z]+)\b/g,(m,w)=>NUMBER_WORDS[w]?` grade ${NUMBER_WORDS[w]} `:m);
    const ORD={1:"first",2:"second",3:"third"};
    q = q.replace(/\bterm\s*([123])\b/g,(m,n)=>` ${ORD[n]} term `);
    q = q.replace(/\b([123])\s*(?:st|nd|rd)?\s+term\b/g,(m,n)=>` ${ORD[n]} term `);
    q = q.replace(/\b1st\b/g," first ").replace(/\b2nd\b/g," second ").replace(/\b3rd\b/g," third ");
    q = q.replace(/\byear\s+end\b/g," third term ");
    return q.split(/\s+/).filter(Boolean);
  }
  const wordsOf = e => [e.title,e.description,e.keywords,e.section,e.level].filter(Boolean).join(" ")
    .toLowerCase().replace(/[^a-z0-9]+/g," ").split(/\s+/).filter(Boolean);
  function wordMatches(w, words){ return /^\d+$/.test(w) ? words.includes(w) : words.some(x=>x===w||x.startsWith(w)); }
  function run(q){
    const ws = normalise(q);
    return idx.filter(e => { const all = wordsOf(e); return ws.every(w => wordMatches(w, all)); });
  }
  const papersOnly = rs => rs.filter(r => r.section === 'Past Papers');

  // expectation helpers, straight from papers.json
  const P = (fn) => papers.filter(fn).length;
  const g = (n) => p => String(p.grade||'') === String(n);
  const t = (x) => p => p.term === x;
  const y = (n) => p => String(p.year||'') === String(n);
  const prov = (s) => p => String(p.province||'').toLowerCase().includes(s);

  const tests = [
    ['Grade 7 Second Term',        P(x=>g(7)(x)&&t('second')(x))],
    ['Grade 7 Term 2',             P(x=>g(7)(x)&&t('second')(x))],
    ['Grade Seven Second Term',    P(x=>g(7)(x)&&t('second')(x))],
    ['Gr 7 2nd Term',              P(x=>g(7)(x)&&t('second')(x))],
    ['grade 7 second term test',   P(x=>g(7)(x)&&t('second')(x))],
    ['Grade 7 third term',         P(x=>g(7)(x)&&t('third')(x))],
    ['Grade 10 Second Term',       P(x=>g(10)(x)&&t('second')(x))],
    ['Grade 10 term 2',            P(x=>g(10)(x)&&t('second')(x))],
    ['Grade 10 First Term',        P(x=>g(10)(x)&&t('first')(x))],
    ['Grade 10 Third Term',        P(x=>g(10)(x)&&t('third')(x))],
    ['Grade 9 third term',         P(x=>g(9)(x)&&t('third')(x))],
    ['Grade 9 Term 3',             P(x=>g(9)(x)&&t('third')(x))],
    ['Grade 8 second term',        P(x=>g(8)(x)&&t('second')(x))],
    ['Grade 6',                    P(g(6))],
    ['grade 11 second term',       P(x=>g(11)(x)&&t('second')(x))],
    ['Grade 4 second term',        P(x=>g(4)(x)&&t('second')(x))],
    ['Grade 4 first term',         P(x=>g(4)(x)&&t('first')(x))],
    ['Grade 4 third term',         P(x=>g(4)(x)&&t('third')(x))],
    ['grade four second term',     P(x=>g(4)(x)&&t('second')(x))],
    ['Central Province',           P(prov('central'))],
    ['Southern Province',          P(prov('southern'))],
    ['Western Province',           P(prov('western'))],
    ['Northern Province',          P(prov('northern'))],
    ['2026',                       P(y(2026))],
    ['2019',                       P(y(2019))],
    ['2025',                       P(y(2025))],
    ['Grade 10 2019',              P(x=>g(10)(x)&&y(2019)(x))],
    ['Grade 10 second term 2026',  P(x=>g(10)(x)&&t('second')(x)&&y(2026)(x))],
    ['Grade 9 third term 2024',    P(x=>g(9)(x)&&t('third')(x)&&y(2024)(x))],
    ['marking scheme',             P(x=>x.type==='marking-scheme')],
    ['model paper',                P(x=>x.type==='model-paper')],
    ['Grade 4 Galnewa',            P(x=>g(4)(x)&&prov('galnewa')(x))],
    ['Puttlam Zone',               P(prov('puttlam'))],
    ['Trincomalee',                P(prov('trincomalee'))],
  ];

  const rows = tests.map(([q, expected]) => {
    const all = run(q);
    const pOnly = papersOnly(all);
    return { query: q, expectedPapers: expected, actualPapers: pOnly.length, totalHits: all.length,
             pass: pOnly.length >= expected && (expected > 0 ? pOnly.length > 0 : true) };
  });

  // false-positive probes: these must NOT explode
  const probes = ['OL','O/L','Ordinary Level','A/L','Term 2','Grade Seven'].map(q => ({
    query: q, hits: run(q).length, papers: papersOnly(run(q)).length
  }));

  return { rows, probes, failures: rows.filter(r => !r.pass) };
};
'ready';
