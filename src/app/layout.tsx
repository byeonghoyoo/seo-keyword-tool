import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '역방향 SEO 키워드 발굴 도구 | Reverse SEO Keyword Discovery Tool',
  description: '웹사이트 URL만 입력하면 네이버 검색에서 노출되고 있는 모든 키워드를 자동으로 발굴하는 AI 기반 SEO 분석 도구입니다.',
  keywords: ['SEO', '키워드 분석', '검색엔진최적화', '키워드 발굴', '네이버 SEO', '검색 순위', '키워드 도구'],
  authors: [{ name: 'Claude Code' }],
  creator: 'Claude Code',
  publisher: 'Claude Code',
  robots: 'index, follow',
  openGraph: {
    title: '역방향 SEO 키워드 발굴 도구',
    description: '웹사이트의 숨겨진 키워드를 자동으로 발굴하는 AI 기반 SEO 분석 도구',
    type: 'website',
    locale: 'ko_KR',
    siteName: 'SEO Keyword Discovery Tool',
  },
  twitter: {
    card: 'summary_large_image',
    title: '역방향 SEO 키워드 발굴 도구',
    description: '웹사이트의 숨겨진 키워드를 자동으로 발굴하는 AI 기반 SEO 분석 도구',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {children}
      </body>
    </html>
  )
}