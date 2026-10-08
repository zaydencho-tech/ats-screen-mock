import type { CommonCodeOption } from "./commonCode";

/** 입사지원서 select — grpCd별 옵션 묶음 */
export interface ApplyFormCodeOptions {
  militaryStatus: CommonCodeOption[];
  veteranStatus: CommonCodeOption[];
  disabilityType: CommonCodeOption[];
  schoolType: CommonCodeOption[];
  educationLocation: CommonCodeOption[];
  graduationStatus: CommonCodeOption[];
  employmentType: CommonCodeOption[];
  jobRole: CommonCodeOption[];
  activityType: CommonCodeOption[];
  howDidYouKnow: CommonCodeOption[];
}

export const EMPTY_APPLY_FORM_CODE_OPTIONS: ApplyFormCodeOptions = {
  militaryStatus: [],
  veteranStatus: [],
  disabilityType: [],
  schoolType: [],
  educationLocation: [],
  graduationStatus: [],
  employmentType: [],
  jobRole: [],
  activityType: [],
  howDidYouKnow: [],
};
