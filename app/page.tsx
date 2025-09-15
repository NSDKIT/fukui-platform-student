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
