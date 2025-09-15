"use client"
import styles from './page.module.css'
import React, { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function Home() {
  useEffect(() => {
    (async() => {
      await OneSignal.init({
        appId: '66b12ad6-dbe7-498f-9eb6-f9d8031fa8a1',
        notifyButton: {
          enable: true,
          // 以下の3つのプロパティを追加します。
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
          },
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
