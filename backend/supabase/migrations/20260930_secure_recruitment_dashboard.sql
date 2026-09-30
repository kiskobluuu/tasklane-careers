-- Task Lane Recruitment Dashboard hardening
-- Applied to production on 2026-09-30.
-- Staff may change only review status; applicant-provided fields remain read-only.
revoke update on table public.applications from authenticated;
grant update (status) on table public.applications to authenticated;

-- Status changes are already logged by trg_log_careers_status_change, whose
-- function is SECURITY DEFINER. Remove the redundant audit trigger so one
-- staff update creates one history entry and does not depend on direct INSERT
-- permission to the history table.
drop trigger if exists applications_status_audit on public.applications;