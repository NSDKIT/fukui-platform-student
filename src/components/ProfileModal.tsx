import React, { useState, useEffect } from 'react';
import { X, Save, User, School, Briefcase, MapPin, Heart, TrendingUp } from 'lucide-react';
import { supabase } from '../config/supabase';
import { User as UserType } from '../types';
import { motion } from 'framer-motion';

interface ProfileModalProps {
  onClose: () => void;
  user: UserType | null;
  onProfileUpdate: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose, user, onProfileUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'career' | 'preferences'>('basic');
  const [formData, setFormData] = useState({
    // Basic info
    gender_detail: '',
    grade: '',
    hometown: '',
    school_name: '',
    faculty_department: '',
    
    // Career interests
    interested_industries: [] as string[],
    interested_job_types: [] as string[],
    preferred_work_areas: [] as string[],
    
    // Company selection criteria (top 3)
    company_selection_criteria_1: '',
    company_selection_criteria_2: '',
    company_selection_criteria_3: '',
    
    // Important benefits (top 3)
    important_benefits_1: '',
    important_benefits_2: '',
    important_benefits_3: '',
    
    // Deal breakers (top 3)
    dealbreaker_points_1: '',
    dealbreaker_points_2: '',
    dealbreaker_points_3: '',
    
    // Text responses
    fulfilling_work_state: '',
    job_hunting_start_time: '',
    desired_company_info: '',
    work_satisfaction_moments: '',
    info_sources: '',
    
    // Information sources (top 3)
    helpful_info_sources_1: '',
    helpful_info_sources_2: '',
    helpful_info_sources_3: '',
    
    // SNS related
    sns_company_account_usage: '',
    memorable_sns_content: '',
    frequently_used_sns: [] as string[],
    
    // Company research
    company_research_focus: '',
    positive_selection_experience: '',
    selection_improvement_suggestions: '',
    memorable_recruitment_content: ''
  });

  useEffect(() => {
    if (user?.profile) {
      const profile = user.profile as any;
      setFormData({
        gender_detail: profile.gender_detail || '',
        grade: profile.grade || '',
        hometown: profile.hometown || '',
        school_name: profile.school_name || '',
        faculty_department: profile.faculty_department || '',
        interested_industries: profile.interested_industries || [],
        interested_job_types: profile.interested_job_types || [],
        preferred_work_areas: profile.preferred_work_areas || [],
        company_selection_criteria_1: profile.company_selection_criteria_1 || '',
        company_selection_criteria_2: profile.company_selection_criteria_2 || '',
        company_selection_criteria_3: profile.company_selection_criteria_3 || '',
        important_benefits_1: profile.important_benefits_1 || '',
        important_benefits_2: profile.important_benefits_2 || '',
        important_benefits_3: profile.important_benefits_3 || '',
        dealbreaker_points_1: profile.dealbreaker_points_1 || '',
        dealbreaker_points_2: profile.dealbreaker_points_2 || '',
        dealbreaker_points_3: profile.dealbreaker_points_3 || '',
        fulfilling_work_state: profile.fulfilling_work_state || '',
        job_hunting_start_time: profile.job_hunting_start_time || '',
        desired_company_info: profile.desired_company_info || '',
        work_satisfaction_moments: profile.work_satisfaction_moments || '',
        info_sources: profile.info_sources || '',
        helpful_info_sources_1: profile.helpful_info_sources_1 || '',
        helpful_info_sources_2: profile.helpful_info_sources_2 || '',
        helpful_info_sources_3: profile.helpful_info_sources_3 || '',
        sns_company_account_usage: profile.sns_company_account_usage || '',
        memorable_sns_content: profile.memorable_sns_content || '',
        frequently_used_sns: profile.frequently_used_sns || [],
        company_research_focus: profile.company_research_focus || '',
        positive_selection_experience: profile.positive_selection_experience || '',
        selection_improvement_suggestions: profile.selection_improvement_suggestions || '',
        memorable_recruitment_content: profile.memorable_recruitment_content || ''
      });
    }
  }, [user]);

  const handleArrayFieldChange = (field: string, value: string) => {
    const values = value.split(',').map(v => v.trim()).filter(v => v);
    setFormData(prev => ({ ...prev, [field]: values }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('monitor_profiles')
        .update(formData)
        .eq('user_id', user?.id);

      if (error) throw error;

      onProfileUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('プロフィールの更新に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  const companySelectionOptions = [
    '給与・待遇', '仕事内容', '企業の安定性', '成長性', '職場環境', '福利厚生',
    '勤務地', '企業理念・価値観', '社会貢献度', 'ワークライフバランス',
    '研修制度', 'キャリアアップの機会', '企業規模', '業界の将来性'
  ];

  const benefitsOptions = [
    '健康保険', '厚生年金', '有給休暇', '育児休暇', '介護休暇', '住宅手当',
    '交通費支給', '退職金制度', '社員食堂', 'フレックスタイム', 'リモートワーク',
    '資格取得支援', '社員旅行', '慶弔見舞金', '財形貯蓄', '社内託児所'
  ];

  const dealbreakerOptions = [
    '長時間労働', 'パワハラ・セクハラ', '給与の低さ', '昇進機会の少なさ',
    '職場の人間関係', '仕事内容のミスマッチ', '企業の将来性への不安',
    '福利厚生の不備', '研修制度の不足', 'ワークライフバランスの悪さ',
    '評価制度の不透明さ', '転勤の多さ', '残業代の未払い', '職場環境の悪さ'
  ];

  const infoSourceOptions = [
    '企業ホームページ', '就職情報サイト', '合同説明会', '個別説明会',
    'OB・OG訪問', 'インターンシップ', 'SNS', '口コミサイト',
    '大学のキャリアセンター', '友人・知人', '新聞・雑誌', 'テレビ・ラジオ'
  ];

  const snsOptions = [
    'Instagram', 'Twitter(X)', 'Facebook', 'LinkedIn', 'TikTok', 'YouTube',
    'LINE', 'Discord', 'Clubhouse', 'Pinterest', 'Snapchat'
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">プロフィール設定</h2>
            <p className="text-sm text-neutral-300">就職活動に関する詳細情報を入力してください</p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/20 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('basic')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'basic'
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-300'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              基本情報
            </button>
            <button
              onClick={() => setActiveTab('career')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'career'
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-300'
              }`}
            >
              <Briefcase className="w-4 h-4 inline mr-2" />
              キャリア志向
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'preferences'
                  ? 'border-blue-400 text-blue-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-300'
              }`}
            >
              <Heart className="w-4 h-4 inline mr-2" />
              就活情報
            </button>
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white mb-4">基本情報</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Q1. 性別
                  </label>
                  <select
                    value={formData.gender_detail}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender_detail: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                  >
                    <option value="" className="bg-slate-800">選択してください</option>
                    <option value="男性" className="bg-slate-800">男性</option>
                    <option value="女性" className="bg-slate-800">女性</option>
                    <option value="その他" className="bg-slate-800">その他</option>
                    <option value="回答しない" className="bg-slate-800">回答しない</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Q2. 学年
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData(prev => ({ ...prev, grade: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                  >
                    <option value="" className="bg-slate-800">選択してください</option>
                    <option value="大学1年生" className="bg-slate-800">大学1年生</option>
                    <option value="大学2年生" className="bg-slate-800">大学2年生</option>
                    <option value="大学3年生" className="bg-slate-800">大学3年生</option>
                    <option value="大学4年生" className="bg-slate-800">大学4年生</option>
                    <option value="修士1年生" className="bg-slate-800">修士1年生</option>
                    <option value="修士2年生" className="bg-slate-800">修士2年生</option>
                    <option value="博士課程" className="bg-slate-800">博士課程</option>
                    <option value="その他" className="bg-slate-800">その他</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Q3. 出身地
                </label>
                <select
                  value={formData.hometown}
                  onChange={(e) => setFormData(prev => ({ ...prev, hometown: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                >
                  <option value="" className="bg-slate-800">選択してください</option>
                  <option value="北海道" className="bg-slate-800">北海道</option>
                  <option value="青森県" className="bg-slate-800">青森県</option>
                  <option value="岩手県" className="bg-slate-800">岩手県</option>
                  <option value="宮城県" className="bg-slate-800">宮城県</option>
                  <option value="秋田県" className="bg-slate-800">秋田県</option>
                  <option value="山形県" className="bg-slate-800">山形県</option>
                  <option value="福島県" className="bg-slate-800">福島県</option>
                  <option value="茨城県" className="bg-slate-800">茨城県</option>
                  <option value="栃木県" className="bg-slate-800">栃木県</option>
                  <option value="群馬県" className="bg-slate-800">群馬県</option>
                  <option value="埼玉県" className="bg-slate-800">埼玉県</option>
                  <option value="千葉県" className="bg-slate-800">千葉県</option>
                  <option value="東京都" className="bg-slate-800">東京都</option>
                  <option value="神奈川県" className="bg-slate-800">神奈川県</option>
                  <option value="新潟県" className="bg-slate-800">新潟県</option>
                  <option value="富山県" className="bg-slate-800">富山県</option>
                  <option value="石川県" className="bg-slate-800">石川県</option>
                  <option value="福井県" className="bg-slate-800">福井県</option>
                  <option value="山梨県" className="bg-slate-800">山梨県</option>
                  <option value="長野県" className="bg-slate-800">長野県</option>
                  <option value="岐阜県" className="bg-slate-800">岐阜県</option>
                  <option value="静岡県" className="bg-slate-800">静岡県</option>
                  <option value="愛知県" className="bg-slate-800">愛知県</option>
                  <option value="三重県" className="bg-slate-800">三重県</option>
                  <option value="滋賀県" className="bg-slate-800">滋賀県</option>
                  <option value="京都府" className="bg-slate-800">京都府</option>
                  <option value="大阪府" className="bg-slate-800">大阪府</option>
                  <option value="兵庫県" className="bg-slate-800">兵庫県</option>
                  <option value="奈良県" className="bg-slate-800">奈良県</option>
                  <option value="和歌山県" className="bg-slate-800">和歌山県</option>
                  <option value="鳥取県" className="bg-slate-800">鳥取県</option>
                  <option value="島根県" className="bg-slate-800">島根県</option>
                  <option value="岡山県" className="bg-slate-800">岡山県</option>
                  <option value="広島県" className="bg-slate-800">広島県</option>
                  <option value="山口県" className="bg-slate-800">山口県</option>
                  <option value="徳島県" className="bg-slate-800">徳島県</option>
                  <option value="香川県" className="bg-slate-800">香川県</option>
                  <option value="愛媛県" className="bg-slate-800">愛媛県</option>
                  <option value="高知県" className="bg-slate-800">高知県</option>
                  <option value="福岡県" className="bg-slate-800">福岡県</option>
                  <option value="佐賀県" className="bg-slate-800">佐賀県</option>
                  <option value="長崎県" className="bg-slate-800">長崎県</option>
                  <option value="熊本県" className="bg-slate-800">熊本県</option>
                  <option value="大分県" className="bg-slate-800">大分県</option>
                  <option value="宮崎県" className="bg-slate-800">宮崎県</option>
                  <option value="鹿児島県" className="bg-slate-800">鹿児島県</option>
                  <option value="沖縄県" className="bg-slate-800">沖縄県</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Q4. 所属学校
                </label>
                <input
                  type="text"
                  value={formData.school_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, school_name: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
                  placeholder="例: ○○大学"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Q5. 所属学部・学科
                </label>
                <input
                  type="text"
                  value={formData.faculty_department}
                  onChange={(e) => setFormData(prev => ({ ...prev, faculty_department: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
                  placeholder="例: 経済学部 経済学科"
                />
              </div>
            </div>
          )}

          {activeTab === 'career' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white mb-4">キャリア志向</h3>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Q6. 興味のある業界（複数選択可、カンマ区切り）
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    'メーカー（製造業）',
                    '小売・流通',
                    'サービス業',
                    'IT・インターネット',
                    '広告・マスコミ・出版',
                    '金融・保険',
                    '建設・不動産',
                    '医療・福祉',
                    '教育・公務',
                    '物流・運輸',
                    '商社',
                    'エネルギー・インフラ',
                    'ベンチャー／スタートアップ',
                    '特に決まっていない／わからない',
                    'その他'
                  ].map((industry) => (
                    <label key={industry} className="flex items-center p-2 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.interested_industries.includes(industry)}
                        onChange={(e) => {
                          const currentIndustries = formData.interested_industries;
                          let newIndustries;
                          if (e.target.checked) {
                            newIndustries = [...currentIndustries, industry];
                          } else {
                            newIndustries = currentIndustries.filter(i => i !== industry);
                          }
                          setFormData(prev => ({ ...prev, interested_industries: newIndustries }));
                        }}
                        className="mr-2 text-orange-500"
                      />
                      <span className="text-sm text-neutral-300">{industry}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Q7. 興味のある職種（複数選択可、カンマ区切り）
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    'サービス・接客業',
                    '営業・販売職',
                    '事務・オフィスワーク',
                    '製造・技術職',
                    'IT・クリエイティブ職',
                    '教育・医療・福祉',
                    '物流・運輸業',
                    '公務員・安定志向の職業',
                    '特に決まっていない／わからない',
                    'その他'
                  ].map((jobType) => (
                    <label key={jobType} className="flex items-center p-2 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.interested_job_types.includes(jobType)}
                        onChange={(e) => {
                          const currentJobTypes = formData.interested_job_types;
                          let newJobTypes;
                          if (e.target.checked) {
                            newJobTypes = [...currentJobTypes, jobType];
                          } else {
                            newJobTypes = currentJobTypes.filter(j => j !== jobType);
                          }
                          setFormData(prev => ({ ...prev, interested_job_types: newJobTypes }));
                        }}
                        className="mr-2 text-blue-500"
                      />
                      <span className="text-sm text-neutral-300">{jobType}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Q8. 就職希望エリア（複数選択可、カンマ区切り）
                </label>
                <input
                  type="text"
                  value={formData.preferred_work_areas.join(', ')}
                  onChange={(e) => handleArrayFieldChange('preferred_work_areas', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
                  placeholder="例: 東京都, 大阪府, 全国"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-neutral-300">
                  Q9. 企業を選ぶ際に重視するポイントは？（上位3つ）
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {[1, 2, 3].map((rank) => (
                    <div key={rank}>
                      <label className="block text-xs text-neutral-400 mb-1">[{rank}位]</label>
                      <select
                        value={formData[`company_selection_criteria_${rank}` as keyof typeof formData] as string}
                        onChange={(e) => setFormData(prev => ({ ...prev, [`company_selection_criteria_${rank}`]: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                      >
                        <option value="" className="bg-slate-800">選択してください</option>
                        {companySelectionOptions.map(option => (
                          <option key={option} value={option} className="bg-slate-800">{option}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-neutral-300">
                  Q10. 特に重視する福利厚生は？（上位3つ）
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {[1, 2, 3].map((rank) => (
                    <div key={rank}>
                      <label className="block text-xs text-neutral-400 mb-1">[{rank}位]</label>
                      <select
                        value={formData[`important_benefits_${rank}` as keyof typeof formData] as string}
                        onChange={(e) => setFormData(prev => ({ ...prev, [`important_benefits_${rank}`]: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                      >
                        <option value="" className="bg-slate-800">選択してください</option>
                        {benefitsOptions.map(option => (
                          <option key={option} value={option} className="bg-slate-800">{option}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-neutral-300">
                  Q11. この項目が充実していないと嫌だなと感じるポイントは？（上位3つ）
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {[1, 2, 3].map((rank) => (
                    <div key={rank}>
                      <label className="block text-xs text-neutral-400 mb-1">[{rank}位]</label>
                      <select
                        value={formData[`dealbreaker_points_${rank}` as keyof typeof formData] as string}
                        onChange={(e) => setFormData(prev => ({ ...prev, [`dealbreaker_points_${rank}`]: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                      >
                        <option value="" className="bg-slate-800">選択してください</option>
                        {dealbreakerOptions.map(option => (
                          <option key={option} value={option} className="bg-slate-800">{option}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white mb-4">就活情報・SNS</h3>
              
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Q12. 生き生き働いていると感じるのは、どのような状態だと思いますか？
                </label>
                <textarea
                  value={formData.fulfilling_work_state}
                  onChange={(e) => setFormData(prev => ({ ...prev, fulfilling_work_state: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
                  placeholder="自由にお答えください"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Q13. 就活を始めた時期を教えてください
                </label>
                <select
                  value={formData.job_hunting_start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, job_hunting_start_time: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                >
                  <option value="" className="bg-slate-800">選択してください</option>
                  <option value="大学1年生" className="bg-slate-800">大学1年生</option>
                  <option value="大学2年生" className="bg-slate-800">大学2年生</option>
                  <option value="大学3年生の春" className="bg-slate-800">大学3年生の春</option>
                  <option value="大学3年生の夏" className="bg-slate-800">大学3年生の夏</option>
                  <option value="大学3年生の秋" className="bg-slate-800">大学3年生の秋</option>
                  <option value="大学3年生の冬" className="bg-slate-800">大学3年生の冬</option>
                  <option value="大学4年生" className="bg-slate-800">大学4年生</option>
                  <option value="まだ始めていない" className="bg-slate-800">まだ始めていない</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Q14. 会社のHPやSNSの採用アカウントで知りたい内容は？
                </label>
                <textarea
                  value={formData.desired_company_info}
                  onChange={(e) => setFormData(prev => ({ ...prev, desired_company_info: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
                  placeholder="知りたい情報を自由にお答えください"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Q15. あなたが「働きがい」を感じるのはどんなときですか？
                </label>
                <textarea
                  value={formData.work_satisfaction_moments}
                  onChange={(e) => setFormData(prev => ({ ...prev, work_satisfaction_moments: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
                  placeholder="働きがいを感じる瞬間について教えてください"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Q16. 企業情報はどこで入手しますか？
                </label>
                <textarea
                  value={formData.info_sources}
                  onChange={(e) => setFormData(prev => ({ ...prev, info_sources: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
                  placeholder="情報収集方法を教えてください"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-neutral-300">
                  Q17. 就職活動で特に参考になった情報源は？（上位3つ）
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {[1, 2, 3].map((rank) => (
                    <div key={rank}>
                      <label className="block text-xs text-neutral-400 mb-1">[{rank}位]</label>
                      <select
                        value={formData[`helpful_info_sources_${rank}` as keyof typeof formData] as string}
                        onChange={(e) => setFormData(prev => ({ ...prev, [`helpful_info_sources_${rank}`]: e.target.value }))}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                      >
                        <option value="" className="bg-slate-800">選択してください</option>
                        {infoSourceOptions.map(option => (
                          <option key={option} value={option} className="bg-slate-800">{option}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Q18. SNSで企業アカウントを見たことがありますか？
                </label>
                <select
                  value={formData.sns_company_account_usage}
                  onChange={(e) => setFormData(prev => ({ ...prev, sns_company_account_usage: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                >
                  <option value="" className="bg-slate-800">選択してください</option>
                  <option value="よく見る" className="bg-slate-800">よく見る</option>
                  <option value="たまに見る" className="bg-slate-800">たまに見る</option>
                  <option value="あまり見ない" className="bg-slate-800">あまり見ない</option>
                  <option value="見たことがない" className="bg-slate-800">見たことがない</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Q19. 印象に残っている企業のSNS投稿があれば、その内容を教えてください。
                </label>
                <textarea
                  value={formData.memorable_sns_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, memorable_sns_content: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
                  placeholder="印象に残った投稿内容があれば教えてください"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Q20. 週5日以上使用するSNSをすべて教えてください。（複数選択可、カンマ区切り）
                </label>
                <input
                  type="text"
                  value={formData.frequently_used_sns.join(', ')}
                  onChange={(e) => handleArrayFieldChange('frequently_used_sns', e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
                  placeholder="例: Instagram, Twitter, LINE"
                />
                <div className="text-xs text-neutral-400 mt-1">
                  選択肢: {snsOptions.join(', ')}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Q21. 就職を考えている企業の何を見ますか？
                </label>
                <textarea
                  value={formData.company_research_focus}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_research_focus: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
                  placeholder="企業研究で重視する点を教えてください"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Q22. 選考過程で「この企業は良い」と感じたポイントは何でしたか？
                </label>
                <textarea
                  value={formData.positive_selection_experience}
                  onChange={(e) => setFormData(prev => ({ ...prev, positive_selection_experience: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
                  placeholder="良いと感じた選考体験があれば教えてください"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Q23. 説明会や選考過程で「もっとこうしてほしい」と感じる点はありますか？
                </label>
                <textarea
                  value={formData.selection_improvement_suggestions}
                  onChange={(e) => setFormData(prev => ({ ...prev, selection_improvement_suggestions: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
                  placeholder="改善してほしい点があれば教えてください"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Q24. 企業の採用ホームページで印象に残っている内容があれば、業界とその内容を教えてください。
                </label>
                <textarea
                  value={formData.memorable_recruitment_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, memorable_recruitment_content: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
                  placeholder="印象に残った採用コンテンツがあれば教えてください"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-6 border-t border-white/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-300 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>保存</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};