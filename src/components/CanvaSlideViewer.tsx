import React, { useState, useRef, useEffect } from 'react';
import {
  Maximize2,
  Minimize2,
  ExternalLink,
  RotateCw,
  Copy,
  Check,
  BookOpen,
  Sparkles,
  ChevronRight,
  Info,
  Layers,
  ArrowLeft,
  Flame,
  Award,
} from 'lucide-react';
import { ThemeConfig } from '../utils/theme';

interface CanvaSlideViewerProps {
  theme: ThemeConfig;
  projectName?: string;
  onBackToDashboard?: () => void;
  isEmbedInDashboard?: boolean;
}

export const CANVA_SHARE_URL = 'https://canva.link/q4i9eu31pgyx9mu';
export const CANVA_EMBED_URL = 'https://www.canva.com/design/DAHS1ZrxJMc/JvKD4MJ5ne2FU55jAq_K7Q/view?embed';
export const SLIDE_TITLE = 'KHÁM PHÁ ĐỒNG TỬ LÀ GÌ ?';
export const TOTAL_PAGES = 20;

// 20 Trang nội dung thực tế của bài thuyết trình
export const SLIDE_PAGES_OUTLINE = [
  { page: 1, title: 'Bìa chính: Khám Phá Đồng Tử Là Gì ?', category: 'Mở đầu' },
  { page: 2, title: 'Lời chào & Giới thiệu chủ đề bài thuyết trình', category: 'Tổng quan' },
  { page: 3, title: 'Cấu tạo sinh học của đôi mắt & Vị trí đồng tử', category: 'Khoa học' },
  { page: 4, title: 'Định nghĩa: Đồng tử (con ngươi) là gì?', category: 'Khái niệm' },
  { page: 5, title: 'Cơ chế co - giãn tự động của đồng tử', category: 'Sinh học' },
  { page: 6, title: 'Hiện tượng đồng tử giãn to trong bóng tối', category: 'Hiện tượng' },
  { page: 7, title: 'Hiện tượng đồng tử co nhỏ khi gặp ánh sáng mạnh', category: 'Hiện tượng' },
  { page: 8, title: 'Đồng tử và tâm lý học: Phản ánh cảm xúc con người', category: 'Tâm lý' },
  { page: 9, title: 'Đồng tử ở thế giới động vật: Mèo, Dê, Chim cú...', category: 'Động vật học' },
  { page: 10, title: 'Vì sao mắt mèo có đồng tử hình khe dọc kỳ lạ?', category: 'Khám phá' },
  { page: 11, title: 'Ứng dụng AI: Công nghệ theo dõi ánh mắt (Eye-Tracking)', category: 'Công nghệ AI' },
  { page: 12, title: 'AI phân tích độ tập trung của người học qua đồng tử', category: 'Ứng dụng GD' },
  { page: 13, title: 'Chẩn đoán bệnh sớm qua kích thước và phản xạ đồng tử', category: 'Y tế số' },
  { page: 14, title: 'Thí nghiệm thực hành: Tự quan sát đồng tử trước gương', category: 'Thực hành' },
  { page: 15, title: 'Góc đố vui & Trắc nghiệm tương tác nhóm', category: 'Tương tác' },
  { page: 16, title: 'Trò chơi dân gian liên quan đến đôi mắt và quan sát', category: 'Văn hóa' },
  { page: 17, title: 'Phương pháp bảo vệ thị lực và chăm sóc đôi mắt khỏe', category: 'Sức khỏe' },
  { page: 18, title: '5 Điều cốt lõi cần nhớ về đồng tử', category: 'Tóm tắt' },
  { page: 19, title: 'Thảo luận nhóm & Hỏi đáp phản biện cùng AI', category: 'Thảo luận' },
  { page: 20, title: 'Lời cảm ơn ban giám khảo & Thành viên lắng nghe', category: 'Kết luận' },
];

export const CanvaSlideViewer: React.FC<CanvaSlideViewerProps> = ({
  theme,
  projectName = 'Báo Cáo Dự Án: Ứng Dụng AI Trong Giáo Dục',
  onBackToDashboard,
  isEmbedInDashboard = false,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOutlinePage, setActiveOutlinePage] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(CANVA_SHARE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {
          setIsFullscreen(true);
        });
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Escape key support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  return (
    <div
      ref={containerRef}
      className={`relative transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#1A1612] flex flex-col p-2 sm:p-4'
          : 'w-full space-y-4'
      }`}
    >
      {/* Golden-Beige Traditional Header Banner */}
      <div
        className="rounded-2xl p-4 sm:p-6 border shadow-sm relative overflow-hidden transition-colors"
        style={{
          background: 'linear-gradient(135deg, #FDF7EA 0%, #F6ECDA 50%, #EFE1C6 100%)',
          borderColor: '#DECDAF',
        }}
      >
        {/* Decorative Pagoda & Dragonfly SVG motifs */}
        <div className="absolute right-0 top-0 bottom-0 w-64 pointer-events-none opacity-20 overflow-hidden flex items-center justify-end pr-4">
          <svg viewBox="0 0 200 200" className="w-56 h-56 text-[#8B5A2B] fill-current">
            {/* Stylized Traditional Vietnamese Pagoda (Chùa Một Cột) */}
            <path d="M100 20 L108 35 L125 38 L112 50 L115 67 L100 58 L85 67 L88 50 L75 38 L92 35 Z" opacity="0.8" />
            <path d="M50 85 C80 75, 120 75, 150 85 L145 95 C120 90, 80 90, 55 95 Z" />
            <path d="M60 95 L65 125 L135 125 L140 95 Z" opacity="0.6" />
            <path d="M35 125 C80 115, 120 115, 165 125 L160 135 C120 128, 80 128, 40 135 Z" />
            <path d="M75 135 L80 175 L120 175 L125 135 Z" />
            <rect x="92" y="145" width="16" height="30" rx="8" opacity="0.4" />
            <rect x="85" y="175" width="30" height="20" />
          </svg>
        </div>

        {/* Dragonfly flying motif in top corner */}
        <div className="absolute left-6 top-3 pointer-events-none opacity-25">
          <svg viewBox="0 0 100 100" className="w-10 h-10 text-[#B45309] fill-current transform -rotate-12">
            <ellipse cx="50" cy="50" rx="3" ry="25" />
            <ellipse cx="30" cy="40" rx="18" ry="4" transform="rotate(-15 30 40)" />
            <ellipse cx="70" cy="40" rx="18" ry="4" transform="rotate(15 70 40)" />
            <ellipse cx="35" cy="52" rx="14" ry="3" transform="rotate(-10 35 52)" />
            <ellipse cx="65" cy="52" rx="14" ry="3" transform="rotate(10 65 52)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              {onBackToDashboard && !isEmbedInDashboard && (
                <button
                  type="button"
                  onClick={onBackToDashboard}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-[#EBD9BE] hover:bg-[#DECAAC] text-[#6B4226] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Quay lại Tổng Quan
                </button>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#B45309] text-white shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                CANVA CHÍNH THỨC • {TOTAL_PAGES} TRANG
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F0E2C8] text-[#78350F] border border-[#DECDAF]">
                🎨 Phong cách màu vàng be, hình chùa & chuồn chuồn
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#5C3818] tracking-tight flex items-center gap-2">
              <span>{SLIDE_TITLE}</span>
            </h1>

            <p className="text-xs sm:text-sm text-[#7D532B] font-medium max-w-3xl leading-relaxed">
              Slide thuyết trình chính thức của dự án{' '}
              <strong className="text-[#5C3818]">"{projectName}"</strong>. Đã kết nối nhúng trực tiếp từ Canva,
              cho phép xem full màn hình và lướt Next/Prev 20 trang ngay trong app mà không cần tải file!
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              id="btn-canva-fullscreen"
              type="button"
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#8B5A2B] hover:bg-[#72451C] text-white shadow-sm transition-all cursor-pointer"
              title="Phóng to toàn màn hình để thuyết trình"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  <span>Thu Nhỏ</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  <span>Toàn Màn Hình</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReload}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#EBD8BB] hover:bg-[#DECAAC] text-[#6B4226] border border-[#D5BE99] transition-all cursor-pointer"
              title="Tải lại khung trình chiếu"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Tải Lại</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#EBD8BB] hover:bg-[#DECAAC] text-[#6B4226] border border-[#D5BE99] transition-all cursor-pointer"
              title="Sao chép link Canva"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã chép link' : 'Chép Link'}</span>
            </button>

            <a
              href={CANVA_SHARE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#D97706] hover:bg-[#B45309] text-white shadow-xs transition-all"
              title="Mở trên trang Canva.com trong tab mới"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Mở Canva Gốc</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Responsive Iframe Container */}
      <div
        className={`relative overflow-hidden rounded-2xl border bg-black shadow-xl transition-all ${
          isFullscreen ? 'flex-1 h-full w-full my-2' : 'w-full'
        }`}
        style={{
          borderColor: '#DECDAF',
        }}
      >
        {/* Loading Spinner Indicator */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#FAF3E0] text-[#78350F] p-6 text-center space-y-3">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-4 border-[#DECDAF] border-t-[#B45309] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#B45309]" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#5C3818]">Đang kết nối Slide Canva 20 trang...</p>
              <p className="text-xs text-[#8B5A2B]">Chủ đề: {SLIDE_TITLE}</p>
            </div>
          </div>
        )}

        {/* 16:9 Aspect Ratio Wrapper or Fullscreen Flex */}
        <div
          className={`relative w-full ${
            isFullscreen ? 'h-full min-h-[85vh]' : 'aspect-video min-h-[380px] sm:min-h-[480px] md:min-h-[580px] lg:min-h-[660px]'
          }`}
        >
          <iframe
            key={iframeKey}
            src={CANVA_EMBED_URL}
            title={SLIDE_TITLE}
            loading="lazy"
            allowFullScreen
            allow="fullscreen"
            onLoad={() => setIsLoading(false)}
            className="absolute inset-0 w-full h-full border-0 rounded-2xl bg-[#F6ECDA]"
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </div>

        {/* Floating Quick Tip Bar on Bottom */}
        <div className="absolute bottom-2 left-2 right-2 z-10 pointer-events-none flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-[11px] font-medium border border-white/10 opacity-90 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2 pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Slide tương tác Canva thật: Lướt Next / Prev hoặc bấm phím mũi tên ◀ ▶</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 pointer-events-auto">
            <span className="text-amber-300 font-bold">20 Trang Hoàn Chỉnh</span>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="text-white hover:text-amber-300 underline font-semibold cursor-pointer"
            >
              {isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            </button>
          </div>
        </div>
      </div>

      {/* Slide Navigation Guide & Outline (20 Trang) */}
      {!isFullscreen && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EBD8BB] text-[#6B4226] flex items-center justify-center font-bold text-xs">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Mục Lục & Khung Bài Giảng ({TOTAL_PAGES} Trang Chi Tiết)
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Nhấp vào từng trang để xem tóm lược nội dung
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
            {SLIDE_PAGES_OUTLINE.map((item) => {
              const isSelected = activeOutlinePage === item.page;
              return (
                <div
                  key={item.page}
                  onClick={() => setActiveOutlinePage(isSelected ? null : item.page)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#B45309] bg-[#FDF6E2] dark:bg-[#78350F]/20 ring-2 ring-[#B45309]/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#DECDAF] hover:bg-[#FDFBF7] dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-[#F4E9D4] text-[#8B5A2B] dark:bg-slate-800 dark:text-amber-400">
                      Trang {item.page}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight">
                    {item.title}
                  </p>
                </div>
              );
            })}
          </div>

          {activeOutlinePage && (
            <div className="p-3.5 rounded-xl bg-[#FDF8EE] dark:bg-[#78350F]/15 border border-[#DECDAF] text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-[#5C3818] dark:text-amber-300">
                <span>Trang {activeOutlinePage}: {SLIDE_PAGES_OUTLINE[activeOutlinePage - 1]?.title}</span>
                <button
                  type="button"
                  onClick={() => setActiveOutlinePage(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                >
                  ✕ Đóng
                </button>
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Để chuyển đến trang {activeOutlinePage} trong bài giảng, bạn sử dụng thanh điều khiển Canva ở góc dưới iframe (bấm mũi tên Tiếp/Lùi hoặc nhập số trang).
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
