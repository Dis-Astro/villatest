-- Create function to promote first user to admin (can be called once)
-- This allows the first registered user to become an admin

CREATE OR REPLACE FUNCTION public.promote_to_admin(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_admin_count INTEGER;
BEGIN
  -- Check if there are any existing admins
  SELECT COUNT(*) INTO existing_admin_count
  FROM public.user_roles
  WHERE role = 'admin';
  
  -- If no admins exist, allow promotion
  IF existing_admin_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN TRUE;
  END IF;
  
  -- If admins exist, only existing admins can promote others
  IF public.is_admin() THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.promote_to_admin TO authenticated;