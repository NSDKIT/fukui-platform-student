import React from 'react';
import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { isSupabaseConfigured } from './config/supabase';
import { AuthForm } from './components/AuthForm';
import { WelcomeScreen } from './components/WelcomeScreen';
import MonitorDashboard from './components/MonitorDashboard';
import { ClientDashboard } from './components/ClientDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import SupportDashboard from './components/SupportDashboard';
import { SparklesCore } from './components/ui/sparkles';
import { Database, AlertCircle } from 'lucide-react';

function App() {
  const { user, loading, error } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);

  // Supabaseが設定されていない場合の表示
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
        {/* Sparkles Background */}
        <div className="w-full absolute inset-0 h-screen">
          <SparklesCore
            id="tsparticlessetup"
            background="transparent"
            minSize={0.6}
            maxSize={1.4}
            particleDensity={60}
            className="w-full h-full"
            particleColor="#F97316"
            speed={0.5}
          />
        </div>

        {/* Subtle Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 via-white to-orange-50/30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-white/80"></div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-orange-100 relative z-20">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
            <Database className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500 mb-4">
            Supabaseの設定が必要です
          </h1>
          <p className="text-gray-600 mb-6">
            アプリケーションを使用するには、Supabaseプロジェクトを設定してください。
            <br /><br />
            環境変数が正しく設定されていない可能性があります。
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-orange-900 mb-2">設定手順:</h3>
            <ol className="text-sm text-orange-800 space-y-1">
              <li>1. .envファイルを確認してください</li>
              <li>2. VITE_SUPABASE_URLが正しく設定されているか確認</li>
              <li>3. VITE_SUPABASE_ANON_KEYが正しく設定されているか確認</li>
              <li>4. 開発サーバーを再起動してください</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // エラーがある場合の表示
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
        {/* Sparkles Background */}
        <div className="w-full absolute inset-0 h-screen">
          <SparklesCore
            id="tsparticleserror"
            background="transparent"
            minSize={0.6}
            maxSize={1.4}
            particleDensity={60}
            className="w-full h-full"
            particleColor="#3B82F6"
            speed={0.5}
          />
        </div>

        {/* Subtle Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-orange-50/30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-white/80"></div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-orange-100 relative z-20">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500 mb-4">
            接続エラー
          </h1>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
        {/* Sparkles Background */}
        <div className="w-full absolute inset-0 h-screen">
          <SparklesCore
            id="tsparticlesloading"
            background="transparent"
            minSize={0.6}
            maxSize={1.4}
            particleDensity={60}
            className="w-full h-full"
            particleColor="#3B82F6"
            speed={0.5}
          />
        </div>

        {/* Subtle Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-orange-50/30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-white/80"></div>

        <div className="text-center max-w-md relative z-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showWelcome) {
      return <WelcomeScreen onGetStarted={() => setShowWelcome(false)} />;
    }
    return <AuthForm onBack={() => setShowWelcome(true)} />;
  }

  // Route based on user role
  // Check if user is admin by email address
  console.log('Current user:', user?.email, 'Role:', user?.role);
  
  // Prevent rendering dashboard components until user is fully loaded
  if (user && !user.role) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">ユーザー情報を読み込み中...</p>
        </div>
      </div>
    );
  }
  
  // Route based on user role
  console.log('Routing user with role:', user.role, 'email:', user.email);
  switch (user.role) {
    case 'monitor':
      console.log('Rendering MonitorDashboard');
      return <MonitorDashboard />;
    case 'client':
      console.log('Rendering ClientDashboard');
      return <ClientDashboard />;
    case 'admin':
      console.log('Rendering AdminDashboard');
      return <AdminDashboard />;
    case 'support':
      console.log('Rendering SupportDashboard');
      return <SupportDashboard />;
    default:
      // Check if user is admin or support by email address as fallback
      if (user.email === 'admin@example.com') {
        console.log('Rendering AdminDashboard for admin email');
        return <AdminDashboard />;
      } else if (user.email === 'support@example.com') {
        console.log('Rendering SupportDashboard for support email');
        return <SupportDashboard />;
      }
      console.log('Unknown role, signing out user:', user.role, 'email:', user.email);
      // Sign out user with unknown role to prevent infinite loop
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">不明なユーザー役割です。再度ログインしてください。</p>
            <p className="text-sm text-gray-500 mb-4">Role: {user.role}, Email: {user.email}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg"
            >
              再読み込み
            </button>
          </div>
        </div>
      );
  }
}

export default App;