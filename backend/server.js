import 'dotenv/config';
import app from './src/app.js';
import { sequelize } from './src/models/index.js';

const PORT = process.env.PORT || 5000;
const secret = process.env.JWT_SECRET || '';

if (secret.length < 16 || /replace|change-this|your-secret/i.test(secret)) {
  console.error('JWT_SECRET must be set to a strong random value (at least 16 characters).');
  process.exit(1);
}

async function connectWithRetry(retries = Number(process.env.DB_CONNECT_RETRIES || 20), delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sequelize.authenticate();
      return;
    } catch (error) {
      if (attempt === retries) throw error;
      console.log(`Database not ready (attempt ${attempt}/${retries}). Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

(async () => {
  try {
    await connectWithRetry();
    app.listen(PORT, () => console.log(`API running on port ${PORT}`));
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
})();
