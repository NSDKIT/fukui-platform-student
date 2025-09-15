import OneSignal from 'react-onesignal';

export const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '';

let isOneSignalInitialized = false;

export const initializeOneSignal = async () => {
  // Skip initialization if already initialized or no valid App ID
  if (isOneSignalInitialized || !ONESIGNAL_APP_ID || ONESIGNAL_APP_ID === 'your-onesignal-app-id') {
    console.log('OneSignal initialization skipped - already initialized or no valid App ID');
    return;
  }

  try {
    console.log('Initializing OneSignal...');
    
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      safari_web_id: process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID,
      allowLocalhostAsSecureOrigin: true,
      notifyButton: {
        enable: true,
        prenotify: true,
        showCredit: false,
        text: {
          'tip.state.unsubscribed': '通知を有効にする',
          'tip.state.subscribed': '通知が有効です',
          'tip.state.blocked': '通知がブロックされています',
          'message.action.subscribed': '通知を許可しました',
          'message.action.resubscribed': '通知を再開しました',
          'message.action.unsubscribed': '通知を無効にしました',
          'dialog.main.title': '通知設定',
          'dialog.main.button.subscribe': '有効にする',
          'dialog.main.button.unsubscribe': '無効にする',
          // 以下、追加された必須プロパティ
          'dialog.blocked.title': '通知がブロックされました',
          'dialog.blocked.message': 'Webプッシュ通知を有効にするには、ブラウザの設定で通知を許可してください。',
          'message.action.subscribing': '通知を購読中です...',
          'message.prenotify': '新しいアンケート情報を受け取ります。',
        },
      },
    });

    isOneSignalInitialized = true;
    console.log('OneSignal initialized successfully');
  } catch (error) {
    console.error('OneSignal initialization failed:', error);
  }
};
