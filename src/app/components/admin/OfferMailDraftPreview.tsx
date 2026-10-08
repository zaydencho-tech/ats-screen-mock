import type { OfferMailDraftData } from "../../utils/mapper/offerAdmin";
/** pub_src/offer 템플릿 cid 이미지 자산 */
import headerBannerWithLogo from "../../../imports/mail/01_ITCEN_Header_Banner_with_logo.png";
import headerBanner from "../../../imports/mail/02_ITCEN_Header_Banner.png";
import borderBottom from "../../../imports/mail/03_ITCEN_Border_Bottom.png";

const HEADER_BG = "#168cf4";

interface OfferMailDraftPreviewProps {
  data: OfferMailDraftData;
}

/**
 * 처우협의메일초안template.html 기반 프론트 렌더링.
 * 헤더 배너/하단 보더는 pub_src/offer cid 이미지 자산 사용.
 */
export default function OfferMailDraftPreview({
  data,
}: OfferMailDraftPreviewProps) {
  return (
    <div
      style={{
        backgroundColor: "#f2f4f7",
        padding: "20px",
        borderRadius: "8px",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(15, 23, 43, 0.08)",
        }}
      >
        {/* 헤더 배너 (cid:itcen-header-banner-with-logo + itcen-header-banner) */}
        <div
          style={{
            display: "flex",
            height: "80px",
            backgroundColor: HEADER_BG,
          }}
        >
          <img
            src={headerBannerWithLogo}
            alt="ITCEN"
            width={160}
            height={80}
            style={{ display: "block", width: "160px", height: "80px", flexShrink: 0 }}
          />
          <img
            src={headerBanner}
            alt=""
            height={80}
            style={{
              display: "block",
              flex: 1,
              minWidth: 0,
              height: "80px",
              objectFit: "cover",
            }}
          />
        </div>

        {/* 본문 (email-content) */}
        <div
          style={{
            padding: "30px",
            fontSize: "14px",
            lineHeight: 1.6,
            color: "#0f172b",
            textAlign: "left",
          }}
        >
          {data.greetingLines.map((line, idx) => (
            <p key={`greeting-${idx}`} style={{ margin: 0, minHeight: "1.6em" }}>
              {line}
            </p>
          ))}

          <div style={{ height: "1.6em" }} />

          {data.conditions.map((item, idx) => (
            <p key={`condition-${idx}`} style={{ margin: 0 }}>
              <strong>{item.label}</strong> {item.value}
            </p>
          ))}

          {data.benefits.length > 0 ? (
            <div style={{ marginTop: "4px" }}>
              <p style={{ margin: 0 }}>
                <strong>복리후생</strong>
              </p>
              <ul
                style={{
                  margin: "2px 0 0",
                  paddingLeft: "20px",
                  listStyleType: "disc",
                }}
              >
                {data.benefits.map((benefit, idx) => (
                  <li key={`benefit-${idx}`} style={{ margin: 0 }}>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.notes ? (
            <div style={{ marginTop: "4px" }}>
              <p style={{ margin: 0 }}>
                <strong>특이사항</strong>
              </p>
              {data.notes
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line, idx) => (
                  <p key={`note-${idx}`} style={{ margin: 0 }}>
                    {line}
                  </p>
                ))}
            </div>
          ) : null}

          <div style={{ height: "1.6em" }} />

          {data.deadlineText ? (
            <>
              <p style={{ margin: 0 }}>회신 기한: {data.deadlineText}</p>
              <p style={{ margin: 0 }}>
                기한 내 회신이 어려우신 경우 사전에 알려 주시면 협의 가능합니다.
              </p>
              <div style={{ height: "1.6em" }} />
            </>
          ) : null}

          <p style={{ margin: 0 }}>감사합니다.</p>
          <p style={{ margin: 0 }}>아이티센 채용팀 드림.</p>
        </div>

        {/* 하단 보더 (cid:itcen-border-bottom) */}
        <img
          src={borderBottom}
          alt=""
          height={6}
          style={{ display: "block", width: "100%", height: "6px" }}
        />
      </div>
    </div>
  );
}
