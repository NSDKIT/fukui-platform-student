import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../config/supabase';
import { User, Survey, ClientRegistrationCode } from '../types';
import { Advertisement } from '../types';
import { Shield, Users, FileText, TrendingUp, Calendar, Mail, Building, Plus, Key, Trash2, X, CreditCard, Clock, Upload } from 'lucide-react';
import { SparklesCore } from './ui/sparkles';
import { motion } from 'framer-motion';

export const AdminDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [registrationCodes, setRegistrationCodes] = useState<ClientRegistrationCode[]>([]);
  const [pointExchangeRequests, setPointExchangeRequests] = useState<Record<string, unknown>[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'users' | 'surveys' | 'codes' | 'exchanges' | 'ads' | 'analytics'>('users');
  const [showCreateCodeModal, setShowCreateCodeModal] = useState(false);
  const [showCreateAdModal, setShowCreateAdModal] = useState(false);
  const [exchangeStatusFilter, setExchangeStatusFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    display_order: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('画像ファイルを選択してください。');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('ファイルサイズは5MB以下にしてください。');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `advertisements/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (error) {
        console.error('Upload error:', error);
        setUploadError('アップロードに失敗しました。');
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      // Update form data
      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('アップロードに失敗しました。');
    } finally {
      setUploading(false);
    }
  };

  const fetchData = async () => {
    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          *,
          monitor_profiles(*),
          client_profiles(*)
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      const usersWithProfiles = usersData.map(user => ({
        ...user,
        profile: user.monitor_profiles?.[0] || user.client_profiles?.[0] || null
      }));

      setUsers(usersWithProfiles);

      // Fetch surveys
      const { data: surveysData, error: surveysError } = await supabase
        .from('surveys')
        .select(`
          *,
          client:users!surveys_client_id_fkey(name, email),
          responses_count:responses(count)
        `)
        .order('created_at', { ascending: false });

      if (surveysError) throw surveysError;

      const surveysWithCounts = surveysData.map(survey => ({
        ...survey,
        responses_count: survey.responses_count?.[0]?.count || 0
      }));

      setSurveys(surveysWithCounts);

      // Fetch registration codes
      const { data: codesData, error: codesError } = await supabase
        .from('client_registration_codes')
        .select(`
          *,
          used_by_user:users!client_registration_codes_used_by_fkey(name, email),
          created_by_user:users!client_registration_codes_created_by_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (codesError) throw codesError;
      setRegistrationCodes(codesData || []);

      // Fetch point exchange requests
      const { data: exchangeData, error: exchangeError } = await supabase
        .from('point_exchange_requests')
        .select(`
          *,
          monitor:users!point_exchange_requests_monitor_id_fkey(name, email)
        `)
        .order('created_at', { ascending: false });

      if (exchangeError) throw exchangeError;
      setPointExchangeRequests(exchangeData || []);

      // Fetch advertisements
      const { data: adsData, error: adsError } = await supabase
        .from('advertisements')
        .select(`
          *,
          creator:users!advertisements_created_by_fkey(name, email)
        `)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (adsError) throw adsError;
      setAdvertisements(adsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate') => {
    try {
      // This would update user status in the database
      console.log(`${action} user:`, userId);
      // For now, just refetch data
      fetchData();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleSurveyAction = async (surveyId: string, action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase
        .from('surveys')
        .update({ status: action === 'approve' ? 'active' : 'rejected' })
        .eq('id', surveyId);

      if (error) throw error;

      fetchData();
    } catch (error) {
      console.error('Error updating survey:', error);
    }
  };

  const handleUpdateExchangeStatus = async (requestId: string, status: 'completed' | 'rejected') => {
    try {
      // RPC関数を使用してポイント交換を処理
      const { data, error } = await supabase.rpc('process_point_exchange', {
        p_request_id: requestId,
        p_status: status
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'ポイント交換処理に失敗しました');
      }

      fetchData();
      alert(`ポイント交換を${status === 'completed' ? '完了' : '却下'}しました。`);
    } catch (error) {
      console.error('Error updating exchange status:', error);
      alert(`ステータスの更新に失敗しました: ${error.message}`);
    }
  };

  const handleCreateRegistrationCode = async (codeData: {code: string, company_name: string, industry: string}) => {
    try {
      const { error } = await supabase
        .from('client_registration_codes')
        .insert([{
          ...codeData,
          created_by: user?.id
        }]);

      if (error) throw error;

      setShowCreateCodeModal(false);
      fetchData();
    } catch (error) {
      console.error('Error creating registration code:', error);
      alert('登録番号の作成に失敗しました。');
    }
  };

  const handleDeleteRegistrationCode = async (codeId: string, code: string) => {
    if (!confirm(`登録番号「${code}」を削除してもよろしいですか？`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('client_registration_codes')
        .delete()
        .eq('id', codeId);

      if (error) throw error;

      fetchData();
    } catch (error) {
      console.error('Error deleting registration code:', error);
      alert('登録番号の削除に失敗しました。');
    }
  };

  const handleCreateAdvertisement = async (adData: {
    title: string;
    description: string;
    image_url: string;
    link_url: string;
    display_order: number;
  }) => {
    try {
      const { error } = await supabase
        .from('advertisements')
        .insert([{
          ...adData,
          created_by: user?.id
        }]);

      if (error) throw error;

      setShowCreateAdModal(false);
      fetchData();
    } catch (error) {
      console.error('Error creating advertisement:', error);
      alert('広告の作成に失敗しました。');
    }
  };

  const handleToggleAdStatus = async (adId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('advertisements')
        .update({ is_active: !isActive })
        .eq('id', adId);

      if (error) throw error;

      fetchData();
    } catch (error) {
      console.error('Error updating advertisement status:', error);
      alert('広告ステータスの更新に失敗しました。');
    }
  };

  const handleDeleteAdvertisement = async (adId: string, title: string) => {
    if (!confirm(`広告「${title}」を削除してもよろしいですか？`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', adId);

      if (error) throw error;

      fetchData();
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      alert('広告の削除に失敗しました。');
    }
  };

  const getExchangeTypeLabel = (type: string) => {
    switch (type) {
      case 'paypay': return 'PayPay';
      case 'amazon': return 'Amazonギフトカード';
      case 'starbucks': return 'スターバックスギフトカード';
      default: return type;
    }
  };

  const filteredExchangeRequests = pointExchangeRequests.filter(request => {
    if (exchangeStatusFilter === 'all') return true;
    return request.status === exchangeStatusFilter;
  });

  const stats = {
    totalUsers: users.length,
    monitors: users.filter(u => u.role === 'monitor').length,
    clients: users.filter(u => u.role === 'client').length,
    totalSurveys: surveys.length,
    activeSurveys: surveys.filter(s => s.status === 'active').length,
    totalResponses: surveys.reduce((sum, survey) => sum + survey.responses_count, 0),
    totalCodes: registrationCodes.length,
    usedCodes: registrationCodes.filter(c => c.is_used).length,
    totalExchangeRequests: pointExchangeRequests.length,
    pendingExchangeRequests: pointExchangeRequests.filter(r => r.status === 'pending').length,
    totalAds: advertisements.length,
    activeAds: advertisements.filter(ad => ad.is_active).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Sparkles Background */}
      <div className="w-full absolute inset-0 h-screen">
        <SparklesCore
          id="tsparticlesadmin"
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

      {/* Header */}
      <header className="relative z-30 bg-white/80 backdrop-blur-sm border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-2 shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500">
                  管理者ダッシュボード
                </h1>
                <p className="text-sm text-gray-600">システム管理</p>
              </div>
            </motion.div>
            <button
              onClick={signOut}
              className="text-gray-600 hover:text-orange-600 px-3 py-1 rounded-lg hover:bg-orange-50 transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-100 p-4 shadow-xl">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-2 shadow-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">総ユーザー</p>
                <p className="text-lg font-bold text-orange-600">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-100 p-4 shadow-xl">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-2 shadow-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">モニター</p>
                <p className="text-lg font-bold text-orange-600">{stats.monitors}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-100 p-4 shadow-xl">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-2 shadow-lg">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">クライアント</p>
                <p className="text-lg font-bold text-orange-600">{stats.clients}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-100 p-4 shadow-xl">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-2 shadow-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">総アンケート</p>
                <p className="text-lg font-bold text-orange-600">{stats.totalSurveys}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-100 p-4 shadow-xl">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-2 shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">実行中</p>
                <p className="text-lg font-bold text-orange-600">{stats.activeSurveys}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-100 p-4 shadow-xl">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-2 shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">総回答数</p>
                <p className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500">{stats.totalResponses}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-100 shadow-xl mb-6"
        >
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setSelectedTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'users'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                ユーザー管理
              </button>
              <button
                onClick={() => setSelectedTab('surveys')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'surveys'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                アンケート管理
              </button>
              <button
                onClick={() => setSelectedTab('codes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'codes'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                登録番号管理
              </button>
              <button
                onClick={() => setSelectedTab('exchanges')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'exchanges'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                ポイント交換管理
              </button>
              <button
                onClick={() => setSelectedTab('ads')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'ads'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                広告管理
              </button>
              <button
                onClick={() => setSelectedTab('analytics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === 'analytics'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                分析
              </button>
            </nav>
          </div>

          <div className="p-6">
            {selectedTab === 'users' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">ユーザー一覧</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                          ユーザー
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                          役割
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                          登録日
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                          詳細
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                          アクション
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-orange-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                                  <span className="text-sm font-medium text-white">
                                    {user.name.charAt(0)}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-800">{user.name}</div>
                                <div className="text-sm text-gray-600">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === 'monitor' ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                              user.role === 'client' ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                              'bg-orange-100 text-orange-700 border border-orange-300'
                            }`}>
                              {user.role === 'monitor' ? 'モニター' :
                               user.role === 'client' ? 'クライアント' : '管理者'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(user.created_at).toLocaleDateString('ja-JP')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {user.role === 'monitor' && user.profile && (
                              <div>
                                <div>年齢: {user.profile.age}</div>
                                {user.profile.faculty && <div>学部: {user.profile.faculty}</div>}
                                {user.profile.department && <div>学科: {user.profile.department}</div>}
                                <div>ポイント: {user.profile.points}</div>
                              </div>
                            )}
                            {user.role === 'client' && user.profile && (
                              <div>
                                <div>会社: {user.profile.company_name}</div>
                                <div>業界: {user.profile.industry}</div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUserAction(user.id, 'suspend')}
                                className="text-red-600 hover:text-red-700 transition-colors"
                              >
                                停止
                              </button>
                              <button
                                onClick={() => handleUserAction(user.id, 'activate')}
                                className="text-green-600 hover:text-green-700 transition-colors"
                              >
                                有効化
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedTab === 'surveys' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">アンケート一覧</h3>
                <div className="space-y-4">
                  {surveys.map((survey) => (
                    <div key={survey.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{survey.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{survey.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Mail className="w-4 h-4 mr-1" />
                              {survey.client?.name}
                            </span>
                            <span className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {survey.responses_count} 回答
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(survey.created_at).toLocaleDateString('ja-JP')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            survey.status === 'active' ? 'bg-green-100 text-green-700 border border-green-300' :
                            survey.status === 'draft' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                            'bg-gray-100 text-gray-700 border border-gray-300'
                          }`}>
                            {survey.status === 'active' ? '実行中' : 
                             survey.status === 'draft' ? '下書き' : '完了'}
                          </span>
                          {survey.status === 'draft' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleSurveyAction(survey.id, 'approve')}
                                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-3 py-1 rounded text-sm transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                              >
                                承認
                              </button>
                              <button
                                onClick={() => handleSurveyAction(survey.id, 'reject')}
                                className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-3 py-1 rounded text-sm transition-all duration-300 transform hover:scale-105"
                              >
                                却下
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'codes' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">登録番号管理</h3>
                  <button
                    onClick={() => setShowCreateCodeModal(true)}
                    className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-4 h-4" />
                    <span>新規作成</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-2 shadow-lg">
                        <Key className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">総登録番号数</p>
                        <p className="text-lg font-bold text-orange-600">{stats.totalCodes}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-2 shadow-lg">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">使用済み</p>
                        <p className="text-lg font-bold text-orange-600">{stats.usedCodes}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                          登録番号
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                          会社名
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                          業界
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                          状態
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                          使用者
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                          作成日
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                          アクション
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {registrationCodes.map((code) => (
                        <tr key={code.id} className="hover:bg-orange-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono text-sm font-medium text-gray-800 bg-gray-100 px-2 py-1 rounded border">
                              {code.code}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                            {code.company_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {code.industry}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              code.is_used 
                                ? 'bg-orange-100 text-orange-700 border border-orange-300' 
                                : 'bg-orange-100 text-orange-700 border border-orange-300'
                            }`}>
                              {code.is_used ? '使用済み' : '未使用'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {code.used_by_user ? (
                              <div>
                                <div className="font-medium">{code.used_by_user.name}</div>
                                <div className="text-xs text-gray-500">{code.used_by_user.email}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(code.created_at).toLocaleDateString('ja-JP')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {!code.is_used && (
                              <button
                                onClick={() => handleDeleteRegistrationCode(code.id, code.code)}
                                className="text-red-600 hover:text-red-700 transition-colors flex items-center space-x-1"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>削除</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedTab === 'exchanges' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">ポイント交換管理</h3>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-600">フィルター:</label>
                    <select
                      value={exchangeStatusFilter}
                      onChange={(e) => setExchangeStatusFilter(e.target.value as any)}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">すべて</option>
                      <option value="pending">処理待ち</option>
                      <option value="completed">完了</option>
                      <option value="rejected">却下</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-2 shadow-lg">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">処理待ち</p>
                        <p className="text-lg font-bold text-orange-600">{stats.pendingExchangeRequests}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-2 shadow-lg">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">総交換依頼</p>
                        <p className="text-lg font-bold text-orange-600">{stats.totalExchangeRequests}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-2 shadow-lg">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">総交換ポイント</p>
                        <p className="text-lg font-bold text-orange-600">
                          {pointExchangeRequests
                            .filter(r => r.status === 'completed')
                            .reduce((sum, r) => sum + r.points_amount, 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                          モニター
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                          交換先
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                          ポイント/金額
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                          連絡先
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                          依頼日
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                          ステータス
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b border-gray-200">
                          アクション
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredExchangeRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-orange-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-800">{request.monitor?.name}</div>
                              <div className="text-sm text-gray-600">{request.monitor?.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-800">{getExchangeTypeLabel(request.exchange_type)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-800">{request.points_amount}pt</div>
                            <div className="text-sm text-gray-600">{request.points_amount}円相当</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-800 max-w-xs truncate" title={request.contact_info}>
                              {request.contact_info}
                            </div>
                            {request.notes && (
                              <div className="text-sm text-gray-600 max-w-xs truncate" title={request.notes}>
                                備考: {request.notes}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(request.created_at).toLocaleDateString('ja-JP')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              request.status === 'pending' ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                              request.status === 'completed' ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                              'bg-orange-100 text-orange-700 border border-orange-300'
                            }`}>
                              {request.status === 'pending' ? '処理待ち' :
                               request.status === 'completed' ? '完了' : '却下'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {request.status === 'pending' && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleUpdateExchangeStatus(request.id, 'completed')}
                                  className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-3 py-1 rounded text-sm transition-all duration-300 transform hover:scale-105"
                                >
                                  完了にする
                                </button>
                                <button
                                  onClick={() => handleUpdateExchangeStatus(request.id, 'rejected')}
                                  className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-3 py-1 rounded text-sm transition-all duration-300 transform hover:scale-105"
                                >
                                  却下する
                                </button>
                              </div>
                            )}
                            {request.status !== 'pending' && (
                              <span className="text-gray-400">
                                {request.processed_at && new Date(request.processed_at).toLocaleDateString('ja-JP')}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {filteredExchangeRequests.length === 0 && (
                    <div className="text-center py-8">
                      <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {exchangeStatusFilter === 'all' ? 'ポイント交換依頼がありません' : 
                         `${exchangeStatusFilter === 'pending' ? '処理待ち' : 
                           exchangeStatusFilter === 'completed' ? '完了' : '却下'}の依頼がありません`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedTab === 'ads' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">広告管理</h3>
                  <button
                    onClick={() => setShowCreateAdModal(true)}
                    className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-4 h-4" />
                    <span>新規作成</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-2 shadow-lg">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">総広告数</p>
                        <p className="text-lg font-bold text-orange-600">{stats.totalAds}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-2 shadow-lg">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">アクティブ</p>
                        <p className="text-lg font-bold text-orange-600">{stats.activeAds}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {advertisements.map((ad) => (
                    <div key={ad.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-md transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-gray-800">{ad.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              ad.is_active 
                                ? 'bg-green-100 text-green-700 border border-green-300' 
                                : 'bg-gray-100 text-gray-700 border border-gray-300'
                            }`}>
                              {ad.is_active ? 'アクティブ' : '非アクティブ'}
                            </span>
                          </div>
                          {ad.description && (
                            <p className="text-sm text-gray-600 mb-2">{ad.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>表示順: {ad.display_order}</span>
                            <span>作成: {new Date(ad.created_at).toLocaleDateString('ja-JP')}</span>
                            {ad.creator && (
                              <span>作成者: {ad.creator.name}</span>
                            )}
                          </div>
                          {ad.target_regions && ad.target_regions.length > 0 && (
                            <div className="mt-1">
                              <span className="text-xs text-orange-400">対象地域: </span>
                              <span className="text-xs text-neutral-400">
                                {ad.target_regions.join(', ')}
                              </span>
                            </div>
                          )}
                          {ad.priority > 0 && (
                            <div className="mt-1">
                              <span className="text-xs text-blue-400">優先度: {ad.priority}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {ad.image_url && (
                            <img 
                              src={ad.image_url} 
                              alt={ad.title}
                              className="w-16 h-16 object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={() => handleToggleAdStatus(ad.id, ad.is_active)}
                              className={`px-3 py-1 rounded text-sm transition-all duration-300 transform hover:scale-105 ${
                                ad.is_active
                                  ? 'bg-gray-500 hover:bg-gray-600 text-white'
                                  : 'bg-green-500 hover:bg-green-600 text-white'
                              }`}
                            >
                              {ad.is_active ? '非表示' : '表示'}
                            </button>
                            <button
                              onClick={() => handleDeleteAdvertisement(ad.id, ad.title)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-all duration-300 transform hover:scale-105"
                            >
                              削除
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {advertisements.length === 0 && (
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">広告がありません</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedTab === 'analytics' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800">システム分析</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">ユーザー登録推移</h4>
                    <p className="text-sm text-gray-600">過去30日間の新規登録数</p>
                    <div className="mt-4 h-32 bg-gray-50 rounded flex items-center justify-center border border-gray-200">
                      <p className="text-gray-500">チャート表示エリア</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">アンケート実行状況</h4>
                    <p className="text-sm text-gray-600">アンケートの状態別分布</p>
                    <div className="mt-4 h-32 bg-gray-50 rounded flex items-center justify-center border border-gray-200">
                      <p className="text-gray-500">チャート表示エリア</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-gray-50 to-transparent"></div>

      {/* Create Registration Code Modal */}
      {showCreateCodeModal && (
        <CreateRegistrationCodeModal
          onClose={() => setShowCreateCodeModal(false)}
          onSubmit={handleCreateRegistrationCode}
        />
      )}

      {/* Create Advertisement Modal */}
      {showCreateAdModal && (
        <CreateAdvertisementModal
          onClose={() => setShowCreateAdModal(false)}
          onSubmit={handleCreateAdvertisement}
        />
      )}
    </div>
  );
};

// Create Registration Code Modal Component
const CreateRegistrationCodeModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: {code: string, company_name: string, industry: string}) => void;
}> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    code: '',
    company_name: '',
    industry: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.company_name.trim() || !formData.industry.trim()) {
      alert('すべての項目を入力してください。');
      return;
    }
    onSubmit(formData);
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code: result }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">登録番号を作成</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              登録番号
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-neutral-400"
                placeholder="登録番号を入力"
                required
              />
              <button
                type="button"
                onClick={generateRandomCode}
                className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-3 py-2 rounded-lg text-sm transition-all duration-300 transform hover:scale-105"
              >
                自動生成
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              会社名
            </label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
              placeholder="会社名を入力"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              業界
            </label>
            <input
              type="text"
              value={formData.industry}
              onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
              placeholder="業界を入力"
              required
            />
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-300 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              作成
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Create Advertisement Modal Component
const CreateAdvertisementModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: {title: string, description: string, image_url: string, link_url: string, display_order: number}) => void;
}> = ({ onClose, onSubmit }) => {
  const [imageUploadMethod, setImageUploadMethod] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    display_order: 0
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('画像ファイルを選択してください。');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('ファイルサイズは5MB以下にしてください。');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `advertisements/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (error) {
        console.error('Upload error:', error);
        setUploadError('アップロードに失敗しました。');
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      // Update form data
      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('アップロードに失敗しました。');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('タイトルを入力してください。');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">広告を作成</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              タイトル *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
              placeholder="広告タイトルを入力"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              説明
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
              rows={3}
              placeholder="広告の説明を入力"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              画像
            </label>
            
            {/* Tab Navigation */}
            <div className="flex mb-4 bg-white/5 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setImageUploadMethod('url')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  imageUploadMethod === 'url'
                    ? 'bg-orange-600 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                URL指定
              </button>
              <button
                type="button"
                onClick={() => setImageUploadMethod('upload')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  imageUploadMethod === 'upload'
                    ? 'bg-orange-600 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                ファイルアップロード
              </button>
            </div>

            {/* URL Input */}
            {imageUploadMethod === 'url' && (
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
                placeholder="https://example.com/image.jpg"
              />
            )}

            {/* File Upload */}
            {imageUploadMethod === 'upload' && (
              <div className="space-y-3">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/20 border-dashed rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-neutral-400" />
                      <p className="mb-2 text-sm text-neutral-400">
                        <span className="font-semibold">クリックしてファイルを選択</span>
                      </p>
                      <p className="text-xs text-neutral-500">PNG, JPG, GIF (最大5MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
                
                {uploading && (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500 mr-2"></div>
                    <span className="text-sm text-neutral-400">アップロード中...</span>
                  </div>
                )}
                
                {uploadError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{uploadError}</p>
                  </div>
                )}
              </div>
            )}

            {/* Image Preview */}
            {formData.image_url && (
              <div className="mt-3">
                <p className="text-sm text-neutral-400 mb-2">プレビュー:</p>
                <img
                  src={formData.image_url}
                  alt="広告画像プレビュー"
                  className="w-full max-w-xs h-32 object-cover rounded-lg border border-white/20"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              リンクURL
            </label>
            <input
              type="url"
              value={formData.link_url}
              onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              表示順序
            </label>
            <input
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData(prev => ({ ...prev, display_order: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
              placeholder="0"
              min="0"
            />
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-300 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              作成
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};