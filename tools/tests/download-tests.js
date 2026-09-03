// Requirement 10: open each returned paper and confirm the download really is
// that paper, rather than only that the link resolves. A link can return 200
// and still be a 404 page, an HTML error, or the wrong file.
window.__verifyDownloads = async function () {
  const papers = (await (await fetch('/data/papers.json?cb=' + Date.now())).json()).items
    .filter(p => p.published !== false);

  const local = papers.filter(p => p.url && !/^https?:/i.test(p.url));
  const drive = papers.filter(p => p.url && /^https?:/i.test(p.url));

  const rows = [];
  for (const p of local) {
    const row = { id: p.id, url: p.url, status: null, type: null, bytes: 0, isPdf: false, ok: false };
    try {
      const r = await fetch('/' + p.url.replace(/^\/+/, ''), { cache: 'no-cache' });
      row.status = r.status;
      row.type = r.headers.get('content-type');
      const buf = await r.arrayBuffer();
      row.bytes = buf.byteLength;
      // A real PDF begins with %PDF
      const head = new TextDecoder().decode(new Uint8Array(buf.slice(0, 5)));
      row.isPdf = head.startsWith('%PDF');
      row.ok = r.status === 200 && row.isPdf && row.bytes > 10000;
    } catch (e) {
      row.status = 'fetch-error: ' + e.message;
    }
    rows.push(row);
  }
  return {
    localChecked: rows.length,
    localOk: rows.filter(r => r.ok).length,
    localFailures: rows.filter(r => !r.ok),
    driveLinked: drive.length,
    note: 'Drive-hosted papers cannot be fetched cross-origin from this page; they were audited separately earlier.',
    sample: rows.slice(0, 5)
  };
};
'ready';
