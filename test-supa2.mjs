import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
if (!supabaseUrl) throw new Error("No URL");
const supabase = createClient(supabaseUrl, supabaseAnonKey);
try {
  const { data, error } = await supabase.from('test_table_fake').insert([]).select();
  console.log('Result:', { data, error });
} catch (e) {
  console.error('Caught error:', e);
}
