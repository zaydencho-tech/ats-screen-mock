import type { ReactNode } from "react";

export interface ApplyPdfKit {
  Header: (props: { title: string; subtitle?: string }) => ReactNode;
  Section: (props: { children: ReactNode }) => ReactNode;
  SectionNested: (props: { children: ReactNode }) => ReactNode;
  SectionCompact: (props: { children: ReactNode }) => ReactNode;
  SectionTitle: (props: { children: ReactNode }) => ReactNode;
  BlockTitle: (props: { children: ReactNode }) => ReactNode;
  BlockTitleLg: (props: { children: ReactNode }) => ReactNode;
  ItemTitle: (props: { children: ReactNode }) => ReactNode;
  Empty: (props: { children: ReactNode }) => ReactNode;
  SectionBody: (props: { children: ReactNode }) => ReactNode;
  Row: (props: { children: ReactNode; tight?: boolean }) => ReactNode;
  ColHalf: (props: { children: ReactNode }) => ReactNode;
  ColThird: (props: { children: ReactNode }) => ReactNode;
  ColFull: (props: { children: ReactNode }) => ReactNode;
  Spaced: (props: { gap?: "sm" | "md" | "lg"; children: ReactNode }) => ReactNode;
  CheckboxRow: (props: { children: ReactNode }) => ReactNode;
  MilitaryDates: (props: { children: ReactNode }) => ReactNode;
  Field: (props: {
    label: string;
    apiKey: string;
    value: string;
    required?: boolean;
    locked?: boolean;
    labelSize?: "sm" | "xs";
    multiline?: boolean;
    rows?: number;
  }) => ReactNode;
  Checkbox: (props: { label: string; apiKey: string; checked: boolean }) => ReactNode;
  CertBlock: (props: { children: ReactNode }) => ReactNode;
  FileList: (props: {
    files: { name: string; size?: string }[];
  }) => ReactNode;
  ApplicantPhoto: (props: { photoUrl: string }) => ReactNode;
}
