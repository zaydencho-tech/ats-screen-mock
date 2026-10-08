import { application, recordingExample, referenceExample, scheduleExamples } from './fixtures.mjs';

/** Local prerequisites for source-backed states. Values come from the same API fixtures and original mappers. */
export async function prepareScenario(runtime: any, page: any, state: any) {
  const file = page?.file;
  const binding = (name: string, source = file) => runtime.bindings.get(`${source}#${name}`);
  const set = (name: string, value: any, source = file) => binding(name, source)?.set(value);
  const keys = Object.keys(state?.overrides || {}).map(key => key.split('#').at(-1));
  if (!state || state.kind === 'initial') return;
  if (page.component === 'Apply' && (state.overrides?.[`${file}#step`] === 'form' || keys.includes('postcodeModalOpen'))) {
    const mapper = await import('../app/utils/mapper/application');
    set('verifiedApplicant', { name: application.name, email: application.email });
    set('formData', mapper.applicationResponseToFormData(application));
    if (keys.includes('postcodeModalOpen')) set('step', 'form');
  }
  if (page.component === 'InterviewManagementV2' && (keys.includes('agentStep') || keys.includes('showScheduleModal'))) {
    const step = state.overrides[`${file}#agentStep`] || 'idle';
    if (step !== 'sent') set('showScheduleModal', true);
    set('scheduleCandidates', scheduleExamples);
    const current = binding('scheduleSettings')?.value;
    if (current) set('scheduleSettings', { ...current, startDate: '2026-10-05', endDate: '2026-10-09', responseDeadline: '2026-10-02', location: '본사 3층 회의실 · Mock 예시' });
  }
  if (page.component === 'InterviewManagementV2' && keys.includes('showAnalysisModal')) set('displayedRecordingAnalysis', recordingExample);
  if (page.component === 'OfferManagement' && keys.includes('referenceAnalysisStep')) {
    const step = state.overrides[`${file}#referenceAnalysisStep`];
    if (step === 'completed') set('referenceResult', referenceExample);
    if (step === 'uploading') set('isReferenceUploading', true);
    const heading = [...document.querySelectorAll('h3')].find(item => item.textContent?.includes('레퍼런스 체크'));
    heading?.scrollIntoView({ block: 'center', behavior: 'instant' });
  }
  if (page.component === 'OfferManagement' && keys.includes('showEditModal')) {
    // The original click handler also hydrates useOfferPackageForm; opening the flag alone skips that work.
    const button = [...document.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.trim() === '수정' && item.getAttribute('data-ats-source') === file);
    runtime.scenarioNeedsRetry = !button || !binding('selectedOffer')?.value?.offer;
    if (!runtime.scenarioNeedsRetry && !runtime.scenarioEvidence.some((item: any) => item.kind === 'source-click' && item.sourceFile === file && item.label === '수정')) {
      button!.click();
      runtime.scenarioEvidence.push({ kind: 'source-click', sourceFile: file, label: '수정' });
    }
  }
  if (page.component === 'JobPostingManagement' && (state.requires?.length || keys.includes('showDeactivateModal'))) {
    const mapper = await import('../app/utils/mapper/jobPostAdmin');
    const [list, detail, applicantList] = await Promise.all([
      runtime.adapter({ method: 'get', url: 'job' }),
      runtime.adapter({ method: 'get', url: 'job/11' }),
      runtime.adapter({ method: 'get', url: 'job/11/applicants' }),
    ]);
    const first = mapper.parseJobPostListResponse(list.data).items[0];
    const originalDetail = mapper.parseJobPostDetailResponse(detail.data);
    const applicants = mapper.parseJobPostApplicantsResponse(applicantList.data).items;
    const selected = { ...mapper.mergeJobPostingWithDetail(first, originalDetail), applicants };
    if (!binding('selectedJob')?.value) set('selectedJob', selected);
    if (keys.includes('isCreating')) { set('creationType', 'direct'); set('isEditing', true); }
    if (keys.includes('creationType')) { set('isCreating', true); set('isEditing', true); }
    if (keys.includes('showApplicationPanel')) { set('selectedApplicant', applicants[0]); set('viewMode', 'detail'); }
    if (keys.includes('showBulkRejectModal')) { set('selectedApplicantIds', applicants.slice(0, 2).map((applicant: any) => applicant.id)); set('viewMode', 'detail'); }
  }
}
