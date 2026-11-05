// Test/tool source inspection only. Production pages load the files normally.
const fs = require('node:fs');
const path = require('node:path');

function readGamePage(file, { styles = true } = {}) {
  const directory = path.dirname(path.resolve(file));
  const localFile = url => {
    if (/^(?:[a-z]+:|\/|\.\.\/)/i.test(url)) return null;
    const target = path.resolve(directory, url.split(/[?#]/)[0]);
    if (!target.startsWith(directory + path.sep)) return null;
    return target;
  };
  let html = fs.readFileSync(file, 'utf8').replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi, (tag, attributes) => {
    const src = attributes.match(/\bsrc=["']([^"']+)["']/i);
    const target = src && localFile(src[1]);
    if (!target || /\btype=["']module["']/i.test(attributes)) return tag;
    // Keep the script tag and document order for existing VM test adapters.
    return '<script>' + fs.readFileSync(target, 'utf8') + '</script>';
  });
  if (styles) html = html.replace(/<link\b[^>]*>/gi, tag => {
    if (!/\brel=["']stylesheet["']/i.test(tag)) return tag;
    const href = tag.match(/\bhref=["']([^"']+)["']/i);
    const target = href && localFile(href[1]);
    return target ? '<style>' + fs.readFileSync(target, 'utf8') + '</style>' : tag;
  });
  return html;
}

function readSource(file, encoding) {
  return encoding === 'utf8' && path.extname(String(file)) === '.html'
    ? readGamePage(file) : fs.readFileSync(file, encoding);
}

module.exports = { readGamePage, readSource };
