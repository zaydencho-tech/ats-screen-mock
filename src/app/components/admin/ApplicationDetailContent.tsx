import { Download, ExternalLink, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import ApplicantPhotoHeader from "./ApplicantPhotoHeader";
import Utils from "../../utils";

interface Attachment {
  fileDtlId?: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  url?: string;
}

interface ApplicationDetailData {
  name: string;
  photoUrl?: string;
  photoFileDtlId?: number;
  birthdate?: string;
  email?: string;
  phone?: string;
  zipcode?: string;
  address?: string;
  addressDetail?: string;
  militaryStatus?: string;
  veteransStatus?: string;
  disabilityStatus?: string;
  education?: string;
  experience?: string;
  certifications?: string[];
  languages?: { language: string; level: string }[];
  activities?: string[];
  /** 성장 과정 및 가치관 */
  background?: string;
  /** 지원 동기 및 입사 후 포부 */
  motivation?: string;
  /** @deprecated background 사용. 하위 호환용 */
  coverLetter?: string;
  portfolioUrl?: string;
  attachments?: Attachment[];
  availableDate?: string;
  desiredSalary?: string;
  howDidYouKnow?: string;
  /** @deprecated howDidYouKnow 사용. 하위 호환용 */
  applicationChannel?: string;
  /** 지인 추천(REFERRAL) 시 추천인 부서 */
  referrerDept?: string;
  /** 지인 추천(REFERRAL) 시 추천인 이름 */
  referrerName?: string;
}

function SectionTitle({ children, numbered = true }: { children: React.ReactNode; numbered?: boolean }) {
  return (
    <h3
      style={{
        fontSize: "0.75rem",
        fontWeight: 700,
        color: "#020618",
        marginBottom: "10px",
        paddingBottom: "6px",
        borderBottom: "1px solid #F1F5F9",
      }}
    >
      {!numbered && typeof children === "string" ? children.replace(/^\d+\.\s*/, "") : children}
    </h3>
  );
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div className="ats-detail-field" style={{ display: "flex", gap: "12px", marginBottom: "6px" }}>
      <span
        className="ats-field-label"
        style={{
          fontSize: "0.75rem",
          color: "#90A1B9",
          minWidth: "72px",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span className="ats-field-value" style={{ fontSize: "0.75rem", color: "#334155", flex: 1 }}>{value}</span>
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="ats-application-section"
      style={{
        paddingBottom: "14px",
        marginBottom: "14px",
        borderBottom: "1px solid #F1F5F9",
      }}
    >
      {children}
    </div>
  );
}

function AttachmentDownloadRow({ file }: { file: Attachment }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (file.url?.trim()) {
      const anchor = document.createElement("a");
      anchor.href = file.url;
      anchor.download = file.fileName;
      anchor.rel = "noopener";
      anchor.target = "_blank";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      return;
    }

    if (!file.fileDtlId) return;

    setIsDownloading(true);
    try {
      await Utils.File.downloadFileStream(file.fileDtlId, file.fileName);
    } catch {
      // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleDownload()}
      disabled={isDownloading || (!file.url && !file.fileDtlId)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "6px 10px",
        border: "1px solid #E2E8F0",
        borderRadius: "6px",
        backgroundColor: "#FAFCFF",
        fontWeight: 400,
        fontSize: "0.75rem",
        lineHeight: 1.5,
        cursor:
          isDownloading || (!file.url && !file.fileDtlId)
            ? "not-allowed"
            : "pointer",
        opacity: isDownloading || (!file.url && !file.fileDtlId) ? 0.6 : 1,
      }}
      className="hover:bg-slate-50 transition-colors"
    >
      <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
        <FileText
          style={{ width: "13px", height: "13px", color: "#90A1B9", flexShrink: 0 }}
        />
        <span style={{ fontSize: "0.75rem", color: "#334155" }}>{file.fileName}</span>
      </div>
      {isDownloading ? (
        <Loader2
          style={{ width: "12px", height: "12px", color: "#90A1B9", flexShrink: 0 }}
          className="animate-spin"
        />
      ) : (
        <Download
          style={{ width: "12px", height: "12px", color: "#90A1B9", flexShrink: 0 }}
        />
      )}
    </button>
  );
}

export default function ApplicationDetailContent({
  data,
  columns = 1,
  showSectionNumbers = true,
}: {
  data: ApplicationDetailData;
  columns?: 1 | 2;
  showSectionNumbers?: boolean;
}) {
  const d = data;
  const militaryStatusLabel = d.militaryStatus?.trim() || undefined;
  const applicationChannelLabel =
    d.howDidYouKnow?.trim() || d.applicationChannel?.trim() || undefined;
  const referrerDisplay = Utils.Mapper.application.formatReferrerDisplay(
    applicationChannelLabel,
    d.referrerDept,
    d.referrerName,
  );

  return (
    <div className={`ats-application-detail${columns === 2 ? " ats-application-two-column" : ""}`} style={{ padding: "16px", display: "flex", flexDirection: "column" }}>
      <ApplicantPhotoHeader
        name={d.name}
        email={d.email}
        phone={d.phone}
        birthdate={d.birthdate}
        photoUrl={d.photoUrl}
        photoFileDtlId={d.photoFileDtlId}
      />
      <Section>
        <SectionTitle numbered={showSectionNumbers}>1. 기본 정보</SectionTitle>
        <Row label="이름" value={<strong>{d.name}</strong>} />
        <Row label="생년월일" value={d.birthdate} />
        <Row label="이메일" value={d.email} />
        <Row label="전화번호" value={d.phone} />
        <div className="ats-application-address-title" style={{ marginTop: "8px", marginBottom: "4px" }}>
          <span style={{ fontSize: "0.75rem", color: "#90A1B9" }}>주소</span>
        </div>
        <div className="ats-application-address" style={{ paddingLeft: "12px", borderLeft: "2px solid #F1F5F9" }}>
          <Row label="우편번호" value={d.zipcode} />
          <Row label="주소" value={d.address} />
          <Row label="상세주소" value={d.addressDetail} />
        </div>
      </Section>

      <Section>
        <SectionTitle numbered={showSectionNumbers}>2. 병역 / 보훈 / 장애</SectionTitle>
        <Row label="병역사항" value={militaryStatusLabel} />
        <Row label="보훈 대상" value={d.veteransStatus} />
        <Row label="장애 여부" value={d.disabilityStatus} />
      </Section>

      <Section>
        <SectionTitle numbered={showSectionNumbers}>3. 학력</SectionTitle>
        {d.education ? (
          <p
            style={{
              fontSize: "0.75rem",
              color: "#334155",
              lineHeight: 1.65,
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {d.education}
          </p>
        ) : (
          <p style={{ fontSize: "0.75rem", color: "#CBD5E1", margin: 0 }}>
            등록된 학력 정보가 없습니다.
          </p>
        )}
      </Section>

      <Section>
        <SectionTitle numbered={showSectionNumbers}>4. 경력</SectionTitle>
        {d.experience ? (
          <pre
            style={{
              fontSize: "0.75rem",
              color: "#334155",
              lineHeight: 1.65,
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontFamily: "inherit",
            }}
          >
            {d.experience}
          </pre>
        ) : (
          <p style={{ fontSize: "0.75rem", color: "#CBD5E1", margin: 0 }}>
            등록된 경력 정보가 없습니다.
          </p>
        )}
      </Section>

      <Section>
        <SectionTitle numbered={showSectionNumbers}>5. 자격증 및 어학</SectionTitle>
        {d.certifications && d.certifications.length > 0 && (
          <div style={{ marginBottom: "8px" }}>
            <p
              style={{
                fontSize: "0.6875rem",
                color: "#90A1B9",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              자격증
            </p>
            {d.certifications.map((c, i) => (
              <div
                key={i}
                style={{ fontSize: "0.75rem", color: "#334155", marginBottom: "2px" }}
              >
                • {c}
              </div>
            ))}
          </div>
        )}
        {d.languages && d.languages.length > 0 && (
          <div>
            <p
              style={{
                fontSize: "0.6875rem",
                color: "#90A1B9",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              어학
            </p>
            {d.languages.map((l, i) => (
              <Row key={i} label={l.language} value={l.level} />
            ))}
          </div>
        )}
        {(!d.certifications || d.certifications.length === 0) &&
          (!d.languages || d.languages.length === 0) && (
            <p style={{ fontSize: "0.75rem", color: "#CBD5E1", margin: 0 }}>
              등록된 정보가 없습니다.
            </p>
          )}
      </Section>

      <Section>
        <SectionTitle numbered={showSectionNumbers}>6. 사회활동 경험</SectionTitle>
        {d.activities && d.activities.length > 0 ? (
          d.activities.map((a, i) => (
            <div
              key={i}
              style={{ fontSize: "0.75rem", color: "#334155", marginBottom: "2px" }}
            >
              • {a}
            </div>
          ))
        ) : (
          <p style={{ fontSize: "0.75rem", color: "#CBD5E1", margin: 0 }}>
            등록된 사회활동 경험이 없습니다.
          </p>
        )}
      </Section>

      <Section>
        <SectionTitle numbered={showSectionNumbers}>7. 자기소개</SectionTitle>
        {(() => {
          const background = d.background?.trim() || d.coverLetter?.trim();
          const motivation = d.motivation?.trim();
          const hasAny = Boolean(background || motivation);

          const textBlockStyle = {
            fontSize: "0.75rem" as const,
            color: "#334155",
            lineHeight: 1.75,
            margin: 0,
            whiteSpace: "pre-wrap" as const,
            wordBreak: "break-word" as const,
            fontFamily: "inherit",
          };

          if (!hasAny) {
            return (
              <p style={{ fontSize: "0.75rem", color: "#CBD5E1", margin: 0 }}>
                등록된 자기소개가 없습니다.
              </p>
            );
          }

          return (
            <div className="ats-application-text-columns" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#334155",
                    marginBottom: "6px",
                  }}
                >
                  성장 과정 및 가치관
                </div>
                {background ? (
                  <pre style={textBlockStyle}>{background}</pre>
                ) : (
                  <p style={{ fontSize: "0.75rem", color: "#CBD5E1", margin: 0 }}>
                    없음
                  </p>
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#334155",
                    marginBottom: "6px",
                  }}
                >
                  지원 동기 및 입사 후 포부
                </div>
                {motivation ? (
                  <pre style={textBlockStyle}>{motivation}</pre>
                ) : (
                  <p style={{ fontSize: "0.75rem", color: "#CBD5E1", margin: 0 }}>
                    없음
                  </p>
                )}
              </div>
            </div>
          );
        })()}
      </Section>

      <Section>
        <SectionTitle numbered={showSectionNumbers}>8. 포트폴리오 및 경력기술서</SectionTitle>
        {d.portfolioUrl && (
          <div style={{ marginBottom: "8px" }}>
            <p
              style={{
                fontSize: "0.6875rem",
                color: "#90A1B9",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              포트폴리오 URL
            </p>
            <a
              href={d.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "0.75rem",
                color: "#2B7FFF",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                wordBreak: "break-all",
              }}
              className="hover:underline"
            >
              <ExternalLink style={{ width: "11px", height: "11px", flexShrink: 0 }} />
              {d.portfolioUrl}
            </a>
          </div>
        )}
        {d.attachments && d.attachments.length > 0 && (
          <div className="ats-application-attachments">
            <p
              style={{
                fontSize: "0.6875rem",
                color: "#90A1B9",
                fontWeight: 600,
                marginBottom: "4px",
              }}
            >
              첨부파일
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {d.attachments.map((file, idx) => (
                <AttachmentDownloadRow
                  key={file.fileDtlId ?? `${file.fileName}-${idx}`}
                  file={file}
                />
              ))}
            </div>
          </div>
        )}
        {!d.portfolioUrl && (!d.attachments || d.attachments.length === 0) && (
          <p style={{ fontSize: "0.75rem", color: "#CBD5E1", margin: 0 }}>
            등록된 포트폴리오가 없습니다.
          </p>
        )}
      </Section>

      <div className="ats-application-section">
        <SectionTitle numbered={showSectionNumbers}>9. 지원정보</SectionTitle>
        <Row label="입사 가능일" value={d.availableDate} />
        <Row
          label="희망 연봉"
          value={Utils.Mapper.application.formatDesiredSalaryDisplay(d.desiredSalary)}
        />
        <Row
          label="지원 경로"
          value={
            applicationChannelLabel ? (
              <>
                {applicationChannelLabel}
                {referrerDisplay ? (
                  <span
                    style={{
                      marginLeft: "8px",
                      fontSize: "0.6875rem",
                      color: "#64748B",
                      background: "#F1F5F9",
                      borderRadius: "4px",
                      padding: "1px 7px",
                    }}
                  >
                    {referrerDisplay}
                  </span>
                ) : null}
              </>
            ) : undefined
          }
        />
      </div>
    </div>
  );
}

export type { ApplicationDetailData };
