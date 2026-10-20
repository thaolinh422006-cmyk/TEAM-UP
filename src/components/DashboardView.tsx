import React from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  Presentation,
  FileText,
  Calendar,
  Sparkles,
  Radio,
  Plus,
  TrendingUp,
  UserPlus,
  Crown,
  Trash2,
} from 'lucide-react';
import { Project, Member, Task, SlideDeck, DocumentResource, ActiveTab } from '../types';
import { ThemeConfig } from '../utils/theme';

interface DashboardViewProps {
  project: Project;
  allProjects: Project[];
  onSelectProject: (p: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  tasks: Task[];
  slideDeck: SlideDeck;
  documents?: DocumentResource[];
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenAiModal: () => void;
  onOpenNewProjectModal: () => void;
  onOpenAddMemberModal: () => void;
  theme: ThemeConfig;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  project,
  allProjects,
  onSelectProject,
  onDeleteProject,
  tasks,
  slideDeck,
  documents = [],
  onNavigateTab,
  onOpenAiModal,
  onOpenNewProjectModal,
  onOpenAddMemberModal,
  theme,
}) => {
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const completedTasks = projectTasks.filter((t) => t.status === 'completed');
  const inProgressTasks = projectTasks.filter((t) => t.status === 'in_progress');
  const todoTasks = projectTasks.filter((t) => t.status === 'todo');

  const onlineMembers = project.members.filter((m) => m.isOnline);
  const projectDocuments = documents.filter((d) => d.projectId === project.id);

  // Dynamic real progress calculation based strictly on real project tasks:
  const calculatedProgress =
    projectTasks.length > 0
      ? Math.round((completedTasks.length / projectTasks.length) * 100)
      : 0;

  // Calculate days left
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(project.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="space-y-6">
      {/* Featured Canva Slide Presentation Showcase Card (Trang đầu ai vào cũng thấy ngay) */}
      <div
        className="rounded-2xl border p-5 sm:p-7 shadow-md relative overflow-hidden transition-all"
        style={{
          background: 'linear-gradient(135deg, #FDF7EA 0%, #F6ECDA 50%, #EFE1C6 100%)',
          borderColor: '#DECDAF',
        }}
      >
        {/* Decorative Traditional Vietnamese Pagoda (Chùa Một Cột) SVG */}
        <div className="absolute right-0 top-0 bottom-0 w-80 pointer-events-none opacity-20 overflow-hidden flex items-center justify-end pr-4">
          <svg viewBox="0 0 200 200" className="w-64 h-64 text-[#8B5A2B] fill-current">
            <path d="M100 20 L108 35 L125 38 L112 50 L115 67 L100 58 L85 67 L88 50 L75 38 L92 35 Z" opacity="0.8" />
            <path d="M50 85 C80 75, 120 75, 150 85 L145 95 C120 90, 80 90, 55 95 Z" />
            <path d="M60 95 L65 125 L135 125 L140 95 Z" opacity="0.6" />
            <path d="M35 125 C80 115, 120 115, 165 125 L160 135 C120 128, 80 128, 40 135 Z" />
            <path d="M75 135 L80 175 L120 175 L125 135 Z" />
            <rect x="92" y="145" width="16" height="30" rx="8" opacity="0.4" />
            <rect x="85" y="175" width="30" height="20" />
          </svg>
        </div>

        {/* Dragonfly flying motif */}
        <div className="absolute left-8 top-3 pointer-events-none opacity-30">
          <svg viewBox="0 0 100 100" className="w-10 h-10 text-[#B45309] fill-current transform -rotate-12">
            <ellipse cx="50" cy="50" rx="3" ry="25" />
            <ellipse cx="30" cy="40" rx="18" ry="4" transform="rotate(-15 30 40)" />
            <ellipse cx="70" cy="40" rx="18" ry="4" transform="rotate(15 70 40)" />
            <ellipse cx="35" cy="52" rx="14" ry="3" transform="rotate(-10 35 52)" />
            <ellipse cx="65" cy="52" rx="14" ry="3" transform="rotate(10 65 52)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#B45309] text-white shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                SLIDE THUYẾT TRÌNH CHÍNH THỨC • CANVA 20 TRANG
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#EBD8BB] text-[#78350F] border border-[#DECDAF]">
                🏮 Màu vàng be • Hình chùa & chuồn chuồn
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#5C3818] tracking-tight">
              KHÁM PHÁ ĐỒNG TỬ LÀ GÌ ?
            </h2>

            <p className="text-xs sm:text-sm text-[#7D532B] font-medium leading-relaxed">
              Bài thuyết trình Canva chính thức của dự án gồm 20 trang hoàn chỉnh.
              Lướt Next / Prev tương tác trực tiếp ngay bên dưới hoặc bấm nút để mở toàn màn hình, không cần tải file!
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <button
              id="btn-view-slide-hero"
              type="button"
              onClick={() => onNavigateTab('slides')}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-extrabold bg-[#8B5A2B] hover:bg-[#6F441E] text-white shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Presentation className="w-5 h-5 text-amber-200" />
              <span>Xem Slide Thuyết Trình (20 Trang)</span>
            </button>

            <a
              href="https://canva.link/q4i9eu31pgyx9mu"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold bg-[#EBD8BB] hover:bg-[#DECAAC] text-[#6B4226] border border-[#D5BE99] transition-all cursor-pointer shadow-xs"
            >
              <span>Mở Canva Gốc</span>
              <span className="text-[10px]">↗</span>
            </a>
          </div>
        </div>

        {/* Live Responsive Canva Embed directly on Dashboard first page */}
        <div className="mt-5 pt-4 border-t border-[#DECDAF]/60 relative">
          <div className="flex items-center justify-between text-xs text-[#7D532B] font-semibold mb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Khung xem trực tiếp (Canva Embed 16:9 - 20 trang):
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('slides')}
              className="text-[#8B5A2B] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              Mở Toàn Màn Hình Thuyết Trình ↗
            </button>
          </div>

          <div className="relative w-full aspect-video min-h-[300px] sm:min-h-[420px] max-h-[560px] rounded-xl overflow-hidden border border-[#DECDAF] bg-black shadow-inner">
            <iframe
              src="https://www.canva.com/design/DAHS1ZrxJMc/JvKD4MJ5ne2FU55jAq_K7Q/view?embed"
              title="KHÁM PHÁ ĐỒNG TỬ LÀ GÌ ?"
              loading="lazy"
              allowFullScreen
              allow="fullscreen"
              className="w-full h-full border-0 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Hero Overview Card */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${theme.bgLight} ${theme.textLight}`}>
                {project.category}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {onlineMembers.length} thành viên đang online
              </span>
              <button
                id="btn-hero-add-member"
                type="button"
                onClick={onOpenAddMemberModal}
                className="flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 transition-colors border border-indigo-200/60 dark:border-indigo-800/60 shadow-2xs"
              >
                <UserPlus className="w-3 h-3" />
                + Thêm thành viên
              </button>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Hạn chót: {project.deadline} (Còn {daysLeft} ngày)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {project.name}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {project.description}
            </p>

            {/* Progress bar */}
            <div className="pt-2 space-y-1.5 max-w-md">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-400">Tiến độ tổng thể</span>
                <span className={theme.textLight}>100% Hoàn thành</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-linear-to-r ${theme.gradient} transition-all duration-500`}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap lg:flex-col gap-2.5 shrink-0">
            <button
              id="btn-quick-slide-studio"
              type="button"
              onClick={() => onNavigateTab('slides')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md bg-[#8B5A2B] hover:bg-[#6F441E] text-white cursor-pointer"
            >
              <Presentation className="w-4 h-4 text-amber-200" />
              Xem Slide Thuyết Trình (20 trang)
            </button>

            <button
              id="btn-quick-tasks"
              type="button"
              onClick={() => onNavigateTab('tasks')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Quản lý nhiệm vụ ({completedTasks.length}/{projectTasks.length})
            </button>

            <button
              id="btn-quick-ai-ideas"
              type="button"
              onClick={onOpenAiModal}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border ${theme.borderLight} ${theme.bgLight} ${theme.textLight} hover:opacity-90 transition-all`}
            >
              <Sparkles className="w-4 h-4" />
              AI Gợi Ý Dự Án
            </button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className={`absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-linear-to-br ${theme.gradient} opacity-5 blur-3xl pointer-events-none`} />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab('tasks')}
          className="cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Nhiệm vụ xong</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{completedTasks.length}</span>
            <span className="text-xs text-slate-400">/ {projectTasks.length} việc</span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            {inProgressTasks.length} việc đang làm
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('slides')}
          className="cursor-pointer bg-[#FDF8EE] dark:bg-slate-900 p-4 rounded-xl border border-[#DECDAF] dark:border-slate-800 hover:border-[#8B5A2B] transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8B5A2B] dark:text-amber-400">Slide Thuyết Trình</span>
            <div className="w-8 h-8 rounded-lg bg-[#EBD8BB] text-[#6B4226] flex items-center justify-center">
              <Presentation className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[#5C3818] dark:text-white">20</span>
            <span className="text-xs text-[#8B5A2B] dark:text-slate-400">trang Canva</span>
          </div>
          <p className="text-[11px] text-[#7D532B] dark:text-slate-400 mt-1 truncate font-bold">
            KHÁM PHÁ ĐỒNG TỬ LÀ GÌ ?
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('documents')}
          className="cursor-pointer bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tài nguyên nhóm</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{projectDocuments.length}</span>
            <span className="text-xs text-slate-400">tệp & liên kết</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            {projectDocuments.length > 0 ? `${projectDocuments.length} tài liệu đã lưu` : 'Chưa có tài liệu tải lên'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Thời gian báo cáo</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{daysLeft}</span>
            <span className="text-xs text-slate-400">ngày nữa</span>
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
            Hạn chót: {project.deadline}
          </p>
        </div>
      </div>

      {/* Two Column Layout: Active Members & Your Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Projects list & Task progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Single Official Project Banner */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Dự Án Chính Thức Duy Nhất
                </h2>
                <p className="text-xs text-slate-500">
                  Không gian làm việc nhóm tập trung với bài thuyết trình Canva 20 trang
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
                ✓ Dự án chuẩn
              </span>
            </div>

            <div className="space-y-2.5">
              {allProjects.map((p) => {
                const isSelected = p.id === project.id;
                const isOnline = p.members.some((m) => m.isOnline);
                const pTasks = tasks.filter((t) => t.projectId === p.id);
                const pCompleted = pTasks.filter((t) => t.status === 'completed');
                const pProgress =
                  pTasks.length > 0
                    ? Math.round((pCompleted.length / pTasks.length) * 100)
                    : 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectProject(p)}
                    className={`cursor-pointer rounded-xl px-4 py-3 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-indigo-500 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          isOnline ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-slate-400 dark:bg-slate-500'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {p.name}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 shrink-0">
                              Đang thực hiện
                            </span>
                          )}
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                            {p.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {p.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {p.members.length} thành viên • {pProgress}% tiến độ
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                          isOnline
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                      {allProjects.length > 1 && onDeleteProject && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteProject(p.id);
                          }}
                          title="Xóa dự án này"
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {allProjects.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Chưa có dự án nào. Bấm "+ Tạo nhóm mới" để bắt đầu!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Active Team Members Status */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                Thành Viên ({project.members.length})
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hidden sm:flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {onlineMembers.length} Online
                </span>
                <button
                  id="btn-card-header-add-member"
                  type="button"
                  onClick={onOpenAddMemberModal}
                  className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${theme.bgLight} ${theme.textLight} hover:opacity-90 transition-opacity`}
                >
                  <UserPlus className="w-3 h-3" />
                  + Thêm
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {project.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="relative shrink-0">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                      referrerPolicy="no-referrer"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                        member.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {member.name}
                        </h4>
                        {(member.id === project.adminId || member.isAdmin || member.role.includes('Trưởng nhóm') || member.role.includes('Quản trị viên')) && (
                          <span
                            title="Quản trị viên nhóm: Có quyền xóa thành viên"
                            className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50 shrink-0"
                          >
                            <Crown className="w-2.5 h-2.5 text-amber-500" />
                            Admin
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {member.isOnline ? 'Đang hoạt động' : 'Vắng mặt'}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 truncate">
                      {member.role}
                    </p>
                    {member.statusText && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic line-clamp-1 bg-slate-50 dark:bg-slate-800/60 px-1.5 py-0.5 rounded">
                        "{member.statusText}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                id="btn-card-footer-add-member"
                type="button"
                onClick={onOpenAddMemberModal}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${theme.primary} shadow-xs`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                + Thêm / Mời Thành Viên Mới
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('chat')}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 ${theme.bgLight} ${theme.textLight} hover:opacity-90 transition-all`}
              >
                Nhắn Tin Trao Đổi Với Nhóm
              </button>
            </div>
          </div>

          {/* Quick Voice Chat Invitation Card */}
          <div className="bg-linear-to-br from-indigo-900 to-slate-900 text-white rounded-xl p-5 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Radio className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Voice Room Sẵn Sàng
              </span>
            </div>
            <h4 className="text-sm font-bold mb-1">
              Thảo luận trực tiếp bằng Micro
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Bật mic để trao đổi ý tưởng ngay trong lúc soạn bài thuyết trình hoặc làm báo cáo môn học.
            </p>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Độ trễ thấp • Âm thanh HD</span>
              <span className="text-emerald-400 font-bold">● Đang mở</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
