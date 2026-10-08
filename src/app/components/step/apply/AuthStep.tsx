import { useState } from "react";
import { Shield } from "lucide-react";
import { motion } from "motion/react";
import EmailTemplateModal from "../../EmailTemplateModal";
import FormInlineError from "./FormInlineError";

export interface ApplyAuthStepProps {
  authName: string;
  authEmail: string;
  verificationCode: string;
  isCodeSent: boolean;
  authError?: string;
  isAuthSending?: boolean;
  isAuthVerifying?: boolean;
  onAuthNameChange: (value: string) => void;
  onAuthEmailChange: (value: string) => void;
  onVerificationCodeChange: (value: string) => void;
  onSendVerificationCode: () => void;
  onBack: () => void;
  onSubmit: () => void;
}

export default function ApplyAuthStep({
  authName,
  authEmail,
  verificationCode,
  isCodeSent,
  authError = "",
  isAuthSending = false,
  isAuthVerifying = false,
  onAuthNameChange,
  onAuthEmailChange,
  onVerificationCodeChange,
  onSendVerificationCode,
  onBack,
  onSubmit,
}: ApplyAuthStepProps) {
  const [showEmailTemplate, setShowEmailTemplate] = useState(false);

  return (
          <div className="container mx-auto px-6 py-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto">
              <div className="mb-4 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h1 className="font-display text-2xl mb-2 text-primary">이메일 인증</h1>
                <p className="text-sm text-muted-foreground">입사 지원을 위해 이메일 인증이 필요합니다</p>
              </div>
    
              <div className="border border-border rounded-lg p-4 bg-card space-y-3">
                <FormInlineError message={authError} />

                <div>
                  <label className="block mb-1.5 font-medium text-sm">이름 *</label>
                  <input
                    type="text"
                    value={authName}
                    onChange={(e) => onAuthNameChange(e.target.value)}
                    disabled={isCodeSent || isAuthSending || isAuthVerifying}
                    className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      height: '28px',
                      paddingLeft: '12px',
                      paddingRight: '12px',
                      paddingTop: '4px',
                      paddingBottom: '4px',
                      fontSize: '0.75rem',
                      borderRadius: '5px'
                    }}
                    placeholder="홍길동"
                  />
                </div>
    
                <div>
                  <label className="block mb-1.5 font-medium text-sm">이메일 주소 *</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(e) => onAuthEmailChange(e.target.value)}
                      disabled={isCodeSent || isAuthSending || isAuthVerifying}
                      className="flex-1 border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        height: '28px',
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        paddingTop: '4px',
                        paddingBottom: '4px',
                        fontSize: '0.75rem',
                        borderRadius: '5px'
                      }}
                      placeholder="example@email.com"
                    />
                    <button
                      type="button"
                      onClick={onSendVerificationCode}
                      disabled={!authName || !authEmail || isCodeSent || isAuthSending || isAuthVerifying}
                      className="bg-accent text-accent-foreground hover:bg-accent/90 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        height: '28px',
                        padding: '0 12px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        borderRadius: '5px'
                      }}
                    >
                      {isAuthSending ? "전송 중..." : isCodeSent ? "전송완료" : "인증번호 전송"}
                    </button>
                  </div>
                </div>
    
                {isCodeSent && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2"
                  >
                    <label className="block mb-1.5 font-medium text-sm">인증번호 *</label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => onVerificationCodeChange(e.target.value)}
                      disabled={isAuthVerifying}
                      className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        height: '28px',
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        paddingTop: '4px',
                        paddingBottom: '4px',
                        fontSize: '0.75rem',
                        borderRadius: '5px'
                      }}
                      placeholder="이메일로 받은 6자리 인증번호를 입력하세요"
                      maxLength={6}
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {authEmail}로 인증번호가 전송되었습니다.
                      </p>
                      <button
                        type="button"
                        onClick={onSendVerificationCode}
                        disabled={isAuthSending || isAuthVerifying}
                        className="text-xs text-accent hover:text-accent/80 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        재발송
                      </button>
                    </div>
                  </motion.div>
                )}
    
                <div className="p-2.5 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">안내:</strong> 이메일로 전송된 6자리 인증번호를 입력해주세요. 인증번호가 도착하지 않으면 스팸 메일함을 확인해주세요.
                  </p>
                </div>
    
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onBack}
                    className="flex-1 border border-border hover:bg-muted/50 transition-colors"
                    style={{
                      height: '28px',
                      padding: '0 12px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      borderRadius: '5px'
                    }}
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={!authName || !authEmail || !isCodeSent || !verificationCode || isAuthSending || isAuthVerifying}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      height: '28px',
                      padding: '0 12px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      borderRadius: '5px'
                    }}
                  >
                    {isAuthVerifying ? "인증 중..." : "인증하기"}
                  </button>
                </div>
              </div>

              {import.meta.env.DEV ? (
                <>
                  <div style={{ textAlign: "center", marginTop: "12px" }}>
                    <button
                      type="button"
                      onClick={() => setShowEmailTemplate(true)}
                      style={{
                        fontSize: "0.75rem",
                        color: "#90a1b9",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px 0",
                        textDecoration: "underline",
                        textUnderlineOffset: "2px",
                      }}
                    >
                      인증번호 발송 메일 템플릿 보기
                    </button>
                  </div>

                  {showEmailTemplate ? (
                    <EmailTemplateModal
                      onClose={() => setShowEmailTemplate(false)}
                    />
                  ) : null}
                </>
              ) : null}
            </motion.div>
          </div>
  );
}
