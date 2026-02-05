'use client';

import { useEffect, useState } from 'react';
import { SummaryList } from '@/components/SummaryList';
import { Button } from '@/components/ui/button';
import { fetchSummaries, fetchCurrentUser } from '@/lib/api';

export default function DashboardPage() {
  const [summaries, setSummaries] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [summariesData, userData] = await Promise.all([fetchSummaries(), fetchCurrentUser()]);
        setSummaries(summariesData);
        setUser(userData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>로딩 중...</p></div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">로그인이 필요합니다.</p>
          <Button onClick={() => (window.location.href = 'http://localhost:3001/auth/google')}>Google로 로그인</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">emarry</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <Button variant="outline" size="sm" onClick={() => (window.location.href = 'http://localhost:3001/api/logout')}>로그아웃</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">이메일 요약</h2>
          <p className="text-gray-600">최근 {summaries.length}일간의 요약입니다</p>
        </div>
        <SummaryList summaries={summaries} />
      </main>
    </div>
  );
}
