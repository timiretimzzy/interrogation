import { readFileSync, writeFileSync } from 'node:fs';

const p = 'src/ui/App.tsx';
let s = readFileSync(p, 'utf8');

const footer = `const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? 'dev';\r\n\r\n// Subtle tester footer: a build identifier (so testers can report "bug on build\r\n// X") plus a no-backend feedback path via GitHub Issues. Kept off the core\r\n// gameplay surface so it does not read as a finished product.\r\nfunction SiteFooter() {\r\n  const issuesUrl =\r\n    'https://github.com/timiretimzzy/interrogation/issues/new?title=' +\r\n    encodeURIComponent('Test feedback') +\r\n    '&body=' +\r\n    encodeURIComponent('Build: ' + APP_VERSION + '\\r\\n\\r\\nWhat confused you?\\r\\n\\r\\nWhat felt good?\\r\\n\\r\\nWhere did you get stuck?\\r\\n');\r\n  return (\r\n    <footer class="site-footer">\r\n      <span class="test-badge">Test build</span>\r\n      <span class="build-id">{APP_VERSION}</span>\r\n      <a class="feedback-link" href={issuesUrl} target="_blank" rel="noopener noreferrer">\r\n        Report a problem / feedback\r\n      </a>\r\n    </footer>\r\n  );\r\n}\r\n\r\n`;

const a0 = "function CaseSelect() {\r\n  return (\r\n    <div class=\"case-select\">";
if (!s.includes(a0)) throw new Error('anchor A not found');
s = s.replace(a0, footer + a0);

const b0 = "      </ul>\r\n    </div>\r\n  );\r\n}\r\n\r\n// The case briefing";
if (!s.includes(b0)) throw new Error('anchor B not found');
s = s.replace(b0, "      </ul>\r\n      <SiteFooter />\r\n    </div>\r\n  );\r\n}\r\n\r\n// The case briefing");

const c0 = "        Actions left: <strong>{s.actionsRemaining}</strong>\r\n        {canAccuse() && <span> · Accusation available</span>}";
if (!s.includes(c0)) throw new Error('anchor C not found');
s = s.replace(c0, c0 + "\r\n        <span class=\"test-badge test-badge-inline\">Test build</span>");

writeFileSync(p, s);
console.log('patched App.tsx');
