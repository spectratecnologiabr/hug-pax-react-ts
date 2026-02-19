import fs from 'fs';
import path from 'path';

const src = path.resolve('node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
const dest = path.resolve('public/pdf.worker.min.js');

let content = fs.readFileSync(src, 'utf8');

// Remove o header "export" do ESM e torna global
content = content.replace(/export\s*\{[^}]*\};?/g, '');

fs.writeFileSync(dest, content);

console.log('✔ PDF Worker gerado em public/pdf.worker.min.js');