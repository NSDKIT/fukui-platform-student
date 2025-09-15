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
      notifyButton: {
        enable: true,
      },
      allowLocalhostAsSecureOrigin: true,
    });

    isOneSignalInitialized = true;
    console.log('OneSignal initialized successfully');
  } catch (error) {
    console.error('OneSignal initialization failed:', error);
  }
};