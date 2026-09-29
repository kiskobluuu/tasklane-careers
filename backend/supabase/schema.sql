create extension if not exists pgcrypto;

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  role_slug text not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  country text not null,
  timezone text not null,
  linkedin_url text,
  portfolio_url text,
  resume_path text,
  relevant_experience text not null,
  role_interest text not null,
  start_date date not null,
  weekly_availability text not null,
  availability_notes text,
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  consent_version text not null default '2026-09-v1'
);

alter table public.job_applications enable row level security;
revoke all on public.job_applications from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit)
values ('applicant-resumes','applicant-resumes',false,5242880)
on conflict (id) do update set public=false, file_size_limit=5242880;

-- No public storage policies are created intentionally.
-- Only the Edge Function service-role credential may upload/read files.
