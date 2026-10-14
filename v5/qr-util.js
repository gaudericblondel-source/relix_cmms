// Relix QR helpers — real QR codes encoding the Asset Detail URL, PNG download and label printing in several formats.
// Uses the qrcode-generator library (loaded on demand). window.RelixQR.
const SRC = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
let loading = null;
export const load = () => window.qrcode ? Promise.resolve(window.qrcode) : (loading = loading || new Promise((res, rej) => { const s = document.createElement('script'); s.src = SRC; s.onload = () => res(window.qrcode); s.onerror = rej; document.head.appendChild(s); }));
export const assetUrl = id => { try { return new URL('AssetDetail.dc.html?id=' + encodeURIComponent(id), location.href).href; } catch (e) { return 'AssetDetail.dc.html?id=' + encodeURIComponent(id); } };
export const FORMATS = {
  '50x25': { label: 'Small label · 50 × 25 mm', w: 50, h: 25, qr: 21, lines: 2 },
  '70x35': { label: 'Standard label · 70 × 35 mm', w: 70, h: 35, qr: 29, lines: 4 },
  '100x50': { label: 'Large label · 100 × 50 mm', w: 100, h: 50, qr: 42, lines: 5 },
  A4: { label: 'A4 sheet · 3 × 8 labels (70 × 37 mm)', w: 70, h: 37, qr: 30, lines: 4, sheet: true },
};
const matrix = (q, text) => { const qr = q(0, 'M'); qr.addData(text); qr.make(); const n = qr.getModuleCount(), m = []; for (let r = 0; r < n; r++) { m.push([]); for (let c = 0; c < n; c++) m[r].push(qr.isDark(r, c)); } return m; };
export const svg = (q, text) => { const m = matrix(q, text), n = m.length; let p = ''; m.forEach((row, r) => row.forEach((d, c) => { if (d) p += `M${c} ${r}h1v1h-1z`; })); return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${n + 4} ${n + 4}" shape-rendering="crispEdges" style="width:100%;height:100%;display:block"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${p}" fill="#000"/></svg>`; };
export const svgUrl = (q, text) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg(q, text));
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// a = { id, name, type, path, status }
const labelHtml = (q, a, F) => { const lines = [[a.name, 600, 1.15], [a.id, 500, 1, 'IBM Plex Mono'], [a.type, 400, 0.9], [a.path, 400, 0.85], [a.status, 600, 0.85]].slice(0, F.lines);
  return `<div style="width:${F.w}mm;height:${F.h}mm;box-sizing:border-box;padding:2mm;display:flex;gap:2mm;align-items:center;border:${F.sheet ? '0' : '0.2mm dashed #bbb'};overflow:hidden;font-family:'IBM Plex Sans',Arial,sans-serif;color:#000;page-break-inside:avoid"><div style="flex:none;width:${F.qr}mm;height:${F.qr}mm">${svg(q, assetUrl(a.id))}</div><div style="min-width:0;display:flex;flex-direction:column;gap:0.6mm">${lines.map(([t, w, s, f]) => `<div style="font-weight:${w};font-size:${(F.h / 9.5 * s).toFixed(2)}mm;line-height:1.15;${f ? `font-family:'${f}',monospace;` : ''}white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t)}</div>`).join('')}<div style="font-size:${(F.h / 14).toFixed(2)}mm;color:#444">Scan to open in Relix</div></div></div>`; };
export const printLabels = async (assets, fmt = '70x35', copies = 1) => {
  const q = await load(), F = FORMATS[fmt] || FORMATS['70x35'], items = assets.flatMap(a => Array.from({ length: Math.max(1, copies) }, () => a));
  const body = F.sheet ? `<div style="display:grid;grid-template-columns:repeat(3,70mm);grid-auto-rows:37mm;width:210mm;padding:0;margin:0 auto">${items.map(a => labelHtml(q, a, F)).join('')}</div>` : `<div style="display:flex;flex-wrap:wrap;gap:3mm">${items.map(a => labelHtml(q, a, F)).join('')}</div>`;
  const w = window.open('', '_blank'); if (!w) return false;
  w.document.write(`<!doctype html><html><head><title>Relix QR labels</title><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;600&display=swap" rel="stylesheet"><style>@page{size:${F.sheet ? 'A4' : 'auto'};margin:${F.sheet ? '10mm 0' : '6mm'}}body{margin:0}</style></head><body>${body}<script>setTimeout(function(){window.print()},600)<\/script></body></html>`); w.document.close(); return true;
};
// PNG label: QR + identity, rendered on a canvas and downloaded.
export const downloadPng = async a => {
  const q = await load(), m = matrix(q, assetUrl(a.id)), n = m.length, cell = 10, qs = (n + 4) * cell, W = qs + 520, H = Math.max(qs, 330);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.fillStyle = '#000';
  const oy = (H - qs) / 2; m.forEach((row, r) => row.forEach((d, c) => { if (d) g.fillRect((c + 2) * cell, oy + (r + 2) * cell, cell, cell); }));
  const x = qs + 16; let y = 70; const line = (t, f, col = '#000', dy = 44) => { g.font = f; g.fillStyle = col; g.fillText(String(t || ''), x, y, W - x - 20); y += dy; };
  line(a.name, '600 36px "IBM Plex Sans", Arial'); line(a.id, '500 28px "IBM Plex Mono", monospace', '#333'); line(a.type, '400 24px "IBM Plex Sans", Arial', '#333', 38); line(a.path, '400 22px "IBM Plex Sans", Arial', '#555', 38); line(a.status, '600 22px "IBM Plex Sans", Arial', '#0B6B4A', 38); line('Scan to open in Relix', '400 18px "IBM Plex Sans", Arial', '#777');
  const link = document.createElement('a'); link.download = `QR-${a.id}.png`; link.href = cv.toDataURL('image/png'); document.body.appendChild(link); link.click(); link.remove(); return true;
};
if (typeof window !== 'undefined') window.RelixQR = { load, assetUrl, FORMATS, svg, svgUrl, printLabels, downloadPng };
