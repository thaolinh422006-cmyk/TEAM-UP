import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { VoiceRoomBar } from './components/VoiceRoomBar';
import { DashboardView } from './components/DashboardView';
import { TaskBoardView } from './components/TaskBoardView';
import { PresentationEditor } from './components/PresentationEditor';
import { CanvaSlideViewer } from './components/CanvaSlideViewer';
import { ChatView } from './components/ChatView';
import { DocumentsView } from './components/DocumentsView';
import { AiAssistantModal } from './components/AiAssistantModal';
import { UpAiView } from './components/UpAiView';
import { AddMemberModal } from './components/AddMemberModal';
import { JoinTeamModal } from './components/JoinTeamModal';
import { JoinByGmailModal } from './components/JoinByGmailModal';
import { DeviceToast } from './components/DeviceToast';
import {
  INITIAL_PROJECTS,
  CURRENT_USER,
  DEMO_MEMBERS,
  INITIAL_TASKS,
  INITIAL_MESSAGES,
  INITIAL_DOCUMENTS,
  INITIAL_SLIDES,
  INITIAL_NOTIFICATIONS,
} from './data/mockData';
import { THEMES, createPastelTheme, applyThemeCssVariables } from './utils/theme';
import { createMemberFromEmail, formatNameFromEmail } from './utils/user';
import {
  ActiveTab,
  ThemeColor,
  Project,
  Member,
  Task,
  TaskStatus,
  ChatMessage,
  DocumentResource,
  SlideDeck,
  AppNotification,
  TeamInvitation,
} from './types';
import { sendDeviceNotification, requestDeviceNotificationPermission } from './utils/notificationService';
import { X } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  // Theme & Dark mode: support 5 classic colors, 12 pastel presets, and custom pastel hex
  const [themeColor, setThemeColor] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('teamup_theme');
      if (savedTheme) return savedTheme;
      const saved = localStorage.getItem('teamup_theme_color');
      if (saved) return saved;
    }
    return 'pastel-mint';
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('teamup_dark_mode');
      if (saved !== null) return saved === 'true';
    }
    // Default to clean Light Mode
    return false;
  });

  // App navigation & state
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Purge mock data constants
  const MOCK_PROJECT_NAMES = [
    'Ý Tưởng Khởi Nghiệp: Nông Nghiệp Xanh 4.0',
    'Chiến Dịch Truyền Thông CLB Tình Nguyện',
  ];
  const MOCK_PROJECT_IDS = ['proj_2', 'proj_3'];
  const MOCK_TASK_IDS = ['tsk_1', 'tsk_2', 'tsk_3', 'tsk_4', 'tsk_5', 'tsk_6'];
  const MOCK_DOC_IDS = ['doc_1', 'doc_2', 'doc_3', 'doc_4'];
  const MOCK_MEMBER_EMAILS = ['hoang.minh@edu.vn', 'vy.khanh@edu.vn', 'long.bao@edu.vn', 'hung.nguyen@edu.vn'];
  const MOCK_MEMBER_IDS = ['usr_1', 'usr_2', 'usr_3', 'usr_4'];
  const MOCK_MEMBER_NAMES = ['Minh Hoàng', 'Khánh Vy', 'Bảo Long', 'TS. Nguyễn Văn Hùng'];

  const [projects, setProjects] = useState<Project[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        // Enforce 1 single real project and remove old virtual slides
        localStorage.setItem('teamup_projects', JSON.stringify(INITIAL_PROJECTS));
        localStorage.setItem('teamup_active_project_id', INITIAL_PROJECTS[0].id);
        localStorage.removeItem('teamup_presentation');
      } catch (e) {
        console.error('Failed to sync project', e);
      }
    }
    return INITIAL_PROJECTS;
  });

  const [activeProjectId, setActiveProjectId] = useState<string>(INITIAL_PROJECTS[0].id);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('teamup_active_project_id', activeProjectId);
    }
  }, [activeProjectId]);

  // Sync activeProjectId if current active project doesn't exist
  useEffect(() => {
    if (projects.length > 0 && !projects.some((p) => p.id === activeProjectId)) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects, activeProjectId]);

  // Persist tasks in localStorage so assigned members and status are never lost
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('teamup_tasks');
      if (saved) {
        try {
          const parsed: Task[] = JSON.parse(saved);
          const cleaned = parsed.filter(
            (t) =>
              !MOCK_TASK_IDS.includes(t.id) &&
              !MOCK_PROJECT_IDS.includes(t.projectId) &&
              !MOCK_MEMBER_IDS.includes(t.assigneeId || '')
          );
          localStorage.setItem('teamup_tasks', JSON.stringify(cleaned));
          return cleaned;
        } catch (e) {
          console.error('Failed to parse saved tasks', e);
        }
      }
    }
    return INITIAL_TASKS;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('teamup_tasks', JSON.stringify(tasks));
      } catch (e) {
        console.error('Failed to save tasks to localStorage', e);
      }
    }
  }, [tasks]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('teamup_messages');
      if (saved) {
        try {
          const parsed: ChatMessage[] = JSON.parse(saved);
          const cleaned = parsed.filter(
            (m) =>
              !['msg_1', 'msg_2', 'msg_3', 'msg_4', 'msg_5'].includes(m.id) &&
              !MOCK_PROJECT_IDS.includes(m.projectId) &&
              !MOCK_MEMBER_IDS.includes(m.senderId)
          );
          localStorage.setItem('teamup_messages', JSON.stringify(cleaned));
          return cleaned;
        } catch (e) {
          console.error('Failed to parse saved messages', e);
        }
      }
    }
    return INITIAL_MESSAGES;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('teamup_messages', JSON.stringify(messages));
      } catch (e) {
        console.error('Failed to save messages to localStorage', e);
      }
    }
  }, [messages]);

  // Persist documents in localStorage so uploaded files are stored and displayed across sessions
  const [documents, setDocuments] = useState<DocumentResource[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('teamup_documents');
      if (saved) {
        try {
          const parsed: DocumentResource[] = JSON.parse(saved);
          const cleaned = parsed.filter(
            (d) => !MOCK_DOC_IDS.includes(d.id) && !MOCK_PROJECT_IDS.includes(d.projectId)
          );
          localStorage.setItem('teamup_documents', JSON.stringify(cleaned));
          return cleaned;
        } catch (e) {
          console.error('Failed to parse saved documents', e);
        }
      }
    }
    return INITIAL_DOCUMENTS;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('teamup_documents', JSON.stringify(documents));
      } catch (e) {
        console.error('Failed to save documents to localStorage', e);
      }
    }
  }, [documents]);

  const [presentation, setPresentation] = useState<SlideDeck>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('teamup_presentation');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved presentation', e);
        }
      }
    }
    return INITIAL_SLIDES;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('teamup_presentation', JSON.stringify(presentation));
      } catch (e) {
        console.error('Failed to save presentation to localStorage', e);
      }
    }
  }, [presentation]);

  // Current logged in user (with localStorage persistence)
  const [currentUser, setCurrentUser] = useState<Member>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('teamup_current_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.email || parsed.id === 'usr_me')) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Error parsing saved currentUser', e);
      }
    }
    return CURRENT_USER;
  });

  // Automatically show popup "Nhập Gmail của bạn để tham gia dự án" if no account is in localStorage
  const [isJoinByGmailModalOpen, setIsJoinByGmailModalOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('teamup_current_user');
      if (!saved) return true;
      try {
        const parsed = JSON.parse(saved);
        if (!parsed || (!parsed.email && parsed.id !== 'usr_me')) {
          return true;
        }
      } catch {
        return true;
      }
    }
    return false;
  });

  // Invitations cache in App for suggestions and status updates
  const [allInvitations, setAllInvitations] = useState<TeamInvitation[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('teamup_invitations');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  // Fetch invitations from backend to keep state synced
  useEffect(() => {
    fetch('/api/invitations')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.invitations)) {
          setAllInvitations(data.invitations);
          try {
            localStorage.setItem('teamup_invitations', JSON.stringify(data.invitations));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  // Save currentUser whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && currentUser) {
      try {
        localStorage.setItem('teamup_current_user', JSON.stringify(currentUser));
      } catch (e) {
        console.error('Failed to save currentUser to localStorage', e);
      }
    }
  }, [currentUser]);

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  // Canva Style Email Invitation State
  const [invitationToJoin, setInvitationToJoin] = useState<TeamInvitation | null>(null);
  const [isJoinTeamModalOpen, setIsJoinTeamModalOpen] = useState(false);

  // Requirement 1 & 2: Nhập Gmail để tham gia dự án
  const handleJoinByGmail = async (inputEmail: string, inputName?: string) => {
    const cleanEmail = inputEmail.trim().toLowerCase();
    const displayName = inputName?.trim() || formatNameFromEmail(cleanEmail);
    const memberObj: Member = {
      id: `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      name: displayName,
      email: cleanEmail,
      role: 'Thành viên',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isOnline: true,
    };

    // 1. Call backend API to change invitation status to "joined" in database
    try {
      const res = await fetch('/api/invitations/join-by-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          name: memberObj.name,
          userId: memberObj.id,
        }),
      });
      const data = await res.json();
      if (data.success && data.invitation) {
        if (data.invitation.role) {
          memberObj.role = data.invitation.role;
        }
        if (data.invitation.recipientName && !inputName?.trim()) {
          memberObj.name = data.invitation.recipientName;
        }
        if (data.invitation.projectId) {
          setActiveProjectId(data.invitation.projectId);
        }
      }
    } catch (err) {
      console.error('Error joining via email API:', err);
    }

    // 2. Update localStorage invitations to mark status as "joined" immediately
    try {
      const savedInvites = localStorage.getItem('teamup_invitations');
      const existing: TeamInvitation[] = savedInvites ? JSON.parse(savedInvites) : allInvitations;
      let found = false;
      const updatedInvites = existing.map((i) => {
        if (i.email && i.email.toLowerCase() === cleanEmail) {
          found = true;
          return {
            ...i,
            status: 'joined' as const,
            acceptedAt: new Date().toISOString(),
            recipientName: memberObj.name,
          };
        }
        return i;
      });

      if (!found) {
        updatedInvites.unshift({
          id: `inv_${Date.now()}_auto`,
          email: cleanEmail,
          recipientName: memberObj.name,
          projectId: activeProjectId || 'proj_1',
          projectName: 'Báo Cáo Dự Án: Ứng Dụng AI Trong Giáo Dục',
          inviterName: 'Trưởng nhóm',
          role: memberObj.role || 'Thành viên',
          status: 'joined',
          createdAt: new Date().toISOString(),
          acceptedAt: new Date().toISOString(),
          inviteUrl: window.location.origin,
        });
      }
      setAllInvitations(updatedInvites);
      localStorage.setItem('teamup_invitations', JSON.stringify(updatedInvites));
    } catch (e) {
      console.error('Failed to update localStorage invitations on join', e);
    }

    // 3. Save currentUser to localStorage and state
    try {
      localStorage.setItem('teamup_current_user', JSON.stringify(memberObj));
    } catch {}
    setCurrentUser(memberObj);

    // 4. Add or update member in projects
    setProjects((prev) =>
      prev.map((p) => {
        const alreadyExists = p.members.some(
          (m) => m.email?.toLowerCase() === cleanEmail || m.id === memberObj.id
        );
        if (alreadyExists) {
          return {
            ...p,
            members: p.members.map((m) =>
              m.email?.toLowerCase() === cleanEmail || m.id === memberObj.id
                ? { ...m, name: memberObj.name, isOnline: true }
                : m
            ),
          };
        }
        return {
          ...p,
          members: [...p.members, memberObj],
        };
      })
    );

    // 5. Celebration & toast notification
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}

    const joinTitle = '🎉 Tham gia nhóm thành công!';
    const joinBody = `Bạn đang làm việc với tư cách: ${memberObj.name} (${cleanEmail}).`;
    setActiveToast({
      id: `toast_join_${Date.now()}`,
      title: joinTitle,
      body: joinBody,
      type: 'member_add',
    });
    sendDeviceNotification({
      title: joinTitle,
      body: joinBody,
      type: 'member_add',
    });

    setIsJoinByGmailModalOpen(false);
  };

  const handleContinueAsAdmin = () => {
    try {
      localStorage.setItem('teamup_current_user', JSON.stringify(CURRENT_USER));
    } catch {}
    setCurrentUser(CURRENT_USER);
    setIsJoinByGmailModalOpen(false);
    setActiveToast({
      id: `toast_admin_${Date.now()}`,
      title: '👑 Quản trị viên (Linh Thảo)',
      body: 'Bạn đang thao tác với tư cách Trưởng nhóm Linh Thảo.',
      type: 'info',
    });
  };

  // Clean URL parameters: strip ?join=, ?invite=, etc. without page reload
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const joinParam = searchParams.get('join');
      const inviteToken = searchParams.get('invite');

      // If user opened with an old ?join= link, auto-fill it or join immediately
      if (joinParam && joinParam.trim()) {
        const cleanEmail = joinParam.trim().toLowerCase();
        handleJoinByGmail(cleanEmail);
      } else if (inviteToken) {
        fetch(`/api/invitations/${encodeURIComponent(inviteToken)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.invitation) {
              setInvitationToJoin(data.invitation);
              setIsJoinTeamModalOpen(true);
            }
          })
          .catch((err) => console.error('Error fetching invite:', err));
      }

      // Always clean up query parameters from the browser address bar
      if (window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {}
  }, []);

  // New project form state
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState<Project['category']>('Báo cáo môn học');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectDeadline, setNewProjectDeadline] = useState('');

  const activeTheme = useMemo(() => {
    if (THEMES[themeColor]) return THEMES[themeColor];
    if (themeColor.startsWith('#')) {
      return createPastelTheme(themeColor, 'Pastel Tùy Chọn');
    }
    return THEMES['pastel-mint'] || THEMES.indigo;
  }, [themeColor]);
  const activeProject =
    projects.find((p) => p.id === activeProjectId) || projects[0] || INITIAL_PROJECTS[0];

  // Sync dark class on document element & persist
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('teamup_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('teamup_dark_mode', 'false');
    }
  }, [isDark]);

  useEffect(() => {
    try {
      localStorage.setItem('teamup_theme', themeColor);
      localStorage.setItem('teamup_theme_color', themeColor);
      applyThemeCssVariables(activeTheme);
    } catch (e) {
      console.error('Failed to save theme to localStorage', e);
    }
  }, [themeColor, activeTheme]);

  // Save projects to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('teamup_projects', JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save projects to localStorage', e);
    }
  }, [projects]);

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('teamup_notifications');
      if (saved) {
        try {
          const parsed: AppNotification[] = JSON.parse(saved);
          const cleaned = parsed.filter(
            (n) =>
              !['notif_1', 'notif_2', 'notif_3'].includes(n.id) &&
              !MOCK_PROJECT_IDS.includes(n.projectId || '')
          );
          localStorage.setItem('teamup_notifications', JSON.stringify(cleaned));
          return cleaned;
        } catch (e) {
          console.error('Failed to parse notifications', e);
        }
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [activeToast, setActiveToast] = useState<{
    id: string;
    title: string;
    body: string;
    type?: 'urgent' | 'member_add' | 'member_remove' | 'deadline' | 'info';
  } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('teamup_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.error('Failed to save notifications', e);
    }
  }, [notifications]);

  // Member operations
  const handleAddMember = (projectId: string, newMember: Member) => {
    const targetProj = projects.find((p) => p.id === projectId);
    const projName = targetProj ? targetProj.name : 'nhóm';

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          if (p.members.some((m) => m.id === newMember.id || (newMember.email && m.email && m.email === newMember.email))) {
            return p;
          }
          return {
            ...p,
            members: [...p.members, newMember],
          };
        }
        return p;
      })
    );

    // Gửi thông báo quan trọng trực tiếp về máy cho các thành viên
    const notifTitle = '👥 Thành viên mới gia nhập nhóm';
    const notifBody = `"${newMember.name}" (${newMember.role}) vừa tham gia nhóm "${projName}".`;
    sendDeviceNotification({
      title: notifTitle,
      body: notifBody,
      type: 'member_add',
    });

    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title: notifTitle,
      body: notifBody,
      timestamp: 'Vừa xong',
      read: false,
      type: 'member_add',
      projectId,
      projectName: projName,
      sentToDevice: true,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setActiveToast({
      id: newNotif.id,
      title: notifTitle,
      body: notifBody,
      type: 'member_add',
    });
  };

  const handleRemoveMember = (projectId: string, memberId: string) => {
    const targetProj = projects.find((p) => p.id === projectId);
    if (!targetProj) return;

    // Enforce RBAC: Chỉ Quản trị viên mới có quyền xóa thành viên!
    const isUserAdmin = Boolean(
      currentUser && (
        targetProj.adminId === currentUser.id ||
        currentUser.isAdmin === true ||
        currentUser.role?.includes('Trưởng nhóm') ||
        currentUser.role?.includes('Quản trị viên')
      )
    );

    if (!isUserAdmin) {
      const blockedTitle = '⛔ Không thể thực hiện';
      const blockedBody = 'Chỉ Quản trị viên nhóm mới có quyền xóa thành viên khỏi nhóm.';
      setActiveToast({
        id: `toast_err_${Date.now()}`,
        title: blockedTitle,
        body: blockedBody,
        type: 'urgent',
      });
      return;
    }

    const removedMember = targetProj.members.find((m) => m.id === memberId);
    const removedName = removedMember ? removedMember.name : 'thành viên';

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            members: p.members.filter((m) => m.id !== memberId),
          };
        }
        return p;
      })
    );

    // Gửi thông báo quan trọng trực tiếp về máy cho các thành viên
    const notifTitle = '⚠️ Thành viên bị xóa khỏi nhóm';
    const notifBody = `Quản trị viên đã loại "${removedName}" khỏi nhóm "${targetProj.name}".`;
    sendDeviceNotification({
      title: notifTitle,
      body: notifBody,
      type: 'member_remove',
    });

    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title: notifTitle,
      body: notifBody,
      timestamp: 'Vừa xong',
      read: false,
      type: 'member_remove',
      projectId,
      projectName: targetProj.name,
      sentToDevice: true,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setActiveToast({
      id: newNotif.id,
      title: notifTitle,
      body: notifBody,
      type: 'member_remove',
    });
  };

  // Canva Style Email Invitation Accept Handler
  const handleAcceptInvitation = async (
    invitation: TeamInvitation,
    userInfo: { name: string; email: string; avatar: string; role: string }
  ) => {
    try {
      // 1. Call server to update database record to 'accepted'
      const res = await fetch(`/api/invitations/${encodeURIComponent(invitation.id)}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id || `user_${Date.now()}`,
          name: userInfo.name,
          email: userInfo.email,
          avatar: userInfo.avatar,
          role: userInfo.role,
        }),
      });
      const data = await res.json();
      console.log('Accepted invitation response:', data);

      const newMember: Member = {
        id: `mem_${Date.now()}`,
        name: userInfo.name,
        email: userInfo.email,
        avatar: userInfo.avatar,
        role: userInfo.role,
        isOnline: true,
        statusText: 'Đã tham gia nhóm qua email mời',
      };

      // 2. Update currentUser session in-app
      setCurrentUser((prev) => ({
        ...prev,
        name: userInfo.name,
        email: userInfo.email,
        avatar: userInfo.avatar,
        role: userInfo.role,
      }));

      // 3. Add to projects or create the project if not yet in user's state
      setProjects((prev) => {
        const existing = prev.find((p) => p.id === invitation.projectId);
        if (existing) {
          return prev.map((p) => {
            if (p.id === invitation.projectId) {
              const alreadyMember = p.members.some(
                (m) =>
                  m.email.toLowerCase() === userInfo.email.toLowerCase() ||
                  m.name === userInfo.name
              );
              if (alreadyMember) return p;
              return {
                ...p,
                members: [...p.members, newMember],
              };
            }
            return p;
          });
        } else {
          const newProject: Project = {
            id: invitation.projectId,
            name: invitation.projectName,
            description: `Không gian làm việc nhóm ${invitation.projectName}`,
            category: (invitation.projectCategory as any) || 'Học tập',
            members: [
              {
                id: 'mem_inviter',
                name: invitation.inviterName,
                email: invitation.inviterEmail || 'truongnhom@teamup.workspace',
                role: 'Trưởng nhóm / Quản trị viên',
                avatar:
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                isOnline: true,
                isAdmin: true,
              },
              newMember,
            ],
            status: 'active',
            progress: 20,
            avatarColor: 'from-indigo-500 to-purple-600',
            deadline: '2026-06-30',
          };
          return [newProject, ...prev];
        }
      });

      // 4. Switch view to that project
      setActiveProjectId(invitation.projectId);

      // 5. Native OS & In-App Notification
      const toastTitle = '🎉 Tham gia nhóm thành công!';
      const toastBody = `Chào mừng bạn đã gia nhập nhóm "${invitation.projectName}" với vai trò ${userInfo.role}.`;
      sendDeviceNotification({
        title: toastTitle,
        body: toastBody,
        type: 'member_add',
      });
      setActiveToast({
        id: `toast_joined_${Date.now()}`,
        title: toastTitle,
        body: toastBody,
        type: 'member_add',
      });

      // 6. Clean up URL ?invite=... parameter without page reload
      try {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } catch (e) {
        console.warn('Could not replace URL state', e);
      }
    } catch (err) {
      console.error('Failed to accept invitation:', err);
    }
  };

  const handleSendBroadcastNotification = (title: string, body: string) => {
    sendDeviceNotification({
      title,
      body,
      type: 'urgent',
    });

    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title,
      body,
      timestamp: 'Vừa xong',
      read: false,
      type: 'urgent',
      projectId: activeProject.id,
      projectName: activeProject.name,
      sentToDevice: true,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setActiveToast({
      id: newNotif.id,
      title,
      body,
      type: 'urgent',
    });
  };

  // Task operations
  const handleAddTask = (newTask: Omit<Task, 'id'>) => {
    const task: Task = {
      ...newTask,
      id: `task_${Date.now()}`,
    };
    setTasks((prev) => [task, ...prev]);
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Chat message operations
  const handleSendMessage = (newMsg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const msg: ChatMessage = {
      ...newMsg,
      id: `msg_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, msg]);
  };

  // Document operations
  const handleAddDocument = (newDoc: DocumentResource | Omit<DocumentResource, 'id'>) => {
    const doc: DocumentResource = 'id' in newDoc && newDoc.id ? (newDoc as DocumentResource) : {
      ...newDoc,
      id: `doc_${Date.now()}`,
    };
    setDocuments((prev) => [doc, ...prev]);
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleSaveSlideToDocuments = (slideDoc: DocumentResource) => {
    // 1. Tự động thêm file .ppt vào danh sách tài liệu ở Kho Lưu Trữ ngay lập tức
    setDocuments((prev) => [slideDoc, ...prev]);

    // 2. Thông báo đã lưu vào Kho Lưu Trữ
    const notif: AppNotification = {
      id: `notif_${Date.now()}`,
      projectId: activeProject.id,
      projectName: activeProject.name,
      title: 'Đã lưu vào Kho Lưu Trữ',
      body: `Bản trình chiếu "${slideDoc.name}" (${slideDoc.size}) đã được lưu tự động vào Kho Lưu Trữ tài liệu nhóm.`,
      timestamp: 'Vừa xong',
      type: 'system',
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // Create Project
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const deadlineVal =
      newProjectDeadline.trim() ||
      new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const newProj: Project = {
      id: `proj_${Date.now()}`,
      name: newProjectName.trim(),
      category: newProjectCategory,
      description: newProjectDesc.trim() || 'Không gian làm việc nhóm thật.',
      adminId: currentUser.id,
      members: [{ ...currentUser, isAdmin: true, role: 'Trưởng nhóm / Quản trị viên' }],
      status: 'active',
      progress: 0,
      avatarColor: 'from-purple-600 to-indigo-600',
      deadline: deadlineVal,
    };

    const updatedProjects = [newProj, ...projects];
    setProjects(updatedProjects);
    setActiveProjectId(newProj.id);
    setActiveTab('overview');
    setNewProjectName('');
    setNewProjectDesc('');
    setNewProjectDeadline('');
    setIsNewProjectModalOpen(false);

    try {
      localStorage.setItem('teamup_projects', JSON.stringify(updatedProjects));
    } catch (e) {
      console.error('Failed to save projects to localStorage', e);
    }

    // Gửi thông báo trực tiếp về máy
    const notifTitle = `🎉 Đã tạo nhóm "${newProj.name}"`;
    const notifBody = `Không gian làm việc thật đã sẵn sàng. Bạn có toàn quyền quản lý và phân công nhiệm vụ.`;
    sendDeviceNotification({
      title: notifTitle,
      body: notifBody,
      type: 'urgent',
    });

    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      title: notifTitle,
      body: notifBody,
      timestamp: 'Vừa xong',
      read: false,
      type: 'urgent',
      projectId: newProj.id,
      projectName: newProj.name,
      sentToDevice: true,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setActiveToast({
      id: newNotif.id,
      title: notifTitle,
      body: notifBody,
      type: 'urgent',
    });
  };

  const handleDeleteProject = (projectId: string) => {
    if (projects.length <= 1) {
      alert('Không thể xóa dự án duy nhất còn lại.');
      return;
    }
    const target = projects.find((p) => p.id === projectId);
    if (!target) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhóm/dự án "${target.name}" không?`)) {
      const remaining = projects.filter((p) => p.id !== projectId);
      setProjects(remaining);
      if (activeProjectId === projectId) {
        setActiveProjectId(remaining[0].id);
      }
      setTasks((prev) => prev.filter((t) => t.projectId !== projectId));
      setDocuments((prev) => prev.filter((d) => d.projectId !== projectId));
      setMessages((prev) => prev.filter((m) => m.projectId !== projectId));
      setActiveToast({
        id: `toast_del_${Date.now()}`,
        title: 'Đã xóa dự án',
        body: `Đã xóa thành công dự án "${target.name}".`,
        type: 'info',
      });
    }
  };

  // Account switching & logout handlers
  const handleSwitchUser = (user: Member) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('teamup_current_user', JSON.stringify(user));
    } catch {}
    setActiveToast({
      id: `toast_switch_${Date.now()}`,
      title: '🔄 Đã đổi tài khoản',
      body: `Đang xem dưới danh nghĩa: ${user.name} (${user.role}).`,
      type: 'info',
    });
  };

  const handleLogoutToAdmin = () => {
    setCurrentUser(CURRENT_USER);
    try {
      localStorage.setItem('teamup_current_user', JSON.stringify(CURRENT_USER));
    } catch {}
    setActiveToast({
      id: `toast_logout_${Date.now()}`,
      title: '👑 Đã chuyển về Quản trị viên',
      body: `Đang đăng nhập với: ${CURRENT_USER.name} (Chủ nhóm / Admin).`,
      type: 'info',
    });
  };

  const handleCustomEmailLogin = async (customEmail: string, customName?: string) => {
    await handleJoinByGmail(customEmail, customName);
  };

  return (
    <div
      className="min-h-screen dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200"
      style={{
        backgroundColor: isDark ? undefined : 'color-mix(in srgb, var(--bg-color) 18%, #f8fafc)',
      }}
    >
      {/* Top Main Navigation Header */}
      <Header
        projects={projects}
        activeProject={activeProject}
        onSelectProject={(p) => setActiveProjectId(p.id)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={activeTheme}
        onThemeColorChange={setThemeColor}
        isDarkMode={isDark}
        onToggleDarkMode={() => setIsDark(!isDark)}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
        onOpenAddMemberModal={() => setIsAddMemberModalOpen(true)}
        currentUser={currentUser}
        notifications={notifications}
        onMarkAllNotificationsAsRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
        onClearNotifications={() => setNotifications([])}
        onSendBroadcastNotification={handleSendBroadcastNotification}
        onSwitchUser={handleSwitchUser}
        onLogoutToAdmin={handleLogoutToAdmin}
        onCustomEmailLogin={handleCustomEmailLogin}
        allMembers={activeProject.members}
      />

      {/* Voice Room Control Bar (Microphone & Live Audio Room) */}
      <VoiceRoomBar
        members={activeProject.members}
        theme={activeTheme}
        projectName={activeProject.name}
        onOpenAddMemberModal={() => setIsAddMemberModalOpen(true)}
      />

      {/* Main Content Area (with bottom padding on mobile for sticky bottom nav) */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-24 md:pb-8">
        {activeTab === 'overview' && (
          <DashboardView
            project={activeProject}
            allProjects={projects}
            onSelectProject={(p) => setActiveProjectId(p.id)}
            onDeleteProject={handleDeleteProject}
            tasks={tasks}
            slideDeck={presentation}
            documents={documents}
            onNavigateTab={setActiveTab}
            onOpenAiModal={() => setIsAiModalOpen(true)}
            onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
            onOpenAddMemberModal={() => setIsAddMemberModalOpen(true)}
            theme={activeTheme}
          />
        )}

        {activeTab === 'tasks' && (
          <TaskBoardView
            project={activeProject}
            tasks={tasks}
            onAddTask={handleAddTask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onDeleteTask={handleDeleteTask}
            theme={activeTheme}
            onOpenAddMemberModal={() => setIsAddMemberModalOpen(true)}
          />
        )}

        {activeTab === 'slides' && (
          <CanvaSlideViewer
            theme={activeTheme}
            projectName={activeProject.name}
            onBackToDashboard={() => setActiveTab('overview')}
          />
        )}

        {activeTab === 'chat' && (
          <ChatView
            project={activeProject}
            currentUser={currentUser}
            messages={messages}
            onSendMessage={handleSendMessage}
            theme={activeTheme}
            onOpenAiModal={() => setIsAiModalOpen(true)}
            onOpenAddMemberModal={() => setIsAddMemberModalOpen(true)}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsView
            project={activeProject}
            documents={documents}
            onAddDocument={handleAddDocument}
            onDeleteDocument={handleDeleteDocument}
            theme={activeTheme}
          />
        )}

        {activeTab === 'up_ai' && (
          <UpAiView
            project={activeProject}
            documents={documents}
            theme={activeTheme}
            onNavigateTab={setActiveTab}
            onOpenAiModal={() => setIsAiModalOpen(true)}
            onApplyAiSlides={(newSlides) => {
              setPresentation((prev) => ({
                ...prev,
                slides: [...prev.slides, ...newSlides],
                lastModified: 'Vừa xong',
              }));
              setActiveTab('slides');
            }}
            onApplyAiTasks={(newTasks) => {
              setTasks((prev) => [...newTasks, ...prev]);
              setActiveTab('tasks');
            }}
          />
        )}
      </main>

      {/* Global AI Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        project={activeProject}
        theme={activeTheme}
      />

      {/* Add / Manage Project Members Modal */}
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        project={activeProject}
        onAddMember={(newMember) => handleAddMember(activeProject.id, newMember)}
        onRemoveMember={(memberId) => handleRemoveMember(activeProject.id, memberId)}
        theme={activeTheme}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
      />

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Tạo Nhóm / Dự Án Mới
              </h3>
              <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên nhóm hoặc tên đề tài <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Báo Cáo Thực Tập Tốt Nghiệp 2026"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lĩnh vực / Học phần
                </label>
                <select
                  value={newProjectCategory}
                  onChange={(e) => setNewProjectCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="Báo cáo môn học">Báo cáo môn học & Thuyết trình</option>
                  <option value="Dự án nghiên cứu">Dự án nghiên cứu khoa học sinh viên</option>
                  <option value="Khởi nghiệp">Khởi nghiệp & Kinh doanh</option>
                  <option value="Hoạt động CLB">Hoạt động ngoại khóa & CLB</option>
                  <option value="Học tập">Học tập & Ôn thi nhóm</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả mục tiêu của nhóm <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Mục tiêu bài báo cáo, phân công các phần và mốc thời gian bàn giao..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Hạn chót hoàn thành (Tùy chọn)
                </label>
                <input
                  type="date"
                  value={newProjectDeadline}
                  onChange={(e) => setNewProjectDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  id="btn-confirm-create-project"
                  type="submit"
                  className={`px-4 py-2 text-xs font-bold rounded-xl ${activeTheme.primary} shadow-sm cursor-pointer`}
                >
                  Tạo Không Gian Nhóm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Popup nhập Gmail tham gia dự án (Tự động mở nếu chưa có tài khoản trong localStorage) */}
      <JoinByGmailModal
        isOpen={isJoinByGmailModalOpen}
        onClose={() => setIsJoinByGmailModalOpen(false)}
        onJoin={handleJoinByGmail}
        onContinueAsAdmin={handleContinueAsAdmin}
        projectName={activeProject?.name || 'Báo Cáo Dự Án: Ứng Dụng AI Trong Giáo Dục'}
        projectCategory={activeProject?.category}
        pendingInvitations={allInvitations}
      />

      {/* Canva Style Join Team Modal for Email Invitees */}
      <JoinTeamModal
        isOpen={isJoinTeamModalOpen}
        onClose={() => setIsJoinTeamModalOpen(false)}
        invitation={invitationToJoin}
        onAccept={handleAcceptInvitation}
        theme={activeTheme}
        currentUser={currentUser}
      />

      {/* Floating Device Toast for native in-app & OS notification feedback */}
      <DeviceToast
        notification={activeToast}
        onClose={() => setActiveToast(null)}
      />
    </div>
  );
}
