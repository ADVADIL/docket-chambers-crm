import { createClient } from "@supabase/supabase-js";

// These are the PUBLIC project URL and anon/publishable key — they are meant
// to ship in client-side bundles (that's what "publishable" means). They are
// not a secret and grant no access on their own. Every table's actual
// security boundary is Row Level Security (authenticated-only policies) plus
// the invite-only sign-up trigger on auth.users — not the secrecy of this key.
const supabaseUrl = "https://vvftywyudzjbvqnoaexg.supabase.co";
const supabaseAnonKey =
  "sb_publishable_GJjUk9iTxxhVBZj-Gq8Skw_95LqjR_R";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
