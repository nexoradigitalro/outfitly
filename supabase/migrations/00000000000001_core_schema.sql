-- Outfitly core schema (M0)
-- See docs/ARCHITECTURE.md §8 for the design rationale.
-- Only what M0-M2 need: profiles, consent, body photos, categories, closet
-- items, worn log, outfits. Packing/wishlist/shopping tables are added in
-- the migration that implements those milestones (docs/ROADMAP.md).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  gender text check (gender in ('male', 'female', 'nonbinary', 'unspecified')),
  height_cm numeric,
  weight_kg numeric,
  birth_date date,
  preferred_styles text[] not null default '{}',
  favorite_colors text[] not null default '{}',
  favorite_brands text[] not null default '{}',
  favorite_occasions text[] not null default '{}',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- Every new auth user (including anonymous/guest) gets a profile row
-- automatically, so the app never has to special-case "profile missing".
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------
-- consent_events — append-only GDPR consent audit trail (docs/ARCHITECTURE.md §10)
-- ---------------------------------------------------------------------
create table consent_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('terms_of_service', 'privacy_policy', 'body_photo_processing', 'marketing_email')),
  granted boolean not null,
  policy_version text not null,
  created_at timestamptz not null default now()
);
create index consent_events_profile_kind_idx on consent_events (profile_id, kind, created_at desc);

-- ---------------------------------------------------------------------
-- body_photos
-- ---------------------------------------------------------------------
create table body_photos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  storage_path text not null,
  pose text check (pose in ('front', 'side', 'back', 'full_body')),
  is_avatar_source boolean not null default false,
  created_at timestamptz not null default now()
);
create index body_photos_profile_idx on body_photos (profile_id);

-- ---------------------------------------------------------------------
-- categories — small reference table, seeded below, readable by everyone
-- ---------------------------------------------------------------------
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  parent_id uuid references categories(id),
  label text not null
);

insert into categories (slug, label) values
  ('tops', 'Tops'),
  ('bottoms', 'Bottoms'),
  ('outerwear', 'Outerwear'),
  ('shoes', 'Shoes'),
  ('accessories', 'Accessories'),
  ('bags', 'Bags');

-- ---------------------------------------------------------------------
-- closet_items
-- ---------------------------------------------------------------------
create table closet_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  category_id uuid references categories(id),
  subcategory text,
  brand text,
  name text,
  material text,
  pattern text,
  fit text,
  sleeve_length text,
  season text[] not null default '{}',
  occasion text[] not null default '{}',
  style text[] not null default '{}',
  primary_color_hex text,
  secondary_color_hex text,
  ai_confidence numeric check (ai_confidence is null or (ai_confidence >= 0 and ai_confidence <= 1)),
  ai_raw_response jsonb,
  processing_status text not null default 'processing' check (processing_status in ('processing', 'ready', 'needs_review')),
  image_original_path text not null,
  image_processed_path text,
  image_thumb_path text,
  is_favorite boolean not null default false,
  is_wishlist boolean not null default false,
  archived_at timestamptz,
  last_worn_at timestamptz,
  wear_count integer not null default 0,
  purchase_price numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index closet_items_profile_active_idx on closet_items (profile_id) where archived_at is null;
create index closet_items_season_idx on closet_items using gin (season);
create index closet_items_occasion_idx on closet_items using gin (occasion);

create trigger closet_items_set_updated_at
  before update on closet_items
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------
-- outfits
-- ---------------------------------------------------------------------
create table outfits (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text,
  occasion text,
  source text not null default 'ai_generated' check (source in ('ai_generated', 'user_created')),
  ai_reasoning text,
  cover_image_path text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);
create index outfits_profile_idx on outfits (profile_id);

create table outfit_items (
  outfit_id uuid not null references outfits(id) on delete cascade,
  closet_item_id uuid not null references closet_items(id) on delete cascade,
  primary key (outfit_id, closet_item_id)
);

-- ---------------------------------------------------------------------
-- worn_log
-- ---------------------------------------------------------------------
create table worn_log (
  id uuid primary key default gen_random_uuid(),
  closet_item_id uuid not null references closet_items(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  worn_on date not null,
  outfit_id uuid references outfits(id) on delete set null,
  created_at timestamptz not null default now()
);
create index worn_log_item_idx on worn_log (closet_item_id);

-- ---------------------------------------------------------------------
-- collections
-- ---------------------------------------------------------------------
create table collections (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table collection_items (
  collection_id uuid not null references collections(id) on delete cascade,
  closet_item_id uuid not null references closet_items(id) on delete cascade,
  primary key (collection_id, closet_item_id)
);

-- ---------------------------------------------------------------------
-- plans / subscriptions — minimal shape now, billing wired in M3
-- ---------------------------------------------------------------------
create table plans (
  id text primary key,
  closet_item_limit integer,
  ai_generation_monthly_limit integer,
  features jsonb not null default '{}'
);

insert into plans (id, closet_item_limit, ai_generation_monthly_limit, features) values
  ('free', 20, 5, '{}'),
  ('premium', null, null, '{"virtual_try_on": true, "packing_assistant": true, "daily_outfit": true, "advanced_analytics": true}');

create table subscriptions (
  profile_id uuid primary key references profiles(id) on delete cascade,
  plan_id text not null default 'free' references plans(id),
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'canceled')),
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create trigger subscriptions_set_updated_at
  before update on subscriptions
  for each row execute function set_updated_at();

-- Every new profile starts on the free plan automatically.
create or replace function handle_new_profile()
returns trigger as $$
begin
  insert into public.subscriptions (profile_id, plan_id) values (new.id, 'free');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_profile_created
  after insert on profiles
  for each row execute function handle_new_profile();

-- ---------------------------------------------------------------------
-- ai_generation_logs
-- ---------------------------------------------------------------------
create table ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('item_tagging', 'outfit_generation', 'virtual_try_on', 'search', 'shopping_check')),
  cost_estimate numeric,
  created_at timestamptz not null default now()
);
create index ai_generation_logs_profile_kind_idx on ai_generation_logs (profile_id, kind, created_at desc);
