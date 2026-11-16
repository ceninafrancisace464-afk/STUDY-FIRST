
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import 'expo-sqlite/localStorage/install';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

console.log('SUPABASE URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('SUPABASE URL:', supabaseUrl);
console.log(
  'SUPABASE KEY EXISTS:',
  Boolean(supabaseKey)
);

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
