"use client"
import styles from './page.module.css'
import React, { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function Home() {
  useEffect(() => {
    (async() => {
      await OneSignal.init({
        appId: '｛OneSignalのサイトで取得したappId｝',
        notifyButton: {
            enable: true,
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