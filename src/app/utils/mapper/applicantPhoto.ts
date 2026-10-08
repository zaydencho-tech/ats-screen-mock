import API from "../../api";
import { isApiSuccess } from "../api/response";

function pickRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickString(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export interface ApplicantPhotoRef {
  photoUrl?: string;
  photoFileDtlId?: number;
}

export interface ResolveApplicantPhotoUrlInput {
  name: string;
  photoUrl?: string;
  photoFileDtlId?: number;
  attachments?: unknown;
}

/** PDF·화면 증명사진 placeholder 배경 (ApplicantPhotoHeader / photoBox 와 동일) */
export const APPLICANT_PHOTO_PLACEHOLDER_BG = "#F8FAFC";

/** 화면용 DiceBear SVG (pub v2) */
export function buildApplicantPhotoPlaceholderUrl(name: string): string {
  return "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2296%22%20height%3D%22112%22%20viewBox%3D%220%200%2096%20112%22%3E%3Crect%20width%3D%2296%22%20height%3D%22112%22%20rx%3D%228%22%20fill%3D%22%23edf2f7%22%2F%3E%3Ccircle%20cx%3D%2248%22%20cy%3D%2239%22%20r%3D%2218%22%20fill%3D%22%23a7b7c9%22%2F%3E%3Cpath%20d%3D%22M16%20104v-8a32%2032%200%200%201%2064%200v8%22%20fill%3D%22%23a7b7c9%22%2F%3E%3C%2Fsvg%3E";
}

/** PDF용 DiceBear PNG — @react-pdf/renderer Image 호환, 배경색 포함 */
export function buildApplicantPhotoPlaceholderPngUrl(name: string): string {
  const seed = encodeURIComponent(name.trim() || "applicant");
  const bg = APPLICANT_PHOTO_PLACEHOLDER_BG.replace("#", "");
  return "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2296%22%20height%3D%22112%22%20viewBox%3D%220%200%2096%20112%22%3E%3Crect%20width%3D%2296%22%20height%3D%22112%22%20rx%3D%228%22%20fill%3D%22%23edf2f7%22%2F%3E%3Ccircle%20cx%3D%2248%22%20cy%3D%2239%22%20r%3D%2218%22%20fill%3D%22%23a7b7c9%22%2F%3E%3Cpath%20d%3D%22M16%20104v-8a32%2032%200%200%201%2064%200v8%22%20fill%3D%22%23a7b7c9%22%2F%3E%3C%2Fsvg%3E";
}

/** attachments / profilePhoto 에서 증명사진 카테고리 여부 */
export function isProfilePhotoCategory(category: string): boolean {
  const normalized = category.trim().toUpperCase();
  return normalized === "PROFILE_PHOTO" || normalized === "PHOTO";
}

function pickPhotoFromFileRow(row: Record<string, unknown>): ApplicantPhotoRef {
  const url = pickString(row, "downloadUrl", "fileUrl", "url");
  const fileDtlIdRaw = row.fileDtlId;
  const fileDtlId =
    typeof fileDtlIdRaw === "number"
      ? fileDtlIdRaw
      : typeof fileDtlIdRaw === "string" && fileDtlIdRaw.trim()
        ? Number(fileDtlIdRaw)
        : NaN;

  if (!url && (!Number.isFinite(fileDtlId) || fileDtlId <= 0)) {
    return {};
  }

  return {
    photoUrl: url || undefined,
    photoFileDtlId:
      Number.isFinite(fileDtlId) && fileDtlId > 0 ? fileDtlId : undefined,
  };
}

/** applicationForm.profilePhoto 필드 우선, 없으면 attachments fallback */
export function pickPhotoFromApplicationForm(raw: unknown): ApplicantPhotoRef {
  const row = pickRecord(raw);
  if (!row) return {};

  const profilePhoto = pickRecord(row.profilePhoto);
  if (profilePhoto) {
    const fromProfilePhoto = pickPhotoFromFileRow(profilePhoto);
    if (fromProfilePhoto.photoUrl || fromProfilePhoto.photoFileDtlId) {
      return fromProfilePhoto;
    }
  }

  return pickPhotoFromAttachments(row.attachments);
}

/** attachments 배열에서 PROFILE_PHOTO / PHOTO 카테고리 증명사진 추출 */
export function pickPhotoFromAttachments(raw: unknown): ApplicantPhotoRef {
  if (!Array.isArray(raw)) return {};

  for (const item of raw) {
    const row = pickRecord(item);
    if (!row) continue;

    const category = pickString(row, "category", "fileCategory");
    if (!isProfilePhotoCategory(category)) continue;

    const ref = pickPhotoFromFileRow(row);
    if (ref.photoUrl || ref.photoFileDtlId) {
      return ref;
    }
  }

  return {};
}

/** 실제 사진 URL 조회 — 없으면 DiceBear PNG placeholder */
export async function resolveApplicantPhotoUrl(
  input: ResolveApplicantPhotoUrlInput,
  options?: { format?: "svg" | "png" },
): Promise<string> {
  const name = input.name.trim() || "applicant";
  const format = options?.format ?? "png";
  const placeholder =
    format === "svg"
      ? buildApplicantPhotoPlaceholderUrl(name)
      : buildApplicantPhotoPlaceholderPngUrl(name);

  if (input.photoUrl?.trim()) {
    return input.photoUrl.trim();
  }

  const fromAttachments = pickPhotoFromAttachments(input.attachments);
  if (fromAttachments.photoUrl?.trim()) {
    return fromAttachments.photoUrl.trim();
  }

  const fileDtlId = input.photoFileDtlId ?? fromAttachments.photoFileDtlId;
  if (fileDtlId) {
    try {
      const res = await API.File.GetFileDetail(fileDtlId);
      if (isApiSuccess(res.data)) {
        const url = res.data.data?.downloadUrl?.trim();
        if (url) return url;
      }
    } catch {
      // placeholder fallback
    }
  }

  return placeholder;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function fetchRemoteImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) return null;

    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
}

/** img + canvas — GCS signed URL 등 브라우저에서 보이는 이미지를 data URL로 변환 */
async function loadImageViaCanvas(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth > 0 ? img.naturalWidth : 1;
        canvas.height = img.naturalHeight > 0 ? img.naturalHeight : 1;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        // SVG/PNG 투명 영역 → JPEG 변환 시 검게 나오므로 화면 placeholder 배경과 동일하게 채움
        ctx.fillStyle = APPLICANT_PHOTO_PLACEHOLDER_BG;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** signed URL → PDF embed용 data URL (CORS 대비 canvas → fetch) */
async function embedSignedUrlAsDataUrl(url: string): Promise<string | null> {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:")) return trimmed;

  const fromCanvas = await loadImageViaCanvas(trimmed);
  if (fromCanvas) return fromCanvas;

  return fetchRemoteImageAsDataUrl(trimmed);
}

async function fetchFileBlobAsDataUrl(fileDtlId: number): Promise<string | null> {
  try {
    const res = await API.File.DownloadFileStream(fileDtlId, {
      skipGlobalErrorHandler: true,
    });
    if (!res.data || res.data.size === 0) return null;

    return await blobToDataUrl(res.data);
  } catch {
    return null;
  }
}

/** GET /file/{fileDtlId} — 만료 가능한 캐시 URL 대신 새 signed URL 발급 */
async function fetchFreshSignedDownloadUrl(
  fileDtlId: number,
): Promise<string | null> {
  try {
    const res = await API.File.GetFileDetail(fileDtlId);
    if (!isApiSuccess(res.data)) return null;
    const url = res.data.data?.downloadUrl?.trim();
    return url || null;
  } catch {
    return null;
  }
}

function resolvePhotoFileDtlIdForPdf(
  input: ResolveApplicantPhotoUrlInput & { photoFormSource?: unknown },
): number | undefined {
  const fromForm = input.photoFormSource
    ? pickPhotoFromApplicationForm(input.photoFormSource)
    : {};
  const fromAttachments = pickPhotoFromAttachments(input.attachments);

  return (
    input.photoFileDtlId ??
    fromForm.photoFileDtlId ??
    fromAttachments.photoFileDtlId
  );
}

/**
 * @react-pdf/renderer Image용 data URL.
 * 지원서에 실려 온 downloadUrl은 만료될 수 있어 쓰지 않고,
 * fileDtlId로 새 signed URL을 받은 뒤 data URL로 변환합니다.
 */
export async function resolveApplicantPhotoDataUrlForPdf(
  input: ResolveApplicantPhotoUrlInput & { photoFormSource?: unknown },
): Promise<string> {
  const name = input.name.trim() || "applicant";
  const placeholder = buildApplicantPhotoPlaceholderPngUrl(name);
  const fileDtlId = resolvePhotoFileDtlIdForPdf(input);

  if (fileDtlId) {
    const freshUrl = await fetchFreshSignedDownloadUrl(fileDtlId);
    if (freshUrl) {
      const embedded = await embedSignedUrlAsDataUrl(freshUrl);
      if (embedded) return embedded;
    }

    // signed URL 변환 실패 시 서버 스트림 fallback
    const fromStream = await fetchFileBlobAsDataUrl(fileDtlId);
    if (fromStream) return fromStream;
  }

  // data: 로 이미 넘어준 경우만 예외적으로 허용 (파일 ID 없는 로컬 미리보기)
  const inlineDataUrl = input.photoUrl?.trim();
  if (inlineDataUrl?.startsWith("data:")) {
    return inlineDataUrl;
  }

  return (await embedSignedUrlAsDataUrl(placeholder)) ?? placeholder;
}
