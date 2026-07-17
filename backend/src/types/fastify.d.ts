import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { AppEnv } from "../env.js";

declare module "fastify" {
  interface FastifyInstance {
    env: AppEnv;
    supabaseAdmin: SupabaseClient | null;
    createUserSupabase: (accessToken: string) => SupabaseClient;
  }
  interface FastifyRequest {
    authUser: User | null;
    accessToken: string | null;
  }
}
export {};
