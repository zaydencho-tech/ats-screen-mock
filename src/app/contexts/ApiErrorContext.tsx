import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Toaster, toast } from "sonner";
import Utils from "../utils";
import type { ApiErrorDetail } from "../utils/api/error";

interface ApiErrorContextType {
  lastError: ApiErrorDetail | null;
  clearError: () => void;
}

const ApiErrorContext = createContext<ApiErrorContextType | undefined>(
  undefined,
);

export function ApiErrorProvider({ children }: { children: ReactNode }) {
  const [lastError, setLastError] = useState<ApiErrorDetail | null>(null);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  useEffect(() => {
    return Utils.Api.errorEvents.onApiError((detail) => {
      setLastError(detail);
      toast.error(Utils.Api.error.formatApiErrorMessage(detail));
    });
  }, []);

  return (
    <ApiErrorContext.Provider value={{ lastError, clearError }}>
      {children}
      <Toaster
        className="api-error-toaster"
        richColors
        closeButton
        position="top-center"
      />
    </ApiErrorContext.Provider>
  );
}

export function useApiError() {
  const context = useContext(ApiErrorContext);
  if (context === undefined) {
    throw new Error("useApiError must be used within an ApiErrorProvider");
  }
  return context;
}
