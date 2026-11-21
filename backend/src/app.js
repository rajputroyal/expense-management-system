import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import { sequelize } from './models/index.js';
import { isDevelopment } from './config/environment.js';

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map(origin => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.set('trust proxy', Number(process.env.TRUST_PROXY || 1));
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));
app.use('/api/v1/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 }));
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ success: true, message: 'Expense API is running', database: 'connected' });
  } catch (error) {
    const response = { success: false, message: 'Database connection failed', database: 'disconnected' };
    if (isDevelopment) response.error = error.message;
    res.status(503).json(response);
  }
});
app.use('/api/v1', routes);
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

export default app;
