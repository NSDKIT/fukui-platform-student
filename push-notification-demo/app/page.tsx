"use client"
import styles from './page.module.css'
import React, { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function Home() {
  useEffect(() => {
    (async() => {
      await OneSignal.init({
        appId: '0f6c0b6f-8a3e-4701-b5fe-1d8564674bdd',
        notifyButton: {
            enable: true,
            prenotify: true,
            showCredit: false,
            text: {
                'tip.state.unsubscribed': '通知を有効にする',
                'tip.state.subscribed': '通知が有効です',
                'tip.state.blocked': '通知がブロックされています',
                'message.prenotify': '通知を有効にしますか？',
                'message.action.subscribed': '通知が有効になりました！',
                'message.action.resubscribed': '通知が再び有効になりました！',
                'message.action.unsubscribed': '通知が無効になりました',
                'message.action.subscribing': '通知を有効にしています...',
                'dialog.main.title': '通知を管理',
                'dialog.main.button.subscribe': '通知を有効にする',
                'dialog.main.button.unsubscribe': '通知を無効にする',
                'dialog.blocked.title': '通知を有効にする',
                'dialog.blocked.message': 'ブラウザの設定で通知を許可してください'
            }
        }
      });
    })()
  })

  return (
    <main className={styles.main}>
      <div className='onesignal-customlink-container'></div>
    </main>
  )
}
