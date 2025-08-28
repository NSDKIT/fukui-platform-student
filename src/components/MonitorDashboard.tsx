import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../config/supabase';
import { Survey, Response, PointTransaction } from '../types';
import { Advertisement } from '../types';
import { 
  Award, 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Star,
  Calendar,
  Users,
  Gift,
  Eye,
  X,
  CreditCard,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Briefcase,
  LogOut
} from 'lucide-react';
import { SparklesCore } from './ui/sparkles';
import { motion } from 'framer-motion';
import { ProfileModal } from './ProfileModal';
import { ChatModal } from './ChatModal';
import { CareerConsultationModal } from './CareerConsultationModal';

const MonitorDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [pointTransactions, setPointTransactions] = useState<PointTransaction[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showCareerConsultationModal, setShowCareerConsultationModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'surveys' | 'ads' | 'services'>('surveys');
  const [selectedAdvertisement, setSelectedAdvertisement] = useState<Advertisement | null>(null);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);

  const consultationServices = [
    {
      title: 'チャット相談',
      description: '就活の進め方、業界研究など就職活動全般',
      icon: <Users className="w-8 h-8 text-white" />,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'ES添削',
      description: 'エントリーシートの書き方指導',
      icon: <CheckCircle className="w-8 h-8 text-white" />,
      color: 'from-green-500 to-green-600'
    }
  ];

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]); // Only depend on user ID, not the entire user object

  const fetchData = async () => {
    if (!user?.id) {
      console.log('No user ID available, skipping data fetch');
      return;
    }
    
    try {
      setLoading(true);

      // Fetch available surveys
      const { data: surveysData, error: surveysError } = await supabase
        .from('surveys')
        .select(`
          *,
          client:users!surveys_client_id_fkey(name, email),
          questions(*)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (surveysError) throw surveysError;

      // Check which surveys the user has already responded to
      const { data: userResponses, error: responsesError } = await supabase
        .from('responses')
        .select('survey_id')
        .eq('monitor_id', user?.id);

      if (responsesError) throw responsesError;

      const respondedSurveyIds = userResponses.map(r => r.survey_id);
      const availableSurveys = surveysData.filter(survey => 
        !respondedSurveyIds.includes(survey.id)
      );

      setSurveys(availableSurveys);

      // Fetch user's responses
      const { data: responsesData, error: responsesError2 } = await supabase
        .from('responses')
        .select(`
          *,
          survey:surveys(title, points_reward)
        `)
        .eq('monitor_id', user?.id)
        .order('completed_at', { ascending: false });

      if (responsesError2) throw responsesError2;
      setResponses(responsesData || []);

      // Fetch point transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('point_transactions')
        .select(`
          *,
          survey:surveys(title)
        `)
        .eq('monitor_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionsError) throw transactionsError;
      setPointTransactions(transactionsData || []);

      // Fetch advertisements
      // Get user's location from profile
      const userLocation = user?.profile?.location;
      
      const { data: adsData, error: adsError } = await supabase
        .from('advertisements')
        .select('*, target_regions, priority')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('display_order', { ascending: true });

      if (adsError) throw adsError;

      // Filter and prioritize advertisements based on user location
      let filteredAds = adsData || [];
      
      if (userLocation) {
        // Separate regional and general ads
        const regionalAds = filteredAds.filter(ad => 
          ad.target_regions && ad.target_regions.length > 0 && 
          ad.target_regions.includes(userLocation)
        );
        
        const generalAds = filteredAds.filter(ad => 
          !ad.target_regions || ad.target_regions.length === 0
        );
        
        // Prioritize regional ads first, then general ads
        filteredAds = [...regionalAds, ...generalAds];
      }
      
      setAdvertisements(filteredAds);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeSurvey = (survey: Survey) => {
    setSelectedSurvey(survey);
  };

  const handleSubmitResponse = async (surveyId: string, answers: any[]) => {
    try {
      console.log('Submitting response:', { surveyId, answers, monitorId: user?.id });
      
      const { error } = await supabase
        .from('responses')
        .insert([{
          survey_id: surveyId,
          monitor_id: user?.id,
          answers: answers
        }]);

      if (error) {
        console.error('Error submitting response:', error);
        throw error;
      }

      console.log('Response submitted successfully');

      setSelectedSurvey(null);
      
      // Wait a moment for triggers to execute, then refresh data
      setTimeout(() => {
        fetchData();
      }, 1000);
      
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('回答の送信に失敗しました。もう一度お試しください。');
    }
  };

  const getAnswerDisplay = (answer: any, question: Question) => {
    if (answer.answer_text) return answer.answer_text;
    if (answer.answer_option) {
      let displayText = answer.answer_option;
      if (answer.other_text) {
        displayText += ` (${answer.other_text})`;
      }
      return displayText;
    }
    if (answer.answer_options && Array.isArray(answer.answer_options)) {
      let displayText = answer.answer_options.join(', ');
      if (answer.other_text) {
        displayText += ` (その他: ${answer.other_text})`;
      }
      return displayText;
    }
    if (answer.answer_rating) return `${answer.answer_rating}/5`;
    if (answer.answer_boolean !== undefined) return answer.answer_boolean ? 'はい' : 'いいえ';
    return '未回答';
  };

  const userProfile = user?.profile as any;
  const totalPoints = userProfile?.points || 0;

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
          id="tsparticlesmonitor"
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

      {/* Header */}
      <header className="relative z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center py-4 sm:h-16 gap-4 sm:gap-0">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4 w-full sm:w-auto"
            >
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-2 shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500">
                  モニターダッシュボード
                </h1>
                <p className="text-sm text-gray-600">こんにちは、{user?.name}さん</p>
              </div>
            </motion.div>
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto justify-end">
              <button
                onClick={() => setShowChatModal(true)}
                title="チャットサポート"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-2 sm:px-3 sm:py-1 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 text-sm shadow-lg hover:shadow-xl"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">チャット</span>
              </button>
              <button
                onClick={() => setShowProfileModal(true)}
                title="プロフィール"
                className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white p-2 sm:px-3 sm:py-1 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 text-sm shadow-lg hover:shadow-xl"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">プロフィール</span>
              </button>
              <button
                onClick={signOut}
                title="ログアウト"
                className="text-gray-600 hover:text-orange-600 p-2 sm:px-3 sm:py-1 rounded-lg hover:bg-orange-50 transition-colors flex items-center space-x-2"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">ログアウト</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-100 p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-3 shadow-lg">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">現在の獲得ポイント</p>
                  <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500">{totalPoints}</p>
                </div>
              </div>
              <button
                onClick={() => setShowExchangeModal(true)}
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-5 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2 flex-shrink-0"
              >
                <Gift className="w-4 h-4" />
                <span>ポイントを交換する</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tabbed Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-100 shadow-xl"
        >
          <div className="border-b border-gray-200">
            <nav className="flex justify-center sm:justify-start gap-x-3 sm:gap-x-8 px-2 sm:px-6">
              <button
                onClick={() => setActiveTab('surveys')}
                className={`py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 ${
                  activeTab === 'surveys'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>アンケート</span>
              </button>
              <button
                onClick={() => setActiveTab('ads')}
                className={`py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 ${
                  activeTab === 'ads'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>採用情報</span>
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`py-4 px-2 sm:px-3 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 ${
                  activeTab === 'services'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>キャリア相談</span>
              </button>
            </nav>
          </div>
          <div className="p-6">
            {activeTab === 'surveys' && (
              <div className="space-y-8">
                {/* Section: Answerable Surveys */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">回答できるアンケート</h3>
                  {surveys.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">現在回答できるアンケートはありません。</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {surveys.map((survey) => (
                        <div key={survey.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-md transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-800">{survey.title}</h3>
                              <p className="text-sm text-gray-600 mt-1">{survey.description}</p>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <div className="flex items-center text-orange-600">
                                <Gift className="w-4 h-4 mr-1" />
                                <span className="text-sm font-medium">{survey.points_reward}pt</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                            <div className="flex items-center space-x-4">
                              <span className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {survey.client?.name}
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                質問数: {survey.questions?.length || 0}
                              </span>
                            </div>
                            <button
                              onClick={() => handleTakeSurvey(survey)}
                              className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 text-sm shadow-lg hover:shadow-xl"
                            >
                              回答する
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section: Recent Activity */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">最近の活動</h3>
                  {pointTransactions.length === 0 ? (
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">まだ活動履歴がありません。</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pointTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between py-2">
                          <div className="flex items-center">
                            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-2 mr-3 shadow-lg">
                              <Gift className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {transaction.survey?.title || '新規登録ボーナス'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(transaction.created_at).toLocaleDateString('ja-JP')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-orange-600">
                              +{transaction.points} ポイント
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section: Response History */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">回答履歴</h3>
                  {responses.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">まだアンケートに回答していません。</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                              アンケート
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                              回答日
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                              獲得ポイント
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {responses.map((response) => (
                            <tr key={response.id} className="hover:bg-orange-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-800">
                                  {response.survey?.title}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600">
                                  {new Date(response.completed_at).toLocaleDateString('ja-JP')}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-orange-600">
                                  +{response.points_earned} ポイント
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'ads' && (
              <div>
                {advertisements.length > 0 ? (
                  <RotatingAdvertisements 
                    advertisements={advertisements}
                    onAdClick={setSelectedAdvertisement}
                  />
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">現在、採用情報はありません。</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'services' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">キャリア相談サービス</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {consultationServices.map((service, index) => (
                    <div 
                      key={index}
                      className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-orange-100 hover:border-orange-300 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl cursor-pointer"
                      onClick={() => setShowCareerConsultationModal(true)}
                    >
                      <div className={`bg-gradient-to-br ${service.color} rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center group-hover:shadow-lg transition-all duration-300`}>
                        {service.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 text-center">{service.title}</h3>
                      <p className="text-gray-600 text-sm text-center leading-relaxed">{service.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Survey Modal */}
      {selectedSurvey && (
        <SurveyModal
          survey={selectedSurvey}
          onClose={() => setSelectedSurvey(null)}
          onSubmit={handleSubmitResponse}
        />
      )}

      {/* Point Exchange Modal */}
      {showExchangeModal && (
        <PointExchangeModal
          onClose={() => setShowExchangeModal(false)}
          userEmail={user?.email || ''}
          currentPoints={totalPoints}
          monitorId={user?.id || ''}
        />
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          onClose={() => setShowProfileModal(false)}
          user={user}
          onProfileUpdate={fetchData}
        />
      )}

      {/* Chat Modal */}
      {showChatModal && (
        <ChatModal
          onClose={() => setShowChatModal(false)}
          user={user}
          initialRoomId={chatRoomId || undefined}
        />
      )}

      {/* Career Consultation Modal */}
      {showCareerConsultationModal && (
        <CareerConsultationModal
          onClose={() => setShowCareerConsultationModal(false)}
          user={user}
          onChatOpen={(roomId) => {
            setShowCareerConsultationModal(false);
            setChatRoomId(roomId || null);
            setShowChatModal(true);
          }}
        />
      )}

      {/* Advertisement Modal */}
      {selectedAdvertisement && (
        <AdvertisementModal
          advertisement={selectedAdvertisement}
          onClose={() => setSelectedAdvertisement(null)}
        />
      )}


      {/* Bottom Gradient */}
      <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-gray-50 to-transparent"></div>
    </div>
  );
};

// Survey Modal Component
function SurveyModal({ survey, onClose, onSubmit }: {
  survey: Survey;
  onClose: () => void;
  onSubmit: (surveyId: string, answers: any[]) => void;
}) {
  const [answers, setAnswers] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [otherTexts, setOtherTexts] = useState<{ [key: number]: string }>({});

  const currentQuestion = survey.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === survey.questions.length - 1;

  const handleAnswer = (answer: any) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      question_id: currentQuestion.id,
      ...answer
    };
    setAnswers(newAnswers);
  };

  const isOtherSelected = (option: string) => {
    if (option !== 'その他') return false;
    
    const currentAnswer = answers[currentQuestionIndex];
    if (!currentAnswer) return false;
    
    // 複数選択の場合
    if (currentQuestion.is_multiple_select) {
      return currentAnswer.answer_options?.includes('その他') || false;
    }
    
    // 単数選択の場合
    return currentAnswer.answer_option === 'その他';
  };

  const handleOtherTextChange = (questionIndex: number, text: string) => {
    setOtherTexts(prev => ({
      ...prev,
      [questionIndex]: text
    }));
    
    // 回答データも更新
    const currentAnswer = answers[questionIndex];
    if (currentAnswer) {
      const newAnswers = [...answers];
      newAnswers[questionIndex] = {
        ...currentAnswer,
        other_text: text
      };
      setAnswers(newAnswers);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onSubmit(survey.id, answers);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const canProceed = () => {
    const currentAnswer = answers[currentQuestionIndex];
    if (!currentQuestion.required) return true;
    
    if (!currentAnswer) return false;
    
    // 「その他」が選択されている場合、テキスト入力が必要
    if (currentQuestion.question_type === 'multiple_choice') {
      if (currentQuestion.is_multiple_select) {
        const hasOther = currentAnswer.answer_options?.includes('その他');
        if (hasOther && !otherTexts[currentQuestionIndex]) {
          return false;
        }
        const hasOtherWithParens = currentAnswer.answer_options?.some((opt: string) => opt.includes('その他'));
        if (hasOtherWithParens && !otherTexts[currentQuestionIndex]) {
          return false;
        }
      } else {
        const isOther = currentAnswer.answer_option?.includes('その他');
        if (isOther && !otherTexts[currentQuestionIndex]) {
          return false;
        }
      }
    }
    // 複数選択の場合は少なくとも1つ選択されているかチェック
    if (currentQuestion.question_type === 'multiple_choice' && (currentQuestion.is_multiple_select || currentQuestion.question_type === 'ranking')) {
      return currentAnswer.answer_options && currentAnswer.answer_options.length > 0;
    }
    
    // ランキング質問の場合は3つ選択されているかチェック
    if (currentQuestion.max_selections || currentQuestion.question_type === 'ranking') {
      const requiredSelections = currentQuestion.max_selections || 3;
      return currentAnswer.answer_options && currentAnswer.answer_options.length === requiredSelections;
    }
    
    // その他の場合は何らかの回答があるかチェック
    return currentAnswer.answer_text || 
           currentAnswer.answer_option;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">{survey.title}</h2>
            <p className="text-sm text-neutral-300">
              質問 {currentQuestionIndex + 1} / {survey.questions.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <div className="w-full bg-white/20 rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / survey.questions.length) * 100}%` }}
            ></div>
          </div>

          <h3 className="text-lg font-medium mb-4 text-white">{currentQuestion.question_text}</h3>

          <div className="space-y-3">
            {currentQuestion.question_type === 'text' && (
              <textarea
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
                rows={4}
                placeholder="回答を入力してください"
                value={answers[currentQuestionIndex]?.answer_text || ''}
                onChange={(e) => handleAnswer({ answer_text: e.target.value })}
              />
            )}

            {currentQuestion.question_type === 'multiple_choice' && (
              <div className="space-y-2">
                {currentQuestion.is_multiple_select || currentQuestion.question_type === 'ranking' ? (
                  // 複数選択の場合
                  <div className="space-y-3">
                    {(currentQuestion.max_selections === 3 || currentQuestion.question_type === 'ranking') && (
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mb-4">
                        <p className="text-orange-300 text-sm">
                          📊 以下の選択肢から上位3位を選んでください（順位は問いません）
                        </p>
                      </div>
                    )}
                    {currentQuestion.options?.map((option, index) => (
                      <div key={index}>
                        <label className="flex items-center p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            value={option}
                            checked={answers[currentQuestionIndex]?.answer_options?.includes(option) || false}
                            onChange={(e) => {
                              const currentOptions = answers[currentQuestionIndex]?.answer_options || [];
                              let newOptions;
                              
                              if (e.target.checked) {
                                // 最大選択数の制限
                                const maxSelections = currentQuestion.max_selections || (currentQuestion.question_type === 'ranking' ? 3 : undefined);
                                if (maxSelections && currentOptions.length >= maxSelections) {
                                  return; // 3つ以上は選択できない
                                }
                                newOptions = [...currentOptions, option];
                              } else {
                                newOptions = currentOptions.filter((opt: string) => opt !== option);
                              }
                              handleAnswer({ answer_options: newOptions });
                            }}
                            className="mr-3 text-orange-500"
                            disabled={(currentQuestion.max_selections || (currentQuestion.question_type === 'ranking' ? 3 : undefined)) && 
                                     !answers[currentQuestionIndex]?.answer_options?.includes(option) && 
                                     (answers[currentQuestionIndex]?.answer_options?.length || 0) >= (currentQuestion.max_selections || 3)}
                          />
                          <span className="text-white">{option}</span>
                          {(currentQuestion.max_selections || (currentQuestion.question_type === 'ranking' ? 3 : undefined)) && 
                           !answers[currentQuestionIndex]?.answer_options?.includes(option) && 
                           (answers[currentQuestionIndex]?.answer_options?.length || 0) >= (currentQuestion.max_selections || 3) && (
                            <span className="ml-auto text-xs text-gray-400">（上限{currentQuestion.max_selections || 3}つ）</span>
                          )}
                        </label>
                        {option.includes('その他') && isOtherSelected(option) && (
                          <div className="ml-6 mt-2">
                            <input
                              type="text"
                              placeholder="具体的に入力してください"
                              value={otherTexts[currentQuestionIndex] || ''}
                              onChange={(e) => handleOtherTextChange(currentQuestionIndex, e.target.value)}
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400 text-sm"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    {(currentQuestion.max_selections || (currentQuestion.question_type === 'ranking' ? 3 : undefined)) && (
                      <div className="text-center text-sm text-neutral-400 mt-2">
                        選択済み: {answers[currentQuestionIndex]?.answer_options?.length || 0} / {currentQuestion.max_selections || 3}
                      </div>
                    )}
                  </div>
                ) : (
                  // 単数選択の場合
                  <div className="space-y-3">
                    {currentQuestion.options?.map((option, index) => (
                      <div key={index}>
                        <label className="flex items-center p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                          <input
                            type="radio"
                            name="multiple_choice"
                            value={option}
                            checked={answers[currentQuestionIndex]?.answer_option === option}
                            onChange={(e) => handleAnswer({ answer_option: e.target.value })}
                            className="mr-3 text-orange-500"
                          />
                          <span className="text-white">{option}</span>
                        </label>
                        {option.includes('その他') && answers[currentQuestionIndex]?.answer_option === option && (
                          <div className="ml-6 mt-2">
                            <input
                              type="text"
                              placeholder="具体的に入力してください"
                              value={otherTexts[currentQuestionIndex] || ''}
                              onChange={(e) => handleOtherTextChange(currentQuestionIndex, e.target.value)}
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400 text-sm"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 text-neutral-300 border border-white/20 rounded-lg hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            前へ
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
          >
            {isLastQuestion ? '送信' : '次へ'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Point Exchange Modal Component
const PointExchangeModal: React.FC<{
  onClose: () => void;
  userEmail: string;
  currentPoints: number;
  monitorId: string;
}> = ({ onClose, userEmail, currentPoints, monitorId }) => {
  const [selectedType, setSelectedType] = useState<'paypay' | 'amazon' | 'starbucks' | null>(null);
  const [pointsAmount, setPointsAmount] = useState<number>(100);
  const [contactInfo, setContactInfo] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const exchangeOptions = [
    {
      type: 'paypay' as const,
      name: 'PayPay',
      icon: '💰',
      description: 'PayPayアカウントに送金',
      minPoints: 500,
      rate: '1ポイント = 1円'
    },
    {
      type: 'amazon' as const,
      name: 'Amazonギフトカード',
      icon: '🛒',
      description: 'Amazonギフトカードコード',
      minPoints: 500,
      rate: '1ポイント = 1円'
    },
    {
      type: 'starbucks' as const,
      name: 'スターバックスギフトカード',
      icon: '☕',
      description: 'スタバギフトカード',
      minPoints: 1000,
      rate: '1ポイント = 1円'
    }
  ];

  const selectedOption = exchangeOptions.find(opt => opt.type === selectedType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType || !contactInfo.trim()) {
      alert('すべての項目を入力してください。');
      return;
    }

    if (pointsAmount > currentPoints) {
      alert('保有ポイントを超えて交換することはできません。');
      return;
    }

    if (selectedOption && pointsAmount < selectedOption.minPoints) {
      alert(`${selectedOption.name}は最低${selectedOption.minPoints}ポイントから交換可能です。`);
      return;
    }

    setLoading(true);

    try {
      // データベースに交換リクエストを保存
      const { error: dbError } = await supabase
        .from('point_exchange_requests')
        .insert([{
          monitor_id: monitorId,
          exchange_type: selectedType,
          points_amount: pointsAmount,
          contact_info: contactInfo,
          notes: notes
        }]);

      if (dbError) throw dbError;

      // メール送信用のデータを準備
      const emailData = {
        to: 'koecan.koushiki@gmail.com',
        from: userEmail,
        subject: `【声キャン！】ポイント交換依頼 - ${selectedOption?.name}`,
        body: `
ポイント交換依頼が届きました。

■ 依頼者情報
メールアドレス: ${userEmail}

■ 交換内容
交換先: ${selectedOption?.name}
交換ポイント数: ${pointsAmount}ポイント
交換金額: ${pointsAmount}円相当

■ 連絡先情報
${contactInfo}

■ 備考
${notes || 'なし'}

処理をお願いいたします。
        `
      };

      setSuccess(true);
    } catch (error) {
      console.error('Error submitting exchange request:', error);
      alert('交換依頼の送信に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 w-full max-w-md shadow-2xl"
        >
          <div className="text-center">
            <div className="bg-green-500 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-4">交換依頼を送信しました</h2>
            <p className="text-neutral-300 mb-6 text-sm leading-relaxed">
              ポイント交換依頼をデータベースに保存しました。<br/>
              管理者が確認後、処理を行います。<br/>
              処理完了まで1-3営業日お待ちください。
            </p>
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              閉じる
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">ポイント交換</h2>
            <p className="text-sm text-neutral-300">現在のポイント: {currentPoints}pt</p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 交換先選択 */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-3">
              交換先を選択
            </label>
            <div className="grid grid-cols-1 gap-3">
              {exchangeOptions.map((option) => {
                const isDisabled = currentPoints < option.minPoints;
                return (
                  <label
                    key={option.type}
                    className={`flex items-center p-4 bg-white/5 border rounded-lg transition-colors ${
                      isDisabled 
                        ? 'opacity-50 cursor-not-allowed border-gray-500' 
                        : 'cursor-pointer hover:bg-white/10'
                    } ${
                      selectedType === option.type
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-white/10'
                    }`}
                  >
                    <input
                      type="radio"
                      name="exchangeType"
                      value={option.type}
                      disabled={isDisabled}
                      checked={selectedType === option.type}
                      onChange={(e) => {
                        setSelectedType(e.target.value as typeof selectedType);
                        setPointsAmount(option.minPoints);
                      }}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3 flex-1">
                      <span className="text-2xl">{option.icon}</span>
                      <div>
                        <div className="font-medium text-white">{option.name}</div>
                        <div className="text-sm text-neutral-400">{option.description}</div>
                        <div className="text-xs text-neutral-500">
                          最低{option.minPoints}pt〜 ({option.rate})
                          {isDisabled && (
                            <div className="text-xs text-red-400 mt-1">
                              ポイント不足（あと{option.minPoints - currentPoints}pt必要）
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {selectedType === option.type && !isDisabled && (
                      <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {selectedType && (
            <>
              {/* ポイント数入力 */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  交換ポイント数
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={pointsAmount}
                    onChange={(e) => setPointsAmount(Number(e.target.value))}
                    min={selectedOption?.minPoints || 100}
                    max={currentPoints}
                    step="100"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 text-sm">
                    pt
                  </div>
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  交換金額: {pointsAmount}円相当
                </div>
              </div>

              {/* 連絡先情報 */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  {selectedType === 'paypay' ? 'PayPay ID または 電話番号' :
                   selectedType === 'amazon' ? 'Amazonアカウントのメールアドレス' :
                   'ギフトカード送付先メールアドレス'}
                </label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
                  placeholder={
                    selectedType === 'paypay' ? '例: 090-1234-5678 または PayPay ID' :
                    selectedType === 'amazon' ? '例: amazon@example.com' :
                    '例: gift@example.com'
                  }
                  required
                />
              </div>

              {/* 備考 */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  備考（任意）
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
                  placeholder="特別な要望があればご記入ください"
                />
              </div>

              {/* 注意事項 */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <h4 className="font-medium text-yellow-300 mb-2">⚠️ 注意事項</h4>
                <ul className="text-sm text-yellow-200 space-y-1">
                  <li>• 交換処理には1-3営業日かかります</li>
                  <li>• 交換後のポイントは返却できません</li>
                  <li>• 連絡先情報は正確に入力してください</li>
                  <li>• 処理状況は登録メールアドレスにご連絡します</li>
                </ul>
              </div>
            </>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-300 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!selectedType || loading || pointsAmount > currentPoints}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>交換依頼を送信</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Advertisement Modal Component
const AdvertisementModal: React.FC<{
  advertisement: Advertisement;
  onClose: () => void;
}> = ({ advertisement, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col"
      >
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-xl font-semibold text-white">{advertisement.title}</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto">
          {advertisement.image_url && (
            <img 
              src={advertisement.image_url} 
              alt={advertisement.title}
              className="w-full h-auto max-h-96 object-contain rounded-lg mb-6"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          {advertisement.description && (
            <p className="text-neutral-300 leading-relaxed whitespace-pre-wrap">
              {advertisement.description}
            </p>
          )}
        </div>

        {advertisement.link_url && (
          <div className="mt-6 pt-6 border-t border-white/20 flex-shrink-0">
            <a
              href={advertisement.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              詳細はこちら
            </a>
          </div>
        )}
      </motion.div>
    </div>
  );
};


export default MonitorDashboard;

// Rotating Advertisements Component
interface RotatingAdvertisementsProps {
  advertisements: Advertisement[];
  onAdClick: (advertisement: Advertisement) => void;
}

const RotatingAdvertisements: React.FC<RotatingAdvertisementsProps> = ({ advertisements, onAdClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (advertisements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === advertisements.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [advertisements.length]);

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? advertisements.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === advertisements.length - 1 ? 0 : currentIndex + 1);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (advertisements.length === 0) return null;

  const currentAd = advertisements[currentIndex];

  return (
    <div className="relative">
      {/* メイン広告表示エリア */}
      <div 
        className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:border-orange-300 hover:shadow-md transition-all h-80 sm:h-60 flex items-center overflow-hidden cursor-pointer"
        onClick={() => onAdClick(currentAd)}
      >
        <motion.div
          key={currentAd.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row gap-4 w-full h-full"
        >
          {currentAd.image_url && (
            <div className="w-full md:w-2/5 flex-shrink-0 h-1/2 md:h-full">
              <img 
                src={currentAd.image_url} 
                alt={currentAd.title}
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex flex-col justify-center flex-grow overflow-hidden h-1/2 md:h-full">
            <h3 className="font-semibold text-gray-800 mb-2 text-base sm:text-lg truncate">{currentAd.title}</h3>
            {currentAd.description && (
              <div className="flex-grow overflow-hidden mb-3">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap line-clamp-2 sm:line-clamp-3">{currentAd.description}</p>
              </div>
            )}
            {currentAd.link_url && (
              <a
                href={currentAd.link_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl self-start mt-auto text-sm"
              >
                詳細を見る
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </motion.div>
      </div>

      {/* 複数の広告がある場合のナビゲーション */}
      {advertisements.length > 1 && (
        <>
          {/* 前/次ボタン */}
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white border border-gray-200 rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white border border-gray-200 rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>

          {/* インジケーター */}
          <div className="flex justify-center mt-4 space-x-2">
            {advertisements.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-orange-500 scale-110'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

        </>
      )}
    </div>
  );
};