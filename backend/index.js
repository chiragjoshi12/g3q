import 'dotenv/config';
import app from './src/app.js';
import { adminAuthService } from './src/services/adminAuth.service.js';

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await adminAuthService.ensureMasterAdmin();
  } catch (error) {
    console.warn('Could not ensure master admin (DB may be unavailable yet):', error.message);
  }

  app.listen(PORT, () => {
    console.log('Server is running on port ' + PORT);
  });
}

start();
