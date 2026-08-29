// scripts/_enable_pages.mjs
// Enables GitHub Pages for this repo using the "GitHub Actions" deployment
// source (build_type=workflow) and reports the resulting configuration.
//
// `gh` is not assumed to be installed. Authentication is obtained from the
// Git Credential Manager (the same credential used for `git push`), so no
// separate token needs to be provisioned. The token is read in-process and is
// never written to disk or echoed.
import { execFileSync } from 'node:child_process';

const OWNER = 'timiretimzzy';
const REPO = 'interrogation';
const API = 'https://api.github.com';

function getToken() {
  const out = execFileSync('git', ['credential', 'fill'], {
    input: 'protocol=https\nhost=github.com\n',
    encoding: 'utf8',
  });
  let user, pass;
  for (const line of out.split('\n')) {
    if (line.startsWith('username=')) user = line.slice('username='.length);
    else if (line.startsWith('password=')) pass = line.slice('password='.length);
  }
  return pass || user;
}

const token = getToken();
if (!token) {
  console.error('No GitHub token available from git credential manager.');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'Content-Type': 'application/json',
};

async function main() {
  // Enable Pages with the GitHub Actions deployment source.
  let res = await fetch(`${API}/repos/${OWNER}/${REPO}/pages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ build_type: 'workflow' }),
  });
  if (res.status === 409) {
    console.log('Pages already enabled; switching source to GitHub Actions (workflow).');
    res = await fetch(`${API}/repos/${OWNER}/${REPO}/pages`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ build_type: 'workflow' }),
    });
    if (res.ok) {
      console.log('Pages source switched to GitHub Actions:', (await res.text()).slice(0, 200));
    } else {
      console.error(`Switch failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
      process.exit(1);
    }
  } else if (res.ok) {
    console.log('Pages enabled:', (await res.text()).slice(0, 200));
  } else {
    const body = await res.text();
    console.error(`Enable failed (${res.status}): ${body.slice(0, 300)}`);
    if (res.status !== 409) process.exit(1);
  }

  // Confirm the configured source.
  res = await fetch(`${API}/repos/${OWNER}/${REPO}/pages`, { headers });
  if (res.ok) {
    const cfg = await res.json();
    console.log(
      'Pages config:',
      JSON.stringify({ url: cfg.html_url, source: cfg.source, build_type: cfg.build_type }),
    );
  } else {
    console.error('Read config failed:', res.status, (await res.text()).slice(0, 200));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('Unexpected error:', e.message);
  process.exit(1);
});
