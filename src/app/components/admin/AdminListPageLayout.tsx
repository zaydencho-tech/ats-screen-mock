import { motion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

/** 관리자 상단 헤더 높이(Root.tsx) */
export const ADMIN_HEADER_HEIGHT_PX = 54;

/** 뷰포트를 넘지 않되, 목록이 적을 때는 콘텐츠 높이만큼만 차지 */
export const ADMIN_LIST_PAGE_CONTAINER_STYLE: CSSProperties = {
  maxHeight: `calc(100vh - ${ADMIN_HEADER_HEIGHT_PX}px)`,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  paddingTop: "24px",
  paddingBottom: "24px",
  boxSizing: "border-box",
};

export const ADMIN_LIST_PAGE_CONTENT_STYLE: CSSProperties = {
  flex: "1 1 auto",
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

/** 테이블 카드 래퍼 — 남은 공간을 받되, 내용이 적으면 늘어나지 않음 */
export const ADMIN_LIST_TABLE_REGION_STYLE: CSSProperties = {
  flex: "1 1 auto",
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
};

export const ADMIN_LIST_TABLE_CARD_STYLE: CSSProperties = {
  flex: "0 1 auto",
  maxHeight: "100%",
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

/** 부모가 높이 제한될 때만 스크롤, 적을 때는 행 높이만큼만 */
export const ADMIN_LIST_TABLE_BODY_SCROLL_STYLE: CSSProperties = {
  flex: "1 1 auto",
  minHeight: 0,
  overflowY: "auto",
  overflowX: "auto",
};

type AdminListPageLayoutProps = {
  children: ReactNode;
};

export default function AdminListPageLayout({
  children,
}: AdminListPageLayoutProps) {
  return (
    <div className="container mx-auto px-6" style={ADMIN_LIST_PAGE_CONTAINER_STYLE}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={ADMIN_LIST_PAGE_CONTENT_STYLE}
      >
        {children}
      </motion.div>
    </div>
  );
}
