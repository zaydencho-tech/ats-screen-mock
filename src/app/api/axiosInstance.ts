import axios from "axios";
export default axios.create({ baseURL: "/__ats_fixture__/", adapter: window.__ATS_PREVIEW__.adapter });
