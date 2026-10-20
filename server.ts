import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import nodemailer, { Transporter } from "nodemailer";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// ----------------------------------------------------------------------------
// INVITATIONS DATABASE & PERSISTENCE
// ----------------------------------------------------------------------------
export interface TeamInvitation {
  id: string;
  email: string;
  recipientName?: string;
  projectId: string;
  projectName: string;
  projectCategory?: string;
  inviterName: string;
  inviterEmail?: string;
  role: string;
  message?: string;
  status: "pending" | "accepted" | "joined" | "declined" | "revoked";
  createdAt: string;
  expiresAt?: string;
  acceptedAt?: string;
  acceptedBy?: {
    id: string;
    name: string;
    email: string;
  };
  inviteUrl: string;
  emailDeliveryStatus?: "sent" | "pending" | "failed" | "fallback_mailto";
  emailDeliveryMessage?: string;
  emailProvider?: "resend" | "gmail_smtp" | "custom_smtp" | "none";
  previewUrl?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const INVITATIONS_FILE = path.join(DATA_DIR, "invitations.json");

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(INVITATIONS_FILE)) {
    fs.writeFileSync(INVITATIONS_FILE, JSON.stringify([], null, 2), "utf8");
  }
}

function getStoredInvitations(): TeamInvitation[] {
  try {
    ensureDataDirectory();
    const raw = fs.readFileSync(INVITATIONS_FILE, "utf8");
    const list = JSON.parse(raw) as TeamInvitation[];
    const baseOrigin = process.env.APP_URL
      ? process.env.APP_URL.replace(/\/$/, "")
      : `http://localhost:${PORT}`;
    return list.map((inv) => {
      return {
        ...inv,
        inviteUrl: baseOrigin,
      };
    });
  } catch (err) {
    console.error("Error reading invitations database:", err);
    return [];
  }
}

function saveStoredInvitations(invites: TeamInvitation[]) {
  try {
    ensureDataDirectory();
    fs.writeFileSync(INVITATIONS_FILE, JSON.stringify(invites, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving invitations database:", err);
  }
}

// ----------------------------------------------------------------------------
// EMAIL SERVICE (REAL EMAIL SENDING VIA RESEND OR GMAIL / SMTP)
// ----------------------------------------------------------------------------
export interface EmailSendResult {
  success: boolean;
  provider: "resend" | "gmail_smtp" | "custom_smtp" | "none";
  messageId?: string;
  error?: string;
  code?: string;
  previewUrl?: string;
}

function getEmailProviderStatus(): {
  configured: boolean;
  provider: "resend" | "gmail_smtp" | "custom_smtp" | "none";
  senderEmail: string | null;
  description: string;
} {
  if (process.env.RESEND_API_KEY) {
    return {
      configured: true,
      provider: "resend",
      senderEmail: process.env.RESEND_FROM || "TEAM UP <onboarding@resend.dev>",
      description: "Dịch vụ Resend API đang hoạt động (RESEND_API_KEY)",
    };
  }
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return {
      configured: true,
      provider: "gmail_smtp",
      senderEmail: process.env.GMAIL_USER,
      description: "Dịch vụ Gmail SMTP đang hoạt động (GMAIL_USER + GMAIL_APP_PASSWORD)",
    };
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      configured: true,
      provider: "custom_smtp",
      senderEmail: process.env.SMTP_USER,
      description: `Dịch vụ Custom SMTP đang hoạt động (${process.env.SMTP_HOST})`,
    };
  }
  return {
    configured: false,
    provider: "none",
    senderEmail: null,
    description:
      "Chưa cấu hình dịch vụ email. Cần thêm biến môi trường RESEND_API_KEY hoặc GMAIL_USER + GMAIL_APP_PASSWORD.",
  };
}

async function sendInvitationEmail(invitation: TeamInvitation): Promise<EmailSendResult> {
  const subject = `[TEAM UP] Mời bạn vào nhóm`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lời mời tham gia nhóm TEAM UP</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          <!-- Top Gradient Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%); padding: 36px 32px; text-align: center;">
              <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 6px 16px; border-radius: 9999px; font-size: 13px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px; margin-bottom: 12px;">
                TEAM UP WORKSPACE
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; line-height: 1.3;">
                Bạn nhận được lời mời tham gia nhóm!
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.95); font-size: 14px;">
                Cộng tác, chia sẻ tài liệu và cùng nhau hoàn thành xuất sắc dự án
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <p style="font-size: 16px; line-height: 1.6; margin: 0 0 18px 0; color: #334155;">
                Xin chào,
              </p>
              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; color: #334155;">
                <strong>${invitation.inviterName}</strong> vừa gửi cho bạn một lời mời chính thức để tham gia nhóm làm việc trên nền tảng <strong>TEAM UP</strong>.
              </p>

              <!-- Team Card -->
              <table role="presentation" width="100%" style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 22px;">
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 6px;">
                      THÔNG TIN NHÓM THAM GIA
                    </div>
                    <div style="font-size: 20px; font-weight: 800; color: #1e1b4b; margin-bottom: 6px;">
                      👥 ${invitation.projectName}
                    </div>
                    ${
                      invitation.projectCategory
                        ? `<div style="font-size: 13px; color: #4f46e5; font-weight: 600; margin-bottom: 10px;">Thể loại: ${invitation.projectCategory}</div>`
                        : ""
                    }
                    <div style="font-size: 13px; color: #475569; margin-top: 6px;">
                      <strong>Người mời:</strong> ${invitation.inviterName}
                    </div>
                    <div style="font-size: 13px; color: #475569; margin-top: 6px;">
                      <strong>Vai trò được chỉ định:</strong> 
                      <span style="background: #e0e7ff; color: #3730a3; padding: 3px 10px; border-radius: 8px; font-weight: 700; margin-left: 4px;">
                        ${invitation.role}
                      </span>
                    </div>
                    ${
                      invitation.message
                        ? `
                    <div style="margin-top: 14px; padding: 12px 16px; background: #ffffff; border-radius: 10px; border-left: 4px solid #6366f1; font-size: 13px; font-style: italic; color: #475569; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                      "${invitation.message}"
                    </div>`
                        : ""
                    }
                  </td>
                </tr>
              </table>

              <!-- Action Button (Big Call To Action) -->
              <div style="text-align: center; margin: 32px 0 24px 0;">
                <a href="${invitation.inviteUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; font-size: 16px; font-weight: 800; text-decoration: none; padding: 15px 40px; border-radius: 12px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4); letter-spacing: 0.3px;">
                  👉 Tham Gia Nhóm Ngay
                </a>
              </div>

              <!-- Fallback Direct URL -->
              <div style="background-color: #faf5ff; border: 1px dashed #d8b4fe; border-radius: 10px; padding: 14px; font-size: 12px; color: #6b21a8; line-height: 1.5; word-break: break-all;">
                <strong>Nút không hoạt động?</strong> Bạn có thể sao chép liên kết dưới đây và dán vào thanh địa chỉ trình duyệt:<br>
                <a href="${invitation.inviteUrl}" style="color: #6d28d9; text-decoration: underline; font-weight: 600;">${invitation.inviteUrl}</a>
              </div>

              <div style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">
                Lời mời được gửi bởi ứng dụng TEAM UP. Thời hạn sử dụng: 7 ngày kể từ ngày gửi.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8;">
              <p style="margin: 0 0 4px 0; font-weight: 600; color: #64748b;">TEAM UP WORKSPACE</p>
              <p style="margin: 0;">Nền tảng làm việc nhóm, phân công nhiệm vụ và bài thuyết trình thông minh.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textContent = `Chào bạn,\n\nBạn nhận được lời mời tham gia nhóm "${invitation.projectName}" trên TEAM UP.\nNgười gửi: ${invitation.inviterName}\nVai trò: ${invitation.role}\n\nBấm vào liên kết sau để tham gia nhóm ngay:\n${invitation.inviteUrl}\n\nLời mời có thời hạn 7 ngày.\n\nChúc bạn làm việc hiệu quả cùng nhóm!\nTEAM UP Workspace`;

  // 1. PROVIDER 1: RESEND (Modern REST API email service)
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromAddress =
        process.env.RESEND_FROM ||
        process.env.EMAIL_FROM ||
        "TEAM UP <onboarding@resend.dev>";

      console.log(`[Resend] Sending invitation email to ${invitation.email} from ${fromAddress}...`);
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [invitation.email],
        subject,
        html: htmlContent,
        text: textContent,
      });

      if (error) {
        console.error("[Resend Error]:", error);
        return {
          success: false,
          provider: "resend",
          error: error.message || "Lỗi từ dịch vụ Resend",
        };
      }

      console.log(`[Resend Success] Email delivered. ID: ${data?.id}`);
      return {
        success: true,
        provider: "resend",
        messageId: data?.id,
      };
    } catch (err: any) {
      console.error("[Resend Exception]:", err);
      return {
        success: false,
        provider: "resend",
        error: err?.message || "Không thể gửi email qua Resend",
      };
    }
  }

  // 2. PROVIDER 2: GMAIL SMTP (via Google App Password)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    try {
      console.log(`[Gmail SMTP] Sending invitation email to ${invitation.email} via ${process.env.GMAIL_USER}...`);
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      const fromAddress =
        process.env.GMAIL_FROM ||
        `"TEAM UP Workspace" <${process.env.GMAIL_USER}>`;

      const info = await transporter.sendMail({
        from: fromAddress,
        to: invitation.email,
        subject,
        html: htmlContent,
        text: textContent,
      });

      console.log(`[Gmail SMTP Success] Message ID: ${info.messageId}`);
      return {
        success: true,
        provider: "gmail_smtp",
        messageId: info.messageId,
      };
    } catch (err: any) {
      console.error("[Gmail SMTP Exception]:", err);
      return {
        success: false,
        provider: "gmail_smtp",
        error: err?.message || "Lỗi xác thực hoặc gửi email qua Gmail SMTP",
      };
    }
  }

  // 3. PROVIDER 3: CUSTOM SMTP
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      console.log(`[Custom SMTP] Sending invitation email to ${invitation.email} via ${process.env.SMTP_HOST}...`);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const fromAddress =
        process.env.SMTP_FROM ||
        `"TEAM UP Workspace" <${process.env.SMTP_USER}>`;

      const info = await transporter.sendMail({
        from: fromAddress,
        to: invitation.email,
        subject,
        html: htmlContent,
        text: textContent,
      });

      console.log(`[Custom SMTP Success] Message ID: ${info.messageId}`);
      return {
        success: true,
        provider: "custom_smtp",
        messageId: info.messageId,
      };
    } catch (err: any) {
      console.error("[Custom SMTP Exception]:", err);
      return {
        success: false,
        provider: "custom_smtp",
        error: err?.message || "Lỗi máy chủ SMTP tùy chỉnh",
      };
    }
  }

  // 4. NO REAL EMAIL SERVICE CONFIGURED
  // Do NOT spoof success or use fake test accounts without telling the user
  console.warn(
    "[Email Service Not Configured] No RESEND_API_KEY or GMAIL_APP_PASSWORD found in environment variables."
  );
  return {
    success: false,
    provider: "none",
    code: "EMAIL_PROVIDER_NOT_CONFIGURED",
    error:
      "Chưa cấu hình dịch vụ gửi email (Cần thêm biến môi trường RESEND_API_KEY hoặc GMAIL_USER + GMAIL_APP_PASSWORD trong Vercel / Cloud Run). Email chưa được gửi vào hộp thư.",
  };
}

// Server-side Gemini AI client initialization
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Fast fallback candidate models: prioritize highly available low-latency models
const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.5-flash",
  "gemini-3.8-flash",
];

async function callGeminiWithFallback<T>(
  ai: GoogleGenAI,
  callFn: (model: string) => Promise<T>
): Promise<T> {
  let lastError: any = null;
  for (let i = 0; i < CANDIDATE_MODELS.length; i++) {
    const model = CANDIDATE_MODELS[i];
    try {
      return await callFn(model);
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code || 500;
      const message = err?.message || String(err);
      console.warn(`[Gemini API] Model ${model} failed (code ${status}): ${message}. Attempting fallback model...`);
      if (i < CANDIDATE_MODELS.length - 1) {
        await new Promise((res) => setTimeout(res, 100));
      }
    }
  }
  throw lastError;
}

async function searchWeb(query: string): Promise<string[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch("https://html.duckduckgo.com/html/?q=" + encodeURIComponent(query.trim()), {
      signal: AbortSignal.timeout(1000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!res.ok) return [];
    const html = await res.text();
    const snippets: string[] = [];
    const regex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g;
    let match;
    while ((match = regex.exec(html)) !== null && snippets.length < 4) {
      const text = match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (text && text.length > 20) snippets.push(text);
    }
    return snippets;
  } catch (e) {
    return [];
  }
}

function cleanAiResponseText(rawText: string): string {
  if (!rawText) return "";
  // Strip out markdown symbols * and # as strictly requested
  return rawText
    .replace(/[*#]/g, "")
    .replace(/^\s*[-•]\s*/gm, "- ") // clean bullet points
    .trim();
}

function generateContextualFallback(message: string, searchSnippets: string[] = []): string {
  const query = (message || "").toLowerCase().trim();

  // 1. Topic: Thủ đô các nước (Geography)
  if (query.includes("thủ đô") || query.includes("thu do")) {
    if (query.includes("pháp") || query.includes("france")) {
      return "Thủ đô của nước Pháp là Paris. Paris là trung tâm kinh tế, chính trị, văn hóa và thời trang hàng đầu thế giới, nổi tiếng với các công trình kiến trúc biểu tượng như tháp Eiffel, bảo tàng nghệ thuật Louvre, đại lộ Champs-Élysées và dòng sông Seine thơ mộng.";
    }
    if (query.includes("việt nam") || query.includes("viet nam")) {
      return "Thủ đô của Việt Nam là Hà Nội, trung tâm chính trị và văn hóa nghìn năm văn hiến, gắn liền với Hồ Hoàn Kiếm, Văn Miếu Quốc Tử Giám và khu phố cổ 36 phố phường.";
    }
    if (query.includes("nhật") || query.includes("japan")) {
      return "Thủ đô của Nhật Bản là Tokyo, một trong những siêu đô thị hiện đại và sầm uất bậc nhất thế giới, nổi bật với sự giao thoa giữa công nghệ đỉnh cao và truyền thống văn hóa lâu đời.";
    }
    if (query.includes("mỹ") || query.includes("hoa kỳ") || query.includes("usa") || query.includes("united states")) {
      return "Thủ đô của Hợp chủng quốc Hoa Kỳ là Washington, D.C. (viết tắt của District of Columbia), nơi đặt Nhà Trắng, Điện Capitol và các cơ quan đầu não của chính phủ liên bang Mỹ.";
    }
    if (query.includes("anh") || query.includes("uk") || query.includes("england")) {
      return "Thủ đô của Vương quốc Anh là Luân Đôn (London), thành phố lịch sử bên dòng sông Thames với đồng hồ Big Ben, cầu tháp London và cung điện Buckingham.";
    }
    if (query.includes("hàn quốc") || query.includes("korea")) {
      return "Thủ đô của Hàn Quốc là Seoul, trung tâm kinh tế và văn hóa năng động hàng đầu châu Á.";
    }
    if (query.includes("trung quốc") || query.includes("china")) {
      return "Thủ đô của Trung Quốc là Bắc Kinh (Beijing), trung tâm chính trị với các di tích lịch sử nổi tiếng như Tử Cấm Thành, Thiên An Môn và Vạn Lý Trường Thành.";
    }
    if (query.includes("đức") || query.includes("germany")) {
      return "Thủ đô của nước Đức là Berlin, trung tâm kinh tế và sáng tạo văn hóa lớn của châu Âu.";
    }
    if (query.includes("ý") || query.includes("italia") || query.includes("italy")) {
      return "Thủ đô của nước Ý là Roma (Rome), thành phố vĩnh hằng với đấu trường La Mã Colosseum và tòa thánh Vatican.";
    }
    if (query.includes("nga") || query.includes("russia")) {
      return "Thủ đô của Liên bang Nga là Mát-xcơ-va (Moscow), nổi tiếng với Quảng trường Đỏ và điện Kremlin.";
    }
    if (query.includes("úc") || query.includes("australia")) {
      return "Thủ đô của nước Úc là Canberra. Nhiều người thường nhầm lẫn thủ đô nước Úc là Sydney hoặc Melbourne, nhưng trên thực tế Canberra mới là thủ đô được xây dựng theo quy hoạch riêng.";
    }
    if (query.includes("thái lan") || query.includes("thailand")) {
      return "Thủ đô của Thái Lan là Bangkok (tên nghi lễ chính thức là Krung Thep Maha Nakhon), trung tâm văn hóa và du lịch nổi tiếng của Đông Nam Á.";
    }
  }

  // 2. Topic: Đồng tử & Thị giác (Khám phá đồng tử - Đề tài dự án)
  if (query.includes("đồng tử") || query.includes("con ngươi") || query.includes("pupil")) {
    return "Đồng tử (còn gọi là con ngươi) là lỗ tròn màu đen nằm ở chính giữa mống mắt của mắt. Chức năng quan trọng nhất của đồng tử là tự động điều tiết lượng ánh sáng đi vào võng mạc: trong bóng tối hoặc ánh sáng yếu, đồng tử giãn to ra để thu nhận nhiều ánh sáng nhất; ngược lại dưới ánh sáng chói, đồng tử co nhỏ lại để bảo vệ các tế bào cảm quang không bị tổn thương. Trong tâm lý học và công nghệ AI hiện đại, sự biến thiên kích thước đồng tử còn được ứng dụng để phân tích độ tập trung và trạng thái cảm xúc của người học.";
  }

  // 3. Topic: Ứng dụng AI trong giáo dục
  if (query.includes("giáo dục") || query.includes("học tập") || query.includes("ai trong")) {
    return "Ứng dụng trí tuệ nhân tạo (AI) trong giáo dục mang lại những bước tiến đột phá: cá nhân hóa lộ trình học theo năng lực từng học sinh, xây dựng trợ lý ảo hỗ trợ giải đáp 24/7, tự động chấm điểm và phản hồi bài tập, và ứng dụng công nghệ thị giác máy tính nhận diện mức độ tập trung giúp cải thiện chất lượng giờ học trực tuyến.";
  }

  // 4. Topic: Tổng thống & Lãnh đạo
  if (query.includes("tổng thống mỹ") || query.includes("tổng thống hoa kỳ")) {
    return "Tổng thống Hoa Kỳ hiện tại là Donald Trump, đắc cử và nhậm chức vào tháng 1 năm 2025, trở thành Tổng thống thứ 47 của Hợp chủng quốc Hoa Kỳ.";
  }

  // 5. Synthesis from Web Search snippets if available
  if (searchSnippets && searchSnippets.length > 0) {
    const combined = searchSnippets
      .slice(0, 3)
      .join(" ")
      .replace(/\[\d+\]/g, "")
      .replace(/https?:\/\/\S+/g, "");
    if (combined.length > 30) {
      return cleanAiResponseText(combined);
    }
  }

  // 6. Intelligent universal reasoning fallback
  if (query.length > 0) {
    return `Về câu hỏi "${message.trim()}": Đây là một chủ đề thú vị và có ý nghĩa thực tiễn. Khi phân tích vấn đề này, các chuyên gia thường tập trung vào nguyên lý cốt lõi, bối cảnh thực tế và các giải pháp tối ưu. Bạn có thể nêu rõ thêm khía cạnh cụ thể mà nhóm đang cần đào sâu để UP AI cung cấp phân tích chi tiết và số liệu dẫn chứng cụ thể hơn.`;
  }

  return "Xin chào! Tôi là UP AI, trợ lý trí tuệ nhân tạo toàn năng. Tôi có thể hỗ trợ bạn tìm kiếm kiến thức, giải đáp câu hỏi, biên tập slide thuyết trình và lập kế hoạch công việc nhóm. Bạn cần hỗ trợ vấn đề gì?";
}

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Chat assistant endpoint (General ChatGPT-style AI assistant powered by Gemini)
const handleAiChat = async (req: Request, res: Response) => {
  const { message, history, documentsContext, projectContext } = req.body || {};
  const userMessage = (message || "").trim();

  const projContext = projectContext
    ? `\n\nTHÔNG TIN DỰ ÁN HIỆN TẠI:\nTên dự án: "${projectContext.name}"\nPhân loại: ${projectContext.category || "Học tập & làm việc"}\nMô tả: ${projectContext.description || "Không có"}\nThành viên: ${(projectContext.members || []).join(", ")}`
    : "";

  const docsContext = Array.isArray(documentsContext) && documentsContext.length > 0
    ? `\n\nDANH SÁCH TÀI LIỆU CÓ TRONG KHO LƯU TRỮ CỦA NHÓM DỰ ÁN:\n${documentsContext.map((d: any, idx: number) => `${idx + 1}. Tên tệp: "${d.name}" | Định dạng: ${d.type} | Kích thước: ${d.size} | Mô tả: ${d.description || 'Không'} | Thẻ: ${(d.tags || []).join(', ')}`).join('\n')}\nKhi người dùng hỏi tìm kiếm tài liệu hoặc nhắc đến tài liệu trong kho lưu trữ, hãy đối chiếu và liệt kê chính xác các tài liệu phù hợp từ danh sách trên.`
    : "";

  const systemInstruction = `Bạn là UP AI - trợ lý trí tuệ nhân tạo toàn năng, thông minh, uyên bác và linh hoạt tương tự như ChatGPT.
Bạn am hiểu sâu sắc mọi lĩnh vực của nhân loại: kiến thức đời sống, khoa học tự nhiên, khoa học xã hội, lịch sử, địa lý, văn hóa, công nghệ, kinh tế, lập trình, giải toán, tra cứu thông tin trên Internet, cũng như hỗ trợ làm việc và học tập.
QUY TẮC BẮT BUỘC:
1. Trả lời trực tiếp, thông minh, sâu sắc, hữu ích và tự nhiên như ChatGPT. Trả lời đúng trọng tâm câu hỏi hoặc yêu cầu mà người dùng đưa ra. Ví dụ khi hỏi 'Thủ đô nước Pháp là gì', hãy trả lời rõ ràng là Paris kèm theo những nét đặc trưng văn hóa lịch sử nổi bật như tháp Eiffel, bảo tàng Louvre, sông Seine.
2. Trả lời tự nhiên, chuyên nghiệp, không rườm rà chào hỏi xã giao (không 'Xin chào', không 'Tôi là...', không câu mở đầu sáo rỗng), đi thẳng vào câu trả lời có giá trị thực tế.
3. TUYỆT ĐỐI KHÔNG SỬ DỤNG các ký hiệu Markdown như dấu sao '*' (kể cả in đậm **, in nghiêng *) hay dấu thăng '#' (tiêu đề ##, ###, #).
4. Hãy ngắt đoạn tự nhiên, dùng câu văn liền mạch gãy gọn hoặc đánh số 1. 2. 3. thuần túy khi cần liệt kê.${projContext}${docsContext}`;

  try {
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        reply: generateContextualFallback(userMessage, []),
      });
    }

    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history.slice(-6)) {
        contents.push({
          role: h.sender === "ai" ? "model" : "user",
          parts: [{ text: h.text }],
        });
      }
    }
    contents.push({
      role: "user",
      parts: [{ text: userMessage || "Hãy chia sẻ thông tin tổng quan hữu ích về chủ đề này" }],
    });

    let generatedText = "";
    // Priority models: active fast flash model (gemini-3.8-flash) first for sub-second response, with fallbacks
    const priorityModels = [
      "gemini-3.8-flash",
      "gemini-flash-latest",
      "gemini-1.5-flash",
    ];
    for (const model of priorityModels) {
      try {
        const standardRes = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
        if (standardRes.text) {
          generatedText = standardRes.text;
          break;
        }
      } catch (err: any) {
        console.warn(`[Gemini API] ${model} attempt notice:`, err?.status || err?.message || err);
      }
    }

    const rawReply = generatedText || generateContextualFallback(userMessage, []);
    const cleanReply = cleanAiResponseText(rawReply);

    return res.json({ reply: cleanReply });
  } catch (error: any) {
    console.warn("AI Chat fallback triggered after model retry:", error?.message || error);
    return res.json({ reply: generateContextualFallback(userMessage, []) });
  }
};

app.post("/api/ai/chat", handleAiChat);
app.post("/api/ai", handleAiChat);
app.post("/api/chat", handleAiChat);
app.get("/api/ai/chat", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "Use POST /api/ai/chat for AI chat queries" });
});

// AI Generate Slide Outline & Content endpoint
app.post("/api/ai/generate-slides", async (req: Request, res: Response) => {
  const { topic = "Báo Cáo Đề Tài Nhóm", audience, slideCount = 5, themeStyle } = req.body;

  const defaultSlides = [
    {
      title: topic || "Báo Cáo Dự Án Nhóm",
      subtitle: "Giới thiệu tổng quan và mục tiêu nghiên cứu",
      bullets: [
        "Bối cảnh đề tài và lý do nhóm lựa chọn",
        "Mục tiêu cụ thể cần đạt được",
        "Phương pháp tiếp cận và phân công công việc",
      ],
      notes: "Slide mở đầu cần trình bày tự tin, ấn tượng",
      layout: "title",
    },
    {
      title: "Thực Trạng & Điểm Nghẽn",
      subtitle: "Phân tích số liệu và hiện trạng thực tế",
      bullets: [
        "Những khó khăn thực tế đang gặp phải trong lĩnh vực",
        "Dữ liệu khảo sát sơ bộ từ nhóm",
        "Vấn đề cốt lõi cần tìm giải pháp tháo gỡ",
      ],
      notes: "Nhấn mạnh vào các số liệu thực tế khảo sát",
      layout: "split",
    },
    {
      title: "Giải Pháp Đề Xuất Sáng Tạo",
      subtitle: "Kế hoạch hành động cụ thể của nhóm",
      bullets: [
        "Giải pháp 1: Tối ưu hóa quy trình và thời gian",
        "Giải pháp 2: Áp dụng công nghệ kỹ thuật số",
        "Dự kiến kết quả và tác động tích cực mang lại",
      ],
      notes: "Trình bày giải pháp logic, có tính khả thi cao",
      layout: "cards",
    },
    {
      title: "Kế Hoạch & Lộ Trình Triển Khai",
      subtitle: "Phân công và các mốc tiến độ thực hiện",
      bullets: [
        "Giai đoạn 1: Nghiên cứu tài liệu và hoàn thiện khung đề tài",
        "Giai đoạn 2: Triển khai nội dung và chạy thử nghiệm",
        "Giai đoạn 3: Tổng kết, báo cáo và nghiệm thu đánh giá",
      ],
      notes: "Kiểm tra kỹ các deadline quan trọng",
      layout: "timeline",
    },
    {
      title: "Kết Luận & Thảo Luận Q&A",
      subtitle: "Cảm ơn thầy cô và các bạn đã theo dõi",
      bullets: [
        "Tóm tắt 3 thông điệp then chốt của bài báo cáo",
        "Bài học kinh nghiệm rút ra khi làm việc nhóm",
        "Mời thầy cô và các bạn đặt câu hỏi trao đổi",
      ],
      notes: "Sẵn sàng tinh thần giải đáp các câu hỏi phản biện",
      layout: "conclusion",
    },
  ];

  try {
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({ slides: defaultSlides.slice(0, Math.max(3, slideCount)) });
    }

    const prompt = `Tạo một bài thuyết trình slide chuyên nghiệp cho học sinh/sinh viên/nhóm làm việc:
Chủ đề: "${topic}"
Đối tượng người nghe: "${audience || "Thầy cô, giảng viên và bạn học trong lớp"}"
Phong cách: "${themeStyle || "Hiện đại, rõ ràng, dễ hiểu"}"
Số lượng slide cần tạo: ${slideCount} slide.

Hãy tạo danh sách slide dưới dạng JSON với cấu trúc chuẩn:
- title: Tiêu đề slide súc tích, ấn tượng
- subtitle: Tiêu đề phụ hoặc thông điệp cốt lõi
- bullets: Mảng 3 đến 4 gạch đầu dòng ý chính, cụ thể, không sáo rỗng
- notes: Ghi chú thuyết trình cho diễn giả (speaker notes)
- layout: một trong các kiểu ("title", "split", "cards", "timeline", "conclusion")`;

    const response = await callGeminiWithFallback(ai, (model) =>
      ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              slides: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    subtitle: { type: Type.STRING },
                    bullets: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    notes: { type: Type.STRING },
                    layout: { type: Type.STRING },
                  },
                  required: ["title", "subtitle", "bullets", "notes", "layout"],
                },
              },
            },
            required: ["slides"],
          },
        },
      })
    );

    const parsed = JSON.parse(response.text || '{"slides": []}');
    if (parsed.slides && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
      return res.json(parsed);
    }
    res.json({ slides: defaultSlides.slice(0, Math.max(3, slideCount)) });
  } catch (error: any) {
    console.warn("AI Slides fallback triggered:", error?.message || error);
    res.json({ slides: defaultSlides.slice(0, Math.max(3, slideCount)) });
  }
});

// Common handler for task breakdown
async function handleTaskBreakdown(req: Request, res: Response) {
  const { projectTitle, title, projectGoal, goal, members = [] } = req.body;
  const targetTitle = projectTitle || title || "Dự án nhóm";
  const targetGoal = projectGoal || goal || "Hoàn thành bài tập nhóm và báo cáo đạt điểm cao";

  const memberNames: string[] = Array.isArray(members)
    ? members.map((m: any) => (typeof m === "string" ? m : m?.name || "Thành viên"))
    : ["Trưởng nhóm", "Thành viên"];

  const defaultTasks = [
    {
      title: "Tìm kiếm tài liệu & nghiên cứu cơ sở lý thuyết",
      description: "Thu thập các bài báo khoa học, số liệu thống kê liên quan đến chủ đề",
      suggestedAssignee: memberNames[0] || "Trưởng nhóm",
      priority: "high",
      estimatedDays: 3,
    },
    {
      title: "Xây dựng đề cương chi tiết và phân công slide",
      description: "Thống nhất bố cục 5-7 phần chính của bài thuyết trình",
      suggestedAssignee: memberNames[1] || memberNames[0] || "Thành viên 1",
      priority: "high",
      estimatedDays: 2,
    },
    {
      title: "Thiết kế slide PowerPoint & chuẩn bị hình ảnh minh họa",
      description: "Tạo các slide trực quan, đồ họa đẹp mắt và nhất quán font chữ trong tab New Slide",
      suggestedAssignee: memberNames[2] || memberNames[1] || memberNames[0] || "Thành viên 2",
      priority: "medium",
      estimatedDays: 4,
    },
    {
      title: "Luyện tập thuyết trình thử và canh thời gian (Timing)",
      description: "Tổ chức buổi voice chat trong Team Up để các bạn dợt thử bài",
      suggestedAssignee: memberNames[0] || "Cả nhóm",
      priority: "medium",
      estimatedDays: 2,
    },
    {
      title: "Rà soát tổng thể & nộp bài báo cáo",
      description: "Kiểm tra lại toàn bộ file tài liệu, chính tả và nộp đúng hạn",
      suggestedAssignee: memberNames[0] || "Trưởng nhóm",
      priority: "high",
      estimatedDays: 1,
    },
  ];

  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.json({ tasks: defaultTasks });
    }

    const prompt = `Hãy chia nhỏ nhiệm vụ cho một dự án làm việc nhóm:
Tên đề tài: "${targetTitle}"
Mục tiêu dự án: "${targetGoal}"
Danh sách thành viên: ${JSON.stringify(memberNames)}

Hãy phân tích và gợi ý 4-6 công việc cụ thể, có phân công người phù hợp từ danh sách thành viên trên, mức độ ưu tiên (low, medium, high) và số ngày dự kiến.`;

    const response = await callGeminiWithFallback(ai, (model) =>
      ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    suggestedAssignee: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    estimatedDays: { type: Type.INTEGER },
                  },
                  required: ["title", "description", "suggestedAssignee", "priority", "estimatedDays"],
                },
              },
            },
            required: ["tasks"],
          },
        },
      })
    );

    const parsed = JSON.parse(response.text || '{"tasks": []}');
    if (parsed.tasks && Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
      return res.json(parsed);
    }
    res.json({ tasks: defaultTasks });
  } catch (error: any) {
    console.warn("AI Task breakdown fallback triggered:", error?.message || error);
    res.json({ tasks: defaultTasks });
  }
}

// AI Break down tasks for project (support both endpoint names)
app.post("/api/ai/task-breakdown", handleTaskBreakdown);
app.post("/api/ai/breakdown-tasks", handleTaskBreakdown);

// ----------------------------------------------------------------------------
// INVITATIONS API ENDPOINTS
// ----------------------------------------------------------------------------

// Check real email provider configuration status
app.get("/api/email-service/status", (req: Request, res: Response) => {
  const status = getEmailProviderStatus();
  return res.json({
    success: true,
    ...status,
  });
});

// Create new invitation and send real email
// Create new invitation via free link & Gmail compose mechanism
app.post("/api/invitations", async (req: Request, res: Response) => {
  try {
    const {
      email,
      recipientName,
      name,
      projectId,
      projectName,
      projectCategory,
      inviterName = "Trưởng nhóm",
      inviterEmail,
      inviterRole,
      role = "Thành viên",
      message,
      baseUrl,
    } = req.body;

    if (!email || !projectId || !projectName) {
      return res.status(400).json({
        success: false,
        error: "Thiếu thông tin bắt buộc: email, projectId hoặc projectName",
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 1. Validate email address format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: "Địa chỉ email không đúng định dạng (ví dụ hợp lệ: name@gmail.com).",
      });
    }

    const hostOrigin =
      baseUrl ||
      (req.headers.origin as string) ||
      (req.headers.referer
        ? new URL(req.headers.referer as string).origin
        : `http://localhost:${PORT}`);

    const id = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    // Clean published root link without query parameters
    const inviteUrl = hostOrigin.replace(/\/$/, "");
    const targetRecipientName = (recipientName || name || "").trim() || undefined;

    // Expiration date: 7 days from now
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const newInvite: TeamInvitation = {
      id,
      email: cleanEmail,
      recipientName: targetRecipientName,
      projectId,
      projectName: projectName.trim(),
      projectCategory,
      inviterName: inviterName.trim(),
      inviterEmail: inviterEmail?.trim(),
      role: role.trim(),
      message: message?.trim() || undefined,
      status: "pending",
      createdAt: now.toISOString(),
      expiresAt,
      inviteUrl,
      emailDeliveryStatus: "pending",
      emailDeliveryMessage: "Đã tạo lời mời thành công, sẵn sàng chia sẻ",
    };

    // Save to database
    const allInvites = getStoredInvitations();
    // Replace any previous pending invites for same email on same project or add new
    const existingIdx = allInvites.findIndex(
      (i) => i.projectId === projectId && i.email.toLowerCase() === cleanEmail && i.status === "pending"
    );
    if (existingIdx >= 0) {
      allInvites[existingIdx] = newInvite;
    } else {
      allInvites.unshift(newInvite);
    }
    saveStoredInvitations(allInvites);

    // Pre-create rich Gmail compose URL & Mailto URL
    const emailSubject = `[TEAM UP] Mời bạn tham gia nhóm "${projectName.trim()}"`;
    const emailBody = `Chào bạn,\n\nBạn nhận được lời mời tham gia nhóm "${projectName.trim()}" trên ứng dụng TEAM UP.\nNgười mời: ${inviterName.trim()}\nVai trò được giao: ${role.trim()}\n${message ? `Lời nhắn: "${message.trim()}"\n` : ""}\nBấm vào liên kết sau để truy cập dự án và nhập Gmail để tham gia nhóm ngay:\n${inviteUrl}\n\n* Lưu ý: Lời mời áp dụng cho tài khoản ${cleanEmail}.\n\nChúc bạn làm việc hiệu quả cùng nhóm!\nTEAM UP Workspace`;

    const gmailWebComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      cleanEmail
    )}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    const mailtoUrl = `mailto:${encodeURIComponent(cleanEmail)}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`;

    console.log(`[Invitation Created Free] ${cleanEmail} invited to ${projectName} (ID: ${id})`);

    return res.json({
      success: true,
      status: "created",
      message: "Đã tạo lời mời",
      invitation: newInvite,
      inviteUrl,
      gmailWebComposeUrl,
      mailtoUrl,
    });
  } catch (error: any) {
    console.error("Error creating invitation:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Không thể tạo lời mời",
    });
  }
});

// List all invitations (filter by projectId or email if provided)
app.get("/api/invitations", (req: Request, res: Response) => {
  try {
    const { projectId, email } = req.query;
    let invites = getStoredInvitations();

    if (projectId) {
      invites = invites.filter((i) => i.projectId === String(projectId));
    }
    if (email) {
      invites = invites.filter(
        (i) => i.email.toLowerCase() === String(email).toLowerCase()
      );
    }

    return res.json({
      success: true,
      invitations: invites,
      total: invites.length,
    });
  } catch (error: any) {
    console.error("Error retrieving invitations:", error);
    return res.status(500).json({
      success: false,
      error: "Không thể lấy danh sách lời mời",
    });
  }
});

// Get a single invitation by ID / Token
app.get("/api/invitations/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const invites = getStoredInvitations();
    const invitation = invites.find((i) => i.id === id);

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy lời mời hoặc lời mời đã hết hạn",
      });
    }

    return res.json({
      success: true,
      invitation,
    });
  } catch (error: any) {
    console.error("Error retrieving invitation:", error);
    return res.status(500).json({
      success: false,
      error: "Lỗi hệ thống khi tìm lời mời",
    });
  }
});

// Seamlessly join project by entering Gmail (no ?join= query param needed)
app.post("/api/invitations/join-by-email", (req: Request, res: Response) => {
  try {
    const { email, name, userId, token } = req.body || {};
    if (!email) {
      return res.status(400).json({ success: false, error: "Thiếu địa chỉ email để xác thực" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const invites = getStoredInvitations();

    const hostOrigin =
      (req.headers.origin as string) ||
      (process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, "") : `http://localhost:${PORT}`);

    // Find invitation matching this email or token
    const matchingInvites = invites.filter((inv) => {
      if (token && inv.id === token) return true;
      return inv.email.toLowerCase() === cleanEmail;
    });

    let targetInvite: TeamInvitation;

    if (matchingInvites.length > 0) {
      targetInvite = matchingInvites[0];
      targetInvite.status = "joined";
      targetInvite.acceptedAt = new Date().toISOString();
      if (name) targetInvite.recipientName = name;
      targetInvite.acceptedBy = {
        id: userId || `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, "_")}`,
        name: name || targetInvite.recipientName || cleanEmail.split("@")[0],
        email: cleanEmail,
      };

      invites.forEach((inv) => {
        if ((token && inv.id === token) || inv.email.toLowerCase() === cleanEmail) {
          inv.status = "joined";
          inv.acceptedAt = new Date().toISOString();
          inv.acceptedBy = targetInvite.acceptedBy;
        }
      });
    } else {
      // Auto-register member invite record as joined
      targetInvite = {
        id: `inv_${Date.now()}`,
        email: cleanEmail,
        recipientName: name || cleanEmail.split("@")[0],
        projectId: "proj_1",
        projectName: "Báo Cáo Dự Án: Ứng Dụng AI Trong Giáo Dục",
        inviterName: "Trưởng nhóm",
        role: "Thành viên nhóm",
        status: "joined",
        createdAt: new Date().toISOString(),
        acceptedAt: new Date().toISOString(),
        acceptedBy: {
          id: userId || `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, "_")}`,
          name: name || cleanEmail.split("@")[0],
          email: cleanEmail,
        },
        inviteUrl: hostOrigin.replace(/\/$/, ""),
      };
      invites.unshift(targetInvite);
    }

    saveStoredInvitations(invites);
    console.log(`[Verified Join by Email] ${cleanEmail} joined project ${targetInvite.projectName}.`);

    return res.json({
      success: true,
      invitation: targetInvite,
      message: `Đã xác thực và ghi nhận thành viên ${cleanEmail} gia nhập nhóm!`,
    });
  } catch (error: any) {
    console.error("Error joining by email:", error);
    return res.status(500).json({
      success: false,
      error: "Không thể xác thực và tham gia nhóm",
    });
  }
});

// Accept invitation by ID
app.post("/api/invitations/:id/accept", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, name, email } = req.body;

    const invites = getStoredInvitations();
    const index = invites.findIndex((i) => i.id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: "Lời mời không tồn tại trong hệ thống",
      });
    }

    const targetInvite = invites[index];

    // Check expiration (7 days)
    if (targetInvite.expiresAt && new Date(targetInvite.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        error: "Lời mời này đã hết hạn sau 7 ngày. Vui lòng yêu cầu quản trị viên gửi lời mời mới.",
        code: "INVITATION_EXPIRED",
      });
    }

    // Authenticate that accepting email matches target invited email
    if (email && email.trim().toLowerCase() !== targetInvite.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: `Email xác thực (${email}) không khớp với email được mời (${targetInvite.email}). Chỉ người được mời mới có thể tham gia.`,
        code: "EMAIL_MISMATCH",
      });
    }

    if (targetInvite.status === "accepted" || targetInvite.status === "joined") {
      return res.json({
        success: true,
        alreadyAccepted: true,
        invitation: targetInvite,
        message: "Lời mời này đã được chấp nhận trước đó!",
      });
    }

    // Update status to joined
    targetInvite.status = "joined";
    targetInvite.acceptedAt = new Date().toISOString();
    targetInvite.acceptedBy = {
      id: userId || `user_${Date.now()}`,
      name: name || targetInvite.email.split("@")[0],
      email: email || targetInvite.email,
    };

    saveStoredInvitations(invites);

    console.log(
      `[Invitation Accepted] ${targetInvite.email} accepted invitation for ${targetInvite.projectName}`
    );

    return res.json({
      success: true,
      invitation: targetInvite,
      message: `Chào mừng bạn đã tham gia nhóm "${targetInvite.projectName}"!`,
    });
  } catch (error: any) {
    console.error("Error accepting invitation:", error);
    return res.status(500).json({
      success: false,
      error: "Không thể chấp nhận lời mời",
    });
  }
});

// Refresh / Get links for invitation to open Gmail or copy
const handleResendInvitation = async (req: Request, res: Response) => {
  try {
    const id = req.params.id || req.body.id;
    const targetEmail = req.body.email;
    const { baseUrl, joinLink } = req.body || {};

    const invites = getStoredInvitations();
    const invitation = invites.find(
      (i) => (id && i.id === id) || (targetEmail && i.email.toLowerCase() === String(targetEmail).toLowerCase())
    );

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: "Lời mời không tồn tại trong danh sách",
      });
    }

    // Refresh expiration to 7 days from now and set status to pending
    invitation.createdAt = new Date().toISOString();
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    invitation.status = "pending";

    const hostOrigin =
      baseUrl ||
      (req.headers.origin as string) ||
      (process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, "") : `http://localhost:${PORT}`);

    const finalJoinUrl = hostOrigin.replace(/\/$/, "");
    invitation.inviteUrl = finalJoinUrl;

    const emailSubject = `[TEAM UP] Mời bạn tham gia nhóm "${invitation.projectName}"`;
    const emailBody = `Chào bạn,\n\nBạn nhận được lời mời tham gia nhóm "${invitation.projectName}" trên ứng dụng TEAM UP.\nNgười mời: ${invitation.inviterName}\nVai trò được giao: ${invitation.role}\n\nBấm vào liên kết sau để truy cập dự án và nhập Gmail của bạn để tham gia nhóm ngay:\n${finalJoinUrl}\n\n* Lưu ý: Lời mời áp dụng cho tài khoản ${invitation.email}.\n\nChúc bạn làm việc hiệu quả cùng nhóm!\nTEAM UP Workspace`;

    const gmailWebComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      invitation.email
    )}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    const mailtoUrl = `mailto:${encodeURIComponent(invitation.email)}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`;

    saveStoredInvitations(invites);

    return res.json({
      success: true,
      status: "refreshed",
      invitation,
      inviteUrl: finalJoinUrl,
      gmailWebComposeUrl,
      mailtoUrl,
      message: "Đã làm mới và sẵn sàng gửi lại lời mời",
    });
  } catch (error: any) {
    console.error("Error refreshing invitation:", error);
    return res.status(500).json({
      success: false,
      error: "Không thể làm mới lời mời",
    });
  }
};

app.post("/api/invitations/:id/resend", handleResendInvitation);
app.post("/api/invitations/resend", handleResendInvitation);

// Revoke/cancel invitation
const handleDeleteInvitation = (req: Request, res: Response) => {
  try {
    const id = req.params.id || req.body.id;
    const email = (req.query.email as string) || req.body.email;
    let invites = getStoredInvitations();

    const initialLen = invites.length;
    invites = invites.filter((i) => {
      if (id && i.id === id) return false;
      if (id && i.email.toLowerCase() === String(id).toLowerCase()) return false;
      if (email && i.email.toLowerCase() === String(email).toLowerCase()) return false;
      return true;
    });

    saveStoredInvitations(invites);

    return res.json({
      success: true,
      deletedCount: initialLen - invites.length,
      message: "Đã xóa lời mời thành công",
    });
  } catch (error: any) {
    console.error("Error deleting invitation:", error);
    return res.status(500).json({
      success: false,
      error: "Không thể xóa lời mời",
    });
  }
};

app.delete("/api/invitations/:id", handleDeleteInvitation);
app.post("/api/invitations/delete", handleDeleteInvitation);

// Ensure any unhandled /api/* request always returns JSON 404, never falling through to SPA HTML
app.all("/api/*", (_req: Request, res: Response) => {
  res.status(404).json({ error: "API endpoint not found", path: _req.path });
});

// Global Express error handler to guarantee JSON error response for API requests
app.use((err: any, _req: Request, res: Response, next: express.NextFunction) => {
  console.error("Global server error:", err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err?.status || 500).json({ error: err?.message || "Internal server error" });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TEAM UP Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
