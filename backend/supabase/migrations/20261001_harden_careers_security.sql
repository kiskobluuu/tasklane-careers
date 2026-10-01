-- Remove the one-time owner bootstrap now that the owner account exists.
drop trigger if exists bootstrap_tasklane_careers_owner on auth.users;
drop function if exists public.bootstrap_tasklane_careers_owner();

-- Trigger function must not be directly callable through the API.
revoke execute on function public.log_careers_status_change() from public;

-- is_careers_staff remains executable by authenticated because RLS policies call it.
revoke execute on function public.is_careers_staff() from anon;