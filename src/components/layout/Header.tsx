'use client';

import { Search, BarChart3, Clock, Users, FileText, Bell, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

function NavLink({ href, icon: Icon, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary-100 text-primary-700'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </Link>
  );
}

export default function Header() {
  return (
    <header className="bg-white shadow-soft border-b border-slate-200 sticky top-0 z-50">
      <div className="container-fluid">
        <div className="flex items-center justify-between h-16">
          {/* 로고 & 브랜딩 */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary-600 rounded-lg">
                <Search className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-slate-900">
                  SEO Discovery
                </h1>
                <p className="text-xs text-slate-600">
                  키워드 발굴 도구
                </p>
              </div>
            </div>
          </Link>
          
          {/* 메인 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-2">
            <NavLink href="/" icon={BarChart3}>
              대시보드
            </NavLink>
            <NavLink href="/analysis" icon={Clock}>
              분석 히스토리
            </NavLink>
            <NavLink href="/competitors" icon={Users}>
              경쟁사 분석
            </NavLink>
            <NavLink href="/reports" icon={FileText}>
              보고서
            </NavLink>
          </nav>
          
          {/* 우측 액션 버튼들 */}
          <div className="flex items-center space-x-3">
            {/* 알림 */}
            <button className="p-2 text-slate-400 hover:text-slate-600 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-error-500 rounded-full"></span>
            </button>
            
            {/* 내보내기 */}
            <button className="btn btn-ghost btn-sm">
              내보내기
            </button>
            
            {/* 사용자 프로필 */}
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-slate-100 rounded-full">
                <User className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}