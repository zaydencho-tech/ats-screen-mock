import { useState, useRef, useEffect, type ReactNode } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import itcenLogo from "../../imports/01_ITCEN_Logo_Basic.png";

const ITCEN_FAMILY_GROUPS: { name: string; url: string }[][] = [
  [
    { name: "ITCEN GLOBAL",  url: "https://www.itcen.com/" },
    { name: "ITCEN CTS",     url: "https://www.itcencts.com/" },
    { name: "ITCEN ENTEC",   url: "https://www.itcentec.com/" },
    { name: "ITCEN PNS",     url: "https://www.itcenpns.com/" },
    { name: "ITCEN CLOIT",   url: "https://www.itcencloit.com/" },
    { name: "C PLATFORM",    url: "https://cplatform.co.kr/" },
    { name: "ITCEN IN4U",    url: "https://in4ucloud.com/" },
    { name: "ITCEN CORE",    url: "https://www.itcencore.com/" },
    { name: "WITHCEN",       url: "https://www.withcen.com/" },
  ],
  [
    { name: "ITCEN JAPAN",     url: "https://www.itcen.jp/" },
    { name: "투케이엠시스템즈", url: "https://twokm.co.kr/" },
  ],
  [
    { name: "한국금거래소",         url: "https://www.koreagoldx.co.kr/" },
    { name: "한국금거래소디지털에셋", url: "https://korda.im/" },
    { name: "크레더",              url: "https://creder.biz/" },
  ],
  [
    { name: "한국금거래소 FTC", url: "http://exgoldftc.co.kr/" },
    { name: "비피엠지",        url: "https://www.bpmg.io/" },
  ],
];

function PolicyModal({
  label,
  title,
  content,
  labelStyle,
}: {
  label: string;
  title: string;
  content: ReactNode;
  labelStyle?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit", ...labelStyle }}
      >
        {label}
      </button>
      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 10001, backgroundColor: "rgba(2,6,24,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{ background: "#fff", borderRadius: "10px", width: "min(900px, 96vw)", maxHeight: "82vh", display: "flex", flexDirection: "column", boxShadow: "0 12px 48px rgba(2,6,24,0.18)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#020618", margin: 0 }}>{title}</h2>
              <button type="button" onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "1.1rem", lineHeight: 1, padding: "2px 4px" }}>✕</button>
            </div>
            <div style={{ padding: "20px 24px", overflowY: "auto", fontSize: "0.8125rem", lineHeight: 1.85, color: "#314158" }}>
              {content}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const TERMS_CONTENT = (
  <div style={{ fontSize: "0.8125rem", lineHeight: 1.8, color: "#314158" }}>
    {(
      [
        ["제1조 (목적)",
          <div key="1">
            <p style={{ marginBottom: "8px" }}>본 약관은 아이티센 채용 홈페이지(https://recruit.itcen.com)(이하 "사이트")를 통해 채용을 실시하는 아이티센 그룹사(이하 "회사")가 제공하는 온라인 입사지원 서비스를 이용함에 있어 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 한다.</p>
            <details>
              <summary style={{ color: "#2563eb", cursor: "pointer", userSelect: "none" as const }}>▶ 아이티센 그룹사 리스트 (보기)</summary>
              <p style={{ marginTop: "6px", paddingLeft: "12px", color: "#64748b", fontSize: "0.75rem" }}>㈜아이티센글로벌, ㈜아이티센엔텍, ㈜아이티센씨티에스, ㈜아이티센클로잇, ㈜아이티센피엔에스, ㈜아이티센코어, ㈜씨플랫폼</p>
            </details>
          </div>
        ],
        ["제2조 (정의)",
          <div key="2">
            <p style={{ marginBottom: "4px" }}>1. "사이트"란 회사가 이용자에게 서비스를 제공하기 위하여 컴퓨터 등 정보통신설비를 이용하여 구성한 가상의 공간을 의미한다.</p>
            <p style={{ marginBottom: "4px" }}>2. "서비스"란 본 사이트를 통해 제공하는 회사 입사지원에 관한 일체의 서비스를 의미한다.</p>
            <p>3. "이용자"란 사이트에 접속하여 회사가 제공하는 서비스를 받는 자를 의미한다.</p>
          </div>
        ],
        ["제3조 (약관의 효력 및 변경)",
          <div key="3">
            <p style={{ marginBottom: "4px" }}>1. 약관의 효력: 본 약관은 사이트를 통하여 공지됨과 동시에 효력을 발생한다.</p>
            <p>2. 약관의 변경: 회사는 본 약관을 개정할 경우에 개정된 약관을 적용하고자 하는 날(이하 "효력발생일") 7일 이전에 사이트에 공지함으로써 약관을 변경할 수 있다. 다만, 약관의 변경 내용이 이용자에게 중대하거나 불리한 경우에는 효력발생일의 30일 이전에 공지하여야 한다.</p>
          </div>
        ],
        ["제4조 (약관 외 준칙)",
          <div key="4">
            <p style={{ marginBottom: "4px" }}>1. 회사는 필요한 경우 별도로 운영정책을 공지·안내할 수 있으며, 본 약관과 운영정책이 중첩될 경우 운영정책이 우선 적용된다.</p>
            <p>2. 본 약관에 규정되지 않은 사항에 대해서는 관계법령에 따른다.</p>
          </div>
        ],
        ["제5조 (개인정보보호)",
          <div key="5">
            <p style={{ marginBottom: "4px" }}>1. 본 사이트는 회원가입 기능을 제공하지 않으며, 사이트 이용(입사지원 정보의 보관 등)과 관련된 부분은 회사의 개인정보처리방침을 따른다.</p>
            <p style={{ marginBottom: "4px" }}>2. 회사는 관계법령이 정하는 바에 따라 본 사이트 이용자의 개인정보를 보호하기 위하여 노력한다. 이용자 개인정보의 보호 및 사용에 대해서는 관계법령 및 회사의 개인정보처리방침이 적용된다. 단, 이용자의 귀책 사유로 인해 노출된 정보에 대해 회사는 일체의 책임을 지지 않는다.</p>
            <p>3. 회사는 서비스 제공을 위해 수집한 이용자의 개인정보를 본인 동의 없이 제3자에게 배포, 제공하는 등 외부로 유출하지 않는다. 단, 적법한 절차를 거친 국가기관의 요구나 기타 공익을 위해 필요하다고 인정되는 경우는 예외로 한다.</p>
          </div>
        ],
        ["제6조 (이용계약의 성립)",
          <div key="6">
            <p style={{ marginBottom: "4px" }}>1. 이용계약은 이용자의 본 약관 내용에 대한 동의로 성립한다.</p>
            <p>2. 본 약관에 대한 동의는 입사지원 단계에서 "ITCEN 채용시스템 이용약관"을 읽고 좌측 체크박스를 선택함으로써 의사표시한 것으로 간주한다.</p>
          </div>
        ],
        ["제7조 (이메일 인증)",
          <div key="7">
            <p style={{ marginBottom: "4px" }}>1. 회사는 입사지원 단계에서 이용자의 본인 확인 및 부정 지원 방지를 위해 이메일 인증 절차를 운영한다.</p>
            <p style={{ marginBottom: "4px" }}>2. 이용자의 이메일 인증이 정상적으로 완료되지 않은 경우, 입사지원이 제한된다.</p>
            <p style={{ marginBottom: "4px" }}>3. 이용자가 잘못된 이메일 정보를 입력하여 발생한 불이익(인증 실패, 지원서 미접수 등)에 대해 회사는 일체의 책임을 지지 않는다.</p>
            <p>4. 이용자가 타인의 이메일 주소를 무단 도용하는 등 부정 사용이 발생한 경우, 회사는 당해 이용자의 입사지원을 제한하거나 취소할 수 있다.</p>
          </div>
        ],
        ["제8조 (서비스의 제공 및 변경)",
          <div key="8">
            <p style={{ marginBottom: "4px" }}>1. 회사는 이용자에게 다음의 서비스를 제공한다.</p>
            <p style={{ marginBottom: "2px", paddingLeft: "12px" }}>(1) 회사의 채용 정보</p>
            <p style={{ marginBottom: "2px", paddingLeft: "12px" }}>(2) 온라인 입사지원 및 지원현황 조회 서비스</p>
            <p style={{ marginBottom: "8px", paddingLeft: "12px" }}>(3) 챗봇 상담 및 1:1 문의 서비스</p>
            <p>2. 회사는 필요한 경우, 서비스의 내용을 추가 또는 변경하여 제공할 수 있다.</p>
          </div>
        ],
        ["제9조 (서비스의 이용시간)",
          <p key="9">서비스 이용은 회사의 업무상 또는 기술상 특별한 지장이 없는 한 연중무휴, 1일 24시간을 원칙으로 한다. 단, 회사는 시스템 정기점검, 증설 및 교체를 위해 회사가 정한 날이나 시간에 서비스를 일시중단할 수 있으며, 예정된 작업으로 인한 서비스 일시 중단은 사이트를 통해 사전에 공지한다.</p>
        ],
        ["제10조 (서비스의 중단)",
          <div key="10">
            <p style={{ marginBottom: "4px" }}>1. 회사는 다음 경우에 대하여 사전 공지나 예고 없이 서비스를 일시적 혹은 영구적으로 중단할 수 있다.</p>
            <p style={{ marginBottom: "2px", paddingLeft: "12px" }}>(1) 긴급한 시스템 점검, 증설, 교체, 고장 혹은 오동작을 일으키는 경우</p>
            <p style={{ marginBottom: "2px", paddingLeft: "12px" }}>(2) 국가비상사태, 정전, 천재지변 등의 불가항력적인 사유가 있는 경우</p>
            <p style={{ marginBottom: "2px", paddingLeft: "12px" }}>(3) 전기통신사업법에 규정된 기간통신사업자가 전기통신 서비스를 중지한 경우</p>
            <p style={{ marginBottom: "8px", paddingLeft: "12px" }}>(4) 서비스 이용의 폭주 등으로 정상적인 서비스 이용에 지장이 있는 경우</p>
            <p style={{ marginBottom: "4px" }}>2. 제 1항에 의한 서비스 중단의 경우 회사는 사전에 공지사항 등을 통하여 이용자에게 통지한다. 단, 회사가 통제할 수 없는 사유로 발생한 서비스의 중단에 대하여 사전공지가 불가능한 경우에는 사후공지로 대신한다.</p>
            <p>3. 회사는 제 1항의 사유로 서비스의 제공이 중단됨으로 인하여 이용자가 입은 손해에 대하여 배상하지 않는다. 단, 회사에 고의 또는 중과실이 있는 경우에는 그러하지 아니한다.</p>
          </div>
        ],
        ["제11조 (서비스의 이용 제한)",
          <div key="11">
            <p style={{ marginBottom: "8px" }}>이용자는 다음에 해당하는 행위를 하여서는 아니되며, 해당 행위를 한 경우에 회사는 이용자의 서비스 이용 제한 및 적법한 조치를 할 수 있다.</p>
            {[
              "타인의 사이트 이용을 방해하거나 정보를 도용하는 행위",
              "사이트의 운영진, 직원 또는 관계자를 사칭하는 행위",
              "회사, 기타 제3자의 인격권 또는 지적재산권을 침해하거나 업무를 방해하는 행위",
              "다른 이용자의 개인정보를 그 동의 없이 수집, 저장, 공개하는 행위",
              "범죄와 결부된다고 객관적으로 판단되는 행위",
              "본 약관에 저촉되거나 기타 관계법령에 위배되는 행위",
            ].map((t, i) => (
              <p key={i} style={{ marginBottom: "4px", paddingLeft: "12px" }}>({i + 1}) {t}</p>
            ))}
          </div>
        ],
        ["제12조 (회사의 의무)",
          <div key="12">
            <p style={{ marginBottom: "4px" }}>1. 회사는 본 약관에서 정한 바에 따라 계속적으로, 안정적으로 서비스를 제공하기 위해서 노력해야 한다.</p>
            <p style={{ marginBottom: "4px" }}>2. 회사는 서비스에 관련된 설비를 항상 운용할 수 있는 상태로 유지·보수하고, 장애가 발생하는 경우 지체없이 이를 수리·복구하기 위해 노력해야 한다.</p>
            <p style={{ marginBottom: "4px" }}>3. 회사는 이용자가 안전하게 서비스를 이용할 수 있도록 이용자의 개인정보보호를 위한 보안 시스템을 갖추어야 한다.</p>
            <p style={{ marginBottom: "4px" }}>4. 회사는 이용자가 원하지 않는 영리 목적의 광고성 전자우편을 발송하지 않는다.</p>
            <p>5. 회사는 이용자로부터 제기되는 의견이나 불만이 정당하다고 객관적으로 인정될 경우에는 적절한 절차를 거쳐 가급적 빨리 처리하여야 한다. 다만, 신속한 처리가 곤란한 경우에는 사후에 공지하거나 이용자에게 전자우편(이메일) 또는 유선을 통해 그 사유와 처리일정을 통보해야 한다.</p>
          </div>
        ],
        ["제13조 (이용자의 의무)",
          <div key="13">
            <p style={{ marginBottom: "4px" }}>1. 이용자는 본 약관에서 규정하는 사항과 회사가 정한 제반 규정, 공지사항 및 운영정책 등 회사가 공지하는 사항, 관계법령을 준수하여야 하며 기타 회사의 업무에 방해가 되는 행위와 회사의 명예를 손상하는 행위를 해서는 아니된다.</p>
            <p style={{ marginBottom: "4px" }}>2. 이용자는 회사의 명시적 동의가 없는 한 서비스의 이용권한 및 기타 이용계약 상의 지위를 타인에게 양도, 증여할 수 없으며 이를 담보로 제공할 수 없다.</p>
            <p style={{ marginBottom: "4px" }}>3. 이용자는 회사의 사이트 및 제3자의 지적 재산권을 침해해서는 아니된다.</p>
            <p>4. 이용자는 입사지원 시 모든 사항을 사실에 근거하여 작성하여야 하며, 허위로 등록하거나 타인의 정보를 도용해서는 아니된다.</p>
          </div>
        ],
        ["제14조 (게시물의 관리)",
          <div key="14">
            <p style={{ marginBottom: "4px" }}>1. 이용자가 사이트 내에 게시한 게시물(지원서, 1:1문의, 포트폴리오, 증빙서류 등)의 저작권을 포함한 모든 권리 및 책임은 이를 게시한 이용자에게 있다.</p>
            <p style={{ marginBottom: "4px" }}>2. 회사는 사이트 내에 게시되거나 저장된 자료를 성실히 관리해야 한다. 다만, 다음에 해당하는 게시물이나 자료의 경우 이용자에게 경고 후 삭제 또는 수정 조치할 수 있다.</p>
            {[
              "다른 이용자 또는 제3자에게 모욕을 주거나 명예를 손상하는 게시물",
              "공공질서 및 미풍양속에 위반되는 내용을 유포하거나 링크가 포함된 게시물",
              "불법 복제 또는 해킹을 조장하는 게시물",
              "영리를 목적으로 하는 광고 게시물",
              "범죄와 결부된다고 객관적으로 인정되는 게시물",
              "다른 이용자 또는 제3자의 저작권 등 기타 권리를 침해하는 게시물",
              "기타 본 약관 또는 관계법령에 위배된다고 판단되는 게시물",
            ].map((t, i) => (
              <p key={i} style={{ marginBottom: "2px", paddingLeft: "12px" }}>({i + 1}) {t}</p>
            ))}
            <p style={{ marginTop: "8px", marginBottom: "4px" }}>3. 방송통신심의위원회 등 공공기관이 있는 경우, 회사는 이용자에게 사전 통지 없이 게시물을 삭제하거나 이동할 수 있다.</p>
            <p>4. 회사는 게시물 등에 대하여 제3자로부터 명예훼손, 지적재산권 등의 권리 침해를 이유로 게시 중단 요청을 받은 경우 이를 임시로 게시 중단(전송중단)할 수 있다. 게시 중단 요청자와 게시물을 둘러싼 간에 소송, 합의 기타 이에 준하는 관련 기관의 결정 등이 이루어져 사이트에 접수된 경우 이에 따른다.</p>
          </div>
        ],
        ["제15조 (저작권의 귀속 및 이용제한)",
          <div key="15">
            <p style={{ marginBottom: "4px" }}>1. 회사가 작성한 게시물에 대한 저작권 및 기타 지적재산권은 회사에 귀속된다.</p>
            <p style={{ marginBottom: "4px" }}>2. 이용자는 사이트 내에 게시한 게시물의 저작권은 게시한 이용자에게 귀속된다. 또한 회사는 이용자의 동의 없이 게시물들을 상업적으로 이용할 수 없다. 다만, 입사지원서의 경우 관계법령에 따른 전제된 지원서를 이용자에게 반환하지 않을 수 있다.</p>
            <p>3. 이용자는 서비스를 이용하여 취득한 정보를 임의 가공, 판매, 배포하는 행위 등 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 아니된다.</p>
          </div>
        ],
        ["제16조 (손해배상)",
          <p key="16">회사는 사이트를 통해 제공하는 서비스의 이용과 관련하여 회사의 고의 또는 중대한 과실이 없는 한 어떠한 손해도 책임을 지지 않는다.</p>
        ],
        ["제17조 (면책)",
          <div key="17">
            {[
              "회사는 이용자가 사이트의 서비스 제공으로부터 기대되는 이익을 얻지 못하였거나 서비스 자료에 대한 취사선택 또는 이용으로 발생하는 손해 등에 대해서는 책임을 면한다.",
              "회사는 사이트의 서비스 기반 및 타 통신업자가 제공하는 전기통신 서비스의 장애로 인해 손해가 발생한 경우에는 책임이 면제되며 사이트의 서비스 기반과 관련되어 발생한 손해에 대해서는 사이트의 이용약관에 준한다.",
              "회사는 이용자가 저장, 게시 또는 전송한 자료와 관련하여 일체의 책임을 면한다.",
              "회사는 이용자의 귀책 사유로 인한 서비스 이용의 장애가 발생한 경우에 대해서 책임을 면한다.",
              "회사는 이용자 상호 간 또는 이용자와 제3자 상호 간, 기타 이용자의 본 서비스 내외를 불문한 일체의 활동(데이터 전송, 기타 커뮤니티 활동 포함)에 대하여 책임을 면한다.",
              "회사는 이용자가 게시 또는 전송한 자료 및 본 서비스를 이용할 수 있는 모든 자료들의 진위, 신뢰도, 정확성 등 그 내용에 대해서는 책임을 면한다.",
              "회사는 이용자 상호 간 또는 이용자와 제3자 상호 간에 서비스를 매개로 하여 물품거래 등을 한 경우에 그로부터 발생하는 일체의 손해에 대하여 책임을 면한다.",
              "회사는 회사의 귀책 사유 없이 이용자 간 또는 이용자와 제3자 간에 발생한 일체의 분쟁에 대하여 책임을 면한다.",
              "회사는 서버 등 설비의 관리, 점검, 보수, 교체 과정 또는 소프트웨어의 운용 과정에서 고의 또는 고의에 준하는 중대한 과실 없이 발생할 수 있는 시스템의 장애, 제3자의 공격으로 인한 시스템의 장애, 국내외의 저명한 연구기관이나 보안 관련 업체에 의해 대응 방법이 개발되지 아니한 컴퓨터 바이러스 등의 유포나 기타 회사가 통제할 수 없는 불가항력적 사유로 인한 이용자의 손해에 대하여 책임을 면한다.",
            ].map((t, i) => (
              <p key={i} style={{ marginBottom: "6px" }}>{i + 1}. {t}</p>
            ))}
          </div>
        ],
        ["제18조 (분쟁의 해결)",
          <div key="18">
            <p style={{ marginBottom: "4px" }}>1. 회사와 이용자는 서비스와 관련하여 발생한 분쟁을 원만하게 해결하기 위하여 필요한 모든 노력을 하여야 한다.</p>
            <p>2. 제 1항의 규정에도 불구하고, 회사와 이용자 간에 발생한 분쟁에 대하여는 대한민국법을 적용하며 본 분쟁으로 인하여 소송이 제기될 경우 민사소송법상의 관할을 가지는 대한민국의 법원에 제기한다.</p>
          </div>
        ],
      ] as [string, React.ReactNode][]
    ).map(([title, body]) => (
      <div key={title} style={{ marginBottom: "20px" }}>
        <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#020618", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px", marginBottom: "10px" }}>{title}</p>
        {body}
      </div>
    ))}

    <div style={{ marginTop: "4px", paddingTop: "14px", borderTop: "1px solid #e2e8f0" }}>
      <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#020618", marginBottom: "6px" }}>부칙</p>
      <p>본 약관은 2026년 9월 OO일부터 시행한다.</p>
    </div>
  </div>
);

const PRIVACY_CONTENT = (
  <div style={{ fontSize: "0.8125rem", lineHeight: 1.75 }}>
    <p style={{ marginBottom: "10px" }}>
      아이티센그룹(이하 '회사')은 「개인정보보호법」 제30조에 따라 정보 주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립, 공개합니다. 본 개인정보 처리방침은 관련 법률 및 내부 방침 변경에 의하여 수시로 변경될 수 있으며, 개인정보 처리방침을 개정하거나 변경되는 경우 사이트에 게시하거나 개별적으로 공지할 것입니다.
    </p>
    <details style={{ marginBottom: "10px" }}>
      <summary style={{ color: "#2563eb", cursor: "pointer", userSelect: "none" as const }}>▶ 아이티센 그룹사 리스트 (보기)</summary>
      <p style={{ marginTop: "6px", paddingLeft: "12px", color: "#64748b", fontSize: "0.75rem" }}>㈜아이티센글로벌, ㈜아이티센엔텍, ㈜아이티센씨티에스, ㈜아이티센클로잇, ㈜아이티센피엔에스, ㈜아이티센코어, ㈜씨플랫폼</p>
    </details>
    <p style={{ marginBottom: "6px" }}>본 개인정보 처리방침은 회사의 채용 프로세스에 적용되며, 다음과 같은 내용을 담고 있습니다.</p>
    <ol style={{ paddingLeft: "18px", marginBottom: "16px" }}>
      {["개인정보의 처리 목적, 수집항목, 보유기간","개인정보의 파기 절차 및 방법에 관한 사항","개인정보의 제3자 제공에 관한 사항","개인정보의 위탁처리에 관한 사항","개인정보의 안전성 확보조치에 관한 사항","개인정보 자동 수집 장치의 설치·운영 및 거부에 관한 사항","정보주체와 법정대리인의 권리·의무 및 행사방법에 관한 사항","개인정보보호 책임자 또는 개인정보담당 부서","정보주체의 권익침해에 대한 구제 방법","개인정보 처리방침 시행 및 변경"].map((t, i) => <li key={i}>{t}</li>)}
    </ol>

    <p style={{ fontWeight: 700, marginBottom: "8px", color: "#020618" }}>제1조 (개인정보의 처리 목적, 수집항목, 보유기간)</p>
    <ol style={{ paddingLeft: "18px", marginBottom: "12px" }}>
      <li style={{ marginBottom: "4px" }}>회사는 다음과 같이 개인정보를 처리합니다. 단, 회사는 기본적인 서비스 제공을 위한 최소한의 정보만을 수집합니다.</li>
      <li style={{ marginBottom: "4px" }}>회사는 다음의 개인정보 항목을 『개인정보보호법』 제15조 제1항 제1호 및 제22조 제1항 제7호에 따라 정보주체의 동의를 받아 처리하고 있습니다.</li>
      <li style={{ marginBottom: "4px" }}>개인정보의 수집·이용에 관한 동의는 채용 전형을 위하여 필수적이므로, 다음 사항에 동의하셔야 입사 지원이 가능합니다.<br/>정보주체는 회사의 개인정보 처리와 관련한 동의를 거부할 수 있으며, 동의하지 않을 경우 채용 전형이 진행되지 않습니다.</li>
      <li style={{ marginBottom: "4px" }}>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보 수집 시 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리하고 보유합니다.</li>
      <li style={{ marginBottom: "4px" }}>회사가 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 『개인정보 보호법』 제18조에 따라 별도의 동의를 받겠습니다.</li>
      <li style={{ marginBottom: "4px" }}>회사는 채용 서비스 운영 과정에서 인공지능(AI) 기술을 활용할 수 있습니다. 다만 인공지능은 채용절차 업무 지원을 위한 보조 수단으로만 활용되며, 지원자 평가 및 채용 여부에 대한 최종 의사결정은 평가자가 수행합니다.</li>
    </ol>

    <p style={{ fontWeight: 600, marginBottom: "6px" }}>■ 개인정보 수집 및 이용자 : 귀하가 지원한 아이티센 그룹사</p>

    <p style={{ marginBottom: "4px" }}>□ [입사지원] 개인정보 수집 및 처리에 관한 사항</p>
    <div style={{ overflowX: "auto", marginBottom: "14px" }}>
      <table style={{ width: "100%", minWidth: "580px", borderCollapse: "collapse" }}>
        <thead><tr>{["구분","처리 목적","수집 항목","이용 및 보유기간","수집방법"].map(h=><th key={h} style={{ border:"1px solid #cbd5e1", padding:"5px 7px", background:"#f1f5f9", fontWeight:600, textAlign:"center", fontSize:"0.75rem" }}>{h}</th>)}</tr></thead>
        <tbody>
          <tr>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", textAlign:"center", fontSize:"0.75rem", fontWeight:500, verticalAlign:"top" }}>이메일 인증</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>- 입사지원에 따른 본인확인 및 개인식별<br/>- 문의 대응 및 고지사항 전달</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>[필수]<br/>성명, 이메일</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>[최종 합격자]<br/>- 입사자 : 입사 후 3년까지<br/>- 입사 포기자 : 입사 포기 후 3년까지<br/>[최종 합격자 外]<br/>- 전형 탈락 후 6개월까지<br/>[공통]<br/>- 정보주체의 별도 요청이 있는 경우, 즉시 파기</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top", textAlign:"center" }}>홈페이지를 통한 이메일 인증</td>
          </tr>
          <tr>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", textAlign:"center", fontSize:"0.75rem", fontWeight:500, verticalAlign:"top" }}>지원서</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>- 채용 적합성 판단 및 전형 진행 근거</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>[필수]<br/>졸업사진, 성명, 국적, 생년월일, 이메일, 휴대폰 번호, 주소, 병역사항, 학력사항, 경력사항(경력채용 대상자 限), 경력기술서(경력채용 대상자 限), 자격증, 어학사항, 사회활동 경험, 교육사항, 자기소개서, 입사 가능일, 희망연봉, 채용공고 인지경로<br/>[선택]<br/>포트폴리오, AI 역량</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top", textAlign:"center" }}>상동</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top", textAlign:"center" }}>온라인 입사지원서 작성</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p style={{ marginBottom: "4px" }}>□ [입사지원] 민감정보 수집 및 처리에 관한 사항</p>
    <div style={{ overflowX: "auto", marginBottom: "14px" }}>
      <table style={{ width: "100%", minWidth: "580px", borderCollapse: "collapse" }}>
        <thead><tr>{["구분","처리 목적","수집 항목","이용 및 보유기간","수집방법"].map(h=><th key={h} style={{ border:"1px solid #cbd5e1", padding:"5px 7px", background:"#f1f5f9", fontWeight:600, textAlign:"center", fontSize:"0.75rem" }}>{h}</th>)}</tr></thead>
        <tbody>
          <tr>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", textAlign:"center", fontSize:"0.75rem", fontWeight:500, verticalAlign:"top" }}>지원서</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>- 채용 적합성 판단 및 전형 진행 근거<br/>- 관련법령에 따른 우대 정보 확인</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>[필수]<br/>장애사항, 보호사항</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>[최종 합격자]<br/>- 입사자 : 입사 후 3년까지<br/>- 입사 포기자 : 입사 포기 후 3년까지<br/>[최종 합격자 外]<br/>- 전형 탈락 후 6개월까지<br/>[공통]<br/>- 정보주체의 별도 요청이 있는 경우, 즉시 파기</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top", textAlign:"center" }}>온라인 입사지원서 작성</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p style={{ marginBottom: "4px" }}>□ [면접전형] 개인정보 수집 및 처리에 관한 사항</p>
    <div style={{ overflowX: "auto", marginBottom: "14px" }}>
      <table style={{ width: "100%", minWidth: "580px", borderCollapse: "collapse" }}>
        <thead><tr>{["구분","처리 목적","수집 항목","이용 및 보유기간","수집방법"].map(h=><th key={h} style={{ border:"1px solid #cbd5e1", padding:"5px 7px", background:"#f1f5f9", fontWeight:600, textAlign:"center", fontSize:"0.75rem" }}>{h}</th>)}</tr></thead>
        <tbody>
          <tr>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", textAlign:"center", fontSize:"0.75rem", fontWeight:500, verticalAlign:"top" }}>면접</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>- 채용 적합성 판단 및 전형 진행 근거</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>[필수]<br/>면접전형에서의 음성 데이터</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>- 채용전형 종료 시까지<br/>- 정보주체의 별도 요청이 있는 경우, 즉시 파기</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top", textAlign:"center" }}>면접전형 중 음성 녹음</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p style={{ marginBottom: "4px" }}>□ [처우협의] 개인정보 수집 및 처리에 관한 사항</p>
    <div style={{ overflowX: "auto", marginBottom: "14px" }}>
      <table style={{ width: "100%", minWidth: "580px", borderCollapse: "collapse" }}>
        <thead><tr>{["구분","처리 목적","수집 항목","이용 및 보유기간","수집방법"].map(h=><th key={h} style={{ border:"1px solid #cbd5e1", padding:"5px 7px", background:"#f1f5f9", fontWeight:600, textAlign:"center", fontSize:"0.75rem" }}>{h}</th>)}</tr></thead>
        <tbody>
          <tr>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", textAlign:"center", fontSize:"0.75rem", fontWeight:500, verticalAlign:"top" }}>처우협의</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>- 채용 적합성 판단 및 전형 진행 근거</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>[필수]<br/>최근 3개월 급여명세서, 직전 직장 연봉계약서(고용계약서), 직전년도 근로소득원천징수영수증</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>- 채용전형 종료 시까지<br/>- 정보주체의 별도 요청이 있는 경우, 즉시 파기</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top", textAlign:"center" }}>서류 제출</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p style={{ marginBottom: "4px" }}>□ [입사내정] 정보주체의 동의를 받지 않는 개인정보 수집 및 처리에 관한 사항</p>
    <div style={{ overflowX: "auto", marginBottom: "14px" }}>
      <table style={{ width: "100%", minWidth: "580px", borderCollapse: "collapse" }}>
        <thead><tr>{["구분","처리 목적","수집 항목","이용 및 보유기간","관련법령"].map(h=><th key={h} style={{ border:"1px solid #cbd5e1", padding:"5px 7px", background:"#f1f5f9", fontWeight:600, textAlign:"center", fontSize:"0.75rem" }}>{h}</th>)}</tr></thead>
        <tbody>
          <tr>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", textAlign:"center", fontSize:"0.75rem", fontWeight:500, verticalAlign:"top" }}>입사 서류</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>- 4대보험 신고, 소득세 원천징수</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>고유식별번호(주민등록번호, 외국인등록번호)</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>- 입사 포기 시, 즉시 파기</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>국민연금법 제21조, 국민건강보험법 제7조, 고용보험법 제15조, 고용보험법 및 산업재해보상보험의 보험료징수 등에 관한 법률 제11조, 소득세법 제127조 및 제164조</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p style={{ marginBottom: "4px" }}>□ [입사내정] 정보주체의 동의를 받는 개인정보 수집 및 처리에 관한 사항</p>
    <div style={{ overflowX: "auto", marginBottom: "14px" }}>
      <table style={{ width: "100%", minWidth: "580px", borderCollapse: "collapse" }}>
        <thead><tr>{["구분","처리 목적","수집 항목","이용 및 보유기간","수집방법"].map(h=><th key={h} style={{ border:"1px solid #cbd5e1", padding:"5px 7px", background:"#f1f5f9", fontWeight:600, textAlign:"center", fontSize:"0.75rem" }}>{h}</th>)}</tr></thead>
        <tbody>
          <tr>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", textAlign:"center", fontSize:"0.75rem", fontWeight:500, verticalAlign:"top" }}>입사 서류</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>- 입사에 필요한 서비스 제공<br/>- 인사 행정 업무 활용(근로계약 체결, 복리후생 등)</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>
              [필수]<br/>증명사진, 성명(한글/영문), 국적, 이메일, 주소, 휴대폰 번호, 은행명, 계좌번호, 고등학교 학력(기간/학교명/전공/졸업구분), 대학교 이상 학력(기간/학교명/전공/졸업구분), 병역사항(병역구분/사유/군별/병과/계급/입대일/전역·소집해제일), 급여계좌(은행명/계좌번호), 자격증(자격명/자격등급/취득일자/발급기관), 어학사항(어학시험명/어학등급/취득일자/발급기관), 경력사항(회사명/직급/담당업무/입사일/퇴사일), 비상연락처(가족관계/성명/휴대폰 번호), 대학교 이상 학력 졸업서류(졸업증명서/성적증명서), 경력증명서(또는 건강보험자격득실확인서), 가족관계증명서, 주민등록등본, 외국인등록증(외국 국적자 限), 주민등록초본(남성 限), 병적증명서(병역 미필자 限), 자격증 사본, 급여계좌 사본, 기술이력카드<br/>[선택]<br/>성명(한문), 결혼 여부, 결혼일, 자택 전화번호, 가족사항(관계/성명/주민등록번호/인적공제)
            </td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>- 퇴직 후 3년까지<br/>- 입사 포기 시, 즉시 파기<br/>- 단, 관계법령에 의해 보유가 허용된 정보는 법령이 정한 기간 동안 보관</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top", textAlign:"center" }}>서류 제출</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p style={{ marginBottom: "4px" }}>□ [입사내정] 민감정보 수집 및 처리에 관한 사항</p>
    <div style={{ overflowX: "auto", marginBottom: "16px" }}>
      <table style={{ width: "100%", minWidth: "580px", borderCollapse: "collapse" }}>
        <thead><tr>{["구분","처리 목적","수집 항목","이용 및 보유기간","수집방법"].map(h=><th key={h} style={{ border:"1px solid #cbd5e1", padding:"5px 7px", background:"#f1f5f9", fontWeight:600, textAlign:"center", fontSize:"0.75rem" }}>{h}</th>)}</tr></thead>
        <tbody>
          <tr>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", textAlign:"center", fontSize:"0.75rem", fontWeight:500, verticalAlign:"top" }}>입사 서류</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>- 입사에 필요한 서비스 제공<br/>- 관련법령에 따른 우대 정보 확인</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>[필수]<br/>장애사항(장애 유무/장애유형/장애등급/장애인 증명서), 보호사항(보호 여부/보호유형/보호자와의 관계/보호 대상자 증명서)</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>- 퇴직 후 3년까지<br/>- 입사 포기 시, 즉시 파기<br/>- 단, 관계법령에 의해 보유가 허용된 정보는 법령이 정한 기간 동안 보관</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top", textAlign:"center" }}>서류 제출</td>
          </tr>
          <tr>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", textAlign:"center", fontSize:"0.75rem", fontWeight:500, verticalAlign:"top" }}>건강검진</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>- 입사 전에 수검한 건강검진 결과 확인</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>[필수]<br/>건강검진 결과지</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>- 퇴직 후 3년까지<br/>- 입사 포기 시, 즉시 파기</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top", textAlign:"center" }}>서류 제출</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p style={{ fontWeight: 600, marginBottom: "6px" }}>■ 개인정보 수집 및 이용자 : 아이티센 그룹사</p>
    <p style={{ marginBottom: "4px" }}>□ [인재 Pool] 개인정보 수집 및 처리에 관한 사항</p>
    <div style={{ overflowX: "auto", marginBottom: "12px" }}>
      <table style={{ width: "100%", minWidth: "580px", borderCollapse: "collapse" }}>
        <thead><tr>{["구분","처리 목적","수집 항목","이용 및 보유기간","수집방법"].map(h=><th key={h} style={{ border:"1px solid #cbd5e1", padding:"5px 7px", background:"#f1f5f9", fontWeight:600, textAlign:"center", fontSize:"0.75rem" }}>{h}</th>)}</tr></thead>
        <tbody>
          <tr>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", textAlign:"center", fontSize:"0.75rem", fontWeight:500, verticalAlign:"top" }}>인재 Pool</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>- 상시채용 및 인재발굴을 위한 인력 Pool 활용</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>[필수]<br/>증명사진, 성명, 국적, 생년월일, 이메일, 휴대폰 번호, 주소, 병역사항, 학력사항, 경력사항(경력채용 대상자 限), 경력기술서(경력채용 대상자 限), 자격증, 어학사항, 사회활동 경험, 교육사항, 자기소개서, 입사 가능일, 희망연봉, 채용공고 인지경로, 채용전형 결과(지원회사/부서, 공고명, 서류/면접 결과)<br/>[선택]<br/>포트폴리오, AI 역량</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top" }}>- 등록 후 3년까지<br/>- 정보주체의 별도 요청이 있는 경우, 즉시 파기</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", verticalAlign:"top", textAlign:"center" }}>입사지원서 제출 시, 인재 Pool 데이터 보관 별도 선택 동의</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p style={{ marginBottom: "8px" }}>회사는 지원자의 동의에 따라 지원자의 개인정보를 위 기간 동안 보유할 수 있으며, 그 기간이 경과한 경우에는 지체없이 파기합니다.<br/>다만, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 아래와 같이 해당 법령에서 정한 바에 의하여 개인정보를 별도 보관할 수 있습니다.</p>
    <div style={{ overflowX: "auto", marginBottom: "20px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["보유 항목","보유 기간","관련 법령"].map(h=><th key={h} style={{ border:"1px solid #cbd5e1", padding:"5px 7px", background:"#f1f5f9", fontWeight:600, textAlign:"center", fontSize:"0.75rem" }}>{h}</th>)}</tr></thead>
        <tbody>
          <tr>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", textAlign:"center" }}>인터넷 등 로그기록,<br/>접속지 추적자료</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", textAlign:"center" }}>3개월</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", textAlign:"center" }}>통신비밀보호법 제15조의2 제2항</td>
          </tr>
          <tr>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", textAlign:"center" }}>그 외의 통신사실<br/>확인 자료</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", textAlign:"center" }}>12개월</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", textAlign:"center" }}>통신비밀보호법 시행령 제41조 제2항</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p style={{ fontWeight: 700, marginBottom: "8px", color: "#020618" }}>제2조 (개인정보의 파기 절차 및 방법에 관한 사항)</p>
    <ol style={{ paddingLeft: "18px", marginBottom: "20px" }}>
      <li style={{ marginBottom: "4px" }}>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</li>
      <li style={{ marginBottom: "4px" }}>정보주체로부터 동의받은 개인정보 보유 기간이 경과하거나 처리목적이 달성되었음에도 불구하고 다른 법령에 따라 개인정보를 계속 보존하여야 하는 경우에는 해당 개인정보를 별도의 데이터베이스(DB)로 옮기거나 보관장소를 달리하여 보존합니다.</li>
      <li style={{ marginBottom: "4px" }}>
        개인정보 파기의 절차 및 방법은 다음과 같습니다.<br/>
        <span style={{ display:"block", paddingLeft:"16px", marginTop:"2px" }}>(1) 파기 절차<br/><span style={{ display:"block", paddingLeft:"16px" }}>회사는 파기 사유가 발생한 개인정보를 선정하고, 회사의 개인정보 보호책임자의 승인을 받아 개인정보를 파기합니다.</span></span>
        <span style={{ display:"block", paddingLeft:"16px", marginTop:"2px" }}>(2) 파기 방법<br/><span style={{ display:"block", paddingLeft:"16px" }}>회사는 전자적 파일 형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록 파기하며, 종이 문서에 기록·저장된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.</span></span>
      </li>
    </ol>

    <p style={{ fontWeight: 700, marginBottom: "8px", color: "#020618" }}>제3조 (개인정보의 제3자 제공에 관한 사항)</p>
    <ol style={{ paddingLeft: "18px", marginBottom: "10px" }}>
      <li style={{ marginBottom: "4px" }}>회사는 정보주체의 개인정보를 개인정보의 처리 목적에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 「개인정보보호법」 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공하고 그 이외에는 정보주체의 개인정보를 제3자에게 제공하지 않습니다.</li>
      <li style={{ marginBottom: "4px" }}>회사는 원활한 서비스 제공을 위해 다음의 경우 개인정보보호법 제17조 제1항 제1호에 따라 정보주체의 동의를 얻어 필요 최소한의 범위로만 제공합니다.</li>
    </ol>
    <p style={{ fontWeight: 600, marginBottom: "6px" }}>■ 개인정보의 제3자 제공자 : 귀하가 지원한 아이티센 그룹사</p>
    <div style={{ overflowX: "auto", marginBottom: "20px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["제공 목적","제공 항목","보유 및 이용기간","제공받는 자"].map(h=><th key={h} style={{ border:"1px solid #cbd5e1", padding:"5px 7px", background:"#f1f5f9", fontWeight:600, textAlign:"center", fontSize:"0.75rem" }}>{h}</th>)}</tr></thead>
        <tbody>
          <tr>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", fontWeight:500, textAlign:"center" }}>채용 건강 검진</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem" }}>회사명, 성명, 생년월일, 휴대폰 번호</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem" }}>정보제공 목적 달성 후, 즉시 파기</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", textAlign:"center" }}>한신메디피아</td>
          </tr>
          <tr>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", fontWeight:500, textAlign:"center" }}>평판조회</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem" }}>성명, 휴대폰 번호</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem" }}>정보제공 목적 달성 후, 즉시 파기</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", textAlign:"center" }}>스펙터</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p style={{ fontWeight: 700, marginBottom: "8px", color: "#020618" }}>제4조 (개인정보의 위탁처리에 관한 사항)</p>
    <ol style={{ paddingLeft: "18px", marginBottom: "10px" }}>
      <li style={{ marginBottom: "4px" }}>회사는 원활한 서비스 제공을 위해서 정보주체의 개인정보 수집·취급·관리 등을 위탁하여 처리할 수 있습니다.</li>
      <li style={{ marginBottom: "4px" }}>개인정보를 위탁 처리하는 경우에는 개인정보 보호의 안전을 기하기 위하여 개인정보보호 관련 지시 준수, 개인정보에 대한 비밀유지, 제3자 제공의 금지 및 사고시의 책임 부담, 위탁기간, 처리 종료 후 개인정보의 반환 또는 파기 등을 명확히 규정하고, 위탁업체가 개인정보를 안전하게 처리하도록 감독합니다. 업체 및 위탁하는 업무의 내용이 변경될 경우, 공지사항(또는 이메일 및 SMS 등의 방법으로 개별공지)을 통하여 알려드리겠습니다.</li>
    </ol>
    <p style={{ fontWeight: 600, marginBottom: "6px" }}>■ 개인정보 위탁자 : (주)아이티센글로벌</p>
    <div style={{ overflowX: "auto", marginBottom: "10px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["수탁자","위탁 업무"].map(h=><th key={h} style={{ border:"1px solid #cbd5e1", padding:"5px 7px", background:"#f1f5f9", fontWeight:600, textAlign:"center", fontSize:"0.75rem" }}>{h}</th>)}</tr></thead>
        <tbody>
          <tr>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", textAlign:"center" }}>(주)아이티센클로잇</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem" }}>- AgentGo를 활용한 입사지원서 및 면접 AI 분석 시행<br/>- 아이티센 채용 홈페이지 운영 및 유지보수</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p style={{ fontWeight: 600, marginBottom: "6px" }}>■ 개인정보 위탁자 : 귀하가 지원한 아이티센 그룹사</p>
    <div style={{ overflowX: "auto", marginBottom: "20px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["수탁자","위탁 업무"].map(h=><th key={h} style={{ border:"1px solid #cbd5e1", padding:"5px 7px", background:"#f1f5f9", fontWeight:600, textAlign:"center", fontSize:"0.75rem" }}>{h}</th>)}</tr></thead>
        <tbody>
          <tr>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", textAlign:"center" }}>(주)아이티센글로벌</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem" }}>- AgentGo를 활용한 입사지원서 및 면접 AI 분석 시행<br/>- 아이티센 채용 홈페이지 운영 및 유지보수</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p style={{ fontWeight: 700, marginBottom: "8px", color: "#020618" }}>제5조 (개인정보의 안전성 확보조치에 관한 사항)</p>
    <p style={{ marginBottom: "6px" }}>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 하고 있습니다.</p>
    <ol style={{ paddingLeft: "18px", marginBottom: "20px" }}>
      <li>관리적 조치 : 내부관리계획 수립 및 시행, 정기적 직원 교육 등</li>
      <li>기술적 조치 : 개인정보처리시스템 등의 접근 권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램 설치</li>
      <li>물리적 조치 : 전산실, 자료보관실 등의 접근통제</li>
    </ol>

    <p style={{ fontWeight: 700, marginBottom: "8px", color: "#020618" }}>제6조 (개인정보 자동 수집 장치의 설치·운영 및 거부에 관한 사항)</p>
    <ol style={{ paddingLeft: "18px", marginBottom: "10px" }}>
      <li style={{ marginBottom: "4px" }}>회사는 이용자에게 개별적인 맞춤 서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.</li>
      <li style={{ marginBottom: "4px" }}>쿠키는 웹사이트를 운영하는데 이용되는 서버(http)가 이용자의 컴퓨터 브라우저로 보내는 소량의 정보이며 이용자들의 PC 또는 모바일에 저장됩니다.</li>
      <li style={{ marginBottom: "4px" }}>정보주체는 웹 브라우저 옵션 설정을 통해 쿠키 허용, 차단 등의 설정을 할 수 있습니다. 다만, 쿠키 저장을 거부할 경우 맞춤형 서비스 이용에 어려움이 발생할 수 있습니다.</li>
      <li style={{ marginBottom: "4px" }}>회사는 서비스이용과정에서 사용자가 방문한 각 서비스와 웹 사이트들에 대한 방문 및 이용형태, 인기 검색어, 보안접속 여부 등을 파악하여 이용자에게 최적화된 정보 제공을 위해 수집·이용하고 있습니다.</li>
    </ol>
    <p style={{ fontWeight: 600, marginBottom: "4px" }}>■ 쿠키 허용/차단 방법</p>
    <div style={{ paddingLeft: "12px", marginBottom: "20px", fontSize: "0.75rem", lineHeight: 1.8 }}>
      <p style={{ marginBottom: "2px" }}>(1) 웹 브라우저</p>
      <p style={{ paddingLeft: "12px" }}>- 크롬(Chrome) : 웹 브라우저 설정 &gt; 개인정보 보호 및 보안 &gt; 서드 파티 쿠키 &gt; 허용/차단</p>
      <p style={{ paddingLeft: "12px" }}>- 엣지(Edge) : 웹 브라우저 설정 &gt; 개인정보, 검색 및 서비스 &gt; 쿠키 &gt; 허용/차단</p>
      <p style={{ marginTop: "4px", marginBottom: "2px" }}>(2) 모바일 브라우저</p>
      <p style={{ paddingLeft: "12px" }}>- 크롬(Chrome) : 모바일 브라우저 설정 &gt; 개인정보 보호 및 보안 &gt; 쿠키</p>
      <p style={{ paddingLeft: "12px" }}>- 사파리(Safari) : 모바일 기기 설정 &gt; 앱 &gt; 사파리(Safari) &gt; 고급 &gt; 모든 쿠키 차단</p>
      <p style={{ paddingLeft: "12px" }}>- 삼성 인터넷 : 모바일 브라우저 설정 &gt; 개인정보 보호 및 보안 &gt; 스마트 추적 방지</p>
    </div>

    <p style={{ fontWeight: 700, marginBottom: "8px", color: "#020618" }}>제7조 (정보주체와 법정대리인의 권리·의무 및 행사방법에 관한 사항)</p>
    <ol style={{ paddingLeft: "18px", marginBottom: "20px" }}>
      <li style={{ marginBottom: "4px" }}>정보주체는 회사에 대해 언제든지 개인정보 열람·정정·삭제·처리정지 및 철회 요구 등의 권리를 행사할 수 있습니다.</li>
      <li style={{ marginBottom: "4px" }}>
        제1항에 따른 권리 행사는 회사에 대해 서면, 전화, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며, 회사는 이에 대해 지체없이 조치하겠습니다.<br/>
        <span style={{ display:"block", paddingLeft:"16px" }}>(1) 제1항에 따른 권리 행사는 정보주체의 법정대리인이나 위임을 받은 자 등 대리인을 통하여 하실 수 있습니다. 이 경우 「개인정보보호법」 시행규칙 별지 제11호 서식에 따른 위임장을 제출하셔야 합니다.</span>
        <span style={{ display:"block", paddingLeft:"16px" }}>(2) 정보주체의 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우 회사는 정정 또는 삭제를 완료할 때까지 당해 개인정보를 이용하거나 제공하지 않습니다.</span>
      </li>
      <li style={{ marginBottom: "4px" }}>정보주체가 개인정보 열람 및 처리 정지를 요구할 권리는 「개인정보 보호법」 제35조 제4항 및 제37조 제2항에 의하여 제한될 수 있습니다.</li>
      <li style={{ marginBottom: "4px" }}>다른 법령에서 그 개인정보가 수집 대상으로 명시되어 있는 경우에는 해당 개인정보의 삭제를 요구할 수 없습니다.</li>
      <li style={{ marginBottom: "4px" }}>개인정보의 열람 및 정정 요구 등은 제35조에 따른 개인정보보호 책임자 또는 「개인정보담당 부서」와 동일하며, 해당 부서를 통해 신청하실 수 있습니다. 회사는 정보주체의 개인정보 열람 요구가 신속하게 처리되도록 노력하겠습니다.</li>
    </ol>

    <p style={{ fontWeight: 700, marginBottom: "8px", color: "#020618" }}>제8조 (개인정보 보호책임자 또는 개인정보담당 부서)</p>
    <p style={{ marginBottom: "8px" }}>1. 회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만 처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자 및 담당 부서를 지정하고 있습니다.</p>
    <div style={{ overflowX: "auto", marginBottom: "10px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["개인정보 보호책임자","관련업무 담당부서","문의처"].map(h=><th key={h} style={{ border:"1px solid #cbd5e1", padding:"5px 7px", background:"#f1f5f9", fontWeight:600, textAlign:"center", fontSize:"0.75rem" }}>{h}</th>)}</tr></thead>
        <tbody>
          <tr>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", textAlign:"center" }}>김영조 실장</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", textAlign:"center" }}>그룹전략실</td>
            <td style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", textAlign:"center" }}>youngjokim@itcen.com</td>
          </tr>
        </tbody>
      </table>
    </div>
    <details style={{ marginBottom: "10px" }}>
      <summary style={{ color: "#2563eb", cursor: "pointer", userSelect: "none" as const }}>▶ 개인정보 보호업무 관련 담당부서 (보기)</summary>
      <div style={{ overflowX: "auto", marginTop: "8px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["회사","개인정보 보호책임자","관련업무 담당부서","문의처"].map(h=><th key={h} style={{ border:"1px solid #cbd5e1", padding:"5px 7px", background:"#f1f5f9", fontWeight:600, textAlign:"center", fontSize:"0.75rem" }}>{h}</th>)}</tr></thead>
          <tbody>
            {[["㈜아이티센글로벌","부서명/성명/직급","OOO팀","OOO@itcen.com"],["㈜아이티센엔텍","준법지원팀장","준법지원팀","htakk@itcen.com"],["㈜아이티센씨티에스","부서명/성명/직급","OOO팀","OOO@itcen.com"],["㈜아이티센클로잇","부서명/성명/직급","OOO팀","OOO@itcen.com"],["㈜아이티센피엔에스","부서명/성명/직급","OOO팀","OOO@itcen.com"],["㈜아이티센코어","부서명/성명/직급","OOO팀","OOO@itcen.com"],["㈜씨플랫폼","부서명/성명/직급","OOO팀","OOO@itcen.com"]].map((row,i)=>(
              <tr key={i}>{row.map((c,ci)=><td key={ci} style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", textAlign:"center" }}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
    <p style={{ marginBottom: "20px" }}>2. 정보주체는 회사의 서비스를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만 처리, 피해구제 등에 관한 사항을 개인정보 보호책임자 및 담당부서로 문의하실 수 있습니다. 회사는 정보주체의 문의에 대해 지체없이 답변 및 처리해드릴 것입니다.</p>

    <p style={{ fontWeight: 700, marginBottom: "8px", color: "#020618" }}>제9조 (정보주체의 권익침해에 대한 구제 방법)</p>
    <p style={{ marginBottom: "8px" }}>정보주체는 개인정보침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 한국인터넷진흥원 개인정보침해신고센터 등에 분쟁해결이나 상담 등을 신청할 수 있습니다. 이 밖에 기타 개인정보침해의 신고, 상담에 대하여는 아래의 기관에 문의하시기 바랍니다.</p>
    <div style={{ overflowX: "auto", marginBottom: "20px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{["기관","연락처","사이트"].map(h=><th key={h} style={{ border:"1px solid #cbd5e1", padding:"5px 7px", background:"#f1f5f9", fontWeight:600, textAlign:"center", fontSize:"0.75rem" }}>{h}</th>)}</tr></thead>
        <tbody>
          {[["개인정보\n분쟁조정위원회","(국번없이) 1833-6972","www.kopico.go.kr"],["개인정보\n침해신고센터","(국번없이) 118","privacy.kisa.or.kr"],["대검찰청","(국번없이) 1301","www.spo.go.kr"],["경찰청","(국번없이) 182","ecrm.police.go.kr/minwon/main"]].map((row,i)=>(
            <tr key={i}>{row.map((c,ci)=><td key={ci} style={{ border:"1px solid #cbd5e1", padding:"5px 7px", fontSize:"0.75rem", textAlign:"center", whiteSpace:"pre-line" as const }}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>

    <p style={{ fontWeight: 700, marginBottom: "8px", color: "#020618" }}>제10조 (개인정보 처리방침 시행 및 변경)</p>
    <ol style={{ paddingLeft: "18px" }}>
      <li>본 개인정보처리방침은 2026년 9월 OO일부터 시행됩니다.</li>
      <li>이전의 개인정보처리방침은 본 개인정보처리방침 상단에서 확인하실 수 있습니다.</li>
    </ol>
  </div>
);

const NO_SPAM_CONTENT = (
  <div>
    <p style={{ marginBottom: "20px", lineHeight: 2 }}>
     본 웹사이트에 게시된 이메일 주소가 전자우편 수집 프로그램이나 그 밖의 기술적 장치를 이용하여 무단으로 수집되는 것을 거부하며, 이를 위반 시 정보통신망법에 의해 형사 처벌됨을 유념하시기 바랍니다.
    </p>
    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "16px 20px", marginBottom: "20px" }}>
      <p style={{ fontWeight: 600, color: "#020618", marginBottom: "8px" }}>관련 법령 안내</p>
      <p style={{ fontSize: "0.75rem", color: "#64748b", lineHeight: 1.8 }}>
        「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 제50조의2 (전자우편주소의 무단 수집행위 등 금지)<br />
        누구든지 전자우편주소의 수집을 거부하는 의사가 명시된 인터넷 홈페이지에서 자동으로 전자우편주소를 수집하는 프로그램 그 밖의 기술적 장치를 이용하여 전자우편주소를 수집하여서는 아니 됩니다.
      </p>
    </div>
    
  </div>
);

function ItcenFamilyDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", fontSize: "0.8125rem" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 12px",
          border: "1px solid #cbd5e1",
          borderRadius: "4px",
          background: "transparent",
          color: "#314158",
          cursor: "pointer",
          fontSize: "0.8125rem",
          fontWeight: 500,
          letterSpacing: "0.02em",
        }}
      >
        ITCEN FAMILY
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            right: 0,
            minWidth: "180px",
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 16px rgba(2,6,24,0.08)",
            borderRadius: "4px",
            padding: "8px 0",
            zIndex: 50,
          }}
        >
          {ITCEN_FAMILY_GROUPS.map((group, gi) => (
            <div key={gi}>
              {gi > 0 && (
                <div style={{ borderTop: "1px dashed #e2e8f0", margin: "6px 0" }} />
              )}
              {group.map(({ name, url }) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "block",
                    padding: "6px 16px",
                    color: "#314158",
                    fontSize: "0.8125rem",
                    textDecoration: "none",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#020618")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#314158")}
                >
                  {name}
                </a>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "#ffffff", color: "#314158", borderTop: "1px solid #e2e8f0" }}>
      {/* 상단 바 */}
      <div
        style={{
          borderBottom: "1px solid #e2e8f0",
          padding: "0 24px",
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{ height: "56px", maxWidth: "1200px", margin: "0 auto" }}
        >
          <div className="flex items-center" style={{ gap: "10px" }}>
            <img src={itcenLogo} alt="ITCEN" style={{ height: "18px", width: "auto" }} />
            <span style={{ color: "#94a3b8", fontSize: "0.6875rem", letterSpacing: "0.01em" }}>
              Powered by <span style={{ color: "#64748b", fontWeight: 500 }}>AgentGO</span>
            </span>
          </div>

          <nav className="flex items-center" style={{ gap: "8px", fontSize: "0.8125rem" }}>
            <PolicyModal label="이용약관" title="이용약관" content={TERMS_CONTENT} labelStyle={{ color: "#314158" }} />
            <span style={{ color: "#cbd5e1" }}>·</span>
            <PolicyModal label="개인정보처리방침" title="개인정보처리방침" content={PRIVACY_CONTENT} labelStyle={{ color: "#020618", fontWeight: 600 }} />
            <span style={{ color: "#cbd5e1" }}>·</span>
            <PolicyModal label="이메일무단수집거부" title="이메일 무단수집 거부" content={NO_SPAM_CONTENT} labelStyle={{ color: "#314158" }} />
          </nav>

          <ItcenFamilyDropdown />
        </div>
      </div>

      {/* 메인 링크 영역 */}
      

      {/* 하단 정보 */}
      <div style={{ padding: "24px 24px", fontSize: "0.75rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <p style={{ marginBottom: "4px", color: "#314158" }}>경기도 과천시 과천대로 12길 117, 과천펜타원 E동(아이티센타워)</p>
          <p style={{ marginBottom: "16px", color: "#314158" }}>대표번호 : 02-3497-8300 &nbsp;|&nbsp; FAX : 02-571-6052 &nbsp;|&nbsp; 문의 메일 : itcenjobs@itcen.com </p>
          <p style={{ color: "#90a1b9" }}>Copyright © 2025 ITCEN GLOBAL Company CO.,LTD. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
