import { useCallback, useState } from "react";
import type { CompFieldResponse } from "../api/offers";
import type {
  OfferPackage,
  OfferPackageFormValues,
} from "../types/admin/offer";
import Utils from "../utils";

export const EMPTY_OFFER_PACKAGE_FORM: OfferPackageFormValues = {
  baseSalary: "",
  includeMealAllowance: true,
  jobGradeCd: "",
  posGrade: "",
  deptName: "",
  careerYears: "",
  workLocation: "",
  startDate: "",
  benefits: [],
  notes: "",
};

export function useOfferPackageForm(
  initial: OfferPackageFormValues = EMPTY_OFFER_PACKAGE_FORM,
) {
  const [values, setValues] = useState<OfferPackageFormValues>(initial);
  const [benefitInput, setBenefitInput] = useState("");

  const patchValues = useCallback((patch: Partial<OfferPackageFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
  }, []);

  const applyFromPackage = useCallback((pkg: OfferPackage | null | undefined) => {
    if (!pkg) return;

    setValues({
      baseSalary: pkg.baseSalary ?? "",
      includeMealAllowance: pkg.includeMealAllowance ?? true,
      jobGradeCd: pkg.jobGradeCd ?? "",
      posGrade: pkg.posGrade ?? "",
      deptName: pkg.deptName ?? "",
      careerYears: pkg.careerYears != null ? pkg.careerYears : "",
      workLocation: pkg.workLocation ?? "",
      startDate: pkg.startDate ?? "",
      benefits: pkg.benefits?.length ? [...pkg.benefits] : [],
      notes: pkg.notes ?? "",
    });
    setBenefitInput("");
  }, []);

  const addBenefitTag = useCallback((tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;

    setValues((prev) => ({
      ...prev,
      benefits: prev.benefits.includes(trimmed)
        ? prev.benefits
        : [...prev.benefits, trimmed],
    }));
    setBenefitInput("");
  }, []);

  const removeBenefitTag = useCallback((index: number) => {
    setValues((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  }, []);

  const buildSaveRequest = useCallback(
    (allowedFields?: CompFieldResponse[]) => {
      const salary = values.baseSalary === "" ? null : values.baseSalary;
      const baseSalary =
        salary != null && Number.isFinite(salary) ? salary : null;

      return Utils.Mapper.offerAdmin.buildOfferPackageSaveRequest({
        baseSalary,
        includeMealAllowance: values.includeMealAllowance,
        jobGradeCd: values.jobGradeCd,
        posGrade: values.posGrade,
        deptName: values.deptName,
        careerYears: values.careerYears === "" ? null : values.careerYears,
        workLocation: values.workLocation,
        startDate: values.startDate,
        benefits: values.benefits,
        notes: values.notes,
        allowedFields,
      });
    },
    [values],
  );

  return {
    values,
    benefitInput,
    setBenefitInput,
    patchValues,
    applyFromPackage,
    addBenefitTag,
    removeBenefitTag,
    buildSaveRequest,
    setValues,
  };
}
