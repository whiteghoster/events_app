export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRY || '7d',
};
