import { supabase } from "@/integrations/supabase/client";

export { supabase };

export type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    username?: string;
  };
};

export type AuthSession = {
  user: AuthUser;
  access_token: string;
};