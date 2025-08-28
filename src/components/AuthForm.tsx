import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured } from '../config/supabase';
import { supabase } from '../config/supabase';
import { LogIn, UserPlus, Mail, Lock, User, Building, MapPin, Calendar, Briefcase, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedBackground } from './AnimatedBackground';

const prefectures = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
];

const signInSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
});

const baseSignUpSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
  name: z.string().min(1, '名前を入力してください'),
  role: z.enum(['monitor', 'client']),
});

const monitorSignUpSchema = baseSignUpSchema.extend({
  age: z.number().min(18).max(100).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  occupation: z.string().optional(),
  location: z.string().optional(),
  faculty: z.string().optional(),
  department: z.string().optional(),
});

const clientSignUpSchema = baseSignUpSchema.extend({
  registration_code: z.string().min(1, '登録番号を入力してください'),
  company_name: z.string().min(1, '会社名を入力してください'),
  industry: z.string().min(1, '業界を入力してください'),
});

type SignInData = z.infer<typeof signInSchema>;
type MonitorSignUpData = z.infer<typeof monitorSignUpSchema>;
type ClientSignUpData = z.infer<typeof clientSignUpSchema>;
type SignUpData = MonitorSignUpData | ClientSignUpData;

interface AuthFormProps {
  onBack: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onBack }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'monitor' | 'client'>('monitor');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [verifiedCompanyInfo, setVerifiedCompanyInfo] = useState<{company_name: string, industry: string} | null>(null);
  const { signIn, signUp } = useAuth();

  const signInForm = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
  });

  const monitorForm = useForm<MonitorSignUpData>({
    resolver: zodResolver(monitorSignUpSchema),
    defaultValues: {
      role: 'monitor',
      occupation: '学生', // occupationのデフォルト値を設定
    },
  });

  const clientForm = useForm<ClientSignUpData>({
    resolver: zodResolver(clientSignUpSchema),
    defaultValues: {
      role: 'client',
    },
  });

  const signUpForm = selectedRole === 'monitor' ? monitorForm : clientForm;
  const currentForm = isSignUp ? signUpForm : signInForm;

  const handleSignIn = async (data: SignInData) => {
    if (!isSupabaseConfigured) {
      setError('Supabaseが設定されていません。右上の「Connect to Supabase」ボタンをクリックしてください。');
      return;
    }

    setLoading(true);
    setError(null);

    console.log('=== SIGN IN FORM SUBMIT ===');
    console.log('Email:', data.email);
    console.log('Password length:', data.password.length);

    const { error } = await signIn(data.email, data.password);
    console.log('Sign in result:', { error });
    
    if (error) {
      console.error('Sign in error in form:', error);
      if (error.message === 'Invalid login credentials') {
        setError('メールアドレスまたはパスワードが正しくありません。');
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      console.log('Sign in successful in form');
      // Don't set loading to false here - let auth state change handle it
    }
  };

  const verifyRegistrationCode = async (code: string) => {
    if (!code.trim()) return;
    
    setVerifyingCode(true);
    setError(null);
    
    console.log('=== 登録番号確認開始 ===');
    console.log('入力された登録番号:', `"${code.trim()}"`);
    
    try {
      if (!supabase) {
        setError('データベースに接続できません。');
        setCodeVerified(false);
        setVerifiedCompanyInfo(null);
        return;
      }

      console.log('データベースから全ての登録番号を取得中...');
      
      const { data: allCodes, error: fetchError } = await supabase
        .from('client_registration_codes')
        .select('*');
      
      if (fetchError) {
        console.error('データベースエラー:', fetchError);
        setError('データベースの読み込みに失敗しました。');
        setCodeVerified(false);
        setVerifiedCompanyInfo(null);
        return;
      }
      
      console.log('取得した全登録番号:', allCodes?.length || 0, '件');
      
      if (allCodes && allCodes.length > 0) {
        console.log('=== codeカラムの確認 ===');
        allCodes.forEach((item, index) => {
          console.log(`登録番号 ${index + 1}:`, {
            id: item.id,
            code: item.code,
            codeType: typeof item.code,
            codeLength: item.code?.length,
            company_name: item.company_name,
            is_used: item.is_used
          });
        });
      }
      
      if (!allCodes || allCodes.length === 0) {
        console.log('登録番号が1件も見つかりません');
        setError('登録番号データが存在しません。管理者にお問い合わせください。');
        setCodeVerified(false);
        setVerifiedCompanyInfo(null);
        return;
      }
      
      const inputCode = code.trim();
      console.log('検索対象:', `"${inputCode}"`);
      
      allCodes.forEach((item, index) => {
        console.log(`登録番号 ${index + 1}: "${item.code}" (使用済み: ${item.is_used})`);
      });
      
      const matchingCode = allCodes.find(item => item.code && item.code.trim() === inputCode);
      
      if (!matchingCode) {
        console.log('一致する登録番号が見つかりません');
        console.log('入力値の詳細分析:');
        console.log('- 長さ:', inputCode.length);
        console.log('- 文字コード:', inputCode.split('').map(c => c.charCodeAt(0)));
        
        // ▼▼▼▼▼ 変更箇所 ▼▼▼▼▼
        const dbCodesForDisplay = allCodes.map(item => `"${item.code}"`).join(', ');
        const detailedError = `登録番号データが見つかりませんでした。\n・ユーザーが入力した値: "${inputCode}"\n・DBから取得したリスト: [${dbCodesForDisplay}]\n管理者にお問い合わせください。`;
        setError(detailedError);
        // ▲▲▲▲▲ 変更箇所 ▲▲▲▲▲
        
        setCodeVerified(false);
        setVerifiedCompanyInfo(null);
        return;
      }
      
      console.log('一致する登録番号が見つかりました:', matchingCode);
      
      if (matchingCode.is_used) {
        console.log('登録番号は既に使用済みです');
        setError('この登録番号は既に使用されています。');
        setCodeVerified(false);
        setVerifiedCompanyInfo(null);
      } else {
        console.log('登録番号は有効で未使用です');
        setCodeVerified(true);
        setVerifiedCompanyInfo({
          company_name: matchingCode.company_name,
          industry: matchingCode.industry
        });
        
        clientForm.setValue('company_name', matchingCode.company_name);
        clientForm.setValue('industry', matchingCode.industry);
        
        console.log('登録番号確認成功');
        setError(null);
      }
    } catch (err) {
      console.error('登録番号確認エラー:', err);
      setError('登録番号の確認中にエラーが発生しました。');
      setCodeVerified(false);
      setVerifiedCompanyInfo(null);
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleSignUp = async (data: SignUpData) => {
    if (!isSupabaseConfigured) {
      setError('Supabaseが設定されていません。右上の「Connect to Supabase」ボタンをクリックしてください。');
      return;
    }

    if (!privacyConsent) {
      setError('プライバシーポリシーに同意してください。');
      return;
    }

    if (selectedRole === 'client' && !codeVerified) {
      setError('登録番号を確認してください。');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await signUp(data.email, data.password, data);
      if (error) {
        setError(error.message || 'アカウント作成に失敗しました。');
        setLoading(false);
      }
    } catch (err) {
      setError('予期しないエラーが発生しました。');
      setLoading(false);
    }
  };

  const handleRoleChange = (role: 'monitor' | 'client') => {
    setSelectedRole(role);
    setPrivacyConsent(false);
    setCodeVerified(false);
    setVerifiedCompanyInfo(null);
    monitorForm.reset({ role: 'monitor' });
    clientForm.reset({ role: 'client' });
  };

  return (
    <div className="min-h-screen relative w-full bg-white flex items-center justify-center overflow-hidden">
      <AnimatedBackground />

      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        onClick={onBack}
        className="absolute top-8 left-8 z-30 flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>戻る</span>
      </motion.button>

      {/* Content */}
      <div className="relative z-20 w-full max-w-md mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-100 p-8 shadow-xl"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg"
            >
              {isSignUp ? (
                <UserPlus className="w-8 h-8 text-white" />
              ) : (
                <LogIn className="w-8 h-8 text-white" />
              )}
            </motion.div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500 mb-2">
              {isSignUp ? 'アカウントを作成' : 'ログイン'}
            </h1>
            <p className="text-gray-600">
              アンケートツールへようこそ
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
            >
              {/* 改行を反映させるためにCSSの `white-space: pre-wrap` を適用 */}
              <p className="text-red-600 text-sm" style={{ whiteSpace: 'pre-wrap' }}>{error}</p>
            </motion.div>
          )}

          <form onSubmit={currentForm.handleSubmit(isSignUp ? handleSignUp : handleSignIn)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  {...currentForm.register('email')}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  placeholder="your@email.com"
                />
              </div>
              {currentForm.formState.errors.email && (
                <p className="text-red-500 text-sm mt-1">{currentForm.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  {...currentForm.register('password')}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  placeholder="パスワードを入力"
                />
              </div>
              {currentForm.formState.errors.password && (
                <p className="text-red-500 text-sm mt-1">{currentForm.formState.errors.password.message}</p>
              )}
            </div>

            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    お名前
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      {...signUpForm.register('name')}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                      placeholder="お名前を入力"
                    />
                  </div>
                  {signUpForm.formState.errors.name && (
                    <p className="text-red-500 text-sm mt-1">{signUpForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    登録タイプ
                  </label>
                  {/* 「モニター」の表示のみに修正 */}
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <span className="text-sm font-medium text-gray-800">モニター</span>
                    <div className="text-xs text-orange-600 font-medium mt-1">🎁 新規登録で100ポイント</div>
                  </div>
                </div>

                {selectedRole === 'monitor' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        年齢
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="number"
                          {...monitorForm.register('age', { valueAsNumber: true })}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                          placeholder="年齢を入力"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        性別
                      </label>
                      <select
                        {...monitorForm.register('gender')}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                      >
                        <option value="">選択してください</option>
                        <option value="male">男性</option>
                        <option value="female">女性</option>
                        <option value="other">その他</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        職業
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        {/* 値を「学生」に固定した表示用のdiv */}
                        <div className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-700">
                          学生
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        居住地
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select
                          {...monitorForm.register('location')}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                        >
                          <option value="">選択してください</option>
                          {prefectures.map(pref => (
                            <option key={pref} value={pref}>{pref}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        学部
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          {...monitorForm.register('faculty')}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                          placeholder="学部を入力（例：工学部）"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        学科
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          {...monitorForm.register('department')}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                          placeholder="学科を入力（例：情報工学科）"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        出身地
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select
                          {...monitorForm.register('hometown')}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                        >
                          <option value="">選択してください</option>
                          {prefectures.map(pref => (
                            <option key={pref} value={pref}>{pref}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {selectedRole === 'client' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        登録番号 <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          {...clientForm.register('registration_code')}
                          className={`w-full pl-10 pr-20 py-3 bg-white border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 ${
                            codeVerified ? 'border-green-300 bg-green-50' : 'border-gray-200'
                          }`}
                          placeholder="登録番号を入力"
                          onChange={(e) => {
                            clientForm.setValue('registration_code', e.target.value);
                            if (codeVerified) {
                              setCodeVerified(false);
                              setVerifiedCompanyInfo(null);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => verifyRegistrationCode(clientForm.getValues('registration_code'))}
                          disabled={verifyingCode || !clientForm.getValues('registration_code')}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {verifyingCode ? '確認中...' : codeVerified ? '確認済み' : '確認'}
                        </button>
                      </div>
                      {clientForm.formState.errors.registration_code && (
                        <p className="text-red-500 text-sm mt-1">{clientForm.formState.errors.registration_code.message}</p>
                      )}
                      {codeVerified && verifiedCompanyInfo && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-green-800 text-sm">
                            ✓ 登録番号が確認されました: {verifiedCompanyInfo.company_name}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        会社名
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          {...clientForm.register('company_name')}
                          className={`w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 ${
                            codeVerified ? 'bg-gray-100' : ''
                          }`}
                          placeholder="会社名を入力"
                          readOnly={codeVerified}
                        />
                      </div>
                      {clientForm.formState.errors.company_name && (
                        <p className="text-red-500 text-sm mt-1">{clientForm.formState.errors.company_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        業界
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          {...clientForm.register('industry')}
                          className={`w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 ${
                            codeVerified ? 'bg-gray-100' : ''
                          }`}
                          placeholder="業界を入力"
                          readOnly={codeVerified}
                        />
                      </div>
                      {clientForm.formState.errors.industry && (
                        <p className="text-red-500 text-sm mt-1">{clientForm.formState.errors.industry.message}</p>
                      )}
                    </div>
                  </>
                )}

                {/* Privacy Policy Consent */}
                <div className="space-y-3">
                  <label className="flex items-start p-4 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      checked={privacyConsent}
                      onChange={(e) => setPrivacyConsent(e.target.checked)}
                      className="mr-3 mt-1 text-orange-500 flex-shrink-0"
                      required
                    />
                    <span className="text-sm text-gray-700 leading-relaxed">
                      <a 
                        href="/privacy-policy.html" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700 underline font-medium"
                      >
                        プライバシーポリシー
                      </a>
                      に同意します。個人情報の取り扱いについて確認し、同意の上でアカウントを作成してください。
                    </span>
                  </label>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading || (isSignUp && !privacyConsent)}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  <span>{isSignUp ? 'アカウント作成' : 'ログイン'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-orange-600 hover:text-orange-500 text-sm font-medium transition-colors"
            >
              {isSignUp ? 'すでにアカウントをお持ちの方はこちら' : '新規アカウント作成'}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-gray-50 to-transparent"></div>
    </div>
  );
};