import { createClient } from "@supabase/supabase-js";
import fp from "fastify-plugin";
import { AppError } from "../schemas/common.js";

export default fp(async (app) => {
  const configured = Boolean(app.env.SUPABASE_URL && app.env.SUPABASE_PUBLISHABLE_KEY);
  const serverKey = app.env.SUPABASE_SECRET_KEY || app.env.SUPABASE_SERVICE_ROLE_KEY || app.env.SUPABASE_SERVICE_KEY;
  const adminConfigured = configured && Boolean(serverKey);
  app.decorate("supabaseAdmin", adminConfigured ? createClient(app.env.SUPABASE_URL, serverKey, { auth: { persistSession: false, autoRefreshToken: false } }) : null);
  app.decorate("createUserSupabase", (accessToken: string) => {
    if (!configured) throw new AppError(503, "SUPABASE_UNAVAILABLE", "Supabase is not configured");
    return createClient(app.env.SUPABASE_URL, app.env.SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } }
    });
  });
});
