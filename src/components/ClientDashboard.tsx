import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../config/supabase';
import { Survey, Question } from '../types';
import { Plus, BarChart3, FileText, Download, Eye, Edit, Trash2, Users, Calendar, Upload, X, Star, MessageCircle } from 'lucide-react';

import { ImportSurveyModal } from './ImportSurveyModal';
import { ChatModal } from './ChatModal';
import { SparklesCore } from './ui/sparkles';
import { motion } from 'framer-motion';

// CreateSurveyModalをClientDashboardの前に定義
interface CreateSurveyModalProps {
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  surveyToEdit?: Survey | null;
}

const CreateSurveyModal: React.FC<CreateSurveyModalProps> = ({ onClose, onSubmit, surveyToEdit }) => {
  const isEditMode = !!surveyToEdit;
  const [showImportModal, setShowImportModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points_reward: 10,
    questions: [
      {
        question_text: '',
        question_type: 'text',
        options: [] as string[],
        required: false,
        is_multiple_select: false
      }
    ]
  });

  useEffect(() => {
    if (isEditMode && surveyToEdit) {
      setFormData({
        title: surveyToEdit.title,
        description: surveyToEdit.description,
        points_reward: surveyToEdit.points_reward,
        questions: surveyToEdit.questions.map(q => ({
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options || [],
          required: q.required,
          is_multiple_select: q.is_multiple_select || false,
          max_selections: q.max_selections || undefined,
        }))
      });
    }
  }, [isEditMode, surveyToEdit]);

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, {
        question_text: '',
        question_type: 'text',
        options: [],
        required: false,
        is_multiple_select: false
      }]
    }));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submissionData = isEditMode ? { ...formData, id: surveyToEdit?.id } : formData;
    onSubmit(submissionData);
  };

  const handleImportSurvey = (importedData: any) => {
    setFormData(prev => ({
      ...prev,
      title: importedData.title,
      description: importedData.description,
      questions: importedData.questions
    }));
    setShowImportModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">{isEditMode ? 'アンケートを編集' : '新しいアンケートを作成'}</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              アンケートタイトル
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-neutral-400"
              placeholder="アンケートのタイトルを入力"
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
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-neutral-400"
              rows={3}
              placeholder="アンケートの説明を入力"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              報酬ポイント
            </label>
            <input
              type="number"
              value={formData.points_reward}
              onChange={(e) => setFormData(prev => ({ ...prev, points_reward: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-neutral-400"
              min="1"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-neutral-300">
                質問
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-3 py-1 rounded text-sm transition-all duration-300 transform hover:scale-105 flex items-center space-x-1"
                >
                  <Upload className="w-4 h-4" />
                  <span>インポート</span>
                </button>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-3 py-1 rounded text-sm transition-all duration-300 transform hover:scale-105"
                >
                  質問を追加
                </button>
              </div>
            </div>

            {formData.questions.map((question, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-white">質問 {index + 1}</h4>
                  {formData.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">
                      質問文
                    </label>
                    <input
                      type="text"
                      value={question.question_text}
                      onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
                      placeholder="質問文を入力"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">
                      質問タイプ
                    </label>
                    <select
                      value={question.question_type}
                      onChange={(e) => updateQuestion(index, 'question_type', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                    >
                      <option value="text" className="bg-slate-800">テキスト</option>
                      <option value="multiple_choice" className="bg-slate-800">選択肢</option>
                      <option value="ranking" className="bg-slate-800">上位3位ランキング</option>
                    </select>
                  </div>

                  {question.question_type === 'multiple_choice' && (
                    <label className="flex items-center p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                      <input
                        type="checkbox"
                        id={`multiple-select-${index}`}
                        checked={question.is_multiple_select}
                        onChange={(e) => updateQuestion(index, 'is_multiple_select', e.target.checked)}
                        className="mr-2 text-orange-500"
                      />
                      <span className="text-sm text-neutral-300">
                        複数選択可能
                      </span>
                    </label>
                  )}

                  {question.question_type === 'ranking' && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                      <p className="text-orange-300 text-sm">
                        📊 上位3位ランキング質問として設定されます（複数選択・最大3つまで）
                      </p>
                    </div>
                  )}
                  {(question.question_type === 'multiple_choice' || question.question_type === 'ranking') && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">
                        選択肢（カンマ区切り）
                      </label>
                      <input
                        type="text"
                        value={question.options.join(', ')}
                        onChange={(e) => updateQuestion(index, 'options', e.target.value.split(', ').filter(Boolean))}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-neutral-400"
                        placeholder={question.question_type === 'ranking' ? "例: 商品A, 商品B, 商品C, 商品D, 商品E" : "例: 選択肢1, 選択肢2, 選択肢3"}
                      />
                    </div>
                  )}

                  <label className="flex items-center p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                    <input
                      type="checkbox"
                      id={`required-${index}`}
                      checked={question.required}
                      onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                      className="mr-2 text-orange-500"
                    />
                    <span className="text-sm text-neutral-300">
                      必須項目
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </div>

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
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              {isEditMode ? '更新' : '作成'}
            </button>
          </div>
        </form>

        {showImportModal && (
          <ImportSurveyModal
            onClose={() => setShowImportModal(false)}
            onImport={handleImportSurvey}
          />
        )}
      </div>
    </div>
  );
};

export const ClientDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchSurveys();
    }
  }, [user?.id]); // Only depend on user ID, not the entire user object

  const fetchSurveys = async () => {
    if (!user?.id) {
      console.error('User ID is not available');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('surveys')
        .select(`
          *,
          questions(*),
          responses_count:responses(count)
        `)
        .eq('client_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const surveysWithCounts = data.map(survey => ({
        ...survey,
        questions: survey.questions.sort((a, b) => a.order_index - b.order_index),
        responses_count: survey.responses_count?.[0]?.count || 0
      }));

      setSurveys(surveysWithCounts);
    } catch (error) {
      console.error('Error fetching surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSurvey = async (surveyData: any) => {
    try {
      // Filter out section headers from questions
      const actualQuestions = surveyData.questions.filter((q: any) => q.question_type !== 'section_header');
      
      // Process questions to set proper attributes for ranking questions
      const processedQuestions = actualQuestions.map((q: any) => {
        if (q.question_type === 'ranking') {
          return {
            ...q,
            is_multiple_select: true,
            max_selections: 3
          };
        }
        return q;
      });
      
      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .insert([{
          client_id: user?.id,
          title: surveyData.title,
          description: surveyData.description,
          points_reward: surveyData.points_reward,
          status: 'draft'
        }])
        .select()
        .single();

      if (surveyError) throw surveyError;

      // Create questions
      const questions = processedQuestions.map((q: any, index: number) => ({
        survey_id: survey.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options || [],
        required: q.required || false,
        order_index: index,
        is_multiple_select: q.is_multiple_select || false,
        max_selections: q.max_selections || null
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questions);

      if (questionsError) throw questionsError;

      setShowCreateModal(false);
      fetchSurveys();
    } catch (error) {
      console.error('Error creating survey:', error);
    }
  };

  const handleUpdateSurvey = async (surveyData: any) => {
    try {
      // 1. Update the survey details
      const { error: surveyUpdateError } = await supabase
        .from('surveys')
        .update({
          title: surveyData.title,
          description: surveyData.description,
          points_reward: surveyData.points_reward,
        })
        .eq('id', surveyData.id);

      if (surveyUpdateError) throw surveyUpdateError;

      // 2. Delete all existing questions for this survey
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('survey_id', surveyData.id);

      if (deleteError) throw deleteError;
      
      // 3. Insert the new set of questions
      const newQuestions = surveyData.questions.map((q: any, index: number) => ({
        survey_id: surveyData.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options || [],
        required: q.required || false,
        order_index: index,
        is_multiple_select: q.is_multiple_select || false,
        max_selections: q.max_selections || null
      }));
      
      if (newQuestions.length > 0) {
        const { error: insertError } = await supabase
          .from('questions')
          .insert(newQuestions);

        if (insertError) throw insertError;
      }

      setEditingSurvey(null);
      fetchSurveys();
    } catch (error) {
      console.error('Error updating survey:', error);
      alert('アンケートの更新に失敗しました。');
    }
  };

  const handleUpdateSurveyStatus = async (surveyId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('surveys')
        .update({ status })
        .eq('id', surveyId);

      if (error) throw error;

      fetchSurveys();
    } catch (error) {
      console.error('Error updating survey status:', error);
    }
  };

  const handleDeleteSurvey = async (surveyId: string, surveyTitle: string) => {
    if (!confirm(`「${surveyTitle}」を削除してもよろしいですか？この操作は取り消せません。`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('surveys')
        .delete()
        .eq('id', surveyId);

      if (error) throw error;

      // Refresh surveys list
      fetchSurveys();
    } catch (error) {
      console.error('Error deleting survey:', error);
      alert('アンケートの削除に失敗しました。');
    }
  };

  const handleExportCSV = async (surveyId: string) => {
    try {
      // Get survey with questions and responses
      const { data: surveyData, error: surveyError } = await supabase
        .from('surveys')
        .select(`
          *,
          questions(*)
        `)
        .eq('id', surveyId)
        .single();

      if (surveyError) throw surveyError;

      const { data: responsesData, error: responsesError } = await supabase
        .from('responses')
        .select(`
          *,
          monitor:users!responses_monitor_id_fkey(name, email)
        `)
        .eq('survey_id', surveyId);

      if (responsesError) throw responsesError;

      // Sort questions by order_index to maintain order
      const sortedQuestions = (surveyData.questions || []).sort((a, b) => a.order_index - b.order_index);

      // Create question map for easy lookup
      const questionMap = new Map(sortedQuestions.map(q => [q.id, q]));

      // Convert to CSV format
      const csvData = responsesData.map(response => {
        const row: any = {
          '回答者名': response.monitor?.name || 'Unknown Monitor',
          'メールアドレス': response.monitor?.email || 'unknown@example.com',
          '回答日時': new Date(response.completed_at).toLocaleString('ja-JP'),
        };

        // Create answer map for easy lookup
        const answerMap = new Map(response.answers.map((answer: any) => [answer.question_id, answer]));

        // Add answers in question order
        sortedQuestions.forEach(question => {
          const answer = answerMap.get(question.id);
          const columnName = question.question_text;
          
          if (answer) {
            if (answer.answer_text) {
              // Text answer
              row[columnName] = answer.answer_text;
            } else if (answer.answer_option) {
              // Single choice answer
              let answerValue = answer.answer_option;
              if (answer.other_text) {
                answerValue += ` (${answer.other_text})`;
              }
              row[columnName] = answerValue;
            } else if (answer.answer_options && Array.isArray(answer.answer_options)) {
              // Multiple choice answer
              let answerValue = answer.answer_options.join(', ');
              if (answer.other_text) {
                answerValue += ` (その他: ${answer.other_text})`;
              }
              row[columnName] = answerValue;
            } else {
              row[columnName] = '未回答';
            }
          } else {
            row[columnName] = '未回答';
          }
        });

        return row;
      });

      // Create and download CSV
      const csvContent = convertToCSV(csvData);
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      
      // Use survey title in filename
      const filename = `${surveyData.title}_responses_${new Date().toISOString().split('T')[0]}.csv`;
      link.download = filename;
      link.click();
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
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
          id="tsparticlesclient"
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

      <header className="relative z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-2 shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500">
                  クライアントダッシュボード
                </h1>
                <p className="text-sm text-gray-600">こんにちは、{user?.name}さん</p>
              </div>
            </motion.div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowChatModal(true)}
                className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 px-3 py-2 rounded-lg hover:bg-orange-50 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span>チャット</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                <span>アンケート作成</span>
              </button>
              <button
                onClick={signOut}
                className="text-gray-600 hover:text-orange-600 px-3 py-1 rounded-lg hover:bg-orange-50 transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-100 p-6 shadow-xl">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-3 shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">総アンケート数</p>
                <p className="text-2xl font-bold text-orange-600">{surveys.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-100 p-6 shadow-xl">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-3 shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">総回答数</p>
                <p className="text-2xl font-bold text-orange-600">
                  {surveys.reduce((sum, survey) => sum + survey.responses_count, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-100 p-6 shadow-xl">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-3 shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">実行中のアンケート</p>
                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500">
                  {surveys.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-100 shadow-xl"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">アンケート一覧</h2>
          </div>
          <div className="p-6">
            {surveys.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">まだアンケートがありません。</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  最初のアンケートを作成
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {surveys.map((survey) => (
                  <div key={survey.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-800">{survey.title}</h3>
                        <p className="text-sm text-gray-600">{survey.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          survey.status === 'active' ? 'bg-green-100 text-green-700 border border-green-300' :
                          survey.status === 'draft' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                          'bg-gray-100 text-gray-700 border border-gray-300'
                        }`}>
                          {survey.status === 'active' ? '実行中' : 
                           survey.status === 'draft' ? '下書き' : '完了'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {survey.responses_count} 回答
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(survey.created_at).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedSurvey(survey)}
                          className="text-orange-600 hover:text-orange-700 flex items-center space-x-1 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span>詳細</span>
                        </button>
                        <button
                          onClick={() => setEditingSurvey(survey)}
                          className="text-blue-600 hover:text-blue-700 flex items-center space-x-1 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          <span>編集</span>
                        </button>
                        <button
                          onClick={() => handleExportCSV(survey.id)}
                          className="text-green-600 hover:text-green-700 flex items-center space-x-1 transition-colors"
                          disabled={survey.responses_count === 0}
                        >
                          <Download className="w-4 h-4" />
                          <span>CSV</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSurvey(survey.id, survey.title)}
                          className="text-red-600 hover:text-red-700 flex items-center space-x-1 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>削除</span>
                        </button>
                        {survey.status === 'draft' && (
                          <button
                            onClick={() => handleUpdateSurveyStatus(survey.id, 'active')}
                            className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white px-3 py-1 rounded text-sm transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                          >
                            公開
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-gray-50 to-transparent"></div>

      {showCreateModal && (
        <CreateSurveyModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSurvey}
        />
      )}
      
      {editingSurvey && (
        <CreateSurveyModal
          surveyToEdit={editingSurvey}
          onClose={() => setEditingSurvey(null)}
          onSubmit={handleUpdateSurvey}
        />
      )}

      {selectedSurvey && (
        <SurveyDetailModal
          survey={selectedSurvey}
          onClose={() => setSelectedSurvey(null)}
        />
      )}

      {showChatModal && (
        <ChatModal
          onClose={() => setShowChatModal(false)}
          user={user}
        />
      )}
    </div>
  );
};

// Survey Detail Modal Component
const SurveyDetailModal: React.FC<{
  survey: Survey;
  onClose: () => void;
}> = ({ survey, onClose }) => {
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResponses();
  }, []);

  const fetchResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('responses')
        .select(`
          *,
          monitor:users!responses_monitor_id_fkey(name, email)
        `)
        .eq('survey_id', survey.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setResponses(data || []);
    } catch (error) {
      console.error('Error fetching responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return 'テキスト';
      case 'multiple_choice': return '選択肢';
      case 'ranking': return '上位3位ランキング';
      default: return type;
    }
  };

  const getAnswerDisplay = (answer: any, question: Question) => {
    if (answer.answer_text) return answer.answer_text;
    if (answer.answer_option) return answer.answer_option;
    if (answer.answer_rating) return `${answer.answer_rating}/5`;
    if (answer.answer_boolean !== undefined) return answer.answer_boolean ? 'はい' : 'いいえ';
    return '未回答';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">{survey.title}</h2>
            <p className="text-neutral-300 mt-1">{survey.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Survey Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-100 p-4 shadow-xl">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-2 shadow-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">作成日</p>
                <p className="text-lg font-bold text-orange-600">{new Date(survey.created_at).toLocaleDateString('ja-JP')}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-100 p-4 shadow-xl">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-2 shadow-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">回答数</p>
                <p className="text-lg font-bold text-orange-600">{survey.responses_count}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-100 p-4 shadow-xl">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-2 shadow-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">質問数</p>
                <p className="text-lg font-bold text-orange-600">{survey.questions?.length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-100 p-4 shadow-xl">
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full p-2 shadow-lg">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">報酬ポイント</p>
                <p className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500">{survey.points_reward}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/20 mb-6">
          <nav className="flex space-x-8">
            <button className="py-2 px-1 border-b-2 border-orange-400 text-orange-400 font-medium text-sm">
              質問一覧
            </button>
          </nav>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">質問一覧</h3>
          {survey.questions && survey.questions.length > 0 ? (
            <div className="space-y-4">
              {survey.questions
                .sort((a, b) => a.order_index - b.order_index)
                .map((question, index) => (
                <div key={question.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="bg-orange-500/20 text-orange-300 text-xs font-medium px-2 py-1 rounded border border-orange-500/30">
                          質問 {index + 1}
                        </span>
                        <span className="bg-gray-500/20 text-gray-300 text-xs font-medium px-2 py-1 rounded border border-gray-500/30">
                          {getQuestionTypeLabel(question.question_type)}
                        </span>
                        {question.required && (
                          <span className="bg-red-500/20 text-red-300 text-xs font-medium px-2 py-1 rounded border border-red-500/30">
                            必須
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium text-white mb-2">{question.question_text}</h4>
                      
                      {question.question_type === 'multiple_choice' && question.options && question.options.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-neutral-400 mb-1">選択肢:</p>
                          <ul className="list-disc list-inside text-sm text-neutral-300 space-y-1">
                            {question.options.map((option, optionIndex) => (
                              <li key={optionIndex}>{option}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {question.question_type === 'rating' && (
                        <div className="mt-2">
                          <p className="text-sm text-neutral-400">評価: 1〜5段階</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
              <p className="text-neutral-400">質問がありません</p>
            </div>
          )}
        </div>

        {/* Responses Section */}
        {survey.responses_count > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-white mb-4">最近の回答</h3>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {responses.slice(0, 5).map((response) => (
                  <div key={response.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-white">{response.monitor?.name}</p>
                        <p className="text-sm text-neutral-300">{response.monitor?.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-neutral-400">
                          {new Date(response.completed_at).toLocaleDateString('ja-JP')}
                        </p>
                        <p className="text-sm font-medium text-orange-400">
                          +{response.points_earned} ポイント
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-neutral-300">
                      回答数: {response.answers?.length || 0} 件
                    </div>
                  </div>
                ))}
                {responses.length > 5 && (
                  <p className="text-center text-sm text-neutral-400">
                    他 {responses.length - 5} 件の回答があります
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            閉じる
          </button>
        </div>
      </motion.div>
    </div>
  );
};