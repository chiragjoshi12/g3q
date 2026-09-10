import cluster from 'node:cluster';
import os from 'node:os';
import 'dotenv/config';

const PORT = process.env.PORT || 4000;

/** Prefer WEB_CONCURRENCY (Azure), else CLUSTER_WORKERS, else min(4, CPU count). Set to 1 to disable. */
function workerCount() {
  const fromEnv = Number(process.env.WEB_CONCURRENCY || process.env.CLUSTER_WORKERS || 0);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return Math.floor(fromEnv);
  return Math.max(1, Math.min(4, os.cpus().length || 1));
}

async function ensureMasterAdminOnce() {
  const { adminAuthService } = await import('./src/services/adminAuth.service.js');
  try {
    await adminAuthService.ensureMasterAdmin();
  } catch (error) {
    console.warn('Could not ensure master admin (DB may be unavailable yet):', error.message);
  }
}

async function startWorker() {
  const { default: app } = await import('./src/app.js');
  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} listening on port ${PORT}`);
  });
}

async function start() {
  const workers = workerCount();

  if (cluster.isPrimary) {
    await ensureMasterAdminOnce();

    if (workers <= 1) {
      await startWorker();
      return;
    }

    console.log(`Primary ${process.pid} starting ${workers} workers`);
    for (let i = 0; i < workers; i += 1) {
      cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
      console.warn(
        `Worker ${worker.process.pid} exited (${signal || code}); restarting`,
      );
      cluster.fork();
    });
    return;
  }

  await startWorker();
}

start();
