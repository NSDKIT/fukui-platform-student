import { createClient } from '@supabase/supabase-js';

// Next.js環境変数を使用（フォールバックとしてVite環境変数も対応）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || (typeof window !== 'undefined' && (window as Record<string, unknown>).process?.env?.VITE_SUPABASE_URL as string);
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (typeof window !== 'undefined' && (window as Record<string, unknown>).process?.env?.VITE_SUPABASE_ANON_KEY as string);

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
