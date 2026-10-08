import * as application from "./application";
import * as job from "./job";
import * as jobPostAdmin from "./jobPostAdmin";
import * as corp from "./corp";
import * as member from "./member";
import * as policy from "./policy";
import * as resumeAnalyze from "./resumeAnalyze";
import * as applicationStatus from "./applicationStatus";
import * as agentGo from "./agentGo";
import * as applicantList from "./applicantList";
import * as documentScreening from "./documentScreening";
import * as applicationFormView from "./applicationFormView";
import * as managedCorpSelect from "./managedCorpSelect";
import * as template from "./template";
import * as memberSearch from "./memberSearch";
import * as fileUpload from "./fileUpload";
import * as interviewAdmin from "./interviewAdmin";
import * as offerAdmin from "./offerAdmin";
import * as dashboard from "./dashboard";

const Mapper = {
  application,
  applicationStatus,
  job,
  jobPostAdmin,
  corp,
  member,
  policy,
  resumeAnalyze,
  agentGo,
  applicantList,
  documentScreening,
  applicationFormView,
  managedCorpSelect,
  template,
  memberSearch,
  fileUpload,
  interviewAdmin,
  offerAdmin,
  dashboard,
};

export default Mapper;
