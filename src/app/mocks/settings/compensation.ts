import type { CompensationField } from "../../components/tab/types";

/** 설정 > 처우항목 탭 임시 데이터 */
export const DEFAULT_COMPENSATION_FIELDS: Record<string, CompensationField[]> =
  {
    global: [
      { id: "1", name: "연봉", type: "number", required: true },
      {
        id: "2",
        name: "직급",
        type: "select",
        options: ["사원", "주임", "대리", "과장", "차장", "부장"],
        required: true,
      },
      { id: "3", name: "입사일", type: "text", required: true },
      {
        id: "4",
        name: "근무지",
        type: "select",
        options: ["본사", "지사", "재택"],
        required: false,
      },
    ],
    ntech: [
      { id: "1", name: "연봉", type: "number", required: true },
      {
        id: "2",
        name: "직급",
        type: "select",
        options: ["사원", "주임", "대리", "과장", "차장", "부장"],
        required: true,
      },
      { id: "3", name: "입사일", type: "text", required: true },
    ],
    cloit: [
      { id: "1", name: "연봉", type: "number", required: true },
      {
        id: "2",
        name: "직급",
        type: "select",
        options: ["사원", "대리", "과장", "부장"],
        required: true,
      },
      { id: "3", name: "입사일", type: "text", required: true },
    ],
    core: [
      { id: "1", name: "연봉", type: "number", required: true },
      { id: "2", name: "입사일", type: "text", required: true },
    ],
  };
