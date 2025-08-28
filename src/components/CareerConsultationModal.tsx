import React, { useState } from 'react';
import { X, MessageCircle, User, Clock, Calendar, BookOpen, Edit3, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../config/supabase';
import { ChatModal } from './ChatModal';

interface CareerConsultationModalProps {
  onClose: () => void;
  user: Record<string, unknown>;
  onChatOpen?: (roomId?: string) => void;
  initialServiceId?: string | null;
}

export const CareerConsultationModal: React.FC<CareerConsultationModalProps> = ({ onClose, user, onChatOpen, initialServiceId }) => {
  const [selectedService, setSelectedService] = useState<string | null>(initialServiceId || null);
  const [formData, setFormData] = useState({
    consultationType: initialServiceId || '',
    message: '',
    name: user?.name || '',
    email: user?.email || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);


  const consultationTypes = [
    {
      id: 'career-planning',
      title: '就職活動全般相談',
      description: '就活の進め方、業界研究、企業選びなど',
      duration: '60分',
      icon: <Users className="w-6 h-6" />,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'resume-review',
      title: 'ES添削',
      description: 'エントリーシート、履歴書の書き方指導',
      duration: '45分',
      icon: <Edit3 className="w-6 h-6" />,
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'cv-review',
      title: '履歴書添削',
      description: '履歴書のブラッシュアップ',
      duration: '45分',
      icon: <BookOpen className="w-6 h-6" />,
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      id: 'interview-prep',
      title: '面接対策',
      description: '模擬面接、面接マナー、質問対策',
      duration: '60分',
      icon: <MessageCircle className="w-6 h-6" />,
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'industry-research',
      title: '業界・企業研究',
      description: '業界動向、企業分析、職種理解',
      duration: '45分',
      icon: <Calendar className="w-6 h-6" />,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // サポートスタッフのユーザーIDを取得
      const { data: supportUser, error: supportError } = await supabase
        .from('users')
        .select('id')
        .eq('email', 'support@example.com')
        .single();

      if (supportError) {
        console.error('Error fetching support user:', supportError);
        throw supportError;
      }

      if (!supportUser) {
        console.error('Support user not found');
        throw new Error('Support user not found');
      }

      // サポートチャットルームを作成または取得
      const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('room_type', 'support')
        .contains('participants', [user?.id])
        .maybeSingle();

      let roomId = existingRoom?.id;

      if (!existingRoom) {
        // サポートルームを作成（モニターとサポートスタッフの両方が参加）
        const { data: newRoom, error: roomError } = await supabase
          .from('chat_rooms')
          .insert([{
            name: 'キャリア相談サポート',
            room_type: 'support',
            participants: [user?.id, supportUser.id],
            created_by: user?.id
          }])
          .select()
          .single();

        if (roomError) throw roomError;
        roomId = newRoom.id;
        setCreatedRoomId(newRoom.id);
      } else {
        // 既存のルームにサポートスタッフが参加していない場合は追加
        if (!existingRoom.participants.includes(supportUser.id)) {
          const { error: updateError } = await supabase
            .from('chat_rooms')
            .update({
              participants: [...existingRoom.participants, supportUser.id]
            })
            .eq('id', existingRoom.id);

          if (updateError) throw updateError;
        }
      }

      // 相談内容をチャットメッセージとして送信
      const selectedConsultation = consultationTypes.find(t => t.id === selectedService);
      const messageContent = `【キャリア相談申込】

相談内容: ${selectedConsultation?.title}
お名前: ${formData.name}
メールアドレス: ${formData.email}

詳細・質問:
${formData.message || '特になし'}

よろしくお願いいたします。`;

      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert([{
          sender_id: user?.id,
          room_id: roomId,
          message: messageContent,
          message_type: 'text',
          is_read: false
        }]);

      if (messageError) throw messageError;

      setIsSubmitted(true);
      // 自動的にチャットモーダルを開く
      setTimeout(() => {
        if (onChatOpen) {
          onChatOpen(roomId);
        } else {
          setShowChatModal(true);
        }
      }, 2000); // 2秒後にチャットモーダルを開く
    } catch (error) {
      console.error('Error submitting career consultation:', error);
      alert('相談申込の送信に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"
        >
          <div className="text-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              相談申込を送信しました！
            </h2>
            <p className="text-gray-600 mb-6">
              チャットで担当カウンセラーからご連絡いたします。
              <br /><br />
              2秒後にチャット画面が自動的に開きます。
              <br />
              チャット画面でやり取りを続けることができます。
            </p>
            <div className="flex space-x-4 justify-center">
              <button
                onClick={() => {
                  onClose();
                  setShowChatModal(true);
                }}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>チャットを開く</span>
              </button>
              <button
                onClick={onClose}
                className="bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                閉じる
              </button>
            </div>
          </div>
        </motion.div>
        
        {showChatModal && (
          <ChatModal
            onClose={() => setShowChatModal(false)}
            user={user}
          />
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">キャリア相談</h2>
            <p className="text-gray-600">専門カウンセラーによる無料相談</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {!selectedService ? (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">相談内容を選択してください</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {consultationTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedService(type.id)}
                  className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-lg transition-all duration-300 text-left"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`bg-gradient-to-br ${type.color} rounded-full p-3 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                      {type.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 mb-2">{type.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{type.duration}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>            
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {consultationTypes.find(t => t.id === selectedService)?.title}
              </h3>
              <p className="text-gray-600">
                {consultationTypes.find(t => t.id === selectedService)?.description}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    お名前 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メールアドレス <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  詳細・質問内容
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="具体的な相談内容や質問があれば記入してください（任意）"
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">💬 チャット相談の流れ</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>1. 申込内容がチャットで送信されます</li>
                  <li>2. 担当カウンセラーがチャットで返信</li>
                  <li>3. チャットでリアルタイムに相談</li>
                  <li>4. 必要に応じて資料やリンクを共有</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>送信中...</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4" />
                      <span>チャットで相談申込</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
};