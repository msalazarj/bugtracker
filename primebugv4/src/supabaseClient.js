import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://cbykzabsmxnnumhqnclu.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNieWt6YWJzbXhubnVtaHFuY2x1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyOTExODMsImV4cCI6MjA2Mzg2NzE4M30.-eZh8iSY-lRd1khVWt5ufWgPmJM3QKVGuNIyLNXRfQ8";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Las variables de entorno de Supabase no están definidas o son incorrectas.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
