import { Image, Text, View } from "@react-pdf/renderer";
import {
  Checkbox,
  ColFull,
  ColHalf,
  ColThird,
  Field,
  Row,
  SectionBody,
  Spaced,
} from "./applyPdfFields";
import { FileTextIcon } from "./applyPdfIcons";
import { pdfPageLayout } from "./applyPdfPageLayout";
import type { ApplyPdfKit } from "./applyPdfKit";
import { styles } from "./styles";

/** @react-pdf/renderer View/Text 기반 kit */
export const reactPdfKit: ApplyPdfKit = {
  Header: ({ title, subtitle }) => (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  ),
  Section: ({ children }) => <View style={styles.section}>{children}</View>,
  SectionNested: ({ children }) => <View style={styles.sectionNested}>{children}</View>,
  SectionCompact: ({ children }) => (
    <View style={styles.sectionCompact} wrap>
      {children}
    </View>
  ),
  SectionTitle: ({ children }) => (
    <Text
      style={styles.sectionTitle}
      minPresenceAhead={pdfPageLayout.sectionTitleMinPresenceAhead}
    >
      {children}
    </Text>
  ),
  BlockTitle: ({ children }) => <Text style={styles.blockTitle}>{children}</Text>,
  BlockTitleLg: ({ children }) => <Text style={styles.blockTitleLg}>{children}</Text>,
  ItemTitle: ({ children }) => <Text style={styles.itemTitle}>{children}</Text>,
  Empty: ({ children }) => <Text style={styles.empty}>{children}</Text>,
  SectionBody,
  Row,
  ColHalf,
  ColThird,
  ColFull,
  Spaced,
  CheckboxRow: ({ children }) => <View style={styles.checkboxRow}>{children}</View>,
  MilitaryDates: ({ children }) => (
    <View style={styles.militaryDates} wrap>
      {children}
    </View>
  ),
  Field,
  Checkbox,
  CertBlock: ({ children }) => <View style={styles.certBlock}>{children}</View>,
  FileList: ({ files }) => (
    <View>
      <Text style={styles.labelXs}>파일 첨부</Text>
      {files.map((file, index) => (
        <View key={index} style={styles.fileRow} wrap={false}>
          <View style={styles.fileIcon}>
            <FileTextIcon size={12} />
          </View>
          <View>
            <Text style={styles.textMedium}>{file.name}</Text>
            {file.size ? <Text style={styles.textMuted}>{file.size}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  ),
  ApplicantPhoto: ({ photoUrl }) => (
    <View style={styles.photoWrap} wrap={false}>
      <View style={styles.photoBox}>
        <Image src={photoUrl} style={styles.photoImage} />
      </View>
      <Text style={styles.photoLabel}>증명사진</Text>
    </View>
  ),
};
