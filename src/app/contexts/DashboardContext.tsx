import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  useDateInputFilterCommit,
  useManagedCorpSelect,
  useRoleScopedEffect,
} from "../hooks";
import Utils from "../utils";
import {
  getKoreaDateInputDaysFromToday,
  getKoreaTodayDateInputValue,
} from "../utils/form/dateInputValue";

type DashboardContextType = {
  selectedCompany: string;
  selectedDashboardCorpId: string | null;
  handleDashboardCorpChange: (corpId: string | null) => void;
  appliedDateFrom: string;
  appliedDateTo: string;
  dateFromInput: string;
  dateToInput: string;
  dateFromFilter: ReturnType<typeof useDateInputFilterCommit>;
  dateToFilter: ReturnType<typeof useDateInputFilterCommit>;
};

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined,
);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const corpSelect = useManagedCorpSelect();
  const { corps: corpOptions } = corpSelect;

  const defaultDateFrom = getKoreaDateInputDaysFromToday(-180);
  const defaultDateTo = getKoreaTodayDateInputValue();

  const [selectedCompany, setSelectedCompany] = useState("all");
  const [appliedDateFrom, setAppliedDateFrom] = useState(defaultDateFrom);
  const [appliedDateTo, setAppliedDateTo] = useState(defaultDateTo);
  const [dateFromInput, setDateFromInput] = useState(defaultDateFrom);
  const [dateToInput, setDateToInput] = useState(defaultDateTo);

  const dateFromFilter = useDateInputFilterCommit(
    dateFromInput,
    setDateFromInput,
    setAppliedDateFrom,
  );
  const dateToFilter = useDateInputFilterCommit(
    dateToInput,
    setDateToInput,
    setAppliedDateTo,
  );

  const selectedDashboardCorpId = useMemo(() => {
    if (selectedCompany === "all") return null;
    return (
      corpOptions.find(
        (corp) =>
          Utils.Mapper.managedCorpSelect.toDashboardCorpKey(corp) ===
          selectedCompany,
      )?.corpId ?? null
    );
  }, [selectedCompany, corpOptions]);

  const handleDashboardCorpChange = useCallback(
    (corpId: string | null) => {
      if (!corpId) {
        setSelectedCompany("all");
        return;
      }

      const corp = Utils.Mapper.managedCorpSelect.findManagedCorpBySelection(
        corpOptions,
        corpId,
      );
      setSelectedCompany(
        corp
          ? Utils.Mapper.managedCorpSelect.toDashboardCorpKey(corp)
          : "all",
      );
    },
    [corpOptions],
  );

  useRoleScopedEffect(() => {
    setSelectedCompany((prev) =>
      Utils.Mapper.managedCorpSelect.resolveDefaultDashboardCorpKey(
        corpOptions,
        prev,
      ),
    );
  }, [corpOptions]);

  const value = useMemo(
    () => ({
      selectedCompany,
      selectedDashboardCorpId,
      handleDashboardCorpChange,
      appliedDateFrom,
      appliedDateTo,
      dateFromInput,
      dateToInput,
      dateFromFilter,
      dateToFilter,
    }),
    [
      selectedCompany,
      selectedDashboardCorpId,
      handleDashboardCorpChange,
      appliedDateFrom,
      appliedDateTo,
      dateFromInput,
      dateToInput,
      dateFromFilter,
      dateToFilter,
    ],
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
