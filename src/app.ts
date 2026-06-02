import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import { errorHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';

const app = express();

// Secure Express apps by setting various HTTP headers
app.use(helmet());

// CORS Whitelist Configuration
const whitelist = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:5000'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman, etc.)
      if (!origin || whitelist.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true, // Allow transmitting HTTP cookies
  })
);

app.use(express.json());
app.use(cookieParser());

// General API rate limiting
app.use('/api/', apiRateLimiter);

// Mount authentication sub-router
app.use('/api/auth', authRoutes);

// Server status endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'active', time: new Date().toISOString() });
});

// Centralized error handling
app.use(errorHandler);

export default app;
