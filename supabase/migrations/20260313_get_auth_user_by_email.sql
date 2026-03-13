-- Function to look up a user in auth.users by email (bypasses listUsers pagination issues)
-- Only service_role can execute this function
CREATE OR REPLACE FUNCTION public.get_auth_user_by_email(user_email TEXT)
RETURNS TABLE(id UUID, email TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id, email::TEXT FROM auth.users WHERE LOWER(email) = LOWER(user_email) LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_auth_user_by_email(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_auth_user_by_email(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.get_auth_user_by_email(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_user_by_email(TEXT) TO service_role;
