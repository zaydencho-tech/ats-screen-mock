import { formatReferrerDisplay } from "../../utils/mapper/application";
import { resolveCodeLabel } from "../../utils/codes/commonCode";
import {
  isMilitaryInService,
  shouldShowMilitaryServiceDates,
} from "../../utils/codes/militaryServiceCode";
import {
  toDateInputValue,
  toMonthInputValue,
} from "../../utils/form/dateInputValue";
import type { ApplyPdfKit } from "./applyPdfKit";
import type { ApplyPdfViewData } from "./types";

function codeLabel(
  value: string,
  options: ApplyPdfViewData["codeOptions"][keyof ApplyPdfViewData["codeOptions"]],
): string {
  return resolveCodeLabel(value, options) || value;
}

/** 입사지원서 본문 — DOM / PDF kit 공유 */
export function ApplyPdfContent({
  data,
  kit,
}: {
  data: ApplyPdfViewData;
  kit: ApplyPdfKit;
}) {
  const {
    title = "입사 지원서",
    jobSubtitle = "",
    form: formData,
    codeOptions,
    portfolioFiles = [],
    photoUrl,
  } = data;

  const {
    Header,
    Section,
    SectionNested,
    SectionCompact,
    SectionTitle,
    BlockTitle,
    BlockTitleLg,
    ItemTitle,
    Empty,
    SectionBody,
    Row,
    ColHalf,
    ColThird,
    ColFull,
    Spaced,
    CheckboxRow,
    MilitaryDates,
    Field,
    Checkbox,
    CertBlock,
    FileList,
    ApplicantPhoto,
  } = kit;

  const howDidYouKnowLabel = codeLabel(
    formData.howDidYouKnow,
    codeOptions.howDidYouKnow,
  );
  const howDidYouKnowReferrer = formatReferrerDisplay(
    formData.howDidYouKnow,
    formData.referrerDept,
    formData.referrerName,
  );

  return (
    <>
      <Header title={title} subtitle={jobSubtitle || undefined} />

      <Section>
        <SectionTitle>기본 정보</SectionTitle>
        <SectionBody>
          {photoUrl ? <ApplicantPhoto photoUrl={photoUrl} /> : null}
          <Row>
            <ColHalf>
              <Field label="이름" apiKey="name" value={formData.name} required />
            </ColHalf>
            <ColHalf>
              <Field
                label="생년월일"
                apiKey="birthdate"
                value={toDateInputValue(formData.birthdate)}
                required
              />
            </ColHalf>
            <ColHalf>
              <Field label="이메일" apiKey="email" value={formData.email} required />
            </ColHalf>
            <ColHalf>
              <Field label="전화번호" apiKey="phone" value={formData.phone} required />
            </ColHalf>
          </Row>
          <ColFull>
            <Field
              label="우편번호"
              apiKey="postalCode"
              value={formData.postalCode}
              required
            />
          </ColFull>
          <ColFull>
            <Field label="주소" apiKey="address" value={formData.address} required />
          </ColFull>
          <ColFull>
            <Field
              label="상세주소"
              apiKey="detailAddress"
              value={formData.detailAddress}
              required
            />
          </ColFull>
        </SectionBody>
      </Section>

      <Section>
        <SectionTitle>병역/보훈/장애</SectionTitle>
        <Spaced gap="md">
          <Field
            label="병역사항"
            apiKey="militaryStatus"
            value={codeLabel(formData.militaryStatus, codeOptions.militaryStatus)}
            required
          />

          {shouldShowMilitaryServiceDates(
            formData.militaryStatus,
            formData.militaryStartDate,
            formData.militaryEndDate,
            codeOptions.militaryStatus,
          ) ? (
            <MilitaryDates>
              <Row tight>
                <ColHalf>
                  <Field
                    label="복무 시작일"
                    apiKey="militaryStartDate"
                    value={toMonthInputValue(formData.militaryStartDate)}
                    required
                    labelSize="xs"
                  />
                </ColHalf>
                <ColHalf>
                  <Field
                    label={
                      isMilitaryInService(
                        formData.militaryStatus,
                        codeOptions.militaryStatus,
                      )
                        ? "전역 예정일"
                        : "복무 종료일"
                    }
                    apiKey="militaryEndDate"
                    value={toMonthInputValue(formData.militaryEndDate)}
                    required
                    labelSize="xs"
                  />
                </ColHalf>
              </Row>
            </MilitaryDates>
          ) : null}

          <Row>
            <ColHalf>
              <Field
                label="보훈사항"
                apiKey="veteranStatus"
                value={codeLabel(formData.veteranStatus, codeOptions.veteranStatus)}
              />
            </ColHalf>
            <ColHalf>
              <Field
                label="장애사항"
                apiKey="disabilityStatus"
                value={codeLabel(formData.disabilityStatus, codeOptions.disabilityType)}
                required
              />
            </ColHalf>
          </Row>
        </Spaced>
      </Section>

      <Section>
        <SectionTitle>{applySectionTitle("학력사항", "educationHistory")}</SectionTitle>
        {formData.educationHistory.length === 0 ? (
          <Empty>학력사항 없음</Empty>
        ) : (
          <Spaced gap="md">
            {formData.educationHistory.map((edu, index) => (
              <SectionNested key={index}>
                <BlockTitle>학력 {index + 1}</BlockTitle>
                <Row tight>
                  <ColThird>
                    <Field
                      label="학교 구분"
                      apiKey="schoolType"
                      value={codeLabel(edu.schoolType, codeOptions.schoolType)}
                      required
                      labelSize="xs"
                    />
                  </ColThird>
                  <ColThird>
                    <Field
                      label="소재지"
                      apiKey="location"
                      value={codeLabel(edu.location, codeOptions.educationLocation)}
                      required
                      labelSize="xs"
                    />
                  </ColThird>
                  <ColThird>
                    <Field
                      label="졸업 여부"
                      apiKey="graduationStatus"
                      value={codeLabel(
                        edu.graduationStatus,
                        codeOptions.graduationStatus,
                      )}
                      required
                      labelSize="xs"
                    />
                  </ColThird>
                </Row>
                <Row tight>
                  <ColHalf>
                    <Field
                      label="학교명"
                      apiKey="schoolName"
                      value={edu.schoolName}
                      required
                      labelSize="xs"
                    />
                  </ColHalf>
                  <ColHalf>
                    <Field
                      label="주전공"
                      apiKey="major"
                      value={edu.major}
                      required
                      labelSize="xs"
                    />
                  </ColHalf>
                  <ColHalf>
                    <Field
                      label="복수/부전공"
                      apiKey="doubleMajor"
                      value={edu.doubleMajor}
                      labelSize="xs"
                    />
                  </ColHalf>
                </Row>
                <Row tight>
                  <ColHalf>
                    <Field
                      label="입학연월"
                      apiKey="admissionDate"
                      value={toMonthInputValue(edu.admissionDate)}
                      required
                      labelSize="xs"
                    />
                  </ColHalf>
                  <ColHalf>
                    <Field
                      label="졸업연월"
                      apiKey="graduationDate"
                      value={toMonthInputValue(edu.graduationDate)}
                      required
                      labelSize="xs"
                    />
                  </ColHalf>
                </Row>
                <CheckboxRow>
                  <Checkbox label="편입" apiKey="transfer" checked={edu.isTransfer} />
                  <Checkbox
                    label="야간/원격"
                    apiKey="eveningOrOnline"
                    checked={edu.isEveningOrOnline}
                  />
                </CheckboxRow>
              </SectionNested>
            ))}
          </Spaced>
        )}
      </Section>

      <Section>
        <SectionTitle>{applySectionTitle("경력사항", "careerHistory")}</SectionTitle>
        {formData.careerHistory.length === 0 ? (
          <Empty>신입인 경우 건너뛰셔도 됩니다</Empty>
        ) : (
          <Spaced gap="md">
            {formData.careerHistory.map((career, index) => (
              <SectionNested key={index}>
                <BlockTitle>경력 {index + 1}</BlockTitle>
                <Row tight>
                  <ColHalf>
                    <Field
                      label="회사명"
                      apiKey="company"
                      value={career.company}
                      required
                      labelSize="xs"
                    />
                  </ColHalf>
                  <ColHalf>
                    <Field
                      label="부서"
                      apiKey="department"
                      value={career.department}
                      labelSize="xs"
                    />
                  </ColHalf>
                  <ColHalf>
                    <Field
                      label="직위"
                      apiKey="position"
                      value={career.position}
                      labelSize="xs"
                    />
                  </ColHalf>
                  <ColHalf>
                    <Field
                      label="고용형태"
                      apiKey="employmentType"
                      value={codeLabel(career.employmentType, codeOptions.employmentType)}
                      required
                      labelSize="xs"
                    />
                  </ColHalf>
                </Row>
                <ColFull>
                  <Field
                    label="직무"
                    apiKey="jobRole"
                    value={codeLabel(career.jobRole, codeOptions.jobRole)}
                    required
                    labelSize="xs"
                  />
                </ColFull>
                <Row tight>
                  <ColHalf>
                    <Field
                      label="입사연월"
                      apiKey="startDate"
                      value={toMonthInputValue(career.startDate)}
                      required
                      labelSize="xs"
                    />
                  </ColHalf>
                  <ColHalf>
                    <Field
                      label="퇴사연월"
                      apiKey="endDate"
                      value={career.isCurrent ? "" : toMonthInputValue(career.endDate)}
                      labelSize="xs"
                    />
                  </ColHalf>
                </Row>
                <CheckboxRow>
                  <Checkbox label="재직중" apiKey="current" checked={career.isCurrent} />
                </CheckboxRow>
                <Field
                  label="주요 프로젝트 및 담당업무"
                  apiKey="projects"
                  value={career.projects}
                  labelSize="xs"
                  multiline
                  rows={3}
                />
              </SectionNested>
            ))}
          </Spaced>
        )}
      </Section>

      <Section>
        <SectionTitle>자격증 및 어학</SectionTitle>
        <SectionBody>
        <CertBlock>
          <BlockTitleLg>{applySectionTitle("자격증", "certificates")}</BlockTitleLg>
          {formData.certificates.length === 0 ? (
            <Empty>자격증이 없다면 건너뛰셔도 됩니다</Empty>
          ) : (
            <Spaced gap="sm">
              {formData.certificates.map((cert, index) => (
                <SectionCompact key={index}>
                  <ItemTitle>자격증 {index + 1}</ItemTitle>
                  <Row tight>
                    <ColHalf>
                      <Field
                        label="자격증명"
                        apiKey="name"
                        value={cert.name}
                        required
                        labelSize="xs"
                      />
                    </ColHalf>
                    <ColHalf>
                      <Field
                        label="발급기관"
                        apiKey="issuer"
                        value={cert.issuer}
                        required
                        labelSize="xs"
                      />
                    </ColHalf>
                    <ColHalf>
                      <Field
                        label="취득일"
                        apiKey="dateIssued"
                        value={toDateInputValue(cert.dateIssued)}
                        required
                        labelSize="xs"
                      />
                    </ColHalf>
                    <ColHalf>
                      <Field
                        label="자격증 번호"
                        apiKey="certificateNumber"
                        value={cert.certificateNumber}
                        labelSize="xs"
                      />
                    </ColHalf>
                  </Row>
                </SectionCompact>
              ))}
            </Spaced>
          )}
        </CertBlock>

        <>
          <BlockTitleLg>{applySectionTitle("어학", "languages")}</BlockTitleLg>
          {formData.languages.length === 0 ? (
            <Empty>어학 정보가 없다면 건너뛰셔도 됩니다</Empty>
          ) : (
            <Spaced gap="sm">
              {formData.languages.map((lang, index) => (
                <SectionCompact key={index}>
                  <ItemTitle>어학 {index + 1}</ItemTitle>
                  <Row tight>
                    <ColHalf>
                      <Field
                        label="시험명"
                        apiKey="testName"
                        value={lang.testName}
                        required
                        labelSize="xs"
                      />
                    </ColHalf>
                    <ColHalf>
                      <Field
                        label="점수"
                        apiKey="score"
                        value={lang.score}
                        required
                        labelSize="xs"
                      />
                    </ColHalf>
                    <ColHalf>
                      <Field
                        label="취득일"
                        apiKey="dateAcquired"
                        value={toDateInputValue(lang.dateAcquired)}
                        required
                        labelSize="xs"
                      />
                    </ColHalf>
                    <ColHalf>
                      <Field
                        label="만료일"
                        apiKey="expiryDate"
                        value={toDateInputValue(lang.expiryDate)}
                        labelSize="xs"
                      />
                    </ColHalf>
                  </Row>
                </SectionCompact>
              ))}
            </Spaced>
          )}
        </>
        </SectionBody>
      </Section>

      <Section>
        <SectionTitle>{applySectionTitle("사회활동 경험", "activities")}</SectionTitle>
        {formData.activities.length === 0 ? (
          <Empty>사회활동 경험이 없다면 건너뛰셔도 됩니다</Empty>
        ) : (
          <Spaced gap="md">
            {formData.activities.map((activity, index) => (
              <SectionNested key={index}>
                <BlockTitle>활동 {index + 1}</BlockTitle>
                <Row tight>
                  <ColHalf>
                    <Field
                      label="활동 유형"
                      apiKey="type"
                      value={codeLabel(activity.type, codeOptions.activityType)}
                      required
                      labelSize="xs"
                    />
                  </ColHalf>
                  <ColHalf>
                    <Field
                      label="활동명"
                      apiKey="name"
                      value={activity.name}
                      required
                      labelSize="xs"
                    />
                  </ColHalf>
                  <ColHalf>
                    <Field
                      label="시작연월"
                      apiKey="startDate"
                      value={toMonthInputValue(activity.startDate)}
                      required
                      labelSize="xs"
                    />
                  </ColHalf>
                  <ColHalf>
                    <Field
                      label="종료연월"
                      apiKey="endDate"
                      value={activity.isOngoing ? "" : toMonthInputValue(activity.endDate)}
                      labelSize="xs"
                    />
                  </ColHalf>
                </Row>
                <CheckboxRow>
                  <Checkbox label="진행중" apiKey="ongoing" checked={activity.isOngoing} />
                </CheckboxRow>
                <Field
                  label="활동 내용"
                  apiKey="description"
                  value={activity.description}
                  labelSize="xs"
                  multiline
                  rows={3}
                />
              </SectionNested>
            ))}
          </Spaced>
        )}
      </Section>

      <Section>
        <SectionTitle>자기소개</SectionTitle>
        <Spaced gap="md">
          <Field
            label="성장 과정 및 가치관"
            apiKey="background"
            value={formData.background}
            required
            labelSize="xs"
            multiline
            rows={5}
          />
          <Field
            label="지원 동기 및 입사 후 포부"
            apiKey="motivation"
            value={formData.motivation}
            required
            labelSize="xs"
            multiline
            rows={5}
          />
        </Spaced>
      </Section>

      <Section>
        <SectionTitle>포트폴리오 및 경력기술서</SectionTitle>
        <Spaced gap="md">
          <Field
            label="포트폴리오 URL"
            apiKey="portfolioUrl"
            value={formData.portfolioUrl}
            labelSize="xs"
          />
          {portfolioFiles.length > 0 ? <FileList files={portfolioFiles} /> : null}
        </Spaced>
      </Section>

      <Section>
        <SectionTitle>지원 정보</SectionTitle>
        <SectionBody>
          <Row>
            <ColHalf>
              <Field
                label="입사 가능일"
                apiKey="availableDate"
                value={toDateInputValue(formData.availableDate)}
                required
                labelSize="xs"
              />
            </ColHalf>
            <ColHalf>
              <Field
                label="희망연봉"
                apiKey="desiredSalary"
                value={formData.desiredSalary}
                required
                labelSize="xs"
              />
            </ColHalf>
          </Row>
          <ColFull>
            <Field
              label="채용공고 인지경로"
              apiKey="howDidYouKnow"
              value={
                howDidYouKnowReferrer
                  ? `${howDidYouKnowLabel} (${howDidYouKnowReferrer})`
                  : howDidYouKnowLabel
              }
              required
              labelSize="xs"
            />
          </ColFull>
        </SectionBody>
      </Section>
    </>
  );
}
