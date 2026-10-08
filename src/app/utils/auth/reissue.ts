import axios from "axios";
import { persistAuthSession } from "./token";

export async function reissueWithCookie() {
  const baseURL = String(import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
  const res = await axios.post(
    `${baseURL}/auth/reissue`,
    undefined,
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    },
  );

  const resData = res.data as any;
  const tokenData = resData?.data ?? resData;

  const nestedToken =
    tokenData?.token && typeof tokenData.token === "object"
      ? tokenData.token
      : null;

  const newAccessToken: unknown =
    nestedToken?.access_token ??
    tokenData?.access_token ??
    tokenData?.accessToken;
  const newRefreshToken: unknown =
    nestedToken?.refresh_token ??
    tokenData?.refresh_token ??
    tokenData?.refreshToken;

  if (typeof newAccessToken !== "string" || !newAccessToken) {
    throw new Error("Reissue did not return access_token");
  }

  const session = {
    access_token: newAccessToken,
    refresh_token:
      typeof newRefreshToken === "string" && newRefreshToken
        ? newRefreshToken
        : undefined,
  };

  // 메모리 + localStorage 동기화 (새로고침 후 로그인 유지)
  persistAuthSession(session);

  return session;
}

