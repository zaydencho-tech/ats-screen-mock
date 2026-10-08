import { Children, type ReactNode } from "react";
import { Path, Svg, Text, View } from "@react-pdf/renderer";
import { applyFieldLabel } from "../step/apply/applyFieldLabel";
import { pdfPageLayout } from "./applyPdfPageLayout";
import { colors, styles } from "./styles";

/** Pretendard에 U+2713 글리프 없음 → Svg Path로 흰 체크 표시 */
function CheckboxMark() {
  return (
    <Svg width={7} height={7} viewBox="0 0 10 10">
      <Path
        d="M1.8 5.2 L4.2 7.6 L8.4 2.8"
        stroke={colors.white}
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * multiline — border·padding을 Text에 직접 적용해 페이지 넘김 (#3298)
 */
export function Field({
  label,
  apiKey,
  value,
  required,
  locked,
  labelSize = "sm",
  multiline,
  rows = 5,
}: {
  label: string;
  apiKey: string;
  value: string;
  required?: boolean;
  locked?: boolean;
  labelSize?: "sm" | "xs";
  multiline?: boolean;
  rows?: number;
}) {
  const labelStyle = labelSize === "xs" ? styles.labelXs : styles.label;
  const displayValue = value || " ";

  if (multiline) {
    return (
      <View wrap>
        <Text style={labelStyle}>{applyFieldLabel(label, apiKey, { required })}</Text>
        <View
          style={[
            styles.valueMultilineBox,
            ...(locked ? [styles.valueBoxLocked] : []),
          ]}
          wrap
        >
          <Text
            style={styles.valueMultilineText}
            orphans={2}
            widows={2}
          >
            {displayValue}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View wrap={false}>
      <Text style={labelStyle}>{applyFieldLabel(label, apiKey, { required })}</Text>
      <View style={[styles.valueBox, ...(locked ? [styles.valueBoxLocked] : [])]}>
        <Text style={styles.valueText}>{displayValue}</Text>
      </View>
    </View>
  );
}

export function Checkbox({
  label,
  apiKey,
  checked,
}: {
  label: string;
  apiKey: string;
  checked: boolean;
}) {
  return (
    <View style={styles.checkboxItem} wrap={false}>
      <View
        style={[styles.checkboxBox, ...(checked ? [styles.checkboxBoxChecked] : [])]}
      >
        {checked ? <CheckboxMark /> : null}
      </View>
      <Text style={styles.checkboxLabel}>{applyFieldLabel(label, apiKey)}</Text>
    </View>
  );
}

export function Spaced({
  gap = "md",
  children,
}: {
  gap?: "sm" | "md" | "lg";
  children: ReactNode;
}) {
  const gapStyle =
    gap === "sm" ? styles.stackSm : gap === "lg" ? styles.stackLg : styles.stackMd;
  const items = Children.toArray(children).filter(Boolean);
  return <View style={gapStyle}>{items}</View>;
}

export function SectionBody({ children }: { children: ReactNode }) {
  return <View style={styles.sectionBody}>{children}</View>;
}

/** Row는 breakable — 페이지 경계에서 Col 단위로 넘어감 */
export function Row({
  children,
  tight = false,
}: {
  children: ReactNode;
  tight?: boolean;
}) {
  return <View style={tight ? styles.rowTight : styles.row}>{children}</View>;
}

/** 열 단위로 페이지 넘김 (Row 전체를 wrap={false}로 묶지 않음) */
export function ColHalf({ children }: { children: ReactNode }) {
  return (
    <View wrap={false} minPresenceAhead={pdfPageLayout.colMinPresenceAhead} style={styles.colHalf}>
      {children}
    </View>
  );
}

export function ColThird({ children }: { children: ReactNode }) {
  return (
    <View wrap={false} minPresenceAhead={pdfPageLayout.colMinPresenceAhead} style={styles.colThird}>
      {children}
    </View>
  );
}

export function ColFull({ children }: { children: ReactNode }) {
  return <View style={styles.colFull}>{children}</View>;
}
