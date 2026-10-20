import { Project, Member, Task, SlideDeck, DocumentResource, ChatMessage, AppNotification } from '../types';

export const CURRENT_USER: Member = {
  id: 'usr_me',
  name: 'Linh Thảo (Bạn)',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  role: 'Trưởng nhóm / Quản trị viên',
  email: 'thaolinh422006@gmail.com',
  isOnline: true,
  isSpeaking: false,
  micMuted: true,
  statusText: 'Sẵn sàng làm việc',
  isAdmin: true,
};

// 4 Thành viên ảo mẫu phục vụ demo và thuyết trình dự án
export const DEMO_MEMBERS: Member[] = [
  {
    id: 'usr_huyen',
    name: 'Thu Huyền',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'Thiết kế Slide',
    email: 'thuhuyen.design@edu.vn',
    isOnline: true,
    statusText: 'Đã hoàn thiện slide Canva 20 trang',
    isAdmin: false,
  },
  {
    id: 'usr_thoa',
    name: 'Kim Thoa',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'Nghiên cứu số liệu',
    email: 'kimthoa.data@edu.vn',
    isOnline: true,
    statusText: 'Đã tổng hợp dữ liệu khảo sát thị giác',
    isAdmin: false,
  },
  {
    id: 'usr_thy',
    name: 'Mai Thy',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    role: 'Soạn nội dung',
    email: 'maithy.content@edu.vn',
    isOnline: true,
    statusText: 'Đã duyệt đề cương thuyết trình 20 trang',
    isAdmin: false,
  },
  {
    id: 'usr_hong',
    name: 'Ánh Hồng',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    role: 'Tổng hợp báo cáo',
    email: 'anhhong.report@edu.vn',
    isOnline: false,
    statusText: 'Đã hoàn tất báo cáo tổng quan',
    isAdmin: false,
  },
];

// Initial members list combining host and demo members
export const INITIAL_MEMBERS: Member[] = [
  CURRENT_USER,
  ...DEMO_MEMBERS,
];

// Single real project: Báo Cáo Dự Án: Ứng Dụng AI Trong Giáo Dục
export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj_1',
    name: 'Báo Cáo Dự Án: Ứng Dụng AI Trong Giáo Dục',
    description: 'Báo cáo nghiên cứu & bài thuyết trình Canva 20 trang về khám phá đồng tử và ứng dụng công nghệ trong giáo dục.',
    category: 'Báo cáo môn học',
    members: INITIAL_MEMBERS,
    status: 'active',
    progress: 100,
    avatarColor: 'from-amber-600 to-yellow-600',
    deadline: '2026-10-30',
    adminId: 'usr_me',
  },
];

// 1-2 Nhiệm vụ mẫu hoàn thành 100% cho mỗi thành viên ảo để demo thuyết trình
export const INITIAL_TASKS: Task[] = [
  {
    id: 'task_demo_1',
    projectId: 'proj_1',
    title: 'Thiết kế bố cục 20 trang slide Canva theo tông màu vàng be',
    description: 'Hoàn thiện bản thuyết trình Canva "Khám Phá Đồng Tử Là Gì ?" phong cách dân gian Việt Nam với hoạ tiết chùa và chuồn chuồn.',
    assigneeId: 'usr_huyen',
    assigneeName: 'Thu Huyền',
    assigneeAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    dueDate: '2026-10-18',
    status: 'completed',
    priority: 'high',
    tags: ['Slide', 'Canva', 'Thiết kế'],
  },
  {
    id: 'task_demo_2',
    projectId: 'proj_1',
    title: 'Tối ưu hóa hình ảnh và hiệu ứng chuyển trang slide',
    description: 'Kiểm tra độ hiển thị tương thích 16:9 sắc nét trên máy chiếu và màn hình di động.',
    assigneeId: 'usr_huyen',
    assigneeName: 'Thu Huyền',
    assigneeAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    dueDate: '2026-10-19',
    status: 'completed',
    priority: 'medium',
    tags: ['Slide', 'Trình chiếu'],
  },
  {
    id: 'task_demo_3',
    projectId: 'proj_1',
    title: 'Thu thập số liệu nghiên cứu sinh học về phản xạ đồng tử',
    description: 'Tổng hợp các bài báo khoa học về cơ chế co giãn của đồng tử khi tiếp nhận quang phổ ánh sáng khác nhau.',
    assigneeId: 'usr_thoa',
    assigneeName: 'Kim Thoa',
    assigneeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    dueDate: '2026-10-17',
    status: 'completed',
    priority: 'high',
    tags: ['Dữ liệu', 'Khoa học'],
  },
  {
    id: 'task_demo_4',
    projectId: 'proj_1',
    title: 'Thống kê kết quả khảo sát ứng dụng AI trong học đường',
    description: 'Phân tích bảng hỏi từ 300 học sinh về sự tương tác với trợ lý số theo dõi độ tập trung qua ánh mắt.',
    assigneeId: 'usr_thoa',
    assigneeName: 'Kim Thoa',
    assigneeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    dueDate: '2026-10-19',
    status: 'completed',
    priority: 'medium',
    tags: ['Số liệu', 'AI'],
  },
  {
    id: 'task_demo_5',
    projectId: 'proj_1',
    title: 'Soạn thảo nội dung chi tiết 20 phần cho bài thuyết trình',
    description: 'Biên tập cấu trúc bài giảng: từ giải phẫu con ngươi, hiện tượng đồng tử giãn trong bóng tối đến ứng dụng công nghệ Eye-Tracking.',
    assigneeId: 'usr_thy',
    assigneeName: 'Mai Thy',
    assigneeAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    dueDate: '2026-10-18',
    status: 'completed',
    priority: 'high',
    tags: ['Nội dung', 'Biên tập'],
  },
  {
    id: 'task_demo_6',
    projectId: 'proj_1',
    title: 'Chuẩn bị bộ câu hỏi đố vui và tình huống tương tác',
    description: 'Thiết kế mini game và câu đố trực quan trang 15-16 giúp khán giả hào hứng tham gia phản biện.',
    assigneeId: 'usr_thy',
    assigneeName: 'Mai Thy',
    assigneeAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    dueDate: '2026-10-19',
    status: 'completed',
    priority: 'medium',
    tags: ['Tương tác', 'Mini game'],
  },
  {
    id: 'task_demo_7',
    projectId: 'proj_1',
    title: 'Tổng hợp báo cáo chuyên đề và kết luận dự án AI giáo dục',
    description: 'Đúc kết 5 điểm then chốt của đề tài, hoàn thiện báo cáo tổng quan nộp hội đồng đánh giá.',
    assigneeId: 'usr_hong',
    assigneeName: 'Ánh Hồng',
    assigneeAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    dueDate: '2026-10-19',
    status: 'completed',
    priority: 'high',
    tags: ['Báo cáo', 'Tổng hợp'],
  },
];

// Reset mock notifications to empty array
export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

// Real Canva Slide Deck representation
export const INITIAL_SLIDES: SlideDeck = {
  id: 'deck_canva_dong_tu',
  projectId: 'proj_1',
  title: 'KHÁM PHÁ ĐỒNG TỬ LÀ GÌ ?',
  author: 'Linh Thảo (Bạn)',
  themeStyle: 'modern',
  lastModified: 'Vừa xong',
  aspectRatio: '16:9',
  slides: [
    {
      id: 'slide_canva_main',
      title: 'KHÁM PHÁ ĐỒNG TỬ LÀ GÌ ?',
      subtitle: 'Bản Thuyết Trình Canva 20 Trang Hoàn Chỉnh - Màu Vàng Be Dân Gian',
      bullets: [
        'Bài thuyết trình chính thức được nhúng trực tiếp từ Canva',
        '20 trang slide hoàn chỉnh với đồ họa chùa và chuồn chuồn tinh xảo',
        'Lướt Next / Prev tương tác trực tiếp ngay trong ứng dụng',
      ],
      notes: 'Bản thiết kế Canva: Màu Vàng Bài Thuyết Trình Trò Chơi Dân Gian Việt Nam Đơn Giản Open House Mầm Non',
      layout: 'title',
      backgroundColor: '#FAF3E0',
      canvasElements: [],
    },
  ],
};

// Reset mock documents to empty array
export const INITIAL_DOCUMENTS: DocumentResource[] = [];

// Reset mock chat messages to empty array
export const INITIAL_MESSAGES: ChatMessage[] = [];
