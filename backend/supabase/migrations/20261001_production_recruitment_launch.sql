-- Production recruitment launch: private applicant resume storage.
alter table public.applications add column if not exists resume_path text;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('applicant-resumes','applicant-resumes',false,5242880,array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[])
on conflict (id) do update
set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create index if not exists applications_ip_created_idx
on public.applications (applicant_ip_hash,created_at desc)
where applicant_ip_hash is not null;

-- Intentionally no public storage.objects policy. Uploads use the server-side
-- application service and résumé downloads use short-lived signed URLs issued
-- only after staff authentication and careers_staff authorization.