import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Le chiavi sono lette da env (Vite). I valori di fallback hardcoded
// servono per non rompere il dev quando il .env è assente. La chiave anon
// è sicura nel bundle (è progettata per essere pubblica, protetta da RLS).
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? "https://aifeyamngllcezkoxzxu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZmV5YW1uZ2xsY2V6a294enh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MTY3MTEsImV4cCI6MjA3OTA5MjcxMX0.qHX9FBq4Yf-us_xuxsaPQ-d3YDbf0SW7WFS0rKtuWG4";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
