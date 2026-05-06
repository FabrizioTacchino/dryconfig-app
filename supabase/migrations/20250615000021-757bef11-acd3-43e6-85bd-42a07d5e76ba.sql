
-- 1. Configurator Settings: impostazioni base (costo orario, altro in futuro)
create table if not exists public.configurator_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text not null,
  updated_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- 2. Screw configurations: parametri viti per posizione/numero lastre/margini sicurezza
create table if not exists public.screw_configurations (
  id uuid primary key default gen_random_uuid(),
  plates_count integer not null, -- numero lastre
  screw_length integer not null, -- lunghezza vite suggerita (mm)
  screw_code text not null, -- codice riferimento vite (es. TN25)
  compatible_board_types text[] not null, -- tipologie compatibili (es: ["gesso", "cemento", ...])
  margin integer not null default 10,
  notes text,
  updated_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- 3. Finish level settings: livelli di finitura (Q1-Q4) e relativi moltiplicatori costo/tempo
create table if not exists public.finish_level_settings (
  id uuid primary key default gen_random_uuid(),
  finish_level text not null check (finish_level in ('Q1','Q2','Q3','Q4')),
  time_multiplier numeric not null default 1,
  cost_multiplier numeric not null default 1,
  notes text,
  updated_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  unique(finish_level)
);

-- 4. Accessory Calculation Rules: percentuali o regole automatiche per calcolo accessori
create table if not exists public.accessory_calculation_rules (
  id uuid primary key default gen_random_uuid(),
  accessory_type text not null, -- esempio: "angle", "joint_tape", "stucco"
  by_meter boolean not null default false, -- true se la regola applica a metri lineari, false se per mq
  ratio numeric not null, -- es: 1.05 per 5% extra
  description text,
  updated_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  unique(accessory_type)
);

-- 5. Aggiornamento campo tempo posa nei materiali (solo se non già presente, qui per completezza)
alter table public.materials
  add column if not exists installation_time_per_sqm numeric null; -- tempo posa in minuti/mq

