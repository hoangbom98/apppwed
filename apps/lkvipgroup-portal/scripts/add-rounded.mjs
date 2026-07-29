import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'fs';
import { join, resolve } from 'path';

const dir = resolve('src');
const files = globSync('**/*.tsx', { cwd: dir }).map(f => join(dir, f));

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let original = content;

  const hasRounded = (s) => /\brounded(-\w+)?\b/.test(s);
  const isSideBorder = (s) => /\bborder-t\b|\bborder-b\b|\bborder-l\b|\bborder-r\b/.test(s);

  function addRoundedToClassName(cls, size = 'rounded-sm') {
    if (hasRounded(cls) || isSideBorder(cls)) return cls;
    return cls.trimEnd() + ' ' + size;
  }

  function processQuoted(match, before, cls, after) {
    return before + addRoundedToClassName(cls) + after;
  }

  // 1. Template literal classNames with border border-fortress-gold (e.g., WhatWeDo cards)
  content = content.replace(
    /(className=\{`)([^`]*border border-fortress-gold[^`]*?)(`\})/g,
    processQuoted
  );

  // 2. Cards / containers with full border in double-quoted strings
  content = content.replace(
    /(className=")([^"]*border border-(?:fortress-gold|white|green-500|dashed)[^"]*?)(?=")/g,
    (match, before, cls) => {
      if (hasRounded(cls) || isSideBorder(cls)) return match;
      return before + cls.trimEnd() + ' rounded-sm';
    }
  );

  // 3. Cards that also have hover:border-fortress-gold
  content = content.replace(
    /(className=")([^"]*border border-fortress-gold[^"]*hover:border-fortress-gold[^"]*?)(?=")/g,
    (match, before, cls) => {
      return before + addRoundedToClassName(cls);
    }
  );

  // 4. Form inputs, selects, textareas with border
  content = content.replace(
    /(<(?:input|select|textarea)[^>]*className=")([^"]*border border-fortress-gold\/20[^"]*?)(?=")/g,
    (match, before, cls) => {
      return before + addRoundedToClassName(cls, 'rounded');
    }
  );

  // 5. Filter/category buttons
  content = content.replace(
    /(className=")(inline-flex items-center gap-2 px-5 py-3 bg-fortress-navy border border-fortress-gold\/10 text-fortress-silver hover:border-fortress-gold\/30 hover:text-fortress-gold transition-all duration-300 text-sm)(?=")/g,
    (match, before, cls) => {
      return before + addRoundedToClassName(cls, 'rounded-md');
    }
  );

  // 6. File upload label with dashed border
  content = content.replace(
    /(<label[^>]*className=")([^"]*border border-dashed border-fortress-gold\/20[^"]*?)(?=")/g,
    (match, before, cls) => {
      return before + addRoundedToClassName(cls, 'rounded');
    }
  );

  // 7. Newsletter input
  content = content.replace(
    /(className=")(flex-1 px-5 py-3\.5 bg-fortress-navy border border-fortress-gold\/20[^"]*?)(?=")/g,
    (match, before, cls) => {
      return before + addRoundedToClassName(cls, 'rounded');
    }
  );

  // 8. Newsletter subscribe button
  content = content.replace(
    /(className=")(px-8 py-3\.5 bg-fortress-gold text-fortress-navy font-bold[^"]*?)(?=")/g,
    (match, before, cls) => {
      return before + addRoundedToClassName(cls);
    }
  );

  // 9. Map container
  content = content.replace(
    /(className=")(bg-gradient-to-br from-fortress-deep to-fortress-charcoal border border-fortress-gold\/10 overflow-hidden h-full min-h-\[500px\])(?=")/g,
    (match, before, cls) => {
      return before + addRoundedToClassName(cls);
    }
  );

  // 10. Generic buttons/CTAs with bg-gradient-to-r from-fortress-gold
  content = content.replace(
    /(className=")([^"]*bg-gradient-to-r from-fortress-gold to-fortress-champagne[^"]*?)(?=")/g,
    (match, before, cls) => {
      if (hasRounded(cls)) return match;
      return before + cls.trimEnd() + ' rounded-sm';
    }
  );

  // 11. Generic buttons with border-fortress-gold (no other border-[side])
  content = content.replace(
    /(<(?:a|button)[^>]*className=")([^"]*\b(?:border-fortress-gold|bg-fortress-gold|hover:bg-fortress-gold)[^"]*?)(?=")/g,
    (match, before, cls) => {
      if (hasRounded(cls) || isSideBorder(cls)) return match;
      return before + cls.trimEnd() + ' rounded-sm';
    }
  );

  // 12. Hero outline button
  content = content.replace(
    /(className=")(px-8 py-3 border border-white\/60 text-white text-base font-medium hover:bg-white\/10 transition-colors backdrop-blur-sm)(?=")/g,
    (match, before, cls) => {
      return before + addRoundedToClassName(cls);
    }
  );

  // 13. Contact info cards
  content = content.replace(
    /(className=")(flex items-center gap-4 p-5 bg-gradient-to-br from-fortress-deep to-fortress-charcoal border border-fortress-gold\/10 hover:border-fortress-gold\/30 transition-all duration-300)(?=")/g,
    (match, before, cls) => {
      return before + addRoundedToClassName(cls);
    }
  );

  // 14. WhatsApp button
  content = content.replace(
    /(className=")(inline-flex items-center gap-3 px-6 py-3 bg-green-500\/10 border border-green-500\/20 text-green-400 hover:bg-green-500\/20 hover:border-green-500\/30 transition-all duration-300 text-sm font-medium)(?=")/g,
    (match, before, cls) => {
      return before + addRoundedToClassName(cls);
    }
  );

  // 15. Navbar desktop contact button
  content = content.replace(
    /(className="hidden lg:inline-flex px-6 py-2\.5 bg-fortress-gold text-fortress-navy hover:bg-fortress-champagne text-sm font-bold tracking-wider transition-colors duration-300 whitespace-nowrap)"/g,
    '$1 rounded-sm"'
  );

  // 16. Navbar mobile contact button
  content = content.replace(
    /(className="block text-center px-6 py-3 bg-fortress-gold text-fortress-navy text-base font-bold tracking-wider)"/g,
    '$1 rounded-sm"'
  );

  // 17. Navbar mobile menu toggle
  content = content.replace(
    /(className="lg:hidden p-2 transition-colors text-fortress-silver hover:text-fortress-gold)"/g,
    '$1 rounded-sm"'
  );

  // 18. Philosophy cards (border border-fortress-gold/10)
  content = content.replace(
    /(className="text-center p-8 border border-fortress-gold\/10 bg-gradient-to-br from-fortress-deep to-fortress-charcoal hover:border-fortress-gold\/30 transition-all duration-300 h-full flex flex-col)"/g,
    '$1 rounded-sm"'
  );

  if (content !== original) {
    writeFileSync(file, content, 'utf-8');
    console.log('Updated:', file);
  }
}

console.log('Done.');
