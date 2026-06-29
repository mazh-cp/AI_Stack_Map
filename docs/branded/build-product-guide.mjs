// Stitches the two branded guides into one combined "Product Guide" HTML:
// shared styles + a product cover + auto table of contents + both guides.
import { readFileSync, writeFileSync } from "node:fs";

const admin = readFileSync(new URL("./admin-setup.html", import.meta.url), "utf8");
const usage = readFileSync(new URL("./usage-guide.html", import.meta.url), "utf8");

const style = admin.match(/<style>([\s\S]*?)<\/style>/)[1];
const logo = admin.match(/<svg[\s\S]*?<\/svg>/)[0];

// Content = inner HTML of <div class="wrap"> … </div> (before the footer).
const grab = (h) =>
  h.split('<div class="wrap">')[1].split('<div class="footer">')[0].replace(/<\/div>\s*$/, "");
const adminC = grab(admin);
const usageC = grab(usage);

const titles = (c) =>
  [...c.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) =>
    m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
  );

const extra = `
  .part { background:#ee0c5d; color:#fff; padding:10px 16px; font-size:17px; font-weight:bold; margin:0 0 16px; }
  .toc h2 { border:0; margin-top:0; }
  .toc-cols { display:grid; grid-template-columns:1fr 1fr; gap:6px 30px; font-size:11px; }
  .toc-part { color:#ee0c5d; font-weight:bold; text-transform:uppercase; letter-spacing:.5px; font-size:10px; margin:4px 0 2px; }
  .toc-cols ol { margin:0 0 6px; padding-left:18px; }
  .toc-cols li { margin-bottom:2px; color:#41273c; }
`;

const li = (arr) => arr.map((t) => `<li>${t}</li>`).join("");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Product Guide — AI Security Stack Mapper</title>
<style>${style}${extra}</style>
</head>
<body>
  <div class="cover">
    <div>
      ${logo}
      <div class="eyebrow">AI Security Stack Mapper</div>
      <h1>Product Guide</h1>
      <div class="sub">Admin Setup &amp; Usage — complete documentation</div>
    </div>
    <div class="ver"><span class="tag">v1.0.0</span><br />June 2026</div>
  </div>

  <div class="wrap">
    <div class="toc avoid">
      <h2>Contents</h2>
      <div class="toc-cols">
        <div>
          <div class="toc-part">Part I — Admin Setup</div>
          <ol>${li(titles(adminC))}</ol>
        </div>
        <div>
          <div class="toc-part">Part II — Usage Guide</div>
          <ol>${li(titles(usageC))}</ol>
        </div>
      </div>
    </div>

    <div class="page-break"></div>
    <div class="part">Part I &middot; Admin Setup Guide</div>
    ${adminC}

    <div class="page-break"></div>
    <div class="part">Part II &middot; Usage Guide</div>
    ${usageC}
  </div>

  <div class="footer">
    <span>Check Point Software Technologies — AI Security Stack Mapper</span>
    <span>Product Guide · v1.0.0 · Confidential</span>
  </div>
</body>
</html>`;

writeFileSync(new URL("./product-guide.html", import.meta.url), html);
console.log("built product-guide.html (" + html.length + " bytes)");
