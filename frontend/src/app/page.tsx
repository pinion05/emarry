import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="border-b bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">emarry</h1>
          <Link href="http://localhost:3001/auth/google">
            <Button>시작하기</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold mb-6 text-gray-900">
            이메일 과부하에서 해방됩니다
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Gmail의 읽지 않은 이메일을 AI가 매일 아침 요약해드립니다.
            <br />
            중요한 정보만 빠르게 파악하세요.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="text-xl font-semibold mb-2">자동 수집</h3>
              <p className="text-gray-600">읽지 않은 이메일을 자동으로 수집합니다</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-2">AI 요약</h3>
              <p className="text-gray-600">LLM으로 중요한 내용만 요약합니다</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-4xl mb-4">⏰</div>
              <h3 className="text-xl font-semibold mb-2">매일 아침</h3>
              <p className="text-gray-600">매일 정해진 시간에 요약을 받습니다</p>
            </div>
          </div>

          <div className="mt-12">
            <Link href="http://localhost:3001/auth/google">
              <Button size="lg" className="text-lg">Google로 무료 시작하기</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
