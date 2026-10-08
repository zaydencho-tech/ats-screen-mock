import AxiosInstance from "../axiosInstance";

/** [공개] 입사 지원 개인정보 동의 약관 조회 */
const GetPublicConsent = () => {
  return AxiosInstance.get("policy/public/consent");
};

const Policy = {
  GetPublicConsent,
};

export default Policy;
