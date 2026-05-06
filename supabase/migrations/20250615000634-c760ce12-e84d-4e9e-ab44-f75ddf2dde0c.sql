
-- Imposta unica (screw_code, plates_count) su screw_configurations
ALTER TABLE public.screw_configurations
ADD CONSTRAINT screw_code_plates_count_unique UNIQUE(screw_code, plates_count);

-- Imposta unica su accessory_type in accessory_calculation_rules
ALTER TABLE public.accessory_calculation_rules
ADD CONSTRAINT accessory_type_unique UNIQUE(accessory_type);
