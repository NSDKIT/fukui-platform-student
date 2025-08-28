import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../config/supabase';
import { User, ChatMessage, ChatRoom } from '../types';
import { 
  MessageCircle, 
  Users, 
  LogOut, 
  Send,
  Phone,
  Mail,
  Calendar,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SparklesCore } from './ui/sparkles';

const SupportDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [supportStaff, setSupportStaff] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'rooms' | 'staff' | 'users'>('rooms');

  useEffect(() => {
    if (user) {
      fetchChatRooms();
      fetchOnlineUsers();
      fetchSupportStaff();
    }
  }, [user, fetchChatRooms, fetchOnlineUsers]);

  useEffect(() => {
    if (activeRoom) {
      setupRealtimeSubscription();
    }
  }, [activeRoom, setupRealtimeSubscription]);

    const fetchChatRooms = async () => {
    if (!user) return;

    try {
      console.log('=== Starting fetchChatRooms ===');
      
      // まず、メッセージが存在するチャットルームを直接確認
      console.log('Checking for rooms with messages...');
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('room_id')
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;
      console.log('Messages found:', messagesData);

      if (messagesData && messagesData.length > 0) {
        // メッセージが存在するルームIDを取得
        const roomIds = [...new Set(messagesData.map(msg => msg.room_id))];
        console.log('Room IDs with messages:', roomIds);

        // これらのルームの詳細情報を取得
        const { data: roomsData, error: roomsError } = await supabase
          .from('chat_rooms')
          .select(`
            *,
            participants_info:users(id, name, email, role)
          `)
          .in('id', roomIds);

        if (roomsError) throw roomsError;
        console.log('Rooms with messages:', roomsData);

        if (roomsData && roomsData.length > 0) {
          // メッセージ数が多いルームを選択
          const roomsWithMessageCounts = await Promise.all(
            roomsData.map(async (room) => {
              const { count } = await supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('room_id', room.id);
              return { room, messageCount: count || 0 };
            })
          );

          console.log('Rooms with message counts:', roomsWithMessageCounts);

          const roomWithMostMessages = roomsWithMessageCounts
            .sort((a, b) => b.messageCount - a.messageCount)[0];

          console.log('Selected room with most messages:', roomWithMostMessages);
          setRooms(roomsData);
          setActiveRoom(roomWithMostMessages.room);
          fetchMessages(roomWithMostMessages.room.id);
          return;
        }
      }

      // フォールバック: 通常のチャットルーム取得
      console.log('Fallback: fetching user rooms...');
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          participants_info:users(id, name, email, role)
        `)
        .contains('participants', [user.id])
        .order('updated_at', { ascending: false });

      if (error) throw error;
      console.log('User rooms found:', data);
      
      if (data && data.length > 0) {
        setRooms(data);
        const firstRoom = data[0];
        console.log('Selected first room:', firstRoom);
        setActiveRoom(firstRoom);
        fetchMessages(firstRoom.id);
      } else {
        console.log('No rooms found for user');
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOnlineUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .neq('id', user?.id)
        .limit(20);

      if (error) throw error;
      setOnlineUsers(data || []);
    } catch (error) {
      console.error('Error fetching online users:', error);
    }
  };

  const fetchSupportStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'support')
        .order('name');

      if (error) throw error;
      setSupportStaff(data || []);
    } catch (error) {
      console.error('Error fetching support staff:', error);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      console.log('=== Starting fetchMessages ===');
      console.log('Room ID:', roomId);
      
      // まず、そのルームにメッセージが存在するか確認
      const { count, error: countError } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId);

      if (countError) throw countError;
      console.log('Message count for room:', count);

      if (count === 0) {
        console.log('No messages found for this room');
        setMessages([]);
        return;
      }

      // メッセージを取得
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:users(name, email)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      console.log('Fetched messages:', data);
      console.log('Number of messages fetched:', data?.length || 0);
      
      setMessages(data || []);

      // 申請者の名前を抽出してチャットルーム名を更新
      if (data && data.length > 0) {
        const consultationMessage = data.find(msg => 
          msg.message && msg.message.includes('【キャリア相談申込】')
        );
        
        if (consultationMessage) {
          const nameMatch = consultationMessage.message.match(/お名前:\s*([^\n\r]+)/);
          if (nameMatch && nameMatch[1]) {
            const applicantName = nameMatch[1].trim();
            updateRoomName(roomId, `${applicantName}`);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    console.log('Setting up realtime subscription for active room:', activeRoom?.id);
    
    const subscription = supabase
      .channel(`chat_room_${activeRoom?.id || 'all'}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: activeRoom ? `room_id=eq.${activeRoom.id}` : undefined
        },
        (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new as ChatMessage;
          if (activeRoom && newMessage.room_id === activeRoom.id) {
            // 自分が送信したメッセージの場合は、既に表示されているので追加しない
            if (newMessage.sender_id !== user?.id) {
              setMessages(prev => [...prev, newMessage]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeRoom || !user) return;

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
          room_id: activeRoom.id,
          sender_id: user.id,
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

  const handleRoomSelect = (room: ChatRoom) => {
    setActiveRoom(room);
    fetchMessages(room.id);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Sparkles Background */}
      <div className="w-full absolute inset-0 h-screen">
        <SparklesCore
          id="tsparticlessupport"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={40}
          className="w-full h-full"
          particleColor="#3B82F6"
          speed={0.3}
        />
      </div>

      {/* Header */}
      <header className="relative z-20 bg-white/80 backdrop-blur-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-2">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">キャリアサポートセンター</h1>
                <p className="text-sm text-gray-600">サポートスタッフ専用ダッシュボード</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">オンライン</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>ログアウト</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Sidebar - Tabbed Content */}
          <div className="lg:col-span-1 bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 shadow-xl">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex flex-col space-y-1 px-4 py-2">
                <button
                  onClick={() => setActiveTab('rooms')}
                  className={`flex items-center space-x-2 py-3 px-3 rounded-lg font-medium text-sm transition-all ${
                    activeTab === 'rooms'
                      ? 'bg-blue-100 border border-blue-300 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>チャットルーム</span>
                </button>
                <button
                  onClick={() => setActiveTab('staff')}
                  className={`flex items-center space-x-2 py-3 px-3 rounded-lg font-medium text-sm transition-all ${
                    activeTab === 'staff'
                      ? 'bg-blue-100 border border-blue-300 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>サポートスタッフ</span>
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center space-x-2 py-3 px-3 rounded-lg font-medium text-sm transition-all ${
                    activeTab === 'users'
                      ? 'bg-blue-100 border border-blue-300 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>オンラインユーザー</span>
                </button>
              </nav>
            </div>
            
            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'rooms' && (
                <div>
                  {rooms.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">現在チャットルームはありません。</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rooms.map((room) => (
                        <motion.div
                          key={room.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleRoomSelect(room)}
                          className={`bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer ${
                            activeRoom?.id === room.id ? 'border-blue-300 bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-800">
                                {room.name || (room.room_type === 'support' 
                                  ? 'キャリア相談サポート' 
                                  : 'モニターとのチャット')
                                }
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {room.room_type === 'support' 
                                  ? 'キャリア相談チャット' 
                                  : 'モニターとのダイレクトメッセージ'
                                }
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <div className={`w-3 h-3 rounded-full ${
                                room.room_type === 'support' ? 'bg-blue-500' : 'bg-green-500'
                              }`}></div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'staff' && (
                <div>
                  {supportStaff.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">サポートスタッフが見つかりません。</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {supportStaff.map((staff) => (
                        <div key={staff.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:shadow-md transition-all">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {staff.name?.charAt(0) || 'S'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {staff.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {staff.email}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs text-green-600">オンライン</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'users' && (
                <div>
                  {onlineUsers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">オンラインユーザーはいません。</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {onlineUsers.map((onlineUser) => (
                        <div key={onlineUser.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {onlineUser.name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">
                                {onlineUser.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {onlineUser.email}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs text-green-600">オンライン</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 flex flex-col" style={{ height: '600px' }}>
            {activeRoom ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {activeRoom.name || '無名のルーム'}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <Mail className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">メッセージがありません</p>
                      <p className="text-xs text-gray-400 mt-2">
                        アクティブルーム: {activeRoom?.id} | ルームタイプ: {activeRoom?.room_type}
                      </p>
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            console.log('Manual refresh triggered');
                            if (activeRoom) {
                              fetchMessages(activeRoom.id);
                            }
                          }}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          手動で更新
                        </button>
                        <button
                          onClick={async () => {
                            console.log('Testing direct message fetch...');
                            // 直接メッセージテーブルから全てのメッセージを取得
                            const { data, error } = await supabase
                              .from('chat_messages')
                              .select('*')
                              .order('created_at', { ascending: true });
                            
                            if (error) {
                              console.error('Error fetching all messages:', error);
                              alert(`エラー: ${error.message}`);
                            } else {
                              console.log('All messages in database:', data);
                              alert(`データベースには ${data?.length || 0} 件のメッセージがあります`);
                            }
                          }}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          全メッセージ確認
                        </button>
                        <button
                          onClick={async () => {
                            console.log('Testing RLS bypass...');
                            // RLSをバイパスしてメッセージを取得（管理者権限が必要）
                            const { data, error } = await supabase
                              .rpc('get_all_messages');
                            
                            if (error) {
                              console.error('Error with RLS bypass:', error);
                              alert(`RLSバイパスエラー: ${error.message}`);
                            } else {
                              console.log('Messages with RLS bypass:', data);
                              alert(`RLSバイパスで ${data?.length || 0} 件のメッセージを取得`);
                            }
                          }}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          RLSバイパステスト
                        </button>
                        <button
                          onClick={async () => {
                            console.log('Checking current user info...');
                            console.log('Current user:', user);
                            
                            // 現在のユーザーの詳細情報を取得
                            const { data: userData, error: userError } = await supabase
                              .from('users')
                              .select('*')
                              .eq('id', user?.id)
                              .single();
                            
                            if (userError) {
                              console.error('Error fetching user data:', userError);
                              alert(`ユーザー情報取得エラー: ${userError.message}`);
                            } else {
                              console.log('User data:', userData);
                              alert(`ユーザー: ${userData.name} (${userData.role})`);
                            }
                          }}
                          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          ユーザー情報確認
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender_id === user?.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <div className="text-sm whitespace-pre-wrap">{message.message}</div>
                            <p className={`text-xs mt-1 ${
                              message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {new Date(message.created_at).toLocaleTimeString('ja-JP', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-blue-100">
                  <div className="flex space-x-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        // Enterキーで改行（送信はしない）
                        if (e.key === 'Enter') {
                          // デフォルトの改行動作を許可
                          return;
                        }
                      }}
                      placeholder="メッセージを入力... (Enterで改行、送信ボタンで送信)"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={1}
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">チャットルームを選択してください</p>
                </div>
              </div>
            )}
          </div>


        </div>
      </main>
    </div>
  );
};

export default SupportDashboard; 