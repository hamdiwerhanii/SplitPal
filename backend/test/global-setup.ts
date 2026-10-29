import { ChildProcess, spawn } from 'child_process';
import { createWriteStream, existsSync } from 'fs';
import { join } from 'path';

declare global {
  var __SPLITPAL_SERVER__: ChildProcess | undefined;
}

const ROOT = join(__dirname, '..');
const PORT = process.env.E2E_PORT ?? '5099';

const waitForHealth = async (url: string, timeoutMs: number) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  throw new Error(`API did not become healthy at ${url}`);
};

export default async function globalSetup() {
  if (!existsSync(join(ROOT, 'dist', 'main.js'))) {
    throw new Error('Run "pnpm build" before the e2e tests');
  }

  const mongoUrl = (
    process.env.E2E_MONGODB_URL ?? 'mongodb://127.0.0.1:27017'
  ).replace(/\/+$/, '');
  const database = `splitpal-e2e-${Date.now()}`;
  const logFile = join(ROOT, 'test', '.e2e-server.log');

  const server = spawn(process.execPath, ['dist/main.js'], {
    cwd: ROOT,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      NO_COLOR: '1',
      PORT,
      MONGODB_URI: `${mongoUrl}/${database}`,
      JWT_ACCESS_SECRET: 'e2e-access-secret-that-is-long-enough-123',
      OTP_SECRET: 'e2e-otp-secret-that-is-long-enough-1234567',
      OTP_RESEND_COOLDOWN_SECONDS: '60',
      MAIL_HOST: '',
      PUSH_ENABLED: 'false',
      INVITE_URL_BASE: 'splitpal://join',
    },
  });
  const log = createWriteStream(logFile);
  server.stdout?.pipe(log);
  server.stderr?.pipe(log);
  globalThis.__SPLITPAL_SERVER__ = server;

  process.env.E2E_BASE_URL = `http://127.0.0.1:${PORT}`;
  process.env.E2E_LOG_FILE = logFile;
  process.env.E2E_DATABASE_URI = `${mongoUrl}/${database}`;

  await waitForHealth(`${process.env.E2E_BASE_URL}/api/health`, 30_000);
}
