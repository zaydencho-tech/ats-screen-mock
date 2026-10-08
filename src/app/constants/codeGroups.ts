/** 공통코드 API: GET code/groups/{grpCd}?corpCd=... */

export const DEFAULT_CODE_CORP_CD = "ALL" as const;

/** 백엔드 grpCd (공통코드 그룹 ID) — 엑셀 공통코드 기준 */
export const CODE_GROUP = {
  /** 템플릿_유형_코드 */
  TMPL_TY: "TMPL_TY_CD",
  /** 발송_채널_코드 */
  SND_CHNL: "SND_CHNL_CD",
  /** 발송_구분_코드 */
  SND_SE: "SND_SE_CD",
  /** 발송_상태_코드 */
  SND_ST: "SND_ST_CD",
  /** 이벤트_유형_코드 */
  EVNT_TY: "EVNT_TY_CD",
  /** 이벤트_상태_코드 */
  EVNT_ST: "EVNT_ST_CD",
  /** 전형_상태_코드 */
  SEL_ST: "SEL_ST_CD",
  /** 생성_주체_유형_코드 */
  CREAT_MBY_TY: "CREAT_MBY_TY_CD",
  /** 레퍼런스_실행_시점 */
  REF_EXEC_TMNG: "REF_EXEC_TMNG",
  /** 지원_구분_코드 */
  SPORT_SE: "SPORT_SE_CD",
  /** 전형_단계_코드 */
  SEL_STEP: "SEL_STEP_CD",
  /** 공고_상태_코드 */
  POST_ST: "POST_ST_CD",
  /** 평가_결과_코드 */
  EVAL_RSLT: "EVAL_RSLT_CD",
  /** 면접_상태_코드 */
  INTV_ST: "INTV_ST_CD",
  /** 면접_상태_상세_코드 */
  INTV_STDT: "INTV_STDT_CD",
  /** 면접_전체_상태_코드 */
  TOTL_INTV_ST: "TOTL_INTV_ST_CD",
  /** 면접_방식_코드 */
  INTV_MTHD: "INTV_MTHD_CD",
  /** 처우_상태_코드 */
  COMP_ST: "COMP_ST_CD",
  /** 처우_전체_상태_코드 */
  TOTL_COMP_ST: "TOTL_COMP_ST_CD",
  /** 처우_완료_상태_코드 */
  COMP_CMPL_ST: "COMP_CMPL_ST_CD",
  /** 처우_직급_코드 */
  COMP_JOB_GRADE: "COMP_JOB_GRADE_CD",
  /** 처우_직책_코드 */
  COMP_POS_GRADE: "COMP_POS_GRADE_CD",
  /** 서류_상태_코드 */
  DOC_ST: "DOC_ST_CD",
  /** 서류_전체_상태_코드 */
  TOTL_DOC_ST: "TOTL_DOC_ST_CD",
  /** 서류_AI_분석_코드 (AgentGO 서류 검토 결과 값 매핑) */
  DOC_AI_ANLY: "DOC_AI_ANLY",
  /** 추천_결과_코드 */
  RECMD_RSLT: "RECMD_RSLT_CD",
  /** 매칭_코드 */
  MTCH: "MTCH_CD",
  /** 병역_유형_코드 */
  MTRSC_TY: "MTRSC_TY_CD",
  /** 보훈_유형_코드 */
  VTRN_TP: "VTRN_TP_CD",
  /** 장애_유형_코드 */
  TROBL_TY: "TROBL_TY_CD",
  /** 지원_경로_코드 */
  SPORT_COURS: "SPORT_COURS_CD",
  /** 직무_코드 */
  JOB: "JOB_CD",
  /** 고용_형태_코드 */
  EMPL_STLE: "EMPL_STLE_CD",
  /** 학교_구분_코드 */
  SCH_TP: "SCH_TP_CD",
  /** 소재지_코드 */
  LOC: "LOC_CD",
  /** 학적_상태_코드 */
  ENRL_ST: "ENRL_ST_CD",
  /** 사회활동구분 */
  ACT: "ACT_CD",
} as const;

export type CodeGroupId = (typeof CODE_GROUP)[keyof typeof CODE_GROUP];

/** grpCd → 한글명 */
export const CODE_GROUP_NAME: Record<CodeGroupId, string> = {
  TMPL_TY_CD: "템플릿_유형_코드",
  SND_CHNL_CD: "발송_채널_코드",
  SND_SE_CD: "발송_구분_코드",
  SND_ST_CD: "발송_상태_코드",
  EVNT_TY_CD: "이벤트_유형_코드",
  EVNT_ST_CD: "이벤트_상태_코드",
  SEL_ST_CD: "전형_상태_코드",
  CREAT_MBY_TY_CD: "생성_주체_유형_코드",
  REF_EXEC_TMNG: "레퍼런스_실행_시점",
  SPORT_SE_CD: "지원_구분_코드",
  SEL_STEP_CD: "전형_단계_코드",
  POST_ST_CD: "공고_상태_코드",
  EVAL_RSLT_CD: "평가_결과_코드",
  INTV_ST_CD: "면접_상태_코드",
  INTV_STDT_CD: "면접_상태_상세_코드",
  TOTL_INTV_ST_CD: "면접_전체_상태_코드",
  INTV_MTHD_CD: "면접_방식_코드",
  COMP_ST_CD: "처우_상태_코드",
  TOTL_COMP_ST_CD: "처우_전체_상태_코드",
  COMP_CMPL_ST_CD: "처우_완료_상태_코드",
  COMP_JOB_GRADE_CD: "처우_직급_코드",
  COMP_POS_GRADE_CD: "처우_직책_코드",
  DOC_ST_CD: "서류_상태_코드",
  TOTL_DOC_ST_CD: "서류_전체_상태_코드",
  DOC_AI_ANLY: "서류_AI_분석_코드",
  RECMD_RSLT_CD: "추천_결과_코드",
  MTCH_CD: "매칭_코드",
  MTRSC_TY_CD: "병역_유형_코드",
  VTRN_TP_CD: "보훈_유형_코드",
  TROBL_TY_CD: "장애_유형_코드",
  SPORT_COURS_CD: "지원_경로_코드",
  JOB_CD: "직무_코드",
  EMPL_STLE_CD: "고용_형태_코드",
  SCH_TP_CD: "학교_구분_코드",
  LOC_CD: "소재지_코드",
  ENRL_ST_CD: "학적_상태_코드",
  ACT_CD: "사회활동구분",
};

export interface CodeItem {
  name: string;
  sortOrder: number;
  value: string;
}

/** grpCd별 사용처 — 변동된 키값에 맞춰 동기화 */
export const CODE_GROUP_USAGE = [
  {
    grpCd: CODE_GROUP.EMPL_STLE,
    description: CODE_GROUP_NAME[CODE_GROUP.EMPL_STLE],
    screen: "JobListings / ApplyForm",
    field: "emplStleCd / careerHistory[].employmentTypeCd (폼: employmentType)",
  },
  {
    grpCd: CODE_GROUP.POST_ST,
    description: CODE_GROUP_NAME[CODE_GROUP.POST_ST],
    screen: "JobListings",
    field: "GET job/public ?status=POST_ST_CD",
  },
  {
    grpCd: CODE_GROUP.MTRSC_TY,
    description: CODE_GROUP_NAME[CODE_GROUP.MTRSC_TY],
    screen: "ApplyForm",
    field: "militaryStatus",
  },
  {
    grpCd: CODE_GROUP.VTRN_TP,
    description: CODE_GROUP_NAME[CODE_GROUP.VTRN_TP],
    screen: "ApplyForm",
    field: "veteranStatus",
  },
  {
    grpCd: CODE_GROUP.TROBL_TY,
    description: CODE_GROUP_NAME[CODE_GROUP.TROBL_TY],
    screen: "ApplyForm",
    field: "disabilityStatus",
  },
  {
    grpCd: CODE_GROUP.SPORT_COURS,
    description: CODE_GROUP_NAME[CODE_GROUP.SPORT_COURS],
    screen: "ApplyForm",
    field: "howDidYouKnow",
  },
  {
    grpCd: CODE_GROUP.JOB,
    description: CODE_GROUP_NAME[CODE_GROUP.JOB],
    screen: "ApplyForm",
    field: "careerHistory[].jobCd (폼: jobRole)",
  },
  {
    grpCd: CODE_GROUP.LOC,
    description: CODE_GROUP_NAME[CODE_GROUP.LOC],
    screen: "ApplyForm",
    field: "educationHistory[].locCd (폼: location)",
  },
  {
    grpCd: CODE_GROUP.ENRL_ST,
    description: CODE_GROUP_NAME[CODE_GROUP.ENRL_ST],
    screen: "ApplyForm",
    field: "educationHistory[].graduationStatusCd (폼: graduationStatus)",
  },
  {
    grpCd: CODE_GROUP.SCH_TP,
    description: CODE_GROUP_NAME[CODE_GROUP.SCH_TP],
    screen: "ApplyForm",
    field: "educationHistory[].schoolTypeCd (폼: schoolType)",
  },
  {
    grpCd: CODE_GROUP.ACT,
    description: CODE_GROUP_NAME[CODE_GROUP.ACT],
    screen: "ApplyForm",
    field: "activities[].actCd (폼: type)",
  },
  {
    grpCd: CODE_GROUP.SEL_STEP,
    description: CODE_GROUP_NAME[CODE_GROUP.SEL_STEP],
    screen: "RecentApplicationsList",
    field: "currentStage / selStepCd",
  },
  {
    grpCd: CODE_GROUP.SEL_ST,
    description: CODE_GROUP_NAME[CODE_GROUP.SEL_ST],
    screen: "RecentApplicationsList",
    field: "currentStatus / selStCd",
  },
] as const;
