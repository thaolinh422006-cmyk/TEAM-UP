import { Member } from '../types';
import { CURRENT_USER } from '../data/mockData';

export const PRESET_MEMBER_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
];

/**
 * Intelligent Vietnamese name generator from email address
 */
export function formatNameFromEmail(email: string): string {
  if (!email) return 'Thành viên mới';
  const clean = email.trim().toLowerCase();

  // Known sample & test emails
  if (clean.includes('luongthithanhnhan') || clean.includes('nhan280883')) {
    return 'Lương Thị Thanh Nhàn';
  }
  if (clean.includes('thaolinh422006') || clean.includes('thaolinh')) {
    return 'Linh Thảo (Bạn)';
  }
  if (clean.includes('hoang.minh') || clean.includes('minhhoang')) return 'Minh Hoàng';
  if (clean.includes('vy.khanh') || clean.includes('khanhvy')) return 'Khánh Vy';
  if (clean.includes('long.bao') || clean.includes('baolong')) return 'Bảo Long';
  if (clean.includes('hung.nguyen') || clean.includes('nguyenvanhung')) return 'TS. Nguyễn Văn Hùng';
  if (clean.includes('thuha.nguyen') || clean.includes('nguyenthuha')) return 'Nguyễn Thu Hà';
  if (clean.includes('quocbao.pham') || clean.includes('phamquocbao')) return 'Phạm Quốc Bảo';
  if (clean.includes('maianh.do') || clean.includes('domaianh')) return 'Đỗ Mai Anh';
  if (clean.includes('tuankiet.le') || clean.includes('letuankiet')) return 'Lê Tuấn Kiệt';

  // General heuristic: parse username portion before @
  const userPart = clean.split('@')[0];
  // Remove trailing numbers (e.g. 280883, 123, 2026) and punctuation
  const lettersOnly = userPart.replace(/\d+/g, '').replace(/[-_.]/g, ' ').trim();

  if (!lettersOnly) {
    return userPart.toUpperCase();
  }

  // Capitalize each word
  const words = lettersOnly.split(/\s+/).filter(Boolean);
  const capitalized = words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return capitalized || userPart;
}

export function getAvatarForEmail(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash << 5) - hash + email.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PRESET_MEMBER_AVATARS.length;
  return PRESET_MEMBER_AVATARS[index];
}

/**
 * Creates or restores a member object based on an email address.
 * Sets role to member (non-admin) unless it is the default creator admin.
 */
export function createMemberFromEmail(
  email: string,
  customName?: string,
  role = 'Thành viên nhóm'
): Member {
  const cleanEmail = email.trim().toLowerCase();
  const isDefaultAdmin =
    cleanEmail === 'thaolinh422006@gmail.com' || cleanEmail === CURRENT_USER.email.toLowerCase();

  if (isDefaultAdmin) {
    return {
      ...CURRENT_USER,
      email: cleanEmail,
      isOnline: true,
      isAdmin: true,
    };
  }

  const name = customName?.trim() || formatNameFromEmail(cleanEmail);
  const avatar = getAvatarForEmail(cleanEmail);

  return {
    id: `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
    name,
    email: cleanEmail,
    avatar,
    role,
    isOnline: true,
    isSpeaking: false,
    micMuted: true,
    statusText: 'Đã tham gia nhóm qua lời mời',
    isAdmin: false,
  };
}
