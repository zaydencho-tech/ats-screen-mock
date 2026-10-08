import { StyleSheet } from "@react-pdf/renderer";

/**
 * FormStep Tailwind 간격 → pt (px × 72/96)
 * space-y-4 / p-4 = 16px → 12pt | gap-3 / space-y-3 / mb-3 = 12px → 9pt | gap-2 / space-y-2 = 8px → 6pt
 */
export const pdfSpace = {
  sectionGap: 12,
  sectionPad: 12,
  titleGap: 9,
  fieldGap: 9,
  fieldGapSm: 6,
  labelGap: 4,
  labelGapXs: 3,
  nestedPad: 9,
} as const;

/**
 * react-pdf 스타일 규칙 (https://react-pdf.org/styling)
 *
 * - 숫자 단위: pt (기본, 72 dpi PDF)
 * - borderColor: hex 권장 (rgba alpha는 border 렌더 버그 #1491)
 */
export const colors = {
  text: "#020618",
  muted: "#314158",
  primary: "#2b7fff",
  accent: "#4f39f6",
  secondary: "#00bba7",
  white: "#ffffff",
  border: "#ebebed",
  lockedBg: "#f4f7fa",
  nestedBg: "#f6f8fa",
  fileRowBg: "#f4f7fa",
  iconBg: "#eaf2ff",
  militaryAccent: "#bfd9ff",
} as const;

const bordered = {
  borderWidth: 1,
  borderStyle: "solid" as const,
  borderColor: colors.border,
};

export const styles = StyleSheet.create({
  page: {
    fontFamily: "Pretendard",
    fontSize: 10,
    color: colors.text,
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 32,
    backgroundColor: colors.white,
  },
  /** FormStep section p-4 — padding만 동일, paddingBottom 별도 없음 */
  section: {
    ...bordered,
    borderRadius: 6,
    padding: pdfSpace.sectionPad,
    marginBottom: pdfSpace.sectionGap,
    backgroundColor: colors.white,
  },
  /** 섹션 본문 — FormStep space-y-3 / gap-3 */
  sectionBody: {
    gap: pdfSpace.fieldGap,
  },
  sectionNested: {
    ...bordered,
    borderRadius: 6,
    padding: pdfSpace.nestedPad,
    backgroundColor: colors.nestedBg,
    gap: pdfSpace.fieldGapSm,
  },
  sectionCompact: {
    ...bordered,
    borderRadius: 6,
    padding: 8,
    backgroundColor: colors.nestedBg,
    gap: pdfSpace.fieldGapSm,
  },
  header: {
    marginBottom: pdfSpace.sectionGap,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 9,
    color: colors.muted,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: pdfSpace.titleGap,
    color: colors.text,
  },
  blockTitle: {
    fontSize: 10,
    fontWeight: 500,
    marginBottom: 6,
    color: colors.text,
  },
  blockTitleLg: {
    fontSize: 13,
    fontWeight: 500,
    marginBottom: pdfSpace.fieldGapSm,
    color: colors.text,
  },
  blockTitlePrimary: {
    fontSize: 11,
    fontWeight: 500,
    marginBottom: 6,
    color: colors.primary,
  },
  blockTitleAccent: {
    fontSize: 11,
    fontWeight: 500,
    marginBottom: 6,
    color: colors.accent,
  },
  blockTitleSecondary: {
    fontSize: 11,
    fontWeight: 500,
    marginBottom: 6,
    color: colors.secondary,
  },
  itemTitle: {
    fontSize: 9,
    fontWeight: 500,
    marginBottom: 6,
  },
  label: {
    fontSize: 9,
    fontWeight: 500,
    marginBottom: pdfSpace.labelGap,
    color: colors.text,
  },
  labelXs: {
    fontSize: 8,
    fontWeight: 500,
    marginBottom: pdfSpace.labelGapXs,
    color: colors.text,
  },
  valueBox: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.border,
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 10,
    minHeight: 22,
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  valueBoxLocked: {
    backgroundColor: colors.lockedBg,
  },
  valueText: {
    fontSize: 8,
    color: colors.text,
  },
  valueMultilineBox: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 9,
    paddingTop: 7,
    paddingBottom: 5,
    backgroundColor: colors.white,
  },
  valueMultilineText: {
    fontSize: 8,
    lineHeight: 1.35,
  },
  /** FormStep grid gap-3 */
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: pdfSpace.fieldGap,
  },
  /** FormStep nested grid gap-2 */
  rowTight: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: pdfSpace.fieldGapSm,
  },
  colHalf: {
    width: "48%",
  },
  colThird: {
    width: "31%",
  },
  colFull: {
    width: "100%",
  },
  stackSm: { gap: pdfSpace.fieldGapSm },
  stackMd: { gap: pdfSpace.fieldGap },
  stackLg: { gap: pdfSpace.sectionGap },
  empty: {
    paddingVertical: pdfSpace.fieldGap,
    textAlign: "center",
    color: colors.muted,
    fontSize: 8,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxBox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.border,
    borderRadius: 2,
    marginRight: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxBoxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: 8,
  },
  militaryDates: {
    marginLeft: 10,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftStyle: "solid",
    borderLeftColor: colors.militaryAccent,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.fileRowBg,
    marginBottom: 4,
  },
  fileIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.iconBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  textMuted: { fontSize: 8, color: colors.muted },
  textMedium: { fontSize: 8, fontWeight: 500 },
  certBlock: {
    gap: pdfSpace.fieldGapSm,
  },
  photoWrap: {
    width: 54,
    marginBottom: pdfSpace.fieldGap,
  },
  photoBox: {
    width: 54,
    height: 72,
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#E2E8F0",
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
  },
  photoImage: {
    width: 54,
    height: 72,
    objectFit: "cover",
  },
  photoLabel: {
    fontSize: 7,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 3,
  },
});
