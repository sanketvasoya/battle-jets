export const corsConfig = {
  origin: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((s) => s.trim()),
  credentials: true,
};
