import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '[SoloFlow Supabase] SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están definidos. Configure estas variables en .env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
