-- Create obligation_notifications table
create table if not exists public.obligation_notifications (
  id uuid primary key default gen_random_uuid(),
  obligation_id uuid not null references public.obligations(id) on delete cascade,
  user_email text not null,
  user_name text not null,
  custom_message text,
  days_before integer not null default 7,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

-- Add index for faster queries
create index if not exists idx_obligation_notifications_obligation_id 
  on public.obligation_notifications(obligation_id);

create index if not exists idx_obligation_notifications_active 
  on public.obligation_notifications(is_active) where is_active = true;

-- Enable RLS
alter table public.obligation_notifications enable row level security;

-- RLS Policies
-- Admins can do everything
create policy "Admins can view all notifications"
  on public.obligation_notifications
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Admins can insert notifications"
  on public.obligation_notifications
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Admins can update notifications"
  on public.obligation_notifications
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Admins can delete notifications"
  on public.obligation_notifications
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

-- Responsables can view notifications for their obligations
create policy "Responsables can view their obligation notifications"
  on public.obligation_notifications
  for select
  to authenticated
  using (
    exists (
      select 1 from public.obligations
      where id = obligation_notifications.obligation_id
      and responsible_id = auth.uid()
    )
  );

-- Add constraint to limit max 3 notifications per obligation
create or replace function check_notification_limit()
returns trigger as $$
begin
  if (
    select count(*)
    from public.obligation_notifications
    where obligation_id = NEW.obligation_id
    and is_active = true
  ) >= 3 then
    raise exception 'Maximum 3 notification users per obligation';
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger enforce_notification_limit
  before insert on public.obligation_notifications
  for each row
  execute function check_notification_limit();
