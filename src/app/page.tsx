'use client'

import React from 'react';
import { Suspense } from 'react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <h1 className="text-2xl font-bold">Hello World</h1>
    </div>
  );
}

