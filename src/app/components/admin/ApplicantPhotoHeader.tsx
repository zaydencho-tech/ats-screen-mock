import { useEffect, useState } from "react";
import { resolveApplicantPhotoUrl } from "../../utils/mapper/applicantPhoto";

export interface ApplicantPhotoHeaderProps {
  name: string;
  email?: string;
  phone?: string;
  birthdate?: string;
  photoUrl?: string;
  photoFileDtlId?: number;
}

export { buildApplicantPhotoPlaceholderUrl } from "../../utils/mapper/applicantPhoto";

function useResolvedPhotoUrl(
  name: string,
  photoUrl?: string,
  photoFileDtlId?: number,
) {
  const directPhotoUrl = photoUrl?.trim() ?? "";
  const [resolvedUrl, setResolvedUrl] = useState(directPhotoUrl);

  useEffect(() => {
    if (directPhotoUrl) {
      setResolvedUrl(directPhotoUrl);
      return;
    }

    let cancelled = false;

    void (async () => {
      const url = await resolveApplicantPhotoUrl(
        { name, photoFileDtlId },
        { format: "svg" },
      );
      if (!cancelled) {
        setResolvedUrl(url);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [name, directPhotoUrl, photoFileDtlId]);

  return resolvedUrl;
}

export default function ApplicantPhotoHeader({
  name,
  email,
  phone,
  birthdate,
  photoUrl,
  photoFileDtlId,
}: ApplicantPhotoHeaderProps) {
  const resolvedPhotoUrl = useResolvedPhotoUrl(name, photoUrl, photoFileDtlId);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "16px",
        marginBottom: "14px",
        paddingBottom: "14px",
        borderBottom: "1px solid #F1F5F9",
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <div
          style={{
            width: "72px",
            height: "96px",
            borderRadius: "6px",
            border: "1px solid #E2E8F0",
            backgroundColor: "#F8FAFC",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {resolvedPhotoUrl ? (
            <img
              src={resolvedPhotoUrl}
              alt="증명사진"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : null}
        </div>
        <p
          style={{
            fontSize: "0.6rem",
            color: "#94A3B8",
            textAlign: "center",
            marginTop: "4px",
          }}
        >
          증명사진
        </p>
      </div>
      <div style={{ flex: 1, paddingTop: "4px" }}>
        <div
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: "#020618",
            marginBottom: "6px",
          }}
        >
          {name}
        </div>
        {email ? (
          <div style={{ fontSize: "0.75rem", color: "#64748B", marginBottom: "2px" }}>
            {email}
          </div>
        ) : null}
        {phone ? (
          <div style={{ fontSize: "0.75rem", color: "#64748B", marginBottom: "2px" }}>
            {phone}
          </div>
        ) : null}
        {birthdate ? (
          <div style={{ fontSize: "0.75rem", color: "#64748B" }}>{birthdate}</div>
        ) : null}
      </div>
    </div>
  );
}
