import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  LogOut,
  MailPlus,
  PlusCircle,
  Settings,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import loginLogo from '../assets/images/login-logo.png';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useUserStore } from '../lib/userStore';

export default function MainLayout() {
  const navigate = useNavigate();
  const [adminSidebarOpen, setAdminSidebarOpen] = useState(false);
  const logout = useUserStore((state) => state.logout);
  const getId = useUserStore((state) => state.getId);
  const getGroup = useUserStore((state) => state.getGroup);
  const userId = useUserStore((state) => state.currentUser?.id);
  const isAdmin = getGroup() === '관리자';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-5 py-3 rounded-lg text-base font-semibold transition-colors ${
      isActive
        ? 'bg-primary text-primary-foreground shadow-md'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
    }`;

  const adminNavLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors border-l-2 ${
      isActive
        ? 'bg-primary/10 text-primary border-primary'
        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
    }`;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* 관리자 왼쪽 사이드바 */}
        {isAdmin && (
          <aside
            className={`shrink-0 border-r border-border/40 bg-card/50 transition-[width] duration-200 overflow-hidden ${
              adminSidebarOpen ? 'w-56' : 'w-0'
            }`}
          >
            <div className="w-56 py-4 px-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
                관리자 메뉴
              </div>
              <nav className="space-y-1">
                <NavLink to="/admin/new-project" className={adminNavLinkClass}>
                  <PlusCircle className="h-5 w-5 shrink-0" />
                  <span>신규 프로젝트 등록</span>
                </NavLink>
                <NavLink to="/admin/invite-user" className={adminNavLinkClass}>
                  <MailPlus className="h-5 w-5 shrink-0" />
                  <span>사용자 초대</span>
                </NavLink>
                <NavLink to="/admin/users" className={adminNavLinkClass}>
                  <Users className="h-5 w-5 shrink-0" />
                  <span>사용자 관리</span>
                </NavLink>
                <NavLink to="/admin/projects" className={adminNavLinkClass}>
                  <SlidersHorizontal className="h-5 w-5 shrink-0" />
                  <span>프로젝트 관리</span>
                </NavLink>
              </nav>
            </div>
          </aside>
        )}

        <div className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto p-8">
            {/* 상단 헤더: 로고 + 메뉴 + 관리자(admin) + 사용자 */}
            <div className="mb-6 pb-6 border-b border-border/40 flex flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-8">
                <NavLink to="/" className="flex-shrink-0">
                  <img src={loginLogo} alt="SAFEROBO PMS" className="h-12" />
                </NavLink>
                <nav className="flex items-center gap-2">
                  {isAdmin && (
                    <NavLink to="/income-statement" className={navLinkClass}>
                      <FileSpreadsheet className="h-6 w-6 shrink-0" />
                      <span>손익계산서</span>
                    </NavLink>
                  )}
                  <NavLink to="/" end className={navLinkClass}>
                    <Building2 className="h-6 w-6 shrink-0" />
                    <span>구축중 프로젝트</span>
                  </NavLink>
                  <NavLink to="/completed-projects" className={navLinkClass}>
                    <CheckCircle2 className="h-6 w-6 shrink-0" />
                    <span>구축완료 프로젝트</span>
                  </NavLink>
                </nav>
                {isAdmin && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={adminSidebarOpen ? 'secondary' : 'outline'}
                        size="default"
                        className="flex items-center gap-2 shrink-0"
                        onClick={() => setAdminSidebarOpen((v) => !v)}
                      >
                        <Settings className="h-5 w-5" />
                        <span>관리자 메뉴</span>
                        {adminSidebarOpen ? (
                          <ChevronLeft className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {adminSidebarOpen ? '관리자 메뉴 닫기' : '관리자 메뉴 열기'}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              <div className="flex items-center gap-4 w-auto justify-end">
                <div className="text-right block mr-2">
                  <div className="text-sm font-semibold text-foreground">{getId()}</div>
                  <div className="text-xs text-muted-foreground">{getGroup()}</div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full bg-muted/50 hover:bg-muted border-muted-foreground/20 hover:border-muted-foreground/40 text-muted-foreground hover:text-foreground"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>로그아웃</TooltipContent>
                </Tooltip>
              </div>
            </div>

            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
