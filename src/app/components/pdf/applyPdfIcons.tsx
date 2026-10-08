import { Path, Svg } from "@react-pdf/renderer";
import { colors } from "./styles";

/** Lucide FileText (24×24, stroke 2) — FormStep 첨부파일 아이콘과 동일 */
export function FileTextIcon({
  size = 12,
  color = colors.primary,
}: {
  size?: number;
  color?: string;
}) {
  const strokeProps = {
    stroke: color,
    strokeWidth: 2,
    fill: "none" as const,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" {...strokeProps} />
      <Path d="M14 2v4a2 2 0 0 0 2 2h4" {...strokeProps} />
      <Path d="M10 9H8" {...strokeProps} />
      <Path d="M16 13H8" {...strokeProps} />
      <Path d="M16 17H8" {...strokeProps} />
    </Svg>
  );
}
