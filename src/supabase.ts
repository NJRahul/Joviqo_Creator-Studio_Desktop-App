import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://eljrowqdloxgxyognetm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsanJvd3FkbG94Z3h5b2duZXRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NTUyODIsImV4cCI6MjEwMjEzMTI4Mn0.6suazOt9a_MwAXEd1LE0Gjh6jZKm6r80DyRL0H2y6_s'
)
