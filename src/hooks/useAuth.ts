import { useState, useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';
import { User } from '../types';
import { isSupabaseConfigured } from '../config/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitialized = useRef(false);
  const currentUserId = useRef<string | null>(null);
  const isSigningUp = useRef(false);
  const isLoadingProfile = useRef(false);

  useEffect(() => {
    // Supabaseが設定されていない場合は早期リターン
    if (!isSupabaseConfigured) {
      setError('Supabaseが設定されていません。右上の「Connect to Supabase」ボタンをクリックしてください。');
      setLoading(false);
      return;
    }

    // Supabaseクライアントが利用できない場合
    if (!supabase) {
      setError('Supabaseの設定に問題があります。環境変数を確認してください。');
      setLoading(false);
      return;
    }

    // 既に初期化済みの場合はスキップ
    if (isInitialized.current) {
      return;
    }

    isInitialized.current = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // 現在のセッションを取得
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          if (sessionError.message?.includes('Failed to fetch') || sessionError.message?.includes('fetch')) {
            setError('Supabaseへの接続に失敗しました。環境変数の設定を確認してください。');
          } else {
            setError('認証セッションの取得に失敗しました。');
          }
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('Session found, loading user profile...');
          await loadUserProfile(session.user.id);
        } else {
          console.log('No session found');
          setLoading(false);
        }

        // 認証状態の変更を監視
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event);
          console.log('Session user:', session?.user?.email);
          console.log('Session user ID:', session?.user?.id);
          console.log('Current user ID:', currentUserId.current);
          console.log('Is loading profile:', isLoadingProfile.current);
          
          if (event === 'SIGNED_OUT') {
            console.log('User signed out, clearing state');
            setUser(null);
            currentUserId.current = null;
            isSigningUp.current = false;
            isLoadingProfile.current = false;
            setLoading(false);
          } else if (event === 'SIGNED_IN' && session?.user) {
            console.log('User signed in:', session.user.email);
            console.log('User ID:', session.user.id);
            // Only load profile if it's a different user or we don't have user data
            if (currentUserId.current !== session.user.id && !isLoadingProfile.current) {
              console.log('Loading profile for new user');
              await loadUserProfile(session.user.id);
            } else {
              console.log('Skipping profile load - same user or already loading');
            }
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            console.log('Token refreshed for user:', session.user.email);
            // Don't reload profile on token refresh if we already have the same user
            if (currentUserId.current !== session.user.id) {
              console.log('Loading profile after token refresh');
              await loadUserProfile(session.user.id);
            }
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
          setError('Supabaseへの接続に失敗しました。環境変数の設定を確認し、開発サーバーを再起動してください。');
        } else {
          setError('認証システムの初期化に失敗しました。');
        }
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const loadUserProfile = async (userId: string) => {
    // 同じユーザーのプロファイルを既に読み込み中/済みの場合はスキップ
    if (currentUserId.current === userId && user && !isLoadingProfile.current) {
      console.log('Profile already loaded for user:', userId);
      setLoading(false);
      return;
    }
    
    // 既に同じユーザーのプロファイルを読み込み中の場合はスキップ
    if (isLoadingProfile.current && currentUserId.current === userId) {
      console.log('Profile loading already in progress for user:', userId);
      return;
    }
    
    // プロファイル読み込み中フラグを設定
    isLoadingProfile.current = true;
    currentUserId.current = userId; // Set current user ID immediately
    setLoading(true);
    setError(null); // Clear previous errors

    const loadUserProfileWithRetry = async (userId: string, retryCount = 0): Promise<void> => {
      const maxRetries = 2;
      const retryDelay = 500; // 0.5 seconds

      try {
        console.log(`Loading user profile for: ${userId} (attempt ${retryCount + 1})`);
        
        // Special handling for admin@example.com and support@example.com
        const authUser = await supabase.auth.getUser();
        if (authUser.data.user?.email === 'admin@example.com') {
          console.log('Admin user detected, creating admin profile...');
          const adminUser = await ensureAdminProfile(userId);
          if (adminUser) {
            console.log('Admin profile ensured, setting user state');
            setUser(adminUser);
            currentUserId.current = userId;
            isLoadingProfile.current = false;
            setLoading(false);
            return;
          }
        } else if (authUser.data.user?.email === 'support@example.com') {
          console.log('Support user detected, creating support profile...');
          const supportUser = await ensureSupportProfile(userId);
          if (supportUser) {
            console.log('Support profile ensured, setting user state:', supportUser);
            setUser(supportUser);
            currentUserId.current = userId;
            isLoadingProfile.current = false;
            setLoading(false);
            return;
          } else {
            console.log('Failed to ensure support profile, user will be signed out');
            // サポートプロファイルの作成に失敗した場合、ユーザーをサインアウト
            await supabase.auth.signOut();
            setUser(null);
            currentUserId.current = null;
            isLoadingProfile.current = false;
            setLoading(false);
            return;
          }
        }
        
        // First, fetch the basic user information
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (userError) {
          // Network/fetch errors
          if (userError.message?.includes('Failed to fetch') || userError.message?.includes('fetch')) {
            throw new Error('Supabaseへの接続に失敗しました。環境変数の設定を確認してください。');
          }
          
          // Check if it's a "no rows returned" error and we can retry
          if (userError.code === 'PGRST116' && retryCount < maxRetries) {
            console.log(`User not found, retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return loadUserProfileWithRetry(userId, retryCount + 1);
          }
          
          console.error('User fetch error:', userError);
          // Don't set error for missing user during initialization - just clear state
          console.log('User not found, clearing auth state');
          setUser(null);
          setLoading(false);
          currentUserId.current = null;
          isLoadingProfile.current = false;
          return;
        }

        // Handle case where no user profile is found
        if (!userData) {
          if (retryCount < maxRetries) {
            console.log(`No user data found, retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return loadUserProfileWithRetry(userId, retryCount + 1);
          }
          
          console.log('No user profile found for:', userId);
          setUser(null);
          setLoading(false);
          currentUserId.current = null;
          isLoadingProfile.current = false;
          return;
        }

        // Then, fetch the role-specific profile based on the user's role
        let profileData = null;
        
        if (userData.role === 'monitor') {
          const { data: monitorProfile, error: monitorError } = await supabase
            .from('monitor_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
            
          if (monitorError) {
            console.error('Monitor profile fetch error:', monitorError);
          } else {
            profileData = monitorProfile;
          }
        } else if (userData.role === 'client') {
          const { data: clientProfile, error: clientError } = await supabase
            .from('client_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
            
          if (clientError) {
            console.error('Client profile fetch error:', clientError);
          } else {
            profileData = clientProfile;
          }
        }

        // Combine user data with profile data
        const userProfile: User = {
          ...userData,
          profile: profileData
        };

        console.log('User profile loaded successfully');
        setUser(userProfile);
        currentUserId.current = userId; // Confirm user ID is set
        isLoadingProfile.current = false;
        setLoading(false);
      } catch (error) {
        if (retryCount < maxRetries) {
          console.log(`Error loading profile, retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return loadUserProfileWithRetry(userId, retryCount + 1);
        }
        
        console.error('Error loading user profile:', error);
        
        // Set appropriate error message
        if (error instanceof Error && error.message.includes('Supabaseへの接続に失敗')) {
          setError(error.message);
        } else {
          console.log('Error loading profile, clearing auth state');
        }
        
        // サインアップ中の場合は、プロファイル作成の遅延を考慮してもう少し待つ
        if (isSigningUp.current) {
          console.log('User profile not found during signup, waiting longer...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // 再度確認
          const { data: retryUserData, error: retryError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
            
          if (!retryError && retryUserData) {
            // 見つかった場合は処理を続行
            console.log('User profile found on retry');
            // 処理を続行するために再帰呼び出し
            return loadUserProfileWithRetry(userId, 0);
          }
        }
        
        setUser(null);
        setLoading(false);
        currentUserId.current = null;
        isLoadingProfile.current = false;
        isLoadingProfile.current = false;
      }
    };

    try {
      await loadUserProfileWithRetry(userId);
    } catch (error) {
      console.error('Error loading user profile:', error);
      
      // Set appropriate error message for network issues
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        setError('Supabaseへの接続に失敗しました。環境変数の設定を確認し、開発サーバーを再起動してください。');
      } else {
        console.log('Error in loadUserProfile, clearing auth state');
      }
      
      setUser(null);
      setLoading(false);
      currentUserId.current = null;
    }
  };

  // Helper function to check if user is admin
  const isAdminUser = async (userId: string): Promise<boolean> => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      return authUser.user?.email === 'admin@example.com';
    } catch {
      return false;
    }
  };

  // Helper function to ensure admin profile exists
  const ensureAdminProfile = async (userId: string): Promise<User | null> => {
    try {
      console.log('Ensuring admin profile for user:', userId);
      
      // First check by email to avoid duplicate key errors
      const { data: existingUserByEmail, error: emailCheckError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'admin@example.com')
        .maybeSingle();

      if (emailCheckError && emailCheckError.code !== 'PGRST116') {
        console.error('Error checking existing user by email:', emailCheckError);
        return null;
      }

      // If user with this email already exists, just return
      if (existingUserByEmail) {
        console.log('Admin user already exists with email admin@example.com');
        const userProfile: User = {
          ...existingUserByEmail,
          profile: null
        };
        return userProfile;
      }

      // Also check by user ID to be thorough
      const { data: existingUserById, error: idCheckError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (idCheckError && idCheckError.code !== 'PGRST116') {
        console.error('Error checking existing user by ID:', idCheckError);
        return null;
      }

      // If user doesn't exist by either email or ID, create it
      if (!existingUserByEmail && !existingUserById) {
        console.log('Creating admin user profile...');
        
        // Use ON CONFLICT DO NOTHING to handle potential race conditions
        const { data: insertedUser, error: insertError } = await supabase
          .from('users')
          .upsert([{
            id: userId,
            email: 'admin@example.com',
            role: 'admin',
            name: '管理者',
          }], {
            onConflict: 'email',
            ignoreDuplicates: true
          })
          .select();

        if (insertError) {
          console.error('Error creating admin user:', insertError);
          // エラーが発生した場合、既存のユーザーを再確認
          const { data: retryUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', 'admin@example.com')
            .maybeSingle();
          
          if (retryUser) {
            const userProfile: User = {
              ...retryUser,
              profile: null
            };
            return userProfile;
          }
          return null;
        } else {
          console.log('Admin user profile created successfully');
          if (insertedUser && insertedUser.length > 0) {
            const userProfile: User = {
              ...insertedUser[0],
              profile: null
            };
            return userProfile;
          } else {
            // upsertで何も挿入されなかった場合（既に存在）、既存のユーザーを取得
            const { data: existingUser } = await supabase
              .from('users')
              .select('*')
              .eq('email', 'admin@example.com')
              .single();
            
            if (existingUser) {
              const userProfile: User = {
                ...existingUser,
                profile: null
              };
              return userProfile;
            }
          }
        }
      } else {
        console.log('Admin user profile already exists by ID');
        const existingUser = existingUserById || existingUserByEmail;
        if (existingUser) {
          const userProfile: User = {
            ...existingUser,
            profile: null
          };
          return userProfile;
        }
      }
    } catch (error) {
      console.error('Error in ensureAdminProfile:', error);
      // エラーが発生した場合でも、既存のユーザーを確認
      try {
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', 'admin@example.com')
          .maybeSingle();
        
        if (existingUser) {
          const userProfile: User = {
            ...existingUser,
            profile: null
          };
          return userProfile;
        }
      } catch (retryError) {
        console.error('Error retrying to get existing admin user:', retryError);
      }
    }
    return null;
  };

  // Helper function to ensure support profile exists
  const ensureSupportProfile = async (userId: string): Promise<User | null> => {
    try {
      console.log('Ensuring support profile for user:', userId);
      
      // First check by email to avoid duplicate key errors
      console.log('Checking for existing support user by email...');
      const { data: existingUserByEmail, error: emailCheckError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'support@example.com')
        .maybeSingle();

      console.log('Email check result:', { 
        existingUserByEmail, 
        emailCheckError,
        hasData: !!existingUserByEmail,
        errorCode: emailCheckError?.code,
        errorMessage: emailCheckError?.message
      });

      if (emailCheckError && emailCheckError.code !== 'PGRST116') {
        console.error('Error checking existing user by email:', emailCheckError);
        return null;
      }

      // If user with this email already exists, just return
      if (existingUserByEmail) {
        console.log('Support user already exists with email support@example.com:', existingUserByEmail);
        const userProfile: User = {
          ...existingUserByEmail,
          profile: null
        };
        console.log('Returning user profile:', userProfile);
        return userProfile;
      }

      // Also check by user ID to be thorough
      const { data: existingUserById, error: idCheckError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (idCheckError && idCheckError.code !== 'PGRST116') {
        console.error('Error checking existing user by ID:', idCheckError);
        return null;
      }

      // If user doesn't exist by either email or ID, try to create it
      if (!existingUserByEmail && !existingUserById) {
        console.log('Support user does not exist, attempting to create...');
        
        // Since RLS is blocking user creation, we'll try to get the existing user again
        // This handles the case where the user was created by another process
        console.log('Checking for existing support user again...');
        const { data: retryUser, error: retryError } = await supabase
          .from('users')
          .select('*')
          .eq('email', 'support@example.com')
          .maybeSingle();

        if (retryError && retryError.code !== 'PGRST116') {
          console.error('Error retrying to get support user:', retryError);
          return null;
        }

        if (retryUser) {
          console.log('Support user found on retry');
          const userProfile: User = {
            ...retryUser,
            profile: null
          };
          return userProfile;
        }

        // If still no user exists, we cannot create it due to RLS
        console.log('Cannot create support user due to RLS policies. User must be created manually.');
        return null;
      } else {
        console.log('Support user profile already exists by ID');
        const existingUser = existingUserById || existingUserByEmail;
        if (existingUser) {
          const userProfile: User = {
            ...existingUser,
            profile: null
          };
          return userProfile;
        }
      }
    } catch (error) {
      console.error('Error in ensureSupportProfile:', error);
      // エラーが発生した場合でも、既存のユーザーを確認
      try {
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', 'support@example.com')
          .maybeSingle();
        
        if (existingUser) {
          const userProfile: User = {
            ...existingUser,
            profile: null
          };
          return userProfile;
        }
      } catch (retryError) {
        console.error('Error retrying to get existing support user:', retryError);
      }
    }
    return null;
  };
  const signIn = async (email: string, password: string) => {
    try {
      // Supabaseクライアントの確認
      if (!supabase) {
        setError('Supabaseが正しく設定されていません。');
        setLoading(false);
        return { error: new Error('Supabase not configured') };
      }

      setLoading(true);
      setError(null);
      
      console.log('=== SIGN IN ATTEMPT ===');
      console.log('Email:', email);
      console.log('Password length:', password.length);
      
      // admin@example.comとsupport@example.comの場合は特別処理
      if (email === 'admin@example.com') {
        console.log('Admin login detected, attempting sign in...');
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        console.log('Admin auth result:', { data: !!data.user, error });
        
        if (error) {
          // 管理者アカウントが存在しない場合は作成を試行
          if (error.message.includes('Invalid login credentials')) {
            console.log('Admin account not found, attempting to create...');
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  name: '管理者',
                  role: 'admin'
                }
              }
            });
            
            if (signUpError) {
              console.error('Admin signup error:', signUpError);
              setError('管理者アカウントの作成に失敗しました。');
              setLoading(false);
              return { error: signUpError };
            }
            
            console.log('Admin account created, now signing in...');
            // 作成後に再度サインイン
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            
            if (retryError) {
              console.error('Admin retry signin error:', retryError);
              setError('管理者ログインに失敗しました。');
              setLoading(false);
              return { error: retryError };
            }
            
            console.log('Admin signin successful after creation');
            return { error: null };
          } else {
            console.error('Admin signin error:', error);
            setError(error.message);
            setLoading(false);
            return { error };
          }
        }
        
        console.log('Admin signin successful');
        return { error: null };
      } else if (email === 'support@example.com') {
        console.log('Support login detected, attempting sign in...');
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        console.log('Support auth result:', { data: !!data.user, error });
        
        if (error) {
          // サポートアカウントが存在しない場合は作成を試行
          if (error.message.includes('Invalid login credentials')) {
            console.log('Support account not found, attempting to create...');
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  name: 'キャリアサポートスタッフ',
                  role: 'support'
                }
              }
            });
            
            if (signUpError) {
              console.error('Support signup error:', signUpError);
              setError('サポートアカウントの作成に失敗しました。');
              setLoading(false);
              return { error: signUpError };
            }
            
            console.log('Support account created, now signing in...');
            // 作成後に再度サインイン
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            
            if (retryError) {
              console.error('Support retry signin error:', retryError);
              setError('サポートログインに失敗しました。');
              setLoading(false);
              return { error: retryError };
            }
            
            console.log('Support signin successful after creation');
            return { error: null };
          } else {
            console.error('Support signin error:', error);
            setError(error.message);
            setLoading(false);
            return { error };
          }
        }
        
        console.log('Support signin successful');
        return { error: null };
      }
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('Auth sign in result:', { error });
      
      if (error) {
        console.error('Sign in error:', error);
        setError(error.message);
        setLoading(false);
        return { error };
      }
      
      // Don't set loading to false here - let the auth state change handle it
      console.log('Sign in successful, waiting for auth state change...');
      return { error };
    } catch (err) {
      console.error('Sign in error:', err);
      setError('ログインに失敗しました。');
      setLoading(false);
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    console.log('=== SIGNUP FUNCTION CALLED ===');
    console.log('Email:', email);
    console.log('Password length:', password.length);
    console.log('UserData:', userData);
    
    try {
      // Supabaseクライアントの確認
      if (!supabase) {
        setError('Supabaseが正しく設定されていません。');
        setLoading(false);
        return { error: new Error('Supabase not configured') };
      }

      isSigningUp.current = true;
      setLoading(true);
      setError(null);
      
      console.log('Starting signup process for:', email);
      console.log('User data:', userData);
     console.log('User role:', userData.role);
      
      // admin@example.com の場合は特別処理
      if (email === 'admin@example.com') {
        console.log('Admin signup detected');
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: '管理者',
              role: 'admin'
            }
          }
        });

        if (error) {
          console.error('Admin auth signup error:', error);
          setError(error.message);
          isSigningUp.current = false;
          setLoading(false);
          return { error };
        }

        console.log('Admin auth signup successful');
        isSigningUp.current = false;
        setLoading(false);
        return { data, error };
      }
      
      console.log('About to call supabase.auth.signUp...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            role: userData.role
          }
        }
      });

      console.log('supabase.auth.signUp completed');
      console.log('Auth data:', data);
      console.log('Auth error:', error);

      if (error) {
        console.error('Auth signup error:', error);
        if (error.message === 'User already registered') {
          setError('このメールアドレスは既に登録されています。ログインしてください。');
        } else {
          setError(error.message);
        }
        isSigningUp.current = false;
        setLoading(false);
        return { error };
      }

      console.log('Auth signup successful, user ID:', data.user?.id);

      // Create user entry in public.users and role-specific profile
      if (data.user) {
        console.log('Creating user profile in database...');
        
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email: data.user.email,
            role: userData.role,
            name: userData.name,
          }]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          setError('ユーザープロファイルの作成に失敗しました。');
          isSigningUp.current = false;
          setLoading(false);
          return { error: profileError };
        }

        console.log('User profile created successfully');

        // Create role-specific profile
        if (userData.role === 'monitor') {
          console.log('Creating monitor profile...');
          
          // Create monitor profile with proper user_id reference
          const { error: monitorProfileError } = await supabase
            .from('monitor_profiles')
            .insert([{
              user_id: data.user.id,
              age: userData.age || null,
              gender: userData.gender || null,
              occupation: userData.occupation || null,
              location: userData.location || null,
              faculty: userData.faculty || null,
              department: userData.department || null,
              hometown: userData.hometown || null,
              points: 0, // Will be set to 100 by trigger
            }]);
            
          if(monitorProfileError) {
            console.error('Monitor profile creation error:', monitorProfileError);
            console.error('Error details:', {
              message: monitorProfileError.message,
              details: monitorProfileError.details,
              hint: monitorProfileError.hint,
              code: monitorProfileError.code
            });
            setError('モニタープロフィールの作成に失敗しました。');
            isSigningUp.current = false;
            setLoading(false);
            return { error: monitorProfileError };
          }
          
          console.log('Monitor profile created successfully');

        } else if (userData.role === 'client') {
         console.log('Processing client registration...');
         console.log('Client data check:', {
           registration_code: userData.registration_code,
           company_name: userData.company_name,
           industry: userData.industry,
           hasRegistrationCode: !!userData.registration_code,
           hasCompanyName: !!userData.company_name,
           hasIndustry: !!userData.industry
         });
         
          // Validate required client fields
          if (!userData.registration_code || !userData.company_name || !userData.industry) {
            console.error('Missing required client fields:', { 
              registration_code: userData.registration_code,
              company_name: userData.company_name, 
              industry: userData.industry 
            });
            setError('登録番号、会社名、業界は必須項目です。');
            isSigningUp.current = false;
            setLoading(false);
            return { error: new Error('Missing required client fields') };
          }

          // Use registration code (this will mark it as used)
          console.log('Using registration code...');
          const { data: codeResult, error: codeError } = await supabase.rpc('use_registration_code', {
            p_code: userData.registration_code,
            p_user_id: data.user.id
          });
          
          if (codeError || !codeResult.success) {
            console.error('Registration code error:', codeError || codeResult.error);
            setError('登録番号が無効または既に使用されています。');
            isSigningUp.current = false;
            setLoading(false);
            return { error: new Error('Invalid registration code') };
          }

          console.log('Creating client profile...');
          console.log('Client profile data:', {
            user_id: data.user.id,
            company_name: userData.company_name,
            industry: userData.industry
          });
          
         try {
          const { error: clientProfileError } = await supabase
            .from('client_profiles')
            .insert([{
              user_id: data.user.id,
              company_name: userData.company_name,
              industry: userData.industry,
            }]);

          if (clientProfileError) {
            console.error('Client profile creation error:', clientProfileError);
            console.error('Error details:', {
              message: clientProfileError.message,
              details: clientProfileError.details,
              hint: clientProfileError.hint,
              code: clientProfileError.code
            });
            setError(`クライアントプロファイルの作成に失敗しました: ${clientProfileError.message}`);
            isSigningUp.current = false;
            setLoading(false);
            return { error: clientProfileError };
          }

          console.log('Client profile created successfully');
         } catch (clientError) {
           console.error('Unexpected error during client profile creation:', clientError);
           setError('クライアントプロファイルの作成中に予期しないエラーが発生しました。');
           isSigningUp.current = false;
           setLoading(false);
           return { error: clientError };
         }
        }

        // プロファイル作成完了後、少し待ってからユーザー情報を読み込む
        console.log('Waiting for database consistency...');
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // サインアップフラグをリセット（プロファイル読み込み前）
        isSigningUp.current = false;
        
        console.log('Loading user profile after signup...');
        try {
         console.log('About to call loadUserProfile for user:', data.user.id);
          await loadUserProfile(data.user.id);
          console.log('Profile loaded successfully after signup');
          
          // サインアップ完了後は確実にローディングを終了
          setLoading(false);
        } catch (profileLoadError) {
          console.error('Error loading profile after signup:', profileLoadError);
          // エラーが発生してもユーザー作成は成功しているので、再試行を促す
          console.log('Profile load failed, but user was created. Attempting retry...');
          
          // 短時間待機後に再試行
          setTimeout(async () => {
            try {
              await loadUserProfile(data.user.id);
              setLoading(false);
            } catch (retryError) {
              console.error('Retry failed:', retryError);
              setError('プロファイルの読み込みに失敗しました。しばらく待ってから再度お試しください。');
              setLoading(false);
            }
          }, 1000);
          setLoading(false);
        }

        // 自動ログイン処理
        console.log('Auto-login after successful signup...');
        try {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
          });
          
          if (signInError) {
            console.error('Auto-login error:', signInError);
            // エラーが発生してもユーザー作成は成功しているので、手動ログインを促す
            setError('アカウントは作成されましたが、自動ログインに失敗しました。手動でログインしてください。');
          } else {
            console.log('Auto-login successful');
          }
        } catch (autoLoginError) {
          console.error('Auto-login exception:', autoLoginError);
          setError('アカウントは作成されましたが、自動ログインに失敗しました。手動でログインしてください。');
        }
      }
      
      console.log('Signup process completed successfully');

      return { data, error };
    } catch (err) {
      console.error('Sign up error:', err);
      setError('アカウント作成に失敗しました。');
      isSigningUp.current = false;
      setLoading(false);
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Always clear local state first, regardless of server response
      setUser(null);
      currentUserId.current = null;
      isLoadingProfile.current = false;
      isSigningUp.current = false;
      
      // Attempt to sign out from Supabase if available
      if (supabase) {
        const { error } = await supabase.auth.signOut();
        
        // Log the error but don't throw it, as local state is already cleared
        if (error) {
          console.warn('Supabase signOut error (ignored):', error);
        }
      }
      
      setLoading(false);
      return { error: null };
    } catch (err) {
      console.error('Sign out error:', err);
      // Ensure local state is cleared even if an exception occurs
      setUser(null);
      currentUserId.current = null;
      isLoadingProfile.current = false;
      isSigningUp.current = false;
      setLoading(false);
      return { error: err };
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
  };
};