import { useEffect, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import API from "../../api";
import type { CompFieldResponse } from "../../api/offers";
import type { OfferPackage } from "../../types/admin/offer";
import { useOfferPackageForm } from "../../hooks/useOfferPackageForm";
import type { CommonCodeOption } from "../../utils/codes/commonCode";
import Utils from "../../utils";
import OfferPackageForm from "./OfferPackageForm";

interface OfferPackageEditorSectionProps {
  compId: string | null;
  initialPackage?: OfferPackage | null;
  saveLabel: string;
  currentRole?: string;
  jobGradeOptions?: CommonCodeOption[];
  posGradeOptions?: CommonCodeOption[];
  isJobGradeOptionsLoading?: boolean;
  activeFields?: CompFieldResponse[];
  isActiveFieldsLoading?: boolean;
  activeFieldsLoadError?: string | null;
  onSaved: () => void | Promise<void>;
}

export default function OfferPackageEditorSection({
  compId,
  initialPackage,
  saveLabel,
  currentRole,
  jobGradeOptions = [],
  posGradeOptions = [],
  isJobGradeOptionsLoading = false,
  activeFields = [],
  isActiveFieldsLoading = false,
  activeFieldsLoadError = null,
  onSaved,
}: OfferPackageEditorSectionProps) {
  const [isSaving, setIsSaving] = useState(false);
  const {
    values,
    patchValues,
    applyFromPackage,
    buildSaveRequest,
  } = useOfferPackageForm();

  useEffect(() => {
    if (initialPackage) {
      applyFromPackage(initialPackage);
    }
  }, [initialPackage, applyFromPackage]);

  const selectedJobGradeName = useMemo(() => {
    return Utils.Mapper.offerAdmin.resolveOfferJobGradeLabel(
      values.jobGradeCd,
      jobGradeOptions,
      initialPackage?.jobGradeCd === values.jobGradeCd
        ? initialPackage?.jobGradeName
        : undefined,
    );
  }, [values.jobGradeCd, jobGradeOptions, initialPackage]);

  const selectedPosGradeName = useMemo(() => {
    return Utils.Mapper.offerAdmin.resolveOfferJobGradeLabel(
      values.posGrade,
      posGradeOptions,
      initialPackage?.posGrade === values.posGrade
        ? initialPackage?.posGradeName
        : undefined,
    );
  }, [values.posGrade, posGradeOptions, initialPackage]);

  // 처우 항목 저장 (OFR-02b) — 메일 발송 없음
  const handleSave = async () => {
    if (!compId || isSaving) return;

    if (isActiveFieldsLoading) {
      Utils.Api.response.showAppError(
        "처우 항목 설정을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.",
      );
      return;
    }

    if (activeFieldsLoadError) {
      Utils.Api.response.showAppError(activeFieldsLoadError);
      return;
    }

    const validationError =
      Utils.Mapper.offerAdmin.validateOfferPackageRequiredFields(
        activeFields,
        values,
      );
    if (validationError) {
      Utils.Api.response.showAppError(validationError);
      return;
    }

    const body = buildSaveRequest(activeFields);

    setIsSaving(true);

    try {
      const res = await API.Offers.SaveOfferPackage(
        compId,
        body,
        currentRole ?? undefined,
      );
      if (!Utils.Api.response.isApiSuccess(res.data)) {
        Utils.Api.response.showApiError(res.data);
        return;
      }
      await Promise.resolve(onSaved());
    } catch {
      // HTTP 4xx/5xx — axios 인터셉터에서 서버 메시지 토스트 처리
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="ats-offer-editor border-t border-border pt-4 space-y-3">
      <h3 className="text-xs font-medium text-foreground">처우 제안 작성</h3>
      <OfferPackageForm
        compact
        columns={4}
        values={values}
        jobGradeOptions={jobGradeOptions}
        posGradeOptions={posGradeOptions}
        isJobGradeOptionsLoading={isJobGradeOptionsLoading}
        selectedJobGradeName={selectedJobGradeName}
        selectedPosGradeName={selectedPosGradeName}
        activeFields={activeFields}
        onChange={patchValues}
      />
      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={isSaving}
        style={{
          width: "100%",
          height: "30px",
          padding: "0 12px",
          fontSize: "0.75rem",
          fontWeight: 500,
          borderRadius: "6px",
          backgroundColor: isSaving ? "#93C5FD" : "#3182F6",
          color: "#FFF",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "5px",
          cursor: isSaving ? "not-allowed" : "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          if (!isSaving) e.currentTarget.style.backgroundColor = "#1D6FE8";
        }}
        onMouseLeave={(e) => {
          if (!isSaving) e.currentTarget.style.backgroundColor = "#3182F6";
        }}
      >
        {isSaving ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Check className="w-3.5 h-3.5" />
        )}
        {isSaving ? "저장 중..." : saveLabel}
      </button>
    </div>
  );
}
