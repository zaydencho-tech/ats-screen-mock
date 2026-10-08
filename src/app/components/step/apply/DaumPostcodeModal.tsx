import { useEffect, useRef, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Utils from "../../../utils";
import FormInlineError from "./FormInlineError";
import type { DaumPostcodeResult } from "../../../utils/common/daumPostcode";

export interface DaumPostcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: DaumPostcodeResult) => void;
  /** 다음 검색창 초기 검색어 (QA 주소 자동 검색 등) */
  initialQuery?: string;
}

export default function DaumPostcodeModal({
  isOpen,
  onClose,
  onComplete,
  initialQuery = "",
}: DaumPostcodeModalProps) {
  const embedRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState("");
  const onCompleteRef = useRef(onComplete);
  const onCloseRef = useRef(onClose);

  onCompleteRef.current = onComplete;
  onCloseRef.current = onClose;

  const handleClose = useCallback(() => {
    onCloseRef.current();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    setLoadError("");
    let cancelled = false;
    const element = embedRef.current;
    if (!element) return;

    void Utils.Common.daumPostcode.embedDaumPostcodeSearch(element, {
      query: initialQuery,
      onComplete: (result) => {
        if (cancelled) return;
        onCompleteRef.current(result);
        onCloseRef.current();
      },
    }).catch(() => {
      if (cancelled) return;
      setLoadError(
        "우편번호 서비스를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
      );
    });

    return () => {
      cancelled = true;
      element.replaceChildren();
    };
  }, [isOpen, initialQuery]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="postcode-modal-title"
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(0, 0, 0, 0.5)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#fff",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid var(--border, #e5e7eb)",
          }}
        >
          <h2
            id="postcode-modal-title"
            style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0 }}
          >
            우편번호 검색
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="닫기"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 4,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              borderRadius: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: "12px 16px" }}>
          <FormInlineError message={loadError} />
        </div>
        <div
          ref={embedRef}
          style={{
            width: "100%",
            height: "480px",
          }}
        />
      </div>
    </div>,
    document.body,
  );
}
