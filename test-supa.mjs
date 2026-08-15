import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://xyz.supabase.co', 'xyz');
try {
  const { data, error } = await supabase.from('test').insert([]).select();
  console.log('Result:', { data, error });
} catch (e) {
  console.error('Caught error:', e);
}
