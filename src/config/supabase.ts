import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// デバッグ用のログ
console.log('Supabase Configuration:');
console.log('- URL:', supabaseUrl || 'NOT SET');
console.log('- Key exists:', !!supabaseKey);
console.log('- Is configured:', !!(supabaseUrl && supabaseKey));

// 環境変数の状態をチェック
export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseKey !== 'placeholder-key' &&
  supabaseUrl.includes('.supabase.co'));

// Supabaseが正しく設定されている場合のみクライアントを作成
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
}) : null;
