import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle, Phone, Video, MoreVertical } from 'lucide-react';
import { supabase } from '../config/supabase';
import { User, ChatMessage, ChatRoom } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatModalProps {
  onClose: () => void;
  user: User | null;
  initialRoomId?: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({ onClose, user, initialRoomId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchChatRooms();
      setupRealtimeSubscription();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatRooms = async () => {
    if (!user) return;

    try {
      // サポートチャットルームを取得
      console.log('Fetching support chat room for user...');
      
      const { data: existingRooms, error: fetchError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('room_type', 'support')
        .contains('participants', [user.id])
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      console.log('Found existing support rooms:', existingRooms);

      if (existingRooms && existingRooms.length > 0) {
        setRooms(existingRooms);
        
        // 初期ルームIDが指定されている場合はそれを選択
        if (initialRoomId) {
          const targetRoom = existingRooms.find(room => room.id === initialRoomId);
          if (targetRoom) {
            console.log('Setting initial room as active:', targetRoom);
            setActiveRoom(targetRoom);
            fetchMessages(targetRoom.id);
            return;
          }
        }
        
        // 最初のサポートルームを選択
        console.log('Setting support room as active:', existingRooms[0]);
        setActiveRoom(existingRooms[0]);
        fetchMessages(existingRooms[0].id);
      } else {
        // サポートチャットルームがない場合は何も表示しない
        console.log('No existing support room found. User needs to apply for career consultation first.');
        setRooms([]);
        setActiveRoom(null);
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSupportChat = async () => {
    if (!user) return;

    try {
      // サポートスタッフのユーザーIDを取得
      const { data: supportUser, error: supportError } = await supabase
        .from('users')
        .select('id, name')
        .eq('email', 'support@example.com')
        .single();

      if (supportError) {
        console.error('Error fetching support user:', supportError);
        return;
      }

      if (!supportUser) {
        console.error('Support user not found');
        return;
      }

      // 新しいサポートチャットを作成
      const { data: newRoom, error: createError } = await supabase
        .from('chat_rooms')
        .insert([{
          room_type: 'support',
          participants: [user.id, supportUser.id],
          created_by: user.id,
          name: `シーエイト`
        }])
        .select()
        .single();

      if (createError) throw createError;

      console.log('New support chat created:', newRoom);
      setRooms([newRoom]);
      setActiveRoom(newRoom);
      fetchMessages(newRoom.id);
    } catch (error) {
      console.error('Error creating support chat:', error);
    }
  };



  const fetchMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:users!chat_messages_sender_id_fkey(*)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
      
      // キャリア相談の申込メッセージがあるかチェック
      const hasCareerConsultation = data?.some(msg => 
        msg.message && msg.message.includes('【キャリア相談申込】')
      );

      // 申請者の名前を抽出してチャットルーム名を更新
      if (hasCareerConsultation && data && data.length > 0) {
        const consultationMessage = data.find(msg => 
          msg.message && msg.message.includes('【キャリア相談申込】')
        );
        
        if (consultationMessage) {
          const nameMatch = consultationMessage.message.match(/お名前:\s*([^\n\r]+)/);
          if (nameMatch && nameMatch[1]) {
            const applicantName = nameMatch[1].trim();
            updateRoomName(roomId, `シーエイト`);
          }
        }
      }
      
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!activeRoom) return;

    const subscription = supabase
      .channel(`chat_room_${activeRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${activeRoom.id}`,
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage;
          
          // 自分が送信したメッセージの場合は、既に表示されているので追加しない
          if (newMessage.sender_id === user?.id) {
            return;
          }
          
          // Fetch sender info
          const { data: senderData } = await supabase
            .from('users')
            .select('*')
            .eq('id', newMessage.sender_id)
            .single();

          if (senderData) {
            newMessage.sender = senderData;
          }

          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !activeRoom) return;

    try {
      const messageToSend = newMessage.trim();
      
      // 新しいメッセージオブジェクトを作成
      const newMessageObj = {
        id: `temp-${Date.now()}`, // 一時的なID
        room_id: activeRoom.id,
        sender_id: user.id,
        message: messageToSend,
        message_type: 'text',
        is_read: false,
        created_at: new Date().toISOString(),
        sender: {
          name: user.name,
          email: user.email
        }
      };

      // まずUIに即座に表示
      setMessages(prev => [...prev, newMessageObj]);
      setNewMessage('');

      // データベースに送信
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          sender_id: user.id,
          room_id: activeRoom.id,
          message: messageToSend,
          message_type: 'text',
          is_read: false
        }])
        .select()
        .single();

      if (error) throw error;

      // データベースから取得した実際のメッセージで一時的なメッセージを置き換え
      if (data) {
        setMessages(prev => prev.map(msg => 
          msg.id === newMessageObj.id ? { ...data, sender: { name: user.name, email: user.email } } : msg
        ));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // エラーが発生した場合、一時的なメッセージを削除
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
      // エラーメッセージを表示
      alert('メッセージの送信に失敗しました。もう一度お試しください。');
    }
  };



  const updateRoomName = async (roomId: string, newName: string) => {
    try {
      // チャットルーム名を更新
      const { error: updateError } = await supabase
        .from('chat_rooms')
        .update({ name: newName })
        .eq('id', roomId);

      if (updateError) throw updateError;

      // ルームリストを更新
      setRooms(prev => prev.map(room => 
        room.id === roomId ? { ...room, name: newName } : room
      ));

      // 現在アクティブなルームの場合、アクティブルームも更新
      if (activeRoom?.id === roomId) {
        setActiveRoom(prev => prev ? { ...prev, name: newName } : null);
      }
    } catch (error) {
      console.error('Error updating room name:', error);
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!user) return;

    try {
      // チャットルームを削除
      const { error: deleteError } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', roomId);

      if (deleteError) throw deleteError;

      // 削除されたルームが現在アクティブなルームの場合、最初のルームを選択
      if (activeRoom?.id === roomId) {
        const remainingRooms = rooms.filter(room => room.id !== roomId);
        if (remainingRooms.length > 0) {
          setActiveRoom(remainingRooms[0]);
          fetchMessages(remainingRooms[0].id);
        } else {
          setActiveRoom(null);
        }
      }

      // ルームリストを更新
      setRooms(prev => prev.filter(room => room.id !== roomId));
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    // Enterキーで改行（送信はしない）
    if (e.key === 'Enter') {
      // デフォルトの改行動作を許可
      return;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex shadow-2xl overflow-hidden"
      >
        {/* Sidebar */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-orange-600" />
                チャット
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>



          {/* Chat Rooms */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-600 mb-3">キャリア相談サポート</h3>
              <div className="space-y-2">
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => {
                      setActiveRoom(room);
                      fetchMessages(room.id);
                    }}
                    className={`w-full flex items-center p-3 rounded-lg transition-colors text-left ${
                      activeRoom?.id === room.id
                        ? 'bg-orange-100 border border-orange-200'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                      S
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {room.name || 'キャリア相談サポート'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        キャリア相談チャット
                      </p>
                    </div>
                    {rooms.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRoom(room.id);
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="チャットルームを削除"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeRoom ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                      S
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">
                        {activeRoom.name || 'キャリア相談サポート'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        サポートスタッフが対応します
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      <Video className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${message.sender_id === user?.id ? 'order-2' : 'order-1'}`}>
                        <div className={`px-4 py-2 rounded-2xl ${
                          message.sender_id === user?.id
                            ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          <div className="text-sm whitespace-pre-wrap">{message.message}</div>
                        </div>
                        <div className={`flex items-center mt-1 space-x-2 ${
                          message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                        }`}>
                          {message.sender_id !== user?.id && (
                            <span className="text-xs text-gray-500">{message.sender?.name}</span>
                          )}
                          <span className="text-xs text-gray-400">{formatTime(message.created_at)}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-center space-x-3">
                  <div className="flex-1 relative">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="メッセージを入力... (Enterで改行、送信ボタンで送信)"
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      rows={1}
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white p-3 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">キャリア相談の申込が必要です</p>
                <p className="text-sm text-gray-400">キャリア相談を申し込むと、サポートスタッフとのチャットが開始されます</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};