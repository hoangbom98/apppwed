// deploy-vps.mjs — SSH deploy to VPS
// Usage: node deploy-vps.mjs
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { Client } = require('ssh2');

const HOST     = '104.248.146.203';
const USER     = 'root';
const PASSWORD = '@Thuthuthu1u';
const DEPLOY_DIR = '/var/LKVIP';
// Set GIT_TOKEN env var before running: $env:GIT_TOKEN="your_pat"
const REPO_URL = `https://hoangbom98:${process.env.GIT_TOKEN}@github.com/hoangbom98/apppwed.git`;

// Commands to run on VPS
const COMMANDS = [
  // 1. Ensure deploy dir exists
  `mkdir -p ${DEPLOY_DIR}`,

  // 2. Check if repo already cloned; if yes pull, else clone
  `cd ${DEPLOY_DIR} && if [ -d ".git" ]; then
    echo "==> Pulling latest from main..." &&
    git fetch origin &&
    git reset --hard origin/main &&
    echo "==> Pull complete"
  else
    echo "==> Cloning repo..." &&
    git clone --depth 1 ${REPO_URL} . &&
    echo "==> Clone complete"
  fi`,

  // 3. Show what was deployed
  `cd ${DEPLOY_DIR} && echo "==> Deployed commit:" && git log --oneline -3`,

  // 4. Check Node / pnpm versions
  `node --version 2>/dev/null || echo "Node not installed"`,
  `pnpm --version 2>/dev/null || npm --version 2>/dev/null || echo "No package manager"`,

  // 5. Show directory structure
  `ls ${DEPLOY_DIR}/source/code/ 2>/dev/null || echo "(source/code not present)"`,
];

function runCommand(stream, cmd) {
  return new Promise((resolve, reject) => {
    let output = '';
    stream.write(cmd + '\n');
    // We just collect for the interactive shell session
    resolve();
  });
}

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ SSH connected to', HOST);

  conn.shell((err, stream) => {
    if (err) { console.error('Shell error:', err); conn.end(); return; }

    let buffer = '';

    stream.on('data', (data) => {
      const chunk = data.toString();
      process.stdout.write(chunk);
      buffer += chunk;
    });

    stream.stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });

    stream.on('close', () => {
      console.log('\n✅ Deploy session complete.');
      conn.end();
    });

    // Send all commands sequentially then exit
    const allCmds = COMMANDS.join(' && \\\n') + '\n';
    const script = `
set -e
${COMMANDS.join('\n')}
echo ""
echo "=========================================="
echo "✅ DEPLOY COMPLETE — $(date)"
echo "=========================================="
exit
`;
    stream.write(script);
  });
})
.on('error', (err) => {
  console.error('❌ SSH connection error:', err.message);
  process.exit(1);
})
.connect({
  host:     HOST,
  port:     22,
  username: USER,
  password: PASSWORD,
  readyTimeout: 20000,
  hostVerifier: () => true,  // accept any host key
});
