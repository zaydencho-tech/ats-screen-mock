import API from "../../api";
import Utils from "../index";

export function triggerBlobDownload(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

/** Signed URL 조회 — GET /file/{fileDtlId} */
export async function fetchFileDownloadUrl(
  fileDtlId: number | string,
): Promise<string | null> {
  const res = await API.File.GetFileDetail(fileDtlId);
  if (!Utils.Api.response.isApiSuccess(res.data)) return null;

  const detail = Utils.Api.response.extractResponseData(res.data);
  const downloadUrl = detail?.downloadUrl?.trim();
  return downloadUrl || null;
}

/** 바이트 스트림 다운로드 — GET /file/{fileDtlId}/download */
export async function downloadFileStream(
  fileDtlId: number | string,
  fileName: string,
): Promise<void> {
  const res = await API.File.DownloadFileStream(fileDtlId);
  triggerBlobDownload(res.data, fileName);
}
