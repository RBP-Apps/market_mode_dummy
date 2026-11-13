const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!['node_modules', '.git', 'dist'].includes(file)) {
        getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      if (/\.(jsx?|tsx?|html|json|mjs|cjs)$/.test(file) && !file.includes('audit_external') && !file.includes('package-lock')) {
        arrayOfFiles.push(fullPath);
      }
    }
  });
  return arrayOfFiles;
}

const files = getAllFiles('.');

const results = {
  envVars: [],
  fetchCalls: [],
  axiosCalls: [],
  externalUrls: [],
  emailjsUsages: [],
  whatsappUsages: [],
};

files.forEach(f => {
  const rel = path.relative('.', f);
  const content = fs.readFileSync(f, 'utf8');

  // env vars
  const envMatches = [...content.matchAll(/(import\.meta\.env|process\.env)\.([a-zA-Z0-9_]+)/g)];
  envMatches.forEach(m => {
    results.envVars.push({ file: rel, match: m[0] });
  });

  // fetch
  const fetchMatches = [...content.matchAll(/fetch\s*\(([^)]+)\)/g)];
  fetchMatches.forEach(m => {
    results.fetchCalls.push({ file: rel, arg: m[1].slice(0, 100) });
  });

  // axios
  if (content.includes('axios')) {
    results.axiosCalls.push(rel);
  }

  // external http urls (excluding standard schemas or xmlns)
  const urlMatches = [...content.matchAll(/https?:\/\/[a-zA-Z0-9_\-\.]+\.[a-zA-Z]{2,}[^\s'"`,;)]*/g)];
  urlMatches.forEach(m => {
    const url = m[0];
    if (!url.includes('w3.org') && !url.includes('facebook.com') && !url.includes('registry.npmjs.org') && !url.includes('pnpm.io')) {
      results.externalUrls.push({ file: rel, url });
    }
  });

  // emailjs
  if (content.includes('emailjs') || content.includes('@emailjs')) {
    results.emailjsUsages.push(rel);
  }

  // whatsapp
  if (content.includes('whatsapp') || content.includes('WhatsApp')) {
    results.whatsappUsages.push(rel);
  }
});

console.log('=== AUDIT OF EXTERNAL DEPENDENCIES ===\n');

console.log(`--- Environment Variable Usages (${results.envVars.length}) ---`);
const envSummary = {};
results.envVars.forEach(e => {
  envSummary[e.match] = (envSummary[e.match] || 0) + 1;
});
console.log(envSummary);

console.log(`\n--- Fetch Calls (${results.fetchCalls.length}) ---`);
results.fetchCalls.forEach(f => console.log(`  ${f.file}: fetch(${f.arg.trim()})`));

console.log(`\n--- Axios Usages (${results.axiosCalls.length}) ---`);
results.axiosCalls.forEach(f => console.log(`  ${f}`));

console.log(`\n--- External URLs (${results.externalUrls.length}) ---`);
const urlSet = new Set();
results.externalUrls.forEach(u => urlSet.add(`${u.url} (in ${u.file})`));
urlSet.forEach(u => console.log(`  ${u}`));

console.log(`\n--- EmailJS Usages (${results.emailjsUsages.length}) ---`);
results.emailjsUsages.forEach(f => console.log(`  ${f}`));

console.log(`\n--- WhatsApp Usages (${results.whatsappUsages.length}) ---`);
results.whatsappUsages.forEach(f => console.log(`  ${f}`));
