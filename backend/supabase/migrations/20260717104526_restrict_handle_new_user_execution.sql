-- This trigger function must only be invoked by Supabase Auth when a user is
-- created. Keeping EXECUTE away from API roles prevents direct RPC calls from
-- running with the function owner's elevated privileges.
revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;
