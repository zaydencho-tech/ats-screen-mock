import AxiosInstance from "../axiosInstance";
import type { DataResult } from "../types/dataResult";

// ==========================================
// 1. 타입 정의 (Interfaces)
// ==========================================

export type TemplateType = "BENEFITS" | "NOTICE";

/** [GET /template] 개별 템플릿 아이템 정보 */
export interface TemplateLoadItem {
  tmplId: number;
  title: string;
  content: string;
  displayOrder: number;
  isDefault: boolean;
}

/** [GET /template] 응답 데이터 */
export interface TemplateLoadResponse {
  tmplTy: TemplateType;
  items: TemplateLoadItem[];
}

/** [GET /template] 쿼리 파라미터 */
export interface TemplateLoadParams {
  /** 법인 ID */
  corpId: number;
  /** BENEFITS: 복리후생, NOTICE: 유의사항 */
  tmplTy: TemplateType;
}

/** 법인별 템플릿 상세 설정 아이템 (조회/저장 공통) */
export interface TemplateSettingsItem {
  /** 신규 추가 시 null */
  tmplId: number | null;
  title: string;
  content: string;
  displayOrder: number;
  isDefault: boolean;
  enabled: boolean;
}

/** [GET/PUT /template/settings] 템플릿 설정 데이터 구조 */
export interface TemplateSettingsResponse {
  benefitsTemplates: TemplateSettingsItem[];
  noticeTemplates: TemplateSettingsItem[];
}

/** [PUT /template/settings] 요청 바디 */
export interface TemplateSettingsSaveRequest {
  corpId: number;
  benefitsTemplates: TemplateSettingsItem[];
  noticeTemplates: TemplateSettingsItem[];
}

// ==========================================
// 2. API 요청 함수 (Services)
// ==========================================

/**
 * 활성 역할 헤더 생성 (복수 역할 보유 시 전송)
 * @param activeRole ROLE_HR, ROLE_ADMIN 등
 */
const getHeaders = (activeRole?: string) => {
  return activeRole ? { "X-Active-Role": activeRole } : undefined;
};

/**
 * GET /api/v1/template — 채용공고 템플릿 불러오기
 * 복리후생·유의사항 영역 '템플릿 불러오기'용 (사용 중인 템플릿만 displayOrder 순 정렬)
 */
const GetTemplatesForLoad = (
  params: TemplateLoadParams,
  activeRole?: string,
) => {
  return AxiosInstance.get<DataResult<TemplateLoadResponse>>("template", {
    params,
    headers: getHeaders(activeRole),
    withCredentials: true,
  });
};

/**
 * GET /api/v1/template/settings — 법인별 템플릿 설정 조회 (ROLE_HR)
 */
const GetTemplateSettings = (corpId: number, activeRole?: string) => {
  return AxiosInstance.get<DataResult<TemplateSettingsResponse>>(
    "template/settings",
    {
      params: { corpId },
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

/**
 * PUT /api/v1/template/settings — 법인별 템플릿 설정 저장 (ROLE_HR)
 */
const SaveTemplateSettings = (
  data: TemplateSettingsSaveRequest,
  activeRole?: string,
) => {
  return AxiosInstance.put<DataResult<TemplateSettingsResponse>>(
    "template/settings",
    data,
    {
      headers: getHeaders(activeRole),
      withCredentials: true,
    },
  );
};

const Template = {
  GetTemplatesForLoad,
  GetTemplateSettings,
  SaveTemplateSettings,
};

export default Template;
