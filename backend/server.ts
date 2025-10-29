import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { signup } from './signup/route';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post('/api/auth/signup', signup);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});