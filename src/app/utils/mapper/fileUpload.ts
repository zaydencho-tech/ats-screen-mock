import type { FileUploadBatchResponse } from "../../api/file";

export interface ParsedFileUploadItem {
  fileGrpId: number;
  fileDtlId: number;
  fileOrgName: string;
}

/** POST /file/upload 응답 data → fileGrpId, fileDtlId */
export function parseFileUploadBatchResponse(
  data: unknown,
): ParsedFileUploadItem | null {
  if (!data || typeof data !== "object") return null;

  const row = data as FileUploadBatchResponse;
  const uploaded = row.uploaded ?? row.files?.[0];
  if (!uploaded || typeof uploaded !== "object") return null;

  const fileGrpId = Number(row.fileGrpId ?? uploaded.fileGrpId);
  const fileDtlId = Number(uploaded.fileDtlId);
  if (!Number.isFinite(fileGrpId) || fileGrpId <= 0) return null;
  if (!Number.isFinite(fileDtlId) || fileDtlId <= 0) return null;

  return {
    fileGrpId,
    fileDtlId,
    fileOrgName:
      typeof uploaded.fileOrgName === "string" ? uploaded.fileOrgName.trim() : "",
  };
}
