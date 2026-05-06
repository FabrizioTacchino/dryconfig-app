-- Enable RLS on configurator_settings table
ALTER TABLE public.configurator_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read configurator settings
CREATE POLICY "Anyone can view configurator settings" 
ON public.configurator_settings 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow only admins and super users to insert configurator settings
CREATE POLICY "Admins can insert configurator settings" 
ON public.configurator_settings 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_user')
  )
);

-- Allow only admins and super users to update configurator settings
CREATE POLICY "Admins can update configurator settings" 
ON public.configurator_settings 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_user')
  )
);

-- Allow only admins and super users to delete configurator settings
CREATE POLICY "Admins can delete configurator settings" 
ON public.configurator_settings 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_user')
  )
);