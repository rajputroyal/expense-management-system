
import 'dotenv/config';
import app from './src/app.js';
import { sequelize } from './src/models/index.js';

const PORT = process.env.PORT || 5000;

const secret = process.env.JWT_SECRET || '';

if (
  secret.length < 16 ||
  /replace|change-this|your-secret/i.test(secret)
) {
  console.error(
    'JWT_SECRET must be set to a strong random value (at least 16 characters).'
  );
  process.exit(1);
}

async function connectWithRetry(
  retries = Number(process.env.DB_CONNECT_RETRIES || 20),
  delayMs = 3000
) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sequelize.authenticate();

      console.log('[DB OK] Database connected successfully.');

      return;
    } catch (error) {
      if (attempt === retries) {
        console.error(
          `[DB ERROR] Database connection failed after ${retries} attempts: ${error.message}`
        );

        throw error;
      }

      console.log(
        `[DB RETRY] Attempt ${attempt}/${retries}. Retrying in ${delayMs}ms...`
      );

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

async function startServer() {
  try {
    // Step 1: Connect to database
    await connectWithRetry();

    // Step 2: Create missing database tables
    await sequelize.sync();

    console.log('[DB SYNC] Database tables synchronized successfully.');

    // Step 3: Start Express server
    app.listen(PORT, () => {
      console.log(`[SERVER OK] API running on port ${PORT}`);
    });

  } catch (error) {
    console.error('[SERVER ERROR] Unable to start server:', error.message);

    process.exit(1);
  }
}

startServer();
