import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import stripMongoId from './middleware/stripMongoId.middleware.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import timelogsRouter from './routes/timelogsRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import priceItemRoutes from './routes/priceItemRoutes.js';
import feedbackRouter from './routes/feedback.routes.js';
import profileRoutes from './routes/profile.routes.js';
import path from 'path';
import accountSettingsRoutes from './routes/accountSettings.routes.js';
import taskRoutes from './routes/taskRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import extendedRoutes from './routes/extendedRoutes.js';
import technicianLookupsRouter from './routes/technicianLookups.js';

connectDB();

const app = express();
app.use(stripMongoId);

// app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
import cors from "cors";

const allowedOrigins = [
  "http://localhost:5173",
  "https://cooltech-jexz.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // mobile apps / postman
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.json({ message: '❄️ CoolTech AC Backend API v1.0' }));

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/timelogs', timelogsRouter);
app.use('/api/chat', chatRoutes);
app.use('/api/pricelist', priceItemRoutes);
app.use('/api/services', priceItemRoutes);
app.use('/api/feedback', feedbackRouter);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', accountSettingsRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/technician-lookups', technicianLookupsRouter);

// ── Extended / Missing Modules ────────────────────────────────────────────────
app.use('/api', extendedRoutes);

// Serve public folder (avatars accessible at /uploads/avatars/filename.jpg)
app.use(express.static(path.join(process.cwd(), 'public')));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));