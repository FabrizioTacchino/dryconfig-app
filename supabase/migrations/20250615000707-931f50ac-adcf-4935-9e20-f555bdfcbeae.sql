
-- Inserisci/aggiorna Costo Orario base (30 €/h)
insert into public.configurator_settings (key, value)
values ('cost_per_hour', '30')
on conflict (key) do update set value=excluded.value;

-- Popola livelli di finitura standard Q1-Q4
insert into public.finish_level_settings (finish_level, time_multiplier, cost_multiplier, notes)
values
  ('Q1', 1.0, 1.0, 'Livello base rasatura'),
  ('Q2', 1.2, 1.1, 'Finitura intermedia'),
  ('Q3', 1.5, 1.25, 'Per locali abitativi impegnativi'),
  ('Q4', 2.0, 1.5, 'Per superfici di altissimo pregio')
on conflict (finish_level) do update set
  time_multiplier=excluded.time_multiplier,
  cost_multiplier=excluded.cost_multiplier,
  notes=excluded.notes;

-- Popola configurazioni base viti
insert into public.screw_configurations
  (plates_count, screw_length, screw_code, compatible_board_types, margin, notes)
values
  (1, 25, 'TN25', array['cartongesso', 'gesso'], 10, 'Mono lastra'),
  (2, 35, 'TN35', array['cartongesso', 'gesso'], 10, 'Doppia lastra base'),
  (3, 45, 'TN45', array['cartongesso', 'gesso'], 7, 'Tripla lastra'),
  (1, 25, 'TB25', array['fibrocemento', 'silicato'], 10, 'Lastra speciale TB'),
  (2, 35, 'TB35', array['fibrocemento', 'silicato'], 10, 'Doppia lastra speciale TB'),
  (4, 50, 'TN50', array['cartongesso', 'gesso'], 10, '4 lastre e oltre')
on conflict (screw_code, plates_count) do update set
  screw_length=excluded.screw_length,
  compatible_board_types=excluded.compatible_board_types,
  margin=excluded.margin,
  notes=excluded.notes;

-- Popola regole accessori automatiche di base
insert into public.accessory_calculation_rules (accessory_type, by_meter, ratio, description)
values
  ('angolare', true, 0.15, '15 cm per mq'),
  ('nastro_carta', true, 1.2, '1,2 metri lineari per mq (+20% margine)'),
  ('stucco', false, 0.5, '0,5 kg per mq'),
  ('viti', false, 25, '25 viti per mq (standard)')
on conflict (accessory_type) do update set
  by_meter=excluded.by_meter,
  ratio=excluded.ratio,
  description=excluded.description;
