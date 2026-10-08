import AxiosInstance from "../axiosInstance";

// [POST] 법인 등록을 위한 Request Body 인터페이스
export interface CorpCreateBody {
  corpCd: string;
  corpName: string;
  isActive: number;
}

// [PUT] 법인 수정을 위한 Request Body 인터페이스 (이름과 활성화 상태만 필요)
export interface CorpUpdateBody {
  corpName: string;
  isActive: number;
}

// [관리자] 법인 목록 조회
const GetAdminCorpsList = () => {
  return AxiosInstance.get("corp");
};

const CreateCorp = (body: CorpCreateBody) => {
  return AxiosInstance.post("corp", body);
};

const UpdateCorp = (id: string | number, body: CorpUpdateBody) => {
  return AxiosInstance.put(`corp/${id}`, body);
};

const DeleteCorp = (id: string | number) => {
  return AxiosInstance.delete(`corp/${id}`);
};

const Corp = {
  GetAdminCorpsList,
  CreateCorp,
  UpdateCorp,
  DeleteCorp,
};

export default Corp;