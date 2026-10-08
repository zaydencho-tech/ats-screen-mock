import { useCallback } from "react";
import {
  Upload,
  X,
  CheckCircle,
  FileText,
  Save,
  Plus,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import type { ApplyFormStepProps } from "./formStepProps";
import type {
  ActivityEntry,
  CareerEntry,
  CertificateEntry,
  EducationEntry,
  LanguageEntry,
} from "./types";
import FormInlineError from "./FormInlineError";
import DateInput from "./DateInput";
import MonthInput from "./MonthInput";
import { applyFieldLabel, applySectionTitle, applySectionRequiredMarkerStyle } from "./applyFieldLabel";
import {
  PORTFOLIO_URL_MAX_LENGTH,
  REFERRER_FIELD_MAX_LENGTH,
  isReferralHowDidYouKnow,
} from "../../../utils/mapper/application";
import { APPLY_BIRTHDATE_UNDER_MIN_AGE } from "../../../constants";
import { getKoreaDateInputYearsFromToday } from "../../../utils/form/dateInputValue";
import { formatPhoneInputValue } from "../../../utils/form/inputValue";
import type { CommonCodeOption } from "../../../utils/codes/commonCode";
import { coerceCommonCodeSelectValue } from "../../../utils/codes/commonCode";
import {
  isMilitaryInService,
  requiresMilitaryServiceDates,
  shouldShowMilitaryServiceDates,
} from "../../../utils/codes/militaryServiceCode";

export type { ApplyFormStepProps } from "./formStepProps";

/** Chrome 등이 autocomplete="off" 를 무시할 때 사용 (주소 자동완성 방지) */
const BLOCK_BROWSER_AUTOFILL = {
  autoComplete: "one-time-code",
  "data-form-type": "other",
  "data-lpignore": "true",
} as const;

/** readOnly/disabled 는 HTML 검증 제외 — 퍼블 스타일 유지, 직접 입력만 차단 */
const LOCKED_FIELD_INPUT_PROPS = {
  onChange: () => {},
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => e.preventDefault(),
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => e.preventDefault(),
  onDrop: (e: React.DragEvent<HTMLInputElement>) => e.preventDefault(),
} as const;

function renderCommonCodeSelectOptions(
  options: CommonCodeOption[],
  isLoading = false,
  includeEmptyOption = true,
) {
  return (
    <>
      {includeEmptyOption ? (
        <option value="">{isLoading ? "불러오는 중..." : "선택"}</option>
      ) : isLoading ? (
        <option value="">불러오는 중...</option>
      ) : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </>
  );
}

export default function ApplyFormStep({
  formData,
  codeOptions,
  isCodeOptionsLoading = false,
  jobSubtitle = "",
  isJobDetailLoading = false,
  isApplicationLoading = false,
  isApplicationSaving = false,
  isApplicationSubmitting = false,
  showResumeAgentSection = false,
  portfolioFiles,
  photoFile,
  resumeFile,
  resumeAttachment = null,
  parsedResume,
  isResumeParsing,
  resumeUploadError = "",
  portfolioUploadError = "",
  photoUploadError = "",
  portfolioUrlError = "",
  formActionError = "",
  onDismissResumeUploadError,
  onDismissPortfolioUploadError,
  onDismissPhotoUploadError,
  onDismissPortfolioUrlError,
  onDismissFormActionError,
  onFormDataChange,
  onResumeUpload,
  onPortfolioFileUpload,
  onPhotoFileUpload,
  onRemovePhotoFile,
  onRemovePortfolioFile,
  onSaveDraft,
  onSubmit,
  onPostalSearch,
  onAddEducation,
  onRemoveEducation,
  onAddCareer,
  onRemoveCareer,
  onAddCertificate,
  onRemoveCertificate,
  onAddLanguage,
  onRemoveLanguage,
  onAddActivity,
  onRemoveActivity,
  // onDevFillSample,
  // onDevDownloadPdf,
  // isDevPdfDownloading = false,
}: ApplyFormStepProps) {
  /** 만 14세 미만 선택 불가 — 오늘(한국) 기준 14년 전 날짜가 선택 상한 */
  const maxBirthdate = getKoreaDateInputYearsFromToday(-14);

  /** 배열 항목도 스칼라 필드와 동일하게 onFormDataChange(functional update) 경로 사용 */
  const patchEducation = useCallback(
    (
      index: number,
      field: keyof EducationEntry,
      value: EducationEntry[keyof EducationEntry],
    ) => {
      onFormDataChange((prev) => {
        const entry = prev.educationHistory[index];
        if (!entry) return prev;
        const educationHistory = [...prev.educationHistory];
        educationHistory[index] = { ...entry, [field]: value };
        return { ...prev, educationHistory };
      });
    },
    [onFormDataChange],
  );

  const patchCareer = useCallback(
    (
      index: number,
      field: keyof CareerEntry,
      value: CareerEntry[keyof CareerEntry],
    ) => {
      onFormDataChange((prev) => {
        const entry = prev.careerHistory[index];
        if (!entry) return prev;
        const careerHistory = [...prev.careerHistory];
        careerHistory[index] = { ...entry, [field]: value };
        return { ...prev, careerHistory };
      });
    },
    [onFormDataChange],
  );

  const patchCertificate = useCallback(
    (index: number, field: keyof CertificateEntry, value: string) => {
      onFormDataChange((prev) => {
        const entry = prev.certificates[index];
        if (!entry) return prev;
        const certificates = [...prev.certificates];
        certificates[index] = { ...entry, [field]: value };
        return { ...prev, certificates };
      });
    },
    [onFormDataChange],
  );

  const patchLanguage = useCallback(
    (index: number, field: keyof LanguageEntry, value: string) => {
      onFormDataChange((prev) => {
        const entry = prev.languages[index];
        if (!entry) return prev;
        const languages = [...prev.languages];
        languages[index] = { ...entry, [field]: value };
        return { ...prev, languages };
      });
    },
    [onFormDataChange],
  );

  const patchActivity = useCallback(
    (
      index: number,
      field: keyof ActivityEntry,
      value: ActivityEntry[keyof ActivityEntry],
    ) => {
      onFormDataChange((prev) => {
        const entry = prev.activities[index];
        if (!entry) return prev;
        const activities = [...prev.activities];
        activities[index] = { ...entry, [field]: value };
        return { ...prev, activities };
      });
    },
    [onFormDataChange],
  );

  const resumeParsedFileName =
    resumeFile?.name ?? resumeAttachment?.name ?? "";
  const showResumeParseSuccess = Boolean(
    (resumeFile || resumeAttachment) && parsedResume && !isResumeParsing,
  );

  return (
        <div className="container mx-auto px-6 py-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
            <div className="mb-4">
              <h1 className="font-display text-2xl mb-2 text-primary">입사 지원서</h1>
              <p className="text-sm text-muted-foreground">
                {isJobDetailLoading
                  ? "채용공고 정보를 불러오는 중..."
                  : jobSubtitle || "채용공고 정보를 불러올 수 없습니다."}
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4" autoComplete="off">
              <FormInlineError
                message={formActionError}
                onDismiss={onDismissFormActionError}
              />
              {/* 브라우저가 아래 필드에 주소 등을 잘못 채우는 것 방지 (표시 안 함) */}
              <input
                type="text"
                name="apply-autofill-trap-text"
                autoComplete="off"
                tabIndex={-1}
                aria-hidden
                style={{
                  position: "absolute",
                  width: 0,
                  height: 0,
                  opacity: 0,
                  pointerEvents: "none",
                }}
              />
              <input
                type="password"
                name="apply-autofill-trap-password"
                autoComplete="new-password"
                tabIndex={-1}
                aria-hidden
                style={{
                  position: "absolute",
                  width: 0,
                  height: 0,
                  opacity: 0,
                  pointerEvents: "none",
                }}
              />
              {showResumeAgentSection ? (
              <section className="border border-primary/20 bg-primary/5 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-2">
                  <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h2 className="font-display text-lg mb-1 text-primary">이력서 자동 입력</h2>
                    <p className="text-xs text-muted-foreground mb-2">
                      이력서 파일을 업로드하면 지원서 정보가 자동으로 입력됩니다.
                    </p>
                  </div>
                </div>
    
                <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer">
                  <input type="file" onChange={onResumeUpload} className="hidden" id="resume-upload" accept=".pdf,.doc,.docx" />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-foreground font-medium mb-1 text-sm">이력서 파일 업로드 (선택사항)</p>
                    <p className="text-xs text-muted-foreground">PDF, DOC, DOCX 형식 지원 (최대 10MB)</p>
                  </label>
                </div>

                <FormInlineError
                  message={resumeUploadError}
                  className="mt-2"
                  onDismiss={onDismissResumeUploadError}
                />
    
                {isResumeParsing && (resumeFile || resumeAttachment) ? (
                  <div className="mt-2 p-2.5 bg-primary/10 rounded-lg text-sm text-muted-foreground">
                    이력서를 분석하는 중입니다...
                  </div>
                ) : null}

                {showResumeParseSuccess ? (
                  <div className="mt-2 p-2.5 bg-primary/10 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <div>
                      <div className="font-medium text-foreground text-sm">
                        {resumeParsedFileName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        파싱 완료 - 지원 정보가 입력되었습니다. 제출 전 입력
                        내용을 다시 한번 확인해주세요.
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>
              ) : null}
    
              {/* 1. 기본 정보 */}
              <section className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-display text-lg text-foreground">기본 정보</h2>
                  <span style={applySectionRequiredMarkerStyle}>(필수)</span>
                </div>

                <div
                  style={{
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "80px",
                      height: "107px",
                      borderRadius: "6px",
                      flexShrink: 0,
                      border: "1px dashed #D1D5DB",
                      backgroundColor: "#F8FAFC",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {photoFile?.previewUrl ? (
                      <>
                        <img
                          src={photoFile.previewUrl}
                          alt="증명사진"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <button
                          type="button"
                          onClick={onRemovePhotoFile}
                          style={{
                            position: "absolute",
                            top: "3px",
                            right: "3px",
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(2, 6, 24, 0.55)",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: "11px",
                            lineHeight: 1,
                          }}
                          aria-label="사진 삭제"
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <>
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#CBD5E1"
                          strokeWidth="1.5"
                          aria-hidden
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span
                          style={{
                            fontSize: "0.6rem",
                            color: "#94A3B8",
                            marginTop: "4px",
                          }}
                        >
                          사진
                        </span>
                      </>
                    )}
                  </div>
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "5px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          fontWeight: 500,
                          color: "#020618",
                        }}
                      >
                        증명사진
                      </span>

                    </div>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "#64748B",
                        marginBottom: "8px",
                        lineHeight: 1.5,
                      }}
                    >
                      JPG, PNG · 5MB 이하
                      <br />
                      <span style={{ color: "#94A3B8" }}>3:4 비율 권장</span>
                    </p>
                    <label style={{ cursor: "pointer" }}>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        className="hidden"
                        onChange={onPhotoFileUpload}
                      />
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          height: "28px",
                          padding: "0 12px",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          borderRadius: "5px",
                          border: "1px solid #D1D5DB",
                          backgroundColor: "#ffffff",
                          color: "#374151",
                          cursor: "pointer",
                        }}
                      >
                        사진 첨부
                      </span>
                    </label>
                    {photoUploadError ? (
                      <FormInlineError
                        message={photoUploadError}
                        onDismiss={onDismissPhotoUploadError}
                      />
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5 font-medium text-sm">{applyFieldLabel("이름", "name")}</label>
                    <input
                      id="apply-name"
                      type="text"
                      required
                      autoComplete="name"
                      value={formData.name}
                      {...LOCKED_FIELD_INPUT_PROPS}
                      className="w-full border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary"
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
                    <label className="block mb-1.5 font-medium text-sm">{applyFieldLabel("생년월일", "birthdate")}</label>
                    <DateInput
                      required
                      min="1000-01-01"
                      max={maxBirthdate}
                      outOfBoundsMessage={APPLY_BIRTHDATE_UNDER_MIN_AGE}
                      value={formData.birthdate}
                      onChange={(next) => {
                        onFormDataChange((prev) => ({
                          ...prev,
                          birthdate: next,
                        }));
                      }}
                      className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                      style={{
                        height: '28px',
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        paddingTop: '4px',
                        paddingBottom: '4px',
                        fontSize: '0.75rem',
                        borderRadius: '5px'
                      }}
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 font-medium text-sm">{applyFieldLabel("이메일", "email")}</label>
                    <input
                      id="apply-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={formData.email}
                      {...LOCKED_FIELD_INPUT_PROPS}
                      className="w-full border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary"
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
                  </div>
                  <div>
                    <label className="block mb-1.5 font-medium text-sm">{applyFieldLabel("전화번호", "phone")}</label>
                    <input
                      id="apply-phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      inputMode="numeric"
                      value={formatPhoneInputValue(formData.phone)}
                      onChange={(e) =>
                        onFormDataChange((prev) => ({
                          ...prev,
                          phone: formatPhoneInputValue(e.target.value),
                        }))
                      }
                      className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                      style={{
                        height: '28px',
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        paddingTop: '4px',
                        paddingBottom: '4px',
                        fontSize: '0.75rem',
                        borderRadius: '5px'
                      }}
                      placeholder="010-1234-5678"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block mb-1.5 font-medium text-sm">{applyFieldLabel("우편번호", "postalCode")}</label>
                    <div className="flex gap-2">
                      <input
                        id="apply-zip"
                        name="apply-zip"
                        type="text"
                        required
                        autoComplete="postal-code"
                        value={formData.postalCode}
                        {...LOCKED_FIELD_INPUT_PROPS}
                        className="w-40 border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary"
                        style={{
                          height: '28px',
                          paddingLeft: '12px',
                          paddingRight: '12px',
                          paddingTop: '4px',
                          paddingBottom: '4px',
                          fontSize: '0.75rem',
                          borderRadius: '5px'
                        }}
                        placeholder="우편번호"
                      />
                      <button
                        type="button"
                        onClick={onPostalSearch}
                        className="bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
                        style={{
                          height: '28px',
                          padding: '0 12px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          borderRadius: '5px'
                        }}
                      >
                        우편번호 검색
                      </button>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block mb-1.5 font-medium text-sm">{applyFieldLabel("주소", "address")}</label>
                    <input
                      id="apply-street"
                      name="apply-street"
                      type="text"
                      required
                      autoComplete="street-address"
                      value={formData.address}
                      {...LOCKED_FIELD_INPUT_PROPS}
                      className="w-full border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary"
                      style={{
                        height: '28px',
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        paddingTop: '4px',
                        paddingBottom: '4px',
                        fontSize: '0.75rem',
                        borderRadius: '5px'
                      }}
                      placeholder="우편번호 검색을 클릭하세요"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block mb-1.5 font-medium text-sm">{applyFieldLabel("상세주소", "detailAddress")}</label>
                    <input
                      id="apply-street-extra"
                      name="apply-street-extra"
                      type="text"
                      required
                      autoComplete="address-line2"
                      value={formData.detailAddress}
                      onChange={(e) => onFormDataChange((prev) => ({ ...prev, detailAddress: e.target.value }))}
                      className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                      style={{
                        height: '28px',
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        paddingTop: '4px',
                        paddingBottom: '4px',
                        fontSize: '0.75rem',
                        borderRadius: '5px'
                      }}
                      placeholder="상세주소 (동, 호수 등)"
                    />
                  </div>
                </div>
              </section>
    
              {/* 2. 병역/보훈/장애 */}
              <section className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-display text-lg text-foreground">병역/보훈/장애</h2>
                  <span style={applySectionRequiredMarkerStyle}>(필수)</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1.5 font-medium text-sm">{applyFieldLabel("병역사항", "militaryStatus", { required: true })}</label>
                    <select
                      required
                      value={coerceCommonCodeSelectValue(
                        formData.militaryStatus,
                        codeOptions.militaryStatus,
                        isCodeOptionsLoading,
                      )}
                      onChange={(e) => {
                        const nextStatus = e.target.value;
                        onFormDataChange((prev) => ({
                          ...prev,
                          militaryStatus: nextStatus,
                          militaryStartDate: requiresMilitaryServiceDates(
                            nextStatus,
                            codeOptions.militaryStatus,
                          )
                            ? prev.militaryStartDate
                            : "",
                          militaryEndDate: requiresMilitaryServiceDates(
                            nextStatus,
                            codeOptions.militaryStatus,
                          )
                            ? prev.militaryEndDate
                            : "",
                        }));
                      }}
                      className="w-full focus:outline-none"
                      style={{
                        backgroundColor: "#ffffff",
                        color: "#020618",
                        boxShadow: "rgba(2, 6, 24, 0.12) 0px 0px 0px 1px",
                        height: '28px',
                        paddingTop: "4px",
                        paddingRight: "32px",
                        paddingBottom: "4px",
                        paddingLeft: "12px",
                        fontSize: "0.75rem",
                        fontWeight: 400,
                        borderRadius: "5px",
                        appearance: "none",
                        backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%2390a1b9' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m4 6 4 4 4-4'/%3e%3c/svg%3e\")",
                        backgroundPosition: "right 8px center",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "12px 12px"
                      }}
                      onFocus={(e) => e.target.style.boxShadow = "#2b7fff 0px 0px 0px 2px"}
                      onBlur={(e) => e.target.style.boxShadow = "rgba(2, 6, 24, 0.12) 0px 0px 0px 1px"}
                    >
                      {renderCommonCodeSelectOptions(
                        codeOptions.militaryStatus,
                        isCodeOptionsLoading,
                      )}
                    </select>
                  </div>
    
                  {shouldShowMilitaryServiceDates(
                    formData.militaryStatus,
                    formData.militaryStartDate,
                    formData.militaryEndDate,
                    codeOptions.militaryStatus,
                  ) && (
                    <div className="grid grid-cols-2 gap-2 pl-3 border-l-2 border-primary/30">
                      <div>
                        <label className="block mb-1.5 text-xs font-medium">{applyFieldLabel("복무 시작일", "militaryStartDate", { required: true })}</label>
                        <MonthInput
                          required
                          value={formData.militaryStartDate}
                          onChange={(v) => onFormDataChange((prev) => ({ ...prev, militaryStartDate: v }))}
                          className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                          style={{
                            height: '28px',
                            paddingLeft: '12px',
                            paddingRight: '12px',
                            paddingTop: '4px',
                            paddingBottom: '4px',
                            fontSize: '0.75rem',
                            borderRadius: '5px'
                          }}
                        />
                      </div>
                      <div>
                        <label className="block mb-1.5 text-xs font-medium">
                          {applyFieldLabel(
                            isMilitaryInService(
                              formData.militaryStatus,
                              codeOptions.militaryStatus,
                            )
                              ? "전역 예정일"
                              : "복무 종료일",
                            "militaryEndDate",
                            { required: true },
                          )}
                        </label>
                        <MonthInput
                          required
                          value={formData.militaryEndDate}
                          onChange={(v) => onFormDataChange((prev) => ({ ...prev, militaryEndDate: v }))}
                          className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                          style={{
                            height: '28px',
                            paddingLeft: '12px',
                            paddingRight: '12px',
                            paddingTop: '4px',
                            paddingBottom: '4px',
                            fontSize: '0.75rem',
                            borderRadius: '5px'
                          }}
                        />
                      </div>
                    </div>
                  )}
    
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1.5 font-medium text-sm">{applyFieldLabel("보훈사항", "veteranStatus")}</label>
                      <select
                        value={coerceCommonCodeSelectValue(
                          formData.veteranStatus,
                          codeOptions.veteranStatus,
                          isCodeOptionsLoading,
                        )}
                        onChange={(e) => onFormDataChange((prev) => ({ ...prev, veteranStatus: e.target.value }))}
                        className="w-full focus:outline-none"
                        style={{
                          backgroundColor: "#ffffff",
                          color: "#020618",
                          boxShadow: "rgba(2, 6, 24, 0.12) 0px 0px 0px 1px",
                          height: '28px',
                          paddingTop: "4px",
                          paddingRight: "32px",
                          paddingBottom: "4px",
                          paddingLeft: "12px",
                          fontSize: "0.75rem",
                          fontWeight: 400,
                          borderRadius: "5px",
                          appearance: "none",
                          backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%2390a1b9' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m4 6 4 4 4-4'/%3e%3c/svg%3e\")",
                          backgroundPosition: "right 8px center",
                          backgroundRepeat: "no-repeat",
                          backgroundSize: "12px 12px"
                        }}
                        onFocus={(e) => e.target.style.boxShadow = "#2b7fff 0px 0px 0px 2px"}
                        onBlur={(e) => e.target.style.boxShadow = "rgba(2, 6, 24, 0.12) 0px 0px 0px 1px"}
                      >
                        {renderCommonCodeSelectOptions(
                          codeOptions.veteranStatus,
                          isCodeOptionsLoading,
                          false,
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1.5 font-medium text-sm">{applyFieldLabel("장애사항", "disabilityStatus")}</label>
                      <select
                        value={coerceCommonCodeSelectValue(
                          formData.disabilityStatus,
                          codeOptions.disabilityType,
                          isCodeOptionsLoading,
                        )}
                        onChange={(e) => onFormDataChange((prev) => ({ ...prev, disabilityStatus: e.target.value }))}
                        disabled={isCodeOptionsLoading}
                        className="w-full focus:outline-none"
                        style={{
                          backgroundColor: "#ffffff",
                          color: "#020618",
                          boxShadow: "rgba(2, 6, 24, 0.12) 0px 0px 0px 1px",
                          height: '28px',
                          paddingTop: "4px",
                          paddingRight: "32px",
                          paddingBottom: "4px",
                          paddingLeft: "12px",
                          fontSize: "0.75rem",
                          fontWeight: 400,
                          borderRadius: "5px",
                          appearance: "none",
                          backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%2390a1b9' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m4 6 4 4 4-4'/%3e%3c/svg%3e\")",
                          backgroundPosition: "right 8px center",
                          backgroundRepeat: "no-repeat",
                          backgroundSize: "12px 12px"
                        }}
                        onFocus={(e) => e.target.style.boxShadow = "#2b7fff 0px 0px 0px 2px"}
                        onBlur={(e) => e.target.style.boxShadow = "rgba(2, 6, 24, 0.12) 0px 0px 0px 1px"}
                      >
                        {renderCommonCodeSelectOptions(
                          codeOptions.disabilityType,
                          isCodeOptionsLoading,
                          false,
                        )}
                      </select>
                    </div>
                  </div>
                </div>
              </section>
    
              {/* 3. 학력사항 */}
              <section className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg text-foreground">{applySectionTitle("학력사항", "educationHistory")}</h2>
                    <span style={applySectionRequiredMarkerStyle}>(필수)</span>
                  </div>
                  <button
                    type="button"
                    onClick={onAddEducation}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                    style={{
                      height: '28px',
                      padding: '0 12px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      borderRadius: '5px'
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    학력 추가
                  </button>
                </div>
    
                {formData.educationHistory.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <p className="text-[12px]">학력 추가 버튼을 클릭하여 학력사항을 입력해주세요</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.educationHistory.map((edu, index) => (
                      <div key={index} className="border border-border rounded-lg p-3 bg-muted/20">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-sm">학력 {index + 1}</h3>
                          <button
                            type="button"
                            onClick={() => onRemoveEducation(index)}
                            className="p-1 hover:bg-destructive/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
    
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div>
                            <label className="block mb-1 text-xs font-medium">{applyFieldLabel("학교 구분", "schoolType", { required: true })}</label>
                            <select
                              required
                              value={coerceCommonCodeSelectValue(
                                edu.schoolType,
                                codeOptions.schoolType,
                                isCodeOptionsLoading,
                              )}
                              onChange={(e) => patchEducation(index, "schoolType", e.target.value)}
                              className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                              style={{
                                height: '28px',
                                paddingLeft: '12px',
                                paddingRight: '32px',
                                paddingTop: '4px',
                                paddingBottom: '4px',
                                fontSize: '0.75rem',
                                borderRadius: '5px'
                              }}
                            >
                              {renderCommonCodeSelectOptions(
                                codeOptions.schoolType,
                                isCodeOptionsLoading,
                              )}
                            </select>
                          </div>
                          <div>
                            <label className="block mb-1 text-xs font-medium">{applyFieldLabel("소재지", "location", { required: true })}</label>
                            <select
                              required
                              value={coerceCommonCodeSelectValue(
                                edu.location,
                                codeOptions.educationLocation,
                                isCodeOptionsLoading,
                              )}
                              onChange={(e) => patchEducation(index, "location", e.target.value)}
                              className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                              style={{
                                height: '28px',
                                paddingLeft: '12px',
                                paddingRight: '32px',
                                paddingTop: '4px',
                                paddingBottom: '4px',
                                fontSize: '0.75rem',
                                borderRadius: '5px'
                              }}
                            >
                              {renderCommonCodeSelectOptions(
                                codeOptions.educationLocation,
                                isCodeOptionsLoading,
                              )}
                            </select>
                          </div>
                          <div>
                            <label className="block mb-1 text-xs font-medium">{applyFieldLabel("졸업 여부", "graduationStatus", { required: true })}</label>
                            <select
                              required
                              value={coerceCommonCodeSelectValue(
                                edu.graduationStatus,
                                codeOptions.graduationStatus,
                                isCodeOptionsLoading,
                              )}
                              onChange={(e) => patchEducation(index, "graduationStatus", e.target.value)}
                              className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                              style={{
                                height: '28px',
                                paddingLeft: '12px',
                                paddingRight: '32px',
                                paddingTop: '4px',
                                paddingBottom: '4px',
                                fontSize: '0.75rem',
                                borderRadius: '5px'
                              }}
                            >
                              {renderCommonCodeSelectOptions(
                                codeOptions.graduationStatus,
                                isCodeOptionsLoading,
                              )}
                            </select>
                          </div>
                        </div>
    
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="block mb-1 text-xs font-medium">{applyFieldLabel("학교명", "schoolName", { required: true })}</label>
                            <input
                              type="text"
                              required
                              value={edu.schoolName}
                              onChange={(e) => patchEducation(index, "schoolName", e.target.value)}
                              className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                              style={{
                                height: '28px',
                                paddingLeft: '12px',
                                paddingRight: '12px',
                                paddingTop: '4px',
                                paddingBottom: '4px',
                                fontSize: '0.75rem',
                                borderRadius: '5px'
                              }}
                              placeholder="한국대학교"
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-xs font-medium">{applyFieldLabel("주전공", "major", { required: true })}</label>
                            <input
                              type="text"
                              required
                              value={edu.major}
                              onChange={(e) => patchEducation(index, "major", e.target.value)}
                              className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                              style={{
                                height: '28px',
                                paddingLeft: '12px',
                                paddingRight: '12px',
                                paddingTop: '4px',
                                paddingBottom: '4px',
                                fontSize: '0.75rem',
                                borderRadius: '5px'
                              }}
                              placeholder="컴퓨터공학"
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-xs font-medium">{applyFieldLabel("복수/부전공", "doubleMajor")}</label>
                            <input
                              type="text"
                              value={edu.doubleMajor}
                              onChange={(e) => patchEducation(index, "doubleMajor", e.target.value)}
                              className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                              style={{
                                height: '28px',
                                paddingLeft: '12px',
                                paddingRight: '12px',
                                paddingTop: '4px',
                                paddingBottom: '4px',
                                fontSize: '0.75rem',
                                borderRadius: '5px'
                              }}
                              placeholder="경영학 (선택사항)"
                            />
                          </div>
                          <div className="col-span-2 grid grid-cols-2 gap-2">
                            <div>
                              <label className="block mb-1 text-xs font-medium">{applyFieldLabel("입학연월", "admissionDate", { required: true })}</label>
                              <MonthInput
                                required
                                value={edu.admissionDate}
                                onChange={(v) => patchEducation(index, "admissionDate", v)}
                                className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                                style={{
                                  height: '28px',
                                  paddingLeft: '12px',
                                  paddingRight: '12px',
                                  paddingTop: '4px',
                                  paddingBottom: '4px',
                                  fontSize: '0.75rem',
                                  borderRadius: '5px'
                                }}
                              />
                            </div>
                            <div>
                              <label className="block mb-1 text-xs font-medium">{applyFieldLabel("졸업연월", "graduationDate", { required: true })}</label>
                              <MonthInput
                                required
                                value={edu.graduationDate}
                                onChange={(v) => patchEducation(index, "graduationDate", v)}
                                className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                                style={{
                                  height: '28px',
                                  paddingLeft: '12px',
                                  paddingRight: '12px',
                                  paddingTop: '4px',
                                  paddingBottom: '4px',
                                  fontSize: '0.75rem',
                                  borderRadius: '5px'
                                }}
                              />
                            </div>
                          </div>
                        </div>
    
                        <div className="flex gap-3">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={edu.isTransfer}
                              onChange={(e) => patchEducation(index, "isTransfer", e.target.checked)}
                              className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="text-xs">{applyFieldLabel("편입", "transfer")}</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={edu.isEveningOrOnline}
                              onChange={(e) => patchEducation(index, "isEveningOrOnline", e.target.checked)}
                              className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="text-xs">{applyFieldLabel("야간/원격", "eveningOrOnline")}</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
    
              {/* 4. 경력사항 */}
              <section className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg text-foreground">{applySectionTitle("경력사항", "careerHistory")}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={onAddCareer}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                    style={{
                      height: '28px',
                      padding: '0 12px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      borderRadius: '5px'
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    경력 추가
                  </button>
                </div>
    
                {formData.careerHistory.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <p className="text-[12px]">해당 사항이 없는 경우 입력하지 않으셔도 됩니다.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.careerHistory.map((career, index) => (
                      <div key={index} className="border border-border rounded-lg p-3 bg-muted/20">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-sm">경력 {index + 1}</h3>
                          <button
                            type="button"
                            onClick={() => onRemoveCareer(index)}
                            className="p-1 hover:bg-destructive/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
    
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="block mb-1 text-xs font-medium">{applyFieldLabel("회사명", "company", { required: true })}</label>
                            <input
                              type="text"
                              required
                              value={career.company}
                              onChange={(e) => patchCareer(index, "company", e.target.value)}
                              className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                              style={{
                                height: '28px',
                                paddingLeft: '12px',
                                paddingRight: '12px',
                                paddingTop: '4px',
                                paddingBottom: '4px',
                                fontSize: '0.75rem',
                                borderRadius: '5px'
                              }}
                              placeholder="(주)테크코리아"
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-xs font-medium">{applyFieldLabel("부서", "department")}</label>
                            <input
                              type="text"
                              value={career.department}
                              onChange={(e) => patchCareer(index, "department", e.target.value)}
                              className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                              style={{
                                height: '28px',
                                paddingLeft: '12px',
                                paddingRight: '12px',
                                paddingTop: '4px',
                                paddingBottom: '4px',
                                fontSize: '0.75rem',
                                borderRadius: '5px'
                              }}
                              placeholder="개발팀"
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-xs font-medium">{applyFieldLabel("직위", "position")}</label>
                            <input
                              type="text"
                              value={career.position}
                              onChange={(e) => patchCareer(index, "position", e.target.value)}
                              className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                              style={{
                                height: '28px',
                                paddingLeft: '12px',
                                paddingRight: '12px',
                                paddingTop: '4px',
                                paddingBottom: '4px',
                                fontSize: '0.75rem',
                                borderRadius: '5px'
                              }}
                              placeholder="선임연구원"
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-xs font-medium">{applyFieldLabel("고용형태", "employmentType", { required: true })}</label>
                            <select
                              required
                              value={coerceCommonCodeSelectValue(
                                career.employmentType,
                                codeOptions.employmentType,
                                isCodeOptionsLoading,
                              )}
                              onChange={(e) => patchCareer(index, "employmentType", e.target.value)}
                              className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                              style={{
                                height: '28px',
                                paddingLeft: '12px',
                                paddingRight: '32px',
                                paddingTop: '4px',
                                paddingBottom: '4px',
                                fontSize: '0.75rem',
                                borderRadius: '5px'
                              }}
                            >
                              {renderCommonCodeSelectOptions(
                                codeOptions.employmentType,
                                isCodeOptionsLoading,
                              )}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="block mb-1 text-xs font-medium">{applyFieldLabel("직무", "jobRole", { required: true })}</label>
                            <select
                              required
                              value={coerceCommonCodeSelectValue(
                                career.jobRole,
                                codeOptions.jobRole,
                                isCodeOptionsLoading,
                              )}
                              onChange={(e) => patchCareer(index, "jobRole", e.target.value)}
                              className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                              style={{
                                height: '28px',
                                paddingLeft: '12px',
                                paddingRight: '32px',
                                paddingTop: '4px',
                                paddingBottom: '4px',
                                fontSize: '0.75rem',
                                borderRadius: '5px'
                              }}
                            >
                              {renderCommonCodeSelectOptions(
                                codeOptions.jobRole,
                                isCodeOptionsLoading,
                              )}
                            </select>
                          </div>
                        </div>
    
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="block mb-1 text-xs font-medium">{applyFieldLabel("입사연월", "startDate", { required: true })}</label>
                            <MonthInput
                              required
                              value={career.startDate}
                              onChange={(v) => patchCareer(index, "startDate", v)}
                              className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                              style={{
                                height: '28px',
                                paddingLeft: '12px',
                                paddingRight: '12px',
                                paddingTop: '4px',
                                paddingBottom: '4px',
                                fontSize: '0.75rem',
                                borderRadius: '5px'
                              }}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-xs font-medium">{applyFieldLabel("퇴사연월", "endDate")}</label>
                            <MonthInput
                              value={career.endDate}
                              disabled={career.isCurrent}
                              onChange={(v) => patchCareer(index, "endDate", v)}
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
                            />
                          </div>
                        </div>
    
                        <div className="mb-2">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={career.isCurrent}
                              onChange={(e) => patchCareer(index, "isCurrent", e.target.checked)}
                              className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="text-xs font-medium">{applyFieldLabel("재직중", "current")}</span>
                          </label>
                        </div>
    
                        <div>
                          <label className="block mb-1 text-xs font-medium">{applyFieldLabel("주요 프로젝트 및 담당업무", "projects")}</label>
                          <textarea
                            value={career.projects}
                            onChange={(e) => patchCareer(index, "projects", e.target.value)}
                            rows={3}
                            className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            style={{
                              paddingLeft: '12px',
                              paddingRight: '12px',
                              paddingTop: '8px',
                              paddingBottom: '8px',
                              fontSize: '0.75rem',
                              borderRadius: '5px'
                            }}
                            placeholder="담당하신 주요 프로젝트와 업무 내용을 구체적으로 작성해주세요"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
    
              {/* 5. 자격증, 어학 */}
              <section className="border border-border rounded-lg p-4 bg-card">
                <h2 className="font-display text-lg mb-3 text-foreground">자격증 및 어학</h2>

                <fieldset autoComplete="off" className="min-w-0 border-0 p-0 m-0">
                {/* 자격증 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-medium">{applySectionTitle("자격증", "certificates")}</h3>
                    <button
                      type="button"
                      onClick={onAddCertificate}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                      style={{
                        height: '28px',
                        padding: '0 12px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        borderRadius: '5px'
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      자격증 추가
                    </button>
                  </div>
    
                  {formData.certificates.length === 0 ? (
                    <div className="text-center py-3 text-muted-foreground text-xs">
                      <p>해당 사항이 없는 경우 입력하지 않으셔도 됩니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {formData.certificates.map((cert, index) => (
                        <div key={index} className="border border-border rounded-lg p-2 bg-muted/20 text-[12px]">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-xs">자격증 {index + 1}</h4>
                            <button
                              type="button"
                              onClick={() => onRemoveCertificate(index)}
                              className="p-1 hover:bg-destructive/10 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </button>
                          </div>
    
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label htmlFor={`cert-name-${index}`} className="block mb-1 text-xs">{applyFieldLabel("자격증명", "name", { required: true })}</label>
                              <input
                                id={`cert-name-${index}`}
                                name={`cert-name-${index}`}
                                type="text"
                                required
                                {...BLOCK_BROWSER_AUTOFILL}
                                value={cert.name}
                                onChange={(e) => patchCertificate(index, "name", e.target.value)}
                                className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                                style={{
                                  height: '28px',
                                  paddingLeft: '12px',
                                  paddingRight: '12px',
                                  paddingTop: '4px',
                                  paddingBottom: '4px',
                                  fontSize: '0.75rem',
                                  borderRadius: '5px'
                                }}
                                placeholder="정보처리기사"
                              />
                            </div>
                            <div>
                              <label htmlFor={`cert-issuer-${index}`} className="block mb-1 text-xs">{applyFieldLabel("발급기관", "issuer", { required: true })}</label>
                              <input
                                id={`cert-issuer-${index}`}
                                name={`cert-issuer-${index}`}
                                type="text"
                                required
                                {...BLOCK_BROWSER_AUTOFILL}
                                value={cert.issuer}
                                onChange={(e) => patchCertificate(index, "issuer", e.target.value)}
                                className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                                style={{
                                  height: '28px',
                                  paddingLeft: '12px',
                                  paddingRight: '12px',
                                  paddingTop: '4px',
                                  paddingBottom: '4px',
                                  fontSize: '0.75rem',
                                  borderRadius: '5px'
                                }}
                                placeholder="한국산업인력공단"
                              />
                            </div>
                            <div>
                              <label className="block mb-1 text-xs">{applyFieldLabel("취득일", "dateIssued", { required: true })}</label>
                              <DateInput
                                required
                                min="1000-01-01"
                                max="9999-12-31"
                                value={cert.dateIssued}
                                onChange={(v) => patchCertificate(index, "dateIssued", v)}
                                className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                                style={{
                                  height: '28px',
                                  paddingLeft: '12px',
                                  paddingRight: '12px',
                                  paddingTop: '4px',
                                  paddingBottom: '4px',
                                  fontSize: '0.75rem',
                                  borderRadius: '5px'
                                }}
                              />
                            </div>
                            <div>
                              <label className="block mb-1 text-xs">{applyFieldLabel("자격번호 (선택)", "certificateNumber")}</label>
                              <input
                                type="text"
                                value={cert.certificateNumber}
                                onChange={(e) => patchCertificate(index, "certificateNumber", e.target.value)}
                                className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                                style={{
                                  height: '28px',
                                  paddingLeft: '12px',
                                  paddingRight: '12px',
                                  paddingTop: '4px',
                                  paddingBottom: '4px',
                                  fontSize: '0.75rem',
                                  borderRadius: '5px'
                                }}
                                placeholder="선택사항"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
    
                {/* 어학 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base font-medium">{applySectionTitle("어학", "languages")}</h3>
                    <button
                      type="button"
                      onClick={onAddLanguage}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                      style={{
                        height: '28px',
                        padding: '0 12px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        borderRadius: '5px'
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      어학 추가
                    </button>
                  </div>
    
                  {formData.languages.length === 0 ? (
                    <div className="text-center py-3 text-muted-foreground text-xs">
                      <p>해당 사항이 없는 경우 입력하지 않으셔도 됩니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {formData.languages.map((lang, index) => (
                        <div key={index} className="border border-border rounded-lg p-2 bg-muted/20">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-xs">어학 {index + 1}</h4>
                            <button
                              type="button"
                              onClick={() => onRemoveLanguage(index)}
                              className="p-1 hover:bg-destructive/10 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </button>
                          </div>
    
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label htmlFor={`lang-test-name-${index}`} className="block mb-1 text-xs">{applyFieldLabel("시험명", "testName", { required: true })}</label>
                              <input
                                id={`lang-test-name-${index}`}
                                name={`lang-exam-name-${index}`}
                                type="text"
                                required
                                {...BLOCK_BROWSER_AUTOFILL}
                                value={lang.testName}
                                onChange={(e) => patchLanguage(index, "testName", e.target.value)}
                                className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                                style={{
                                  height: '28px',
                                  paddingLeft: '12px',
                                  paddingRight: '12px',
                                  paddingTop: '4px',
                                  paddingBottom: '4px',
                                  fontSize: '0.75rem',
                                  borderRadius: '5px'
                                }}
                                placeholder="TOEIC, TOEFL, OPIC 등"
                              />
                            </div>
                            <div>
                              <label htmlFor={`lang-score-${index}`} className="block mb-1 text-xs">{applyFieldLabel("점수/등급", "score", { required: true })}</label>
                              <input
                                id={`lang-score-${index}`}
                                name={`lang-score-${index}`}
                                type="text"
                                required
                                {...BLOCK_BROWSER_AUTOFILL}
                                value={lang.score}
                                onChange={(e) => patchLanguage(index, "score", e.target.value)}
                                className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                                style={{
                                  height: '28px',
                                  paddingLeft: '12px',
                                  paddingRight: '12px',
                                  paddingTop: '4px',
                                  paddingBottom: '4px',
                                  fontSize: '0.75rem',
                                  borderRadius: '5px'
                                }}
                                placeholder="900점, IH등급 등"
                              />
                            </div>
                            <div>
                              <label className="block mb-1 text-xs">{applyFieldLabel("취득일", "dateAcquired", { required: true })}</label>
                              <DateInput
                                required
                                min="1000-01-01"
                                max="9999-12-31"
                                value={lang.dateAcquired}
                                onChange={(v) => patchLanguage(index, "dateAcquired", v)}
                                className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                                style={{
                                  height: '28px',
                                  paddingLeft: '12px',
                                  paddingRight: '12px',
                                  paddingTop: '4px',
                                  paddingBottom: '4px',
                                  fontSize: '0.75rem',
                                  borderRadius: '5px'
                                }}
                              />
                            </div>
                            <div>
                              <label className="block mb-1 text-xs">{applyFieldLabel("유효기간 만료일", "expiryDate")}</label>
                              <DateInput
                                min="1000-01-01"
                                max="9999-12-31"
                                value={lang.expiryDate}
                                onChange={(v) => patchLanguage(index, "expiryDate", v)}
                                className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                                style={{
                                  height: '28px',
                                  paddingLeft: '12px',
                                  paddingRight: '12px',
                                  paddingTop: '4px',
                                  paddingBottom: '4px',
                                  fontSize: '0.75rem',
                                  borderRadius: '5px'
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                </fieldset>
              </section>
    
              {/* 6. 사회활동 경험 */}
              <section className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg text-foreground">{applySectionTitle("사회활동 경험", "activities")}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={onAddActivity}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                    style={{
                      height: '28px',
                      padding: '0 12px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      borderRadius: '5px'
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    활동 추가
                  </button>
                </div>
    
                {formData.activities.length === 0 ? (
                  <div className="text-center py-3 text-muted-foreground text-xs">
                    <p>해당 사항이 없는 경우 입력하지 않으셔도 됩니다.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.activities.map((activity, index) => (
                      <div key={index} className="border border-border rounded-lg p-3 bg-muted/20">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-sm">활동 {index + 1}</h3>
                          <button
                            type="button"
                            onClick={() => onRemoveActivity(index)}
                            className="p-1 hover:bg-destructive/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
    
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="block mb-1 text-xs font-medium">{applyFieldLabel("구분", "type", { required: true })}</label>
                            <select
                              required
                              value={coerceCommonCodeSelectValue(
                                activity.type,
                                codeOptions.activityType,
                                isCodeOptionsLoading,
                              )}
                              onChange={(e) => patchActivity(index, "type", e.target.value)}
                              className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                              style={{
                                height: '28px',
                                paddingLeft: '12px',
                                paddingRight: '12px',
                                paddingTop: '4px',
                                paddingBottom: '4px',
                                fontSize: '0.75rem',
                                borderRadius: '5px'
                              }}
                            >
                              {renderCommonCodeSelectOptions(
                                codeOptions.activityType,
                                isCodeOptionsLoading,
                              )}
                            </select>
                          </div>
                          <div>
                            <label className="block mb-1 text-xs font-medium">{applyFieldLabel("활동명", "name", { required: true })}</label>
                            <input
                              type="text"
                              required
                              value={activity.name}
                              onChange={(e) => patchActivity(index, "name", e.target.value)}
                              className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                              style={{
                                height: '28px',
                                paddingLeft: '12px',
                                paddingRight: '12px',
                                paddingTop: '4px',
                                paddingBottom: '4px',
                                fontSize: '0.75rem',
                                borderRadius: '5px'
                              }}
                              placeholder="활동 이름"
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-xs font-medium">{applyFieldLabel("시작연월", "startDate", { required: true })}</label>
                            <MonthInput
                              required
                              value={activity.startDate}
                              onChange={(v) => patchActivity(index, "startDate", v)}
                              className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                              style={{
                                height: '28px',
                                paddingLeft: '12px',
                                paddingRight: '12px',
                                paddingTop: '4px',
                                paddingBottom: '4px',
                                fontSize: '0.75rem',
                                borderRadius: '5px'
                              }}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-xs font-medium">{applyFieldLabel("종료연월", "endDate")}</label>
                            <MonthInput
                              value={activity.endDate}
                              disabled={activity.isOngoing}
                              onChange={(v) => patchActivity(index, "endDate", v)}
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
                            />
                          </div>
                        </div>
    
                        <div className="mb-2">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={activity.isOngoing}
                              onChange={(e) => patchActivity(index, "isOngoing", e.target.checked)}
                              className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="text-xs font-medium">{applyFieldLabel("진행중", "ongoing")}</span>
                          </label>
                        </div>
    
                        <div>
                          <label className="block mb-1 text-xs font-medium">{applyFieldLabel("상세 내용", "description")}</label>
                          <textarea
                            value={activity.description}
                            onChange={(e) => patchActivity(index, "description", e.target.value)}
                            rows={2}
                            className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            style={{
                              padding: '8px 12px',
                              fontSize: '0.75rem',
                              borderRadius: '5px'
                            }}
                            placeholder="활동 내용과 역할을 구체적으로 작성해주세요"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
    
              {/* 7. 자기소개 */}
              <section className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-display text-lg text-foreground">자기소개</h2>
                  <span style={applySectionRequiredMarkerStyle}>(필수)</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 text-xs font-medium">
                      {applyFieldLabel("성장 과정 및 가치관", "background", { required: true })}{" "}
                      <span className="text-xs text-muted-foreground">(1000자 이내)</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      maxLength={1000}
                      value={formData.background}
                      onChange={(e) => onFormDataChange((prev) => ({ ...prev, background: e.target.value }))}
                      className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      style={{
                        padding: '8px 12px',
                        fontSize: '0.75rem',
                        borderRadius: '5px'
                      }}
                      placeholder="본인의 성장 과정과 가치관에 대해 작성해주세요. 어떤 경험이 현재의 당신을 만들었는지, 어떤 가치를 중요하게 생각하는지 등을 구체적으로 작성해주세요."
                    />
                    <div className="text-right text-xs text-muted-foreground mt-1">
                      {formData.background.length} / 1000자
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-medium">
                      {applyFieldLabel("지원 동기 및 입사 후 포부", "motivation", { required: true })}{" "}
                      <span className="text-xs text-muted-foreground">(1000자 이내)</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      maxLength={1000}
                      value={formData.motivation}
                      onChange={(e) => onFormDataChange((prev) => ({ ...prev, motivation: e.target.value }))}
                      className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      style={{
                        padding: '8px 12px',
                        fontSize: '0.75rem',
                        borderRadius: '5px'
                      }}
                      placeholder="지원하게 된 동기와 입사 후 이루고 싶은 목표에 대해 작성해주세요. 우리 회사에 지원한 이유는 무엇이며, 입사 후 어떤 기여를 하고 싶은지 구체적으로 작성해주세요."
                    />
                    <div className="text-right text-xs text-muted-foreground mt-1">
                      {formData.motivation.length} / 1000자
                    </div>
                  </div>
                </div>
              </section>
    
              {/* 8. 포트폴리오 및 경력기술서 */}
              <section className="border border-border rounded-lg p-4 bg-card">
                <h2 className="font-display text-lg mb-3 text-foreground">포트폴리오 및 경력기술서</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 text-xs font-medium">{applyFieldLabel("포트폴리오 URL", "portfolioUrl")}</label>
                    <input
                      type="text"
                      inputMode="url"
                      autoComplete="url"
                      maxLength={PORTFOLIO_URL_MAX_LENGTH}
                      value={formData.portfolioUrl}
                      onChange={(e) => onFormDataChange((prev) => ({ ...prev, portfolioUrl: e.target.value }))}
                      className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                      style={{
                        height: '28px',
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        paddingTop: '4px',
                        paddingBottom: '4px',
                        fontSize: '0.75rem',
                        borderRadius: '5px'
                      }}
                      placeholder="https://github.com/username 또는 https://portfolio.com"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      GitHub, Notion, 개인 홈페이지 등 포트폴리오 URL을 입력해주세요
                    </p>
                    <FormInlineError
                      message={portfolioUrlError}
                      className="mt-2"
                      onDismiss={onDismissPortfolioUrlError}
                    />
                  </div>
    
                  <div>
                    <label className="block mb-1 text-xs font-medium">{applyFieldLabel("파일 첨부", "attachments[PORTFOLIO]")}</label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer">
                      <input
                        type="file"
                        multiple
                        onChange={onPortfolioFileUpload}
                        className="hidden"
                        id="portfolio-upload"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                      />
                      <label htmlFor="portfolio-upload" className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-foreground text-xs font-medium mb-1">포트폴리오, 경력기술서 파일 업로드</p>
                        <p className="text-xs text-muted-foreground">
                          PDF, DOCX, PPTX, ZIP 형식 지원 (최대 10MB)
                        </p>
                      </label>
                    </div>

                    <FormInlineError
                      message={portfolioUploadError}
                      className="mt-2"
                      onDismiss={onDismissPortfolioUploadError}
                    />
    
                    {portfolioFiles.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {portfolioFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                <FileText className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium text-xs">{file.name}</div>
                                <div className="text-xs text-muted-foreground">{file.size}</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => onRemovePortfolioFile(index)}
                              className="p-1 hover:bg-destructive/10 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
    
              {/* 9. 지원 정보 */}
              <section className="border border-border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-display text-lg text-foreground">지원 정보</h2>
                  <span style={applySectionRequiredMarkerStyle}>(필수)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-xs font-medium">{applyFieldLabel("입사 가능일", "availableDate")}</label>
                    <DateInput
                      required
                      min="1000-01-01"
                      max="9999-12-31"
                      value={formData.availableDate}
                      onChange={(v) => onFormDataChange((prev) => ({ ...prev, availableDate: v }))}
                      className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                      style={{
                        height: '28px',
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        paddingTop: '4px',
                        paddingBottom: '4px',
                        fontSize: '0.75rem',
                        borderRadius: '5px'
                      }}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-medium">{applyFieldLabel("희망연봉", "desiredSalary")}</label>
                    <input
                      type="text"
                      required
                      value={formData.desiredSalary}
                      onChange={(e) => onFormDataChange((prev) => ({ ...prev, desiredSalary: e.target.value }))}
                      className="w-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                      style={{
                        height: '28px',
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        paddingTop: '4px',
                        paddingBottom: '4px',
                        fontSize: '0.75rem',
                        borderRadius: '5px'
                      }}
                      placeholder="회사 내규에 따름 또는 연봉 금액"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block mb-1 text-xs font-medium">{applyFieldLabel("채용공고 인지경로", "howDidYouKnow")}</label>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <select
                        required
                        value={coerceCommonCodeSelectValue(
                          formData.howDidYouKnow,
                          codeOptions.howDidYouKnow,
                          isCodeOptionsLoading,
                        )}
                        onChange={(e) => {
                          const next = e.target.value;
                          const isReferral = isReferralHowDidYouKnow(next);
                          onFormDataChange((prev) => ({
                            ...prev,
                            howDidYouKnow: next,
                            ...(isReferral
                              ? {}
                              : { referrerDept: "", referrerName: "" }),
                          }));
                        }}
                        className="focus:outline-none flex-shrink-0"
                        style={{
                          width: "160px",
                          backgroundColor: "#ffffff",
                          color: "#020618",
                          boxShadow: "rgba(2, 6, 24, 0.12) 0px 0px 0px 1px",
                          height: '28px',
                          paddingTop: "4px",
                          paddingRight: "32px",
                          paddingBottom: "4px",
                          paddingLeft: "12px",
                          fontSize: "0.75rem",
                          fontWeight: 400,
                          borderRadius: "5px",
                          appearance: "none",
                          backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%2390a1b9' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m4 6 4 4 4-4'/%3e%3c/svg%3e\")",
                          backgroundPosition: "right 8px center",
                          backgroundRepeat: "no-repeat",
                          backgroundSize: "12px 12px"
                        }}
                        onFocus={(e) => e.target.style.boxShadow = "#2b7fff 0px 0px 0px 2px"}
                        onBlur={(e) => e.target.style.boxShadow = "rgba(2, 6, 24, 0.12) 0px 0px 0px 1px"}
                      >
                        {renderCommonCodeSelectOptions(
                          codeOptions.howDidYouKnow,
                          isCodeOptionsLoading,
                        )}
                      </select>
                      {isReferralHowDidYouKnow(formData.howDidYouKnow) && (
                        <div style={{ display: "flex", gap: "8px", flex: 1 }}>
                          <input
                            type="text"
                            required
                            maxLength={REFERRER_FIELD_MAX_LENGTH}
                            value={formData.referrerDept ?? ""}
                            onChange={(e) =>
                              onFormDataChange((prev) => ({
                                ...prev,
                                referrerDept: e.target.value,
                              }))
                            }
                            placeholder="추천인 부서"
                            className="focus:outline-none"
                            style={{
                              flex: 1,
                              backgroundColor: "#ffffff",
                              color: "#020618",
                              boxShadow: "rgba(2, 6, 24, 0.12) 0px 0px 0px 1px",
                              height: "28px",
                              padding: "4px 12px",
                              fontSize: "0.75rem",
                              fontWeight: 400,
                              borderRadius: "5px",
                            }}
                            onFocus={(e) =>
                              (e.target.style.boxShadow =
                                "#2b7fff 0px 0px 0px 2px")
                            }
                            onBlur={(e) =>
                              (e.target.style.boxShadow =
                                "rgba(2, 6, 24, 0.12) 0px 0px 0px 1px")
                            }
                          />
                          <input
                            type="text"
                            required
                            maxLength={REFERRER_FIELD_MAX_LENGTH}
                            value={formData.referrerName ?? ""}
                            onChange={(e) =>
                              onFormDataChange((prev) => ({
                                ...prev,
                                referrerName: e.target.value,
                              }))
                            }
                            placeholder="추천인 이름"
                            className="focus:outline-none"
                            style={{
                              flex: 1,
                              backgroundColor: "#ffffff",
                              color: "#020618",
                              boxShadow: "rgba(2, 6, 24, 0.12) 0px 0px 0px 1px",
                              height: "28px",
                              padding: "4px 12px",
                              fontSize: "0.75rem",
                              fontWeight: 400,
                              borderRadius: "5px",
                            }}
                            onFocus={(e) =>
                              (e.target.style.boxShadow =
                                "#2b7fff 0px 0px 0px 2px")
                            }
                            onBlur={(e) =>
                              (e.target.style.boxShadow =
                                "rgba(2, 6, 24, 0.12) 0px 0px 0px 1px")
                            }
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
    
              {/* [DEV] PDF 테스트 — 확인 완료 후 비활성화
              {import.meta.env.DEV &&
                onDevFillSample &&
                onDevDownloadPdf && (
                  <div
                    className="flex flex-wrap gap-2 p-3 mb-3 border border-dashed border-amber-300 rounded-lg bg-amber-50/50"
                  >
                    <span className="w-full text-xs font-medium text-amber-900">
                      [DEV] PDF 테스트
                    </span>
                    <button
                      type="button"
                      onClick={onDevFillSample}
                      disabled={
                        isApplicationLoading ||
                        isApplicationSaving ||
                        isApplicationSubmitting ||
                        isDevPdfDownloading
                      }
                      className="border border-amber-300 bg-white hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        height: "28px",
                        padding: "0 12px",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        borderRadius: "5px",
                      }}
                    >
                      샘플 데이터 입력
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDevDownloadPdf()}
                      disabled={
                        isApplicationLoading ||
                        isApplicationSaving ||
                        isApplicationSubmitting ||
                        isDevPdfDownloading
                      }
                      className="border border-amber-300 bg-white hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        height: "28px",
                        padding: "0 12px",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        borderRadius: "5px",
                      }}
                    >
                      {isDevPdfDownloading ? "PDF 생성 중..." : "PDF 다운로드"}
                    </button>
                  </div>
                )}
              */}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onSaveDraft}
                  disabled={
                    isApplicationLoading ||
                    isApplicationSaving ||
                    isApplicationSubmitting
                  }
                  className="flex-1 border border-border hover:bg-muted/50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  style={{
                    height: '28px',
                    padding: '0 12px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    borderRadius: '5px'
                  }}
                >
                  <Save className="w-3.5 h-3.5" />
                  임시저장
                </button>
                <button
                  type="submit"
                  disabled={
                    isApplicationLoading ||
                    isApplicationSaving ||
                    isApplicationSubmitting
                  }
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    height: '28px',
                    padding: '0 12px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    borderRadius: '5px'
                  }}
                >
                  {isApplicationSubmitting ? "제출 중..." : "지원하기"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
  );
}
