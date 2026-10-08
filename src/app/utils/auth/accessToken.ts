let accessTokenMemory: string | null = null;

export function getAccessTokenMemory() {
  return accessTokenMemory;
}

export function setAccessTokenMemory(token: string) {
  accessTokenMemory = token;
}

export function clearAccessTokenMemory() {
  accessTokenMemory = null;
}

