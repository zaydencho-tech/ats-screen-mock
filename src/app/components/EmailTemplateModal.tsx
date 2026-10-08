import { X } from "lucide-react";

interface EmailTemplateModalProps {
  onClose: () => void;
}

export default function EmailTemplateModal({ onClose }: EmailTemplateModalProps) {
  const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>본인확인 인증번호 안내</title>
<style>
  @media only screen and (max-width: 620px) {
    .email-container { width: 100% !important; padding: 0 16px !important; box-sizing: border-box !important; }
    .content-table { width: 100% !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#E2E8F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#E2E8F0;padding:40px 0;">
  <tr>
    <td align="center">
      <table class="content-table" border="0" cellpadding="0" cellspacing="0" width="600" style="width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2b7fff 0%,#6a3de8 100%);padding:28px 36px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td>
                  <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:0.02em;">ITCEN</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 36px 28px 36px;">
            <p style="margin:0 0 8px 0;font-size:15px;line-height:1.7;color:#1e293b;">안녕하세요. <strong>[서비스명]</strong>입니다.</p>
            <p style="margin:0 0 28px 0;font-size:15px;line-height:1.7;color:#1e293b;">요청하신 본인확인 인증번호를 안내해 드립니다.</p>

            <!-- Code Box -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
              <tr>
                <td style="background-color:#F0F5FA;border:1px solid #D0DEEB;border-radius:8px;padding:24px 28px;">
                  <p style="margin:0 0 6px 0;font-size:12px;color:#64748b;letter-spacing:0.5px;text-transform:uppercase;">인증 번호</p>
                  <p style="margin:0;font-size:36px;font-weight:800;letter-spacing:8px;color:#2b7fff;font-family:'Courier New',Courier,monospace;">940125</p>
                  <p style="margin:8px 0 0 0;font-size:12px;color:#94a3b8;">이 인증번호는 발송 후 <strong style="color:#e53e3e;">3분간</strong> 유효합니다.</p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 4px 0;font-size:14px;color:#475569;line-height:1.6;">본인이 요청하지 않은 경우 이 메일을 무시하셔도 됩니다.</p>
            <p style="margin:0 0 28px 0;font-size:14px;color:#475569;line-height:1.6;">인증번호를 타인에게 절대 알려주지 마세요.</p>

            <p style="margin:0 0 4px 0;font-size:14px;color:#1e293b;">감사합니다.</p>
            <p style="margin:0;font-size:14px;font-weight:600;color:#1e293b;">아이티센 드림.</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 36px;">
            <p style="margin:0 0 4px 0;font-size:11px;color:#94a3b8;line-height:1.6;">이 메일은 발신 전용입니다. 이 메일에 직접 회신하지 마세요.</p>
            <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">© 2025 ITCEN. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '700px',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>인증번호 발송 메일 템플릿</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px', background: '#f1f5f9' }}>
          <iframe
            srcDoc={htmlContent}
            style={{ width: '100%', height: '500px', border: 'none', borderRadius: '8px', background: '#E2E8F0' }}
            title="메일 템플릿 미리보기"
          />
        </div>
      </div>
    </div>
  );
}
