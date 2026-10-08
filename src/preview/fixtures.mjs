// Explicit offline API contracts for the original ATS screens. All people and records are synthetic.
// Unknown methods/paths return 501; they never fall through to a network adapter.
export const corps = [
  { corpId: 1, corpCd: 'GLOBAL', corpName: '아이티센글로벌', isActive: 1 },
  { corpId: 2, corpCd: 'CLOIT', corpName: '아이티센클로잇', isActive: 1 },
];
export const roles = [
  { roleId: 1, value: 'ROLE_ADMIN', name: '시스템 관리자', description: '전체 채용 업무' },
  { roleId: 2, value: 'ROLE_HR', name: '채용 담당자', description: '담당 법인 채용 업무' },
  { roleId: 3, value: 'ROLE_INTERVIEWER', name: '평가자', description: '서류와 면접 평가' },
];
export const profile = { memberId: 1, email: 'recruiter@preview.example.test', name: '김채용', department: '인재영입팀', corp: corps[0], corpCd: corps[0].corpCd, corpName: corps[0].corpName, roles: roles.map(r => ({ roleCd: r.value, roleName: r.name, managedCorps: corps })), roleCodes: roles.map(r => r.value), admin: true, hr: true, interviewer: true };
export const jobs = [
  { jobPostId: 11, posTitle: '클라우드 플랫폼 백엔드 개발자', corpId: 1, corpName: corps[0].corpName, corp: corps[0], workPlace: '서울 강남구', techStacks: ['Java', 'Spring Boot', 'Kubernetes'], sportSeCd: 'CAREER', sportSeName: '경력', emplStleCd: 'REGULAR', emplStleName: '정규직', minCareerYear: 3, maxCareerYear: 8 },
  { jobPostId: 12, posTitle: '프런트엔드 개발자', corpId: 2, corpName: corps[1].corpName, corp: corps[1], workPlace: '서울 서초구', techStacks: ['React', 'TypeScript'], sportSeCd: 'CAREER', sportSeName: '경력', emplStleCd: 'REGULAR', emplStleName: '정규직', minCareerYear: 2, maxCareerYear: 5 },
  { jobPostId: 13, posTitle: '데이터 엔지니어', corpId: 1, corpName: corps[0].corpName, corp: corps[0], workPlace: '서울 강남구', techStacks: ['Python', 'SQL'], sportSeCd: 'NEW', sportSeName: '신입', emplStleCd: 'REGULAR', emplStleName: '정규직', minCareerYear: 0, maxCareerYear: 0 },
].map((job, index) => ({ ...job, active: true, status: 'ACTIVE', ntcNtceStrtDt: '2026-09-01', ntcNtceEndDt: '2026-12-31', jobDtl: '<p>안정적인 서비스와 개발 경험을 함께 만들어 갈 동료를 찾습니다.</p><ul><li>서비스 API 설계 및 개발</li><li>운영 품질 개선과 팀 협업</li></ul>', needAbility: '<p>주요 기술을 활용한 서비스 개발 경험과 문제 해결 역량</p>', pvltrtMatter: '<p>클라우드 환경에서 서비스를 운영한 경험</p>', wlfare: '<p>유연근무, 교육비 지원, 건강검진, 복지포인트</p>', etc: '<p>본 채용 공고는 ATS Mock 화면 검토를 위한 예시 데이터입니다.</p>', selectionSteps: [{ selStepOrdr: 1, selStepName: '서류전형' }, { selStepOrdr: 2, selStepName: '1차면접' }, { selStepOrdr: 3, selStepName: '2차면접' }, { selStepOrdr: 4, selStepName: '처우협의' }], applicantCounts: { total: 4 + index, document: 2, firstInterview: 1, secondInterview: 0, offer: 1 }, description: '서비스의 다음 성장을 함께 만들 인재를 모집합니다.', mainTasks: ['서비스 API 설계 및 개발', '운영 품질 개선'], requirements: ['서비스 개발 경험', '적극적인 커뮤니케이션'], preferred: ['클라우드 운영 경험'], benefits: ['유연근무', '교육비 지원'], notes: '면접 일정은 개별 안내합니다.', processNotificationEnabled: true, fileGrpId: 0, screeningReviewers: [{ memberId: 1, name: '김채용', company: corps[0].corpName, department: '인재영입팀' }], firstInterviewers: [{ memberId: 2, name: '박평가', company: corps[0].corpName, department: '플랫폼개발팀' }], secondInterviewers: [], createdAt: '2026-09-01 09:00:00', updatedAt: '2026-09-28 15:00:00' }));
export const applicants = ['이지원', '김도윤', '박서연', '정하준'].map((name, index) => ({ aplctId: 101 + index, aplctDocId: 201 + index, aplctIntvId: 301 + index, compId: 401 + index, name, email: `candidate${index + 1}@preview.example.test`, phone: '010-0000-0000', jobPostId: 11, jobTitle: jobs[0].posTitle, position: jobs[0].posTitle, jobCorpId: 1, corpId: 1, corpCd: 'GLOBAL', corpName: corps[0].corpName, appliedAt: `2026-09-${24 + index} 10:30:00`, appliedDate: `2026-09-${24 + index}`, statusChangedAt: '2026-09-28 14:00:00', currentStageCd: ['DOC', '1ST_INTV', '2ND_INTV', 'COMP'][index], currentStageName: ['서류전형', '1차면접', '2차면접', '처우협의'][index], currentStatusCd: 'PROGRESS', currentStatusName: '진행중', statusCd: 'PROGRESS', statusName: '진행중', finalDecisionCd: '', finalDecisionName: '', completedEvalCount: index % 2, totalReviewerCount: 2, totalInterviewerCount: 2, roundCd: '1ST_INTV', roundName: '1차면접', scheduleStatusCd: index % 2 ? 'TBD' : 'SCHEDULE', scheduleStatusName: index % 2 ? '미정' : '예정', interviewScore: 88, sendCount: 0, sentDate: null, responseDeadline: '2026-10-12' }));
const review = { reviewerId: '1', reviewerName: '김채용', department: '인재영입팀', decisionCd: 'PASS', decisionName: '합격', comment: '직무 경험과 협업 역량이 포지션에 부합합니다.', statusCd: 'submitted', statusName: '제출 완료', updatedAt: '2026-09-28 14:00:00' };
export const agentSettings = [
  ['resume_parsing', '이력서 분석'], ['jd_generation', '채용공고 생성'], ['chat_bot', '지원자 챗봇'],
  ['screening_analysis', '서류 검토'], ['schedule_coordination', '면접 일정 조율'], ['interview_question', '면접 질문 추천'],
  ['reference_check', '레퍼런스 체크'], ['interview_recording', '면접 녹음 분석'], ['sending mail', '메일 초안 작성'],
  ['process_notification', '전형 안내'], ['offer discussion', '처우 협의'],
].map(([agentCd, agentName], index) => ({ agentCd, agentName, description: '원본 화면 확인용 Mock 설정입니다. 외부 에이전트는 실행되지 않습니다.', displayOrder: index + 1, enabled: agentCd !== 'chat_bot', fixedUseYn: 'N' }));
export const aiReviewExample = {
  statusCd: 'COMPLETE', statusName: '분석 완료', recommendationCd: 'PASS', recommendationName: '추천', overallAgreementCd: 'MATCH', score: 'MATCH',
  jdMatch: Object.fromEntries(['responsibilities', 'requirements', 'preferred'].map(key => [key, { score: 85, recommendationCd: 'MATCH', recommendationName: '적합' }])),
  documentVerification: { careerPeriod: 'MATCH', education: 'MATCH', certificate: 'MATCH', portfolioQuality: 'MATCH' },
  strengths: ['서비스 API 설계 및 운영 경험', '팀 간 협업과 개선 경험'], concerns: ['대규모 트래픽 대응 경험은 면접에서 확인할 항목입니다.'],
  coverLetterStrengths: ['지원 동기와 직무 경험이 구체적입니다.'], coverLetterConcerns: [],
  summary: '[Mock 예시] 원본 분석 결과 화면의 구성과 정보 밀도를 확인하기 위한 가상 평가입니다.', generatedAt: '2026-09-28 15:00:00',
};
export const recordingExample = { overallEvaluation: '[Mock 예시] 서비스 설계 경험과 협업 역량을 설명한 가상 면접 결과입니다.', strengths: ['문제를 단계별로 설명합니다.', '운영 경험을 구체적으로 제시합니다.'], concerns: ['리더십 경험은 추가 확인이 필요합니다.'], finalRecommendation: '[Mock 예시] 다음 전형에서 심화 역량을 확인합니다.' };
export const referenceExample = { score: 85, summary: '[Mock 예시] 원본 레퍼런스 결과 UI를 검토하기 위한 가상 평가입니다.', strengths: ['동료와 지식을 공유합니다.', '맡은 업무를 책임 있게 수행합니다.'], concerns: ['새로운 업무 범위의 경험 확인이 필요합니다.'], softSkills: ['명확한 의사소통'], ethics: ['정보 보호 원칙 준수'], extremeFeedback: [], hashtags: ['협업', '책임감', 'Mock'] };
export const scheduleExamples = [5, 6, 7].map((day, i) => ({ date: `2026-10-0${day}`, time: i === 1 ? '10:00' : '14:00', location: '본사 3층 회의실 · Mock 예시', type: 'FACE_TO_FACE' }));
export const application = { aplctId: 101, jobPostId: 11, draft: true, submitted: false, updatedAt: '2026-09-28 15:00:00', name: applicants[0].name, birthdate: '1995-05-15', email: applicants[0].email, phone: applicants[0].phone, postalCode: '06200', address: '서울시 강남구', detailAddress: '미리보기 주소', militaryStatus: 'NOT_APPLICABLE', veteranStatus: 'N', disabilityStatus: 'N', educationHistory: [{ aplctEduId: 1, schoolTypeCd: 'UNIVERSITY', schoolTypeName: '대학교', locCd: 'SEOUL', locName: '서울', graduationStatusCd: 'GRADUATED', graduationStatusName: '졸업', schoolName: '미리보기대학교', major: '컴퓨터공학', doubleMajor: '', admissionDate: '2014-03', graduationDate: '2018-02', eveningOrOnline: false, transfer: false }], careerHistory: [{ aplctCareerId: 1, company: '예시테크', department: '서비스개발팀', position: '개발자', employmentTypeCd: 'REGULAR', employmentTypeName: '정규직', jobCd: 'DEVELOPER', jobName: '개발', startDate: '2020-03', endDate: '', projects: '플랫폼 API 및 배포 자동화 개발', current: true }], certificates: [], languages: [], activities: [], background: '사용자가 편리하게 사용할 수 있는 안정적인 서비스를 개발해 왔습니다.', motivation: '클라우드 플랫폼 개발 경험을 바탕으로 팀의 성장에 기여하고 싶습니다.', portfolioUrl: '', availableDate: '2026-11-01', desiredSalary: '6000', howDidYouKnow: 'HOMEPAGE', attachments: [], consents: [{ cstitId: 1, agreed: true }, { cstitId: 2, agreed: true }] };
const detail = person => ({ ...person, birthdate: application.birthdate, experience: '경력 5년', skills: jobs[0].techStacks, aiReview: { statusCd: 'NONE', recommendationCd: '', score: '', jdMatch: { responsibilities: '', requirements: '', preferred: '' }, strengths: [], concerns: [], summary: '', generatedAt: '' }, screeningReviewers: [review, { ...review, reviewerId: '2', reviewerName: '박평가', decisionCd: '', decisionName: '', comment: '', statusCd: 'draft', statusName: '평가 대기' }], finalComment: '', finalDecisionDraft: true, resultEmailSent: false, applicationForm: { ...application, aplctId: person.aplctId, name: person.name, email: person.email }, interviewers: [review], screeningReviews: [review], firstInterviewReviews: [review], questionGenerateStatusCd: 'NONE', recordingAnalysisStatusCd: 'NONE', questions: { aplctIntvId: person.aplctIntvId, questions: [] }, scheduleDetail: { methodCd: 'FACE_TO_FACE', methodName: '대면', durationMinutes: 60, startedAt: '2026-10-05 14:00', endedAt: '2026-10-05 15:00', place: '본사 3층 회의실' }, offer: { fields: { baseSalary: 6000, startDate: '2026-11-01', workplace: '서울', benefits: ['교육비 지원', '복지포인트'] } }, sendHistory: [], applicantResponses: [], interviewReviews: [review], referenceAnalysis: { statusCd: 'NONE', statusName: '등록 전' }, verificationFlags: { documentComments: [review], interviewComments: [review] } });
export const codeGroups = {
  SPORT_SE_CD: [['NEW', '신입'], ['CAREER', '경력'], ['ALL', '무관']], EMPL_STLE_CD: [['REGULAR', '정규직'], ['CONTRACT', '계약직']], POST_ST_CD: [['ACTIVE', '진행중'], ['SCHEDULED', '예정'], ['INACTIVE', '비공개'], ['CLOSED', '마감']],
  SEL_STEP_CD: [['DOC', '서류전형'], ['1ST_INTV', '1차면접'], ['2ND_INTV', '2차면접'], ['COMP', '처우협의']], SEL_ST_CD: [['PROGRESS', '진행중'], ['PASS', '합격'], ['REJECT', '불합격'], ['HOLD', '보류']], EVAL_RSLT_CD: [['PASS', '합격'], ['REJECT', '불합격'], ['HOLD', '보류']],
  DOC_ST_CD: [['PROGRESS', '진행중'], ['PASS', '합격'], ['REJECT', '불합격'], ['HOLD', '보류']], TOTL_DOC_ST_CD: [['PROGRESS', '진행중'], ['PASS', '합격'], ['REJECT', '불합격']], DOC_AI_ANLY: [['MATCH', '적합'], ['NOMATCH', '미흡']], RECMD_RSLT_CD: [['PASS', '추천'], ['HOLD', '검토']], MTCH_CD: [['MATCH', '일치'], ['NOMATCH', '불일치']],
  INTV_ST_CD: [['PROGRESS', '진행중'], ['PASS', '합격'], ['REJECT', '불합격']], INTV_STDT_CD: [['TBD', '미정'], ['AWAIT', '응답대기'], ['SCHEDULE', '예정'], ['COMPLETE', '완료']], TOTL_INTV_ST_CD: [['PROGRESS', '진행중'], ['PASS', '합격'], ['REJECT', '불합격']], INTV_MTHD_CD: [['FACE_TO_FACE', '대면'], ['REMOTE', '화상'], ['PHONE', '전화']],
  COMP_ST_CD: [['PENDING', '대기'], ['OFFER_PROGRESS', '처우 협의중'], ['CLOSED', '완료']], TOTL_COMP_ST_CD: [['PENDING', '대기'], ['OFFER_PROGRESS', '처우 협의중'], ['CLOSED', '완료']], COMP_CMPL_ST_CD: [['ACCEPT', '수락'], ['REJECT', '거절'], ['GIVE_UP', '포기'], ['NO_RESPONSE', '미응답'], ['WITHDRAW', '철회'], ['CANCEL', '취소']], COMP_JOB_GRADE_CD: [['MANAGER', '책임'], ['STAFF', '선임']], COMP_POS_GRADE_CD: [['MEMBER', '팀원'], ['LEAD', '팀장']],
  MTRSC_TY_CD: [['NOT_APPLICABLE', '해당없음'], ['COMPLETED', '군필']], VTRN_TP_CD: [['N', '비대상'], ['Y', '대상']], TROBL_TY_CD: [['N', '비대상'], ['Y', '대상']], SPORT_COURS_CD: [['HOMEPAGE', '채용 홈페이지'], ['REFERRAL', '지인 추천']], JOB_CD: [['DEVELOPER', '개발'], ['DATA', '데이터']], SCH_TP_CD: [['UNIVERSITY', '대학교'], ['HIGH_SCHOOL', '고등학교']], LOC_CD: [['SEOUL', '서울'], ['GYEONGGI', '경기']], ENRL_ST_CD: [['GRADUATED', '졸업'], ['ENROLLED', '재학']], ACT_CD: [['PROJECT', '프로젝트'], ['VOLUNTEER', '봉사활동']],
  TMPL_TY_CD: [['BENEFITS', '복리후생'], ['NOTICE', '유의사항']], SND_CHNL_CD: [['EMAIL', '이메일']], SND_SE_CD: [['AUTO', '자동'], ['MANUAL', '수동']], SND_ST_CD: [['SUCCESS', '발송 완료'], ['PENDING', '발송 대기']], EVNT_TY_CD: [['DOCUMENT', '서류전형']], EVNT_ST_CD: [['COMPLETE', '완료']], CREAT_MBY_TY_CD: [['USER', '사용자']], REF_EXEC_TMNG: [['OFFER', '처우협의']],
};
const page = (items, params = {}) => {
  const n = Math.max(0, Number(params.page ?? params.pageRequest?.page ?? 0));
  const size = Math.max(1, Number(params.size ?? params.pageRequest?.size ?? 20));
  return { content: items.slice(n * size, (n + 1) * size), page: n, size, totalElements: items.length, totalPages: Math.max(1, Math.ceil(items.length / size)), first: n === 0, last: (n + 1) * size >= items.length, hasNext: (n + 1) * size < items.length, hasPrevious: n > 0 };
};
const members = [profile, { ...profile, memberId: 2, name: '박평가', email: 'reviewer@preview.example.test', department: '플랫폼개발팀', roles: [profile.roles[2]], roleCodes: ['ROLE_INTERVIEWER'] }].map(x => ({ ...x, username: x.email, corpId: 1, deptName: x.department, actvSt: 'ACTIVE', active: true, telNo: '010-0000-0000', positionName: '책임', createdAt: '2026-09-01 09:00:00' }));
const templates = { benefitsTemplates: [{ tmplId: 1, title: '기본 복리후생', content: '유연근무, 교육비 지원, 건강검진, 복지포인트', displayOrder: 1, isDefault: true, enabled: true }], noticeTemplates: [{ tmplId: 2, title: '채용 유의사항', content: '제출 서류에 허위 사실이 있는 경우 채용이 취소될 수 있습니다.', displayOrder: 1, isDefault: true, enabled: true }] };
const offerSettings = { fields: [{ compFieldId: 1, fieldKey: 'baseSalary', fieldName: '연봉', fieldType: 'number', required: true }, { compFieldId: 2, fieldKey: 'startDate', fieldName: '입사 예정일', fieldType: 'date', required: true }, { compFieldId: 3, fieldKey: 'workplace', fieldName: '근무지', fieldType: 'text', required: false }, { compFieldId: 4, fieldKey: 'benefits', fieldName: '복리후생', fieldType: 'json_array', required: false }] };
const envelope = data => ({ trId: 'ATS-MOCK-FIXTURE', code: 'S001', message: 'Mock 데이터가 현재 화면 세션에 반영되었습니다.', data });
export const fixtureContracts = [
  'GET auth/profile', 'POST auth/login', 'POST auth/logout', 'POST auth/reissue', 'POST auth/email/send', 'POST auth/email/verify', 'POST auth/email/refresh', 'POST auth/password/first-change',
  'GET code/corps', 'GET code/roles', 'GET code/job-posts', 'GET code/groups/:group', 'GET code/groups/:group/items/:code',
  'GET job/public', 'GET job/public/:id', 'GET job', 'GET job/:id', 'GET job/:id/applicants', 'GET job/:id/applicants/:id',
  'POST job', 'PUT job/:id', 'DELETE job/:id', 'PATCH job/:id/view-status', 'PATCH offers/:id',
  'GET applicant', 'GET applicant/recent', 'GET applicant/list-options', 'GET applicant/:id/step-managers', 'GET applicant/:id/navigation',
  'GET documents/applicants', 'GET documents/applicants/:id', 'GET interviews/applicants', 'GET interviews/:id', 'GET offers/applicants', 'GET offers/:id', 'GET offers/settings',
  'GET dashboard/process-stats', 'GET dashboard/charts', 'GET dashboard/interviewer-stats', 'GET dashboard/my-invited-posts',
  'GET corp', 'GET member', 'GET member/:id', 'GET member/search', 'GET template', 'GET template/settings',
  'GET policy/public/consent', 'GET applicant/public/application', 'GET applicant/public/application-status', 'GET applicant/public/applications/:id',
  'GET interviews/public/schedule', 'POST interviews/public/schedule/select', 'GET mail/messages/original-html', 'GET agent/settings',
];

export function createFixtureResolver(context = {}) {
  let confirmed = context.entry?.startsWith('/interview-confirm/confirm') ?? false;
  let reservationConflict = context.scenario?.reservationConflict === true;
  let selectedSlotId = 1;
  let unavailableSlotId = null;
  let draft = structuredClone(application);
  let consentSaved = false;
  // Local mutations live only as long as this renderer. Reload/reset starts from the exported examples.
  let jobRecords = structuredClone(jobs);
  let nextJobId = Math.max(...jobRecords.map(job => job.jobPostId)) + 1;
  const offerFields = new Map();
  const evaluationEdits = new Map();
  const mapReviewers = ids => (ids || []).map(id => members.find(member => member.memberId === Number(id))).filter(Boolean).map(member => ({ memberId: member.memberId, name: member.name, company: member.corpName, department: member.department }));
  const saveJob = (previous, input, id) => {
    const corp = corps.find(item => item.corpCd === input.company || String(item.corpId) === String(input.company)) || previous?.corp || corps[0];
    const job = { ...(previous || structuredClone(jobs[0])), ...input, jobPostId: id, corp, corpId: corp.corpId, corpName: corp.corpName, techStacks: input.techStack ?? previous?.techStacks ?? [], status: input.active === false ? 'INACTIVE' : 'ACTIVE', updatedAt: '2026-10-07 12:00:00' };
    job.sportSeName = codeGroups.SPORT_SE_CD.find(([value]) => value === job.sportSeCd)?.[1] || job.sportSeName;
    job.emplStleName = codeGroups.EMPL_STLE_CD.find(([value]) => value === job.emplStleCd)?.[1] || job.emplStleName;
    if (input.reviewers) {
      job.screeningReviewers = mapReviewers(input.reviewers.screeningMemberIds);
      job.firstInterviewers = mapReviewers(input.reviewers.firstInterviewMemberIds);
      job.secondInterviewers = mapReviewers(input.reviewers.secondInterviewMemberIds);
    }
    if (!previous) job.applicantCounts = { total: 0, document: 0, firstInterview: 0, secondInterview: 0, offer: 0 };
    return job;
  };
  const personFor = id => applicants.find(x => [x.aplctId, x.aplctDocId, x.aplctIntvId, x.compId].includes(Number(id))) ?? applicants[0];
  const slot = { slotCandidateId: 1, startDate: '2026-10-05 14:00:00', endDate: '2026-10-05 15:00:00', available: true };
  const schedule = () => {
    const slots = [slot, { ...slot, slotCandidateId: 2, startDate: '2026-10-06 10:00:00', endDate: '2026-10-06 11:00:00' }].map(item => ({ ...item, available: item.slotCandidateId !== unavailableSlotId }));
    return { status: confirmed ? 'CONFIRMED' : 'ACTIVE', jobPostingName: jobs[0].posTitle, location: '본사 3층 회의실', expiresAt: '2026-10-10 23:59:00', slots, confirmedSlot: confirmed ? slots.find(item => item.slotCandidateId === selectedSlotId) || slots[0] : null };
  };
  return function resolve(config = {}) {
    const method = (config.method ?? 'GET').toUpperCase();
    const url = new URL(config.url ?? '/', 'https://preview.invalid/');
    const pathname = url.pathname.replace(/^\/(?:api\/v1\/|__ats_fixture__\/)?/, '').replace(/\/$/, '');
    const params = { ...Object.fromEntries(url.searchParams), ...config.params };
    let body = config.data;
    try { if (typeof body === 'string') body = JSON.parse(body); } catch {}
    body ??= {};
    let data;
    let raw = false;
    if (method === 'GET') {
      if (pathname === 'auth/profile') data = context.role === 'ROLE_INTERVIEWER' ? { ...profile, roles: [profile.roles[2], profile.roles[0], profile.roles[1]], roleCodes: ['ROLE_INTERVIEWER', 'ROLE_ADMIN', 'ROLE_HR'] } : profile;
      else if (pathname === 'code/corps' || pathname === 'corp') data = corps;
      else if (pathname === 'code/roles') data = roles;
      else if (pathname === 'code/job-posts') data = jobRecords.map(j => ({ ...j, corpCd: j.corp.corpCd }));
      else if (/^code\/groups\/[^/]+(?:\/items\/[^/]+)?$/.test(pathname)) {
        const [, , group, , value] = pathname.split('/');
        if (codeGroups[group]) { const items = codeGroups[group].map(([value, name], i) => ({ cdDtlId: i + 1, value, name, sortOrder: i + 1 })); data = value ? items.find(x => x.value === value) : { grpCd: group, grpName: group, items }; }
      }
      else if (pathname === 'job/public') { const positions = jobRecords.filter(j => j.active !== false && (!params.corpCode || j.corp.corpCd === params.corpCode) && (!params.jobPostId || j.jobPostId === Number(params.jobPostId))); data = { totalCount: positions.length, positions }; }
      else if (/^job\/(public\/)?\d+$/.test(pathname)) data = jobRecords.find(j => j.jobPostId === Number(pathname.split('/').at(-1)));
      else if (pathname === 'job') {
        const content = jobRecords.filter(j => (!params.company || j.corp.corpCd === params.company) && (!params.status || j.status === params.status) && (!params.keyword || j.posTitle.includes(params.keyword)));
        data = { content, size: content.length, hasNext: false, nextCursor: null, statusCounts: { total: jobRecords.length, active: jobRecords.filter(j => j.status === 'ACTIVE').length, scheduled: 0, inactive: jobRecords.filter(j => j.status === 'INACTIVE').length, closed: 0 } };
      }
      else if (/^job\/\d+\/applicants$/.test(pathname)) data = page(applicants.filter(person => person.jobPostId === Number(pathname.split('/')[1])), params);
      else if (/^job\/\d+\/applicants\/\d+$/.test(pathname)) data = detail(personFor(pathname.split('/').at(-1)));
      else if (pathname === 'applicant') data = page(applicants.filter(p => !params.name || p.name.includes(params.name)), params);
      else if (pathname === 'applicant/recent') data = applicants.slice(0, Number(params.limit ?? 4));
      else if (pathname === 'applicant/list-options') data = { sorts: [{ value: 'APPLIED_AT_DESC', label: '지원일 최신순', sortOrder: 1, querySupported: true }, { value: 'APPLIED_AT_ASC', label: '지원일 오래된순', sortOrder: 2, querySupported: true }], pageSizes: [10, 20, 50].map(n => ({ value: String(n), label: `${n}개`, sortOrder: n, querySupported: true })), defaultSort: 'APPLIED_AT_DESC', defaultPageSize: 20 };
      else if (/^applicant\/\d+\/step-managers$/.test(pathname)) data = { ...personFor(pathname.split('/')[1]), ntcSelStepCd: 'DOC', managerSource: 'JOB_POST', managers: members.map(m => ({ memberId: m.memberId, name: m.name, company: m.corpName, department: m.department })) };
      else if (/^applicant\/\d+\/navigation$/.test(pathname)) { const p = personFor(pathname.split('/')[1]); data = { ...p, targetType: ['DOCUMENT', 'FIRST_INTERVIEW', 'SECOND_INTERVIEW', 'OFFER'][applicants.indexOf(p)], interviewId: p.aplctIntvId, allowed: true, message: null }; }
      else if (pathname === 'documents/applicants') data = applicants;
      else if (/^documents\/applicants\/\d+$/.test(pathname)) data = { ...detail(personFor(pathname.split('/').at(-1))), ...evaluationEdits.get(pathname) };
      else if (pathname === 'interviews/applicants') data = applicants.map(p => ({ ...p, roundCd: params.roundCd ?? '1ST_INTV', roundName: params.roundCd === '2ND_INTV' ? '2차면접' : '1차면접' }));
      else if (/^interviews\/\d+$/.test(pathname)) data = { ...detail(personFor(pathname.split('/')[1])), ...evaluationEdits.get(pathname) };
      else if (pathname === 'offers/applicants') data = applicants.map((p, i) => ({ ...p, statusCd: i || context.scenario?.showEditModal ? 'OFFER_PROGRESS' : 'PENDING', statusName: i || context.scenario?.showEditModal ? '처우 협의중' : '대기' }));
      else if (/^offers\/\d+$/.test(pathname)) {
        const person = personFor(pathname.split('/')[1]);
        const inProgress = applicants.indexOf(person) > 0 || context.scenario?.showEditModal;
        data = { ...detail(person), statusCd: inProgress ? 'OFFER_PROGRESS' : 'PENDING', statusName: inProgress ? '처우 협의중' : '대기' };
        if (offerFields.has(pathname)) data.offer = { fields: offerFields.get(pathname) };
      }
      else if (/^offers\/\d+\/application$/.test(pathname)) data = application;
      else if (pathname === 'offers/settings') data = offerSettings;
      else if (pathname === 'dashboard/process-stats') data = { activeJobPostCount: jobRecords.filter(job => job.status === 'ACTIVE').length, totalJobPostCount: jobRecords.length, totalApplicantCount: 4, stepCounts: ['서류전형', '1차면접', '2차면접', '처우협의'].map((stepName, i) => ({ stepName, inProgress: 1, totalEntered: 4 - i })) };
      else if (pathname === 'dashboard/charts') data = { monthlyApplicants: ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'].map((month, i) => ({ month, count: [12, 18, 16, 24, 32, 28][i] })), stepPassCounts: ['서류전형', '1차면접', '2차면접', '처우협의'].map((stepName, i) => ({ stepName, count: [20, 12, 8, 5][i] })) };
      else if (pathname === 'dashboard/interviewer-stats') { const rows = members.map((m, i) => ({ memberId: m.memberId, memberName: m.name, corpName: m.corpName, roleName: '평가자', docReviewCount: 12 - i, interviewCount: 8 - i, passCount: 6 - i, rejectCount: 3, holdCount: 2, passRate: 65, hireRate: 40 })); data = params.limit ? rows.slice(0, params.limit) : page(rows, params); }
      else if (pathname === 'dashboard/my-invited-posts') data = jobRecords.map(j => ({ jobPostId: j.jobPostId, posTitle: j.posTitle, corpName: j.corpName, assignedRole: '평가자' }));
      else if (pathname === 'member') data = page(members, params);
      else if (pathname === 'member/search') data = members.filter(m => !params.name || m.name.includes(params.name));
      else if (/^member\/\d+$/.test(pathname)) data = members.find(m => m.memberId === Number(pathname.split('/')[1])) ?? members[0];
      else if (pathname === 'template/settings') data = templates;
      else if (pathname === 'template') data = { tmplTy: params.tmplTy ?? 'BENEFITS', items: params.tmplTy === 'NOTICE' ? templates.noticeTemplates : templates.benefitsTemplates };
      else if (pathname === 'policy/public/consent') data = { procPolicyId: 1, procPolicyVer: 'preview-1', title: '약관 동의', cont: '입사지원을 위해 아래 내용을 확인해 주세요.', efftDd: '2026-09-01', items: [{ cstitId: 1, itemName: '이용약관에 동의합니다. (필수)', itemCont: '<p>채용 화면 검토를 위한 미리보기 약관입니다.</p>', required: true, sortOrdr: 1 }, { cstitId: 2, itemName: '개인정보 수집 및 이용에 동의합니다. (필수)', itemCont: '<p>이 프리뷰는 입력 데이터를 외부로 전송하지 않습니다.</p>', required: true, sortOrdr: 2 }, { cstitId: 3, itemName: '만 14세 이상임을 확인합니다. (필수)', itemCont: '', required: true, sortOrdr: 3 }, { cstitId: 4, itemName: '채용 소식 수신에 동의합니다. (선택)', itemCont: '<p>미리보기 선택 항목입니다.</p>', required: false, sortOrdr: 4 }] };
      else if (pathname === 'applicant/public/application') data = { ...draft, consents: consentSaved ? application.consents : [] };
      else if (/^applicant\/public\/applications\/\d+$/.test(pathname)) data = { ...application, submitted: true, draft: false };
      else if (pathname === 'applicant/public/application-status') data = [{ id: '101', ...applicants[0], status: 'in_progress', statusText: '1차면접 진행중', currentStage: '1차면접', nextStep: '면접 일정을 확인해 주세요.', stages: [{ name: '서류전형', status: 'completed', date: '2026-09-27' }, { name: '1차면접', status: 'in_progress', date: '2026-10-05', interviewGuide: { scheduledAt: '2026-10-05 14:00', place: '본사 3층 회의실', materials: '신분증', durationMinutes: 60 } }, { name: '2차면접', status: 'pending', date: '' }, { name: '처우협의', status: 'pending', date: '' }] }];
      else if (pathname === 'interviews/public/schedule') data = schedule();
      else if (pathname === 'mail/messages/original-html') { raw = true; data = '<!doctype html><html lang="ko"><body style="font-family: sans-serif;padding:40px;color:#172033"><h1>면접 일정 안내</h1><p>이지원님, 안녕하세요.</p><p>클라우드 플랫폼 백엔드 개발자 채용의 서류전형 합격을 안내드립니다.</p><p>면접: 2026년 10월 5일 오후 2시 · 본사 3층 회의실</p><hr><p>ATS Mock 화면 검토를 위한 예시 메일입니다.</p></body></html>'; }
      else if (pathname === 'agent/settings') data = { ...corps[0], settings: agentSettings, previewOnly: true };
      else if (pathname === 'agent/settings/status' || pathname === 'agent/settings/status/admin') data = { settings: agentSettings, previewOnly: true };
      else if (pathname === 'agent/activities/usage-stats') data = { previewOnly: true, totalCount: 3, items: agentSettings.slice(0, 3).map(setting => ({ agentCd: setting.agentCd, agentName: setting.agentName, count: 1, displayOrder: setting.displayOrder, themeGroup: 'BLUE' })) };
      else if (pathname === 'agent/activities') data = { ...page(agentSettings.slice(0, 3).map((setting, i) => ({ activityNo: `MOCK-${i + 1}`, agentCd: setting.agentCd, agentName: setting.agentName, actionTitle: `[Mock 예시] ${setting.agentName} 화면 확인`, corpName: corps[0].corpName, jobPostTitle: jobs[0].posTitle, applicantName: applicants[0].name, occurredAt: `2026-09-28 1${i}:00:00`, statusName: '예시', description: '외부 에이전트가 실행되지 않은 화면 검토용 데이터입니다.' })), params), previewOnly: true };
    } else if (method === 'POST') {
      if (pathname === 'job') { const id = nextJobId++; jobRecords.push(saveJob(null, body, id)); data = id; }
      else if (pathname === 'auth/login') data = { token: { access_token: context.token }, user: { username: profile.email, email: profile.email, name: profile.name }, mustChangePassword: false, redirectPath: '/admin' };
      else if (pathname === 'auth/reissue') data = { access_token: context.token };
      else if (pathname === 'auth/logout' || pathname === 'auth/password/first-change') data = { previewOnly: true };
      else if (pathname === 'auth/email/send') data = { authRequestId: 'preview-email-request', expiresIn: 300 };
      else if (pathname === 'auth/email/verify' || pathname === 'auth/email/refresh') data = { token: context.token, authRequestId: 'preview-email-request', user: { name: body.name || applicants[0].name, email: body.email || applicants[0].email } };
      else if (pathname === 'applicant/public/application/submit') { draft = { ...draft, ...body, submitted: true, draft: false }; data = draft; }
      else if (pathname === 'interviews/public/schedule/select') {
        if (reservationConflict) {
          reservationConflict = false;
          unavailableSlotId = Number(body.slotCandidateId);
          return { status: 409, fixture: 'POST interviews/public/schedule/select:reservation-conflict', expectedFailure: true, data: { trId: 'ATS-MOCK-EXPECTED-FAILURE', code: 'SCHEDULE_CONFLICT', message: 'Mock 시나리오: 선택한 일정이 먼저 예약되었습니다.', data: null } };
        }
        selectedSlotId = Number(body.slotCandidateId) || 1;
        confirmed = true; data = schedule();
      }
      else if (/^job\/\d+\/applicants\/bulk-reject\/preview$/.test(pathname)) data = { recipientCount: body.aplctIds?.length || 2, recipientLabel: '이지원 외 1명', recipientNames: applicants.slice(0, body.aplctIds?.length || 2).map(person => person.name), subject: '채용 전형 결과 안내', body: '지원해 주셔서 감사합니다. 이번 전형에서는 함께하기 어렵게 되었습니다.' };
    } else if (method === 'PUT') {
      if (/^job\/\d+$/.test(pathname)) { const id = Number(pathname.split('/')[1]); const existing = jobRecords.find(job => job.jobPostId === id); if (existing) { jobRecords = jobRecords.map(job => job.jobPostId === id ? saveJob(existing, body, id) : job); data = { previewOnly: true }; } }
      else if (pathname === 'applicant/public/application') { draft = { ...draft, ...body, aplctId: 101, jobPostId: 11 }; consentSaved = true; data = draft; }
      else if (/^(documents\/applicants|interviews)\/\d+\/(reviews|final-decision)\/(draft|submit)$/.test(pathname)) {
        const isDraft = pathname.endsWith('/draft');
        data = { ...review, ...body, decisionCd: body.decisionCd ?? body.finalDecisionCd ?? 'PASS', decisionName: { PASS: '합격', REJECT: '불합격', HOLD: '보류' }[body.decisionCd ?? body.finalDecisionCd ?? 'PASS'], statusCd: isDraft ? 'draft' : 'submitted', statusName: isDraft ? '임시저장' : '제출 완료', currentSelStepName: '1차면접', currentSelStatCd: 'PROGRESS', currentSelStatName: '진행중' };
        const recordPath = pathname.replace(/\/(reviews|final-decision)\/(draft|submit)$/, '');
        const change = pathname.includes('/final-decision/') ? { finalDecisionCd: body.finalDecisionCd, finalComment: body.finalComment || '', finalDecisionDraft: isDraft } : { [pathname.startsWith('interviews/') ? 'interviewers' : 'screeningReviewers']: [data] };
        evaluationEdits.set(recordPath, { ...evaluationEdits.get(recordPath), ...change });
      }
      else if (pathname === 'offers/settings') data = { fields: offerSettings.fields.map(f => ({ ...f, ...body.fields?.find?.(x => x.compFieldId === f.compFieldId) })) };
      else if (pathname === 'template/settings') data = { ...templates, ...body };
    } else if (method === 'PATCH' && /^offers\/\d+$/.test(pathname)) {
      const fields = { ...(offerFields.get(pathname) || detail(personFor(pathname.split('/')[1])).offer.fields), ...body.fields };
      offerFields.set(pathname, structuredClone(fields));
      data = { compId: Number(pathname.split('/')[1]), offer: { fields }, updatedAt: '2026-10-07 12:00:00' };
    } else if (method === 'PATCH' && /^job\/\d+\/view-status$/.test(pathname)) {
      const id = Number(pathname.split('/')[1]);
      if (jobRecords.some(job => job.jobPostId === id)) { jobRecords = jobRecords.map(job => job.jobPostId === id ? { ...job, active: body.active === true, status: body.active === true ? 'ACTIVE' : 'INACTIVE' } : job); data = { previewOnly: true }; }
    } else if (method === 'DELETE' && /^job\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/')[1]);
      if (jobRecords.some(job => job.jobPostId === id)) { jobRecords = jobRecords.filter(job => job.jobPostId !== id); data = { previewOnly: true }; }
    }
    // Source-backed UI scenarios receive read-only, explicitly labelled examples; no generation API runs.
    if (data && method === 'GET') {
      if (/^documents\/applicants\/\d+$/.test(pathname)) data = { ...data, aiReview: aiReviewExample };
      if (pathname === 'interviews/applicants' && context.scenario?.agentStep || /^interviews\/\d+$/.test(pathname) && (context.scenario?.agentStep || context.scenario?.showScheduleModal)) {
        const status = context.scenario?.agentStep === 'sent' ? 'AWAIT' : 'TBD';
        const scheduleView = row => ({ ...row, scheduleStatusCd: status, scheduleStatusName: status === 'AWAIT' ? '응답대기' : '미정' });
        data = Array.isArray(data) ? data.map(scheduleView) : scheduleView(data);
      }
      if (/^interviews\/\d+$/.test(pathname) && context.scenario?.showAnalysisModal) data = { ...data, recordingAnalysisStatusCd: 'COMPLETE', recordingAnalysis: recordingExample };
      if (/^offers\/\d+$/.test(pathname) && context.scenario?.referenceAnalysisStep === 'completed') data = { ...data, referenceAnalysis: { statusCd: 'COMPLETE', statusName: '분석 완료', ...referenceExample, generatedAt: '2026-09-28 15:00:00' } };
    }
    // Interview/offer DTOs use a string company key; applicant/job DTOs use numeric IDs.
    if (data && /^(interviews|offers|documents)\//.test(pathname)) {
      if (Array.isArray(data)) data = data.map(item => item.corpId == null ? item : { ...item, corpId: String(item.corpId) });
      else if (data.corpId != null) data = { ...data, corpId: String(data.corpId) };
    }
    if (data === undefined) return { status: 501, fixture: null, data: { trId: 'ATS-MOCK-UNSUPPORTED', code: 'PREVIEW_UNSUPPORTED', message: `Mock 범위 밖의 동작입니다. 실제 API는 호출하지 않았습니다: ${method} ${pathname}`, data: null } };
    return { status: 200, fixture: `${method} ${pathname}`, data: raw ? data : envelope(structuredClone(data)) };
  };
}
