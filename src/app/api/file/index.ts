import AxiosInstance from "../axiosInstance";
import type { DataResult } from "../types/dataResult";

/** 공통 파일 상세 정보 (상세 조회, 그룹 조회) */
export interface FileDetailDto {
  fileDtlId: number;
  fileGrpId: number;
  fileSe: string;
  fileOrgName: string;
  fileExtn: string;
  fileMg: number;
  dispOrdr: number;
  /** GCS Signed URL (기본 15분 유효) */
  downloadUrl: string;
}

/** POST /file/upload — 업로드된 개별 파일 */
export interface FileItemDto {
  fileDtlId: number;
  fileGrpId: number;
  fileSe: string;
  fileOrgName: string;
  fileExtn: string;
  fileMg: number;
  dispOrdr: number;
  downloadUrl: string;
}

export type FileUploadPurpose =
  | "RESUME"
  | "PORTFOLIO"
  | "ATTACHMENT"
  | "REFERENCE"
  | "JOB_PROPOSAL";

/** POST /file/upload — 응답 data */
export interface FileUploadBatchResponse {
  fileGrpId: number;
  uploaded: FileItemDto;
  files: FileItemDto[];
}

export interface FileUploadParams {
  purpose: FileUploadPurpose;
  fileGrpId?: number;
  namespace?: string;
  ownerId?: string;
}

/** 파일 업로드 정책 */
export interface FilePolicyDto {
  allowedExtensions: string[];
  maxFileSizeByte: number;
  maxFileCount: number;
}

/** GET /api/v1/file/{fileDtlId} — 파일 상세 조회 (Signed URL 포함) */
const GetFileDetail = (fileDtlId: string | number) => {
  return AxiosInstance.get<DataResult<FileDetailDto>>(`file/${fileDtlId}`, {
    withCredentials: true,
  });
};

/** DELETE /api/v1/file/{fileDtlId} — 파일 삭제 */
const DeleteFile = (fileDtlId: string | number) => {
  return AxiosInstance.delete<DataResult<void>>(`file/${fileDtlId}`, {
    withCredentials: true,
  });
};

/** GET /api/v1/file/{fileDtlId}/download — 파일 바이트 스트림 다운로드 */
const DownloadFileStream = (
  fileDtlId: string | number,
  options?: { skipGlobalErrorHandler?: boolean },
) => {
  return AxiosInstance.get<Blob>(`file/${fileDtlId}/download`, {
    responseType: "blob",
    withCredentials: true,
    skipGlobalErrorHandler: options?.skipGlobalErrorHandler,
  });
};

/** GET /api/v1/file/{fileGrpId} — 파일 그룹 조회 */
const GetFileGroup = (fileGrpId: string | number) => {
  return AxiosInstance.get<DataResult<FileDetailDto[]>>(`file/${fileGrpId}`, {
    withCredentials: true,
  });
};

/** GET /api/v1/file/policies — 업로드 정책 조회 */
const GetFilePolicies = () => {
  return AxiosInstance.get<DataResult<FilePolicyDto>>("file/policies", {
    withCredentials: true,
  });
};

/** POST /api/v1/file/upload — Multipart 파일 업로드 (purpose 쿼리 필수) */
const UploadFile = (file: File, params: FileUploadParams) => {
  const formData = new FormData();
  formData.append("file", file);

  return AxiosInstance.post<DataResult<FileUploadBatchResponse>>(
    "file/upload",
    formData,
    {
      params: {
        purpose: params.purpose,
        ...(params.fileGrpId != null ? { fileGrpId: params.fileGrpId } : {}),
        ...(params.namespace ? { namespace: params.namespace } : {}),
        ...(params.ownerId ? { ownerId: params.ownerId } : {}),
      },
      withCredentials: true,
    },
  );
};

const File = {
  GetFileDetail,
  DeleteFile,
  DownloadFileStream,
  GetFileGroup,
  GetFilePolicies,
  UploadFile,
};

export default File;
