import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolvePort(): number {
  const portArgIndex = process.argv.findIndex((arg) => arg === '--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = Number(process.argv[portArgIndex + 1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  const inlinePortArg = process.argv.find((arg) => arg.startsWith('--port='));
  if (inlinePortArg) {
    const parsed = Number(inlinePortArg.split('=')[1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  const envPort = process.env.PORT;
  const nginxPort = process.env.NGINX_PORT;
  // Never collide with the container nginx proxy port (e.g. PORT=8080 & NGINX_PORT=8080)
  if (envPort && envPort !== nginxPort) {
    const parsed = Number(envPort);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  const fallback = Number(process.env.DEFAULT_APP_PORT || 3000);
  return Number.isFinite(fallback) && fallback > 0 ? fallback : 3000;
}

const PORT = resolvePort();
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'MDMMS space' });
  });

  app.post('/api/auth/admin-login', (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    const envEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const envPassword = process.env.ADMIN_PASSWORD || '';

    if (!envEmail || !envPassword) {
      return res.status(503).json({
        error: 'ADMIN_EMAIL and ADMIN_PASSWORD are not configured in server environment variables.',
      });
    }

    if (email !== envEmail || password !== envPassword) {
      return res.status(401).json({ error: 'Invalid admin email or password.' });
    }

    return res.json({
      ok: true,
      admin: {
        uid: 'env_admin',
        email: envEmail,
        name: 'Class Instructor (Admin)',
        role: 'admin',
      },
    });
  });

  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const disableHmr = process.env.DISABLE_HMR === 'true';
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: !disableHmr,
        watch: disableHmr ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`MDMMS space listening on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    console.error('Server listen error:', err);
    process.exit(1);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
