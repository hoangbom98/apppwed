import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase URL or Secret Key is missing');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
