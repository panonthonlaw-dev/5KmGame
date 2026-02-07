import { createClient } from '@supabase/supabase-js';

// Master อย่าลืมนำ URL และ Key จาก Supabase มาใส่ตรงนี้นะครับ
const supabaseUrl = 'https://zdlnycwbjzhwfoukuaik.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbG55Y3dianpod2ZvdWt1YWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTQ0NDMsImV4cCI6MjA4NTY5MDQ0M30.QNmi8X_RIyWZ4Qxevw_vLP3Y1Ub8cOT_TFQPlGXbVss';

export const supabase = createClient(supabaseUrl, supabaseKey);