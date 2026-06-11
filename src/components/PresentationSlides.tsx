import { useEffect } from "react";

interface PresentationSlidesProps {
  currentSlide: number;
  setCurrentSlide: (slide: number | ((prev: number) => number)) => void;
  renderDemoContent: React.ReactNode;
}

interface SlideData {
  kicker: string;
  title: string;
  subtitle?: string;
  copy?: string;
  list?: string[];
  cards?: { title: string; desc: string; color: string }[];
  note?: string;
  isTitle?: boolean;
  isDemo?: boolean;
  isFinal?: boolean;
}

const slidesData: SlideData[] = [
  {
    kicker: "Đề 02: Ngân hàng Co-opBank",
    title: '"Hiệp sĩ số" toàn năng - cuộc chiến bảo mật và cá nhân hóa thẻ ngân hàng',
    subtitle: "(Trọng tâm: Vòng lặp ReAct, Điểm số rủi ro - Risk Scoring & Cá nhân hóa chuyên sâu)",
    isTitle: true,
  },
  {
    kicker: "1. Bối cảnh ngân hàng",
    title: "02:00 - thẻ số gặp nguy hiểm khi khách hàng đang ngủ",
    copy: "Co-opBank vừa ra mắt sản phẩm Thẻ kỹ thuật số (Digital Card), tích hợp trên ứng dụng Ngân hàng số Co-opBank Mobile Banking. Vào lúc 2 giờ đêm, hệ thống ghi nhận tài khoản của một khách hàng cá nhân liên tục phát sinh các giao dịch chi tiêu trực tiếp tại một website thương mại điện tử với số tiền lớn bất thường.",
    list: [
      "Các tín hiệu cho thấy có dấu hiệu bị lộ thông tin hoặc hack thẻ.",
      "Khách hàng lúc này đang ngủ và không hề hay biết tài sản của mình đang gặp nguy hiểm.",
      "Đây là khoảnh khắc cần một tác nhân chủ động, nhanh hơn quy trình thủ công và thông minh hơn chatbot phản hồi thụ động.",
    ],
  },
  {
    kicker: "2. Yêu cầu nội dung",
    title: "Sân khấu hóa AI Agent chủ động bảo vệ tài sản",
    copy: "Kịch bản của đội thi phải thể hiện được một AI Agent tự chủ động bảo vệ tài sản và chăm sóc khách hàng theo thời gian thực, vượt trội hoàn toàn so với quy trình xử lý thủ công hay chatbot truyền thống.",
    list: [
      "Agent phải quan sát tín hiệu giao dịch và risk scoring theo thời gian thực.",
      "Agent phải có độc thoại nội tâm để khán giả thấy vòng lặp ReAct: Reason - Act - Observe.",
      "Agent chỉ hành động trong guardrail ngân hàng: tạm khóa thẻ tự động (hành động có thể đảo ngược), khóa vĩnh viễn cần xác nhận khách hoặc nhân sự.",
    ],
  },
  {
    kicker: "Giai đoạn 1: Bảo mật và ứng phó sự cố chủ động",
    title: "KNIGHT thức dậy trước khi tiền rời tài khoản",
    cards: [
      {
        title: "Reason",
        desc: "Khi nhận tín hiệu giao dịch lúc 02:00 từ IP lạ, Agent suy luận trên lịch sử chi tiêu, thiết bị, vị trí và risk score. Kết luận: nguy cơ cao, cần hành động phòng vệ ngay.",
        color: "var(--cyan)",
      },
      {
        title: "Act",
        desc: "Agent gọi API tạm khóa thẻ trên hệ thống quản lý thẻ và gửi push notification khẩn cấp đến điện thoại khách hàng.",
        color: "var(--amber)",
      },
      {
        title: "Observe",
        desc: "Khách hàng mở app, xác nhận giao dịch lạ và thực hiện Face ID. Chỉ sau xác thực, Agent mới được chuẩn bị khóa vĩnh viễn thẻ cũ và phát hành thẻ số mới.",
        color: "var(--green)",
      },
    ],
    note: "Guardrail: KNIGHT không tự khóa vĩnh viễn hoặc phát hành thẻ mới nếu chưa có xác nhận gian lận + sinh trắc học.",
  },
  {
    kicker: "Live demo - ReAct Risk Scoring Guardrail",
    title: "Live demo KNIGHT",
    isDemo: true,
  },
  {
    kicker: "Giai đoạn 2: Cá nhân hóa dịch vụ sau sự cố",
    title: "Từ hoảng loạn sang phục hồi niềm tin",
    cards: [
      {
        title: "Reason",
        desc: "Sau khi xử lý xong khủng hoảng, Agent phân tích tiếp hành vi chi tiêu lịch sử: khách thường thanh toán hóa đơn điện, nước và mua sắm nhu yếu phẩm.",
        color: "var(--cyan)",
      },
      {
        title: "Act",
        desc: "Agent thiết kế và hiển thị một ưu đãi 'độc bản' trong app: gói tích điểm hoàn tiền dành riêng cho các dịch vụ thiết yếu của khách hàng.",
        color: "var(--green)",
      },
      {
        title: "Observe",
        desc: "Khách hàng bất ngờ, kích hoạt ưu đãi mới và chuyển từ trạng thái tiêu cực sang cảm giác được chăm sóc 1-1.",
        color: "var(--amber)",
      },
    ],
    note: "KNIGHT không đơn thuần tặng voucher. KNIGHT đóng khung ưu đãi như lời cam kết: Co-opBank đã bảo vệ bạn, hiểu nhu cầu của bạn và tiếp tục đồng hành sau sự cố.",
  },
  {
    kicker: "3. Thông điệp kết luận / 4. Hình thức thể hiện",
    title: "AI Agent là hộ vệ tài chính và chuyên viên tư vấn 1-1",
    isFinal: true,
  },
];

export function PresentationSlides({
  currentSlide,
  setCurrentSlide,
  renderDemoContent,
}: PresentationSlidesProps) {
  
  // Slide Navigation Helpers
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slidesData.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slidesData.length) % slidesData.length);
  };

  // Keyboard navigation listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent navigation when focusing on input elements inside phone
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "SELECT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        nextSlide();
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        prevSlide();
      } else if (e.key === "Home") {
        e.preventDefault();
        setCurrentSlide(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setCurrentSlide(slidesData.length - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const progress = ((currentSlide + 1) / slidesData.length) * 100;

  return (
    <div className="deck" aria-label="Co-opBank KNIGHT presentation slide deck">
      {/* Top progress bar */}
      <div className="deck-progress" aria-hidden="true">
        <span className="deck-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Render slides */}
      {slidesData.map((slide, index) => {
        const isActive = index === currentSlide;

        if (slide.isDemo) {
          return (
            <section
              key={index}
              className={`deck-slide demo-slide ${isActive ? "is-active" : ""}`}
              aria-hidden={!isActive}
            >
              {isActive && (
                <>
                  <div className="demo-ribbon">Live demo - ReAct Risk Scoring Guardrail</div>
                  {renderDemoContent}
                </>
              )}
            </section>
          );
        }

        return (
          <section
            key={index}
            className={`deck-slide ${slide.isTitle ? "title-slide" : ""} ${
              isActive ? "is-active" : ""
            }`}
            aria-hidden={!isActive}
          >
            {isActive && (
              <div className="slide-panel">
                <div className="slide-kicker">{slide.kicker}</div>
                
                {slide.isTitle ? (
                  <h1 className="slide-title">{slide.title}</h1>
                ) : (
                  <h2 className="slide-title">{slide.title}</h2>
                )}

                {slide.subtitle && <p className="slide-subtitle">{slide.subtitle}</p>}
                
                {slide.copy && <p className="slide-copy">{slide.copy}</p>}

                {slide.list && (
                  <ul className="slide-list">
                    {slide.list.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}

                {slide.cards && (
                  <div className="phase-grid">
                    {slide.cards.map((card, idx) => (
                      <article
                        key={idx}
                        className="react-card"
                        style={{ ["--card-color" as any]: card.color }}
                      >
                        <h3>{card.title}</h3>
                        <p>{card.desc}</p>
                      </article>
                    ))}
                  </div>
                )}

                {slide.note && <div className="guardrail-note">{slide.note}</div>}

                {slide.isFinal && (
                  <div className="final-grid">
                    <div>
                      <p className="quote-block">
                        Trong kỷ nguyên số, AI Agent không còn là một công cụ trả lời tự động vô
                        tri, mà đã tiến hóa thành một "Hộ vệ tài chính" và một "Chuyên viên tư
                        vấn 1-1" hoạt động không mệt mỏi.
                      </p>
                      <div className="guardrail-note">
                        Sự khác biệt không nằm ở câu trả lời hay hơn, mà ở khả năng quan sát, suy
                        luận, hành động có kiểm soát và cá nhân hóa sau sự cố.
                      </div>
                    </div>
                    <ul className="slide-list">
                      <li>Một diễn viên đóng vai khách hàng hoang mang.</li>
                      <li>Một diễn viên đóng vai hacker bóng đêm đang tìm cách rút tiền.</li>
                      <li>Một diễn viên hoặc màn hình động đóng vai AI Agent tinh nhuệ.</li>
                      <li>Độc thoại nội tâm thể hiện Reasoning trước mỗi hành động cụ thể.</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}

      {/* Dots navigation */}
      <nav className="slide-dots" aria-label="Điều hướng slide">
        {slidesData.map((_, index) => (
          <button
            key={index}
            className={`slide-dot ${index === currentSlide ? "is-active" : ""}`}
            type="button"
            onClick={() => setCurrentSlide(index)}
            aria-label={`Đến slide ${index + 1}`}
            aria-current={index === currentSlide ? "true" : "false"}
          />
        ))}
      </nav>

      {/* Nav buttons */}
      <div className="slide-controls" aria-label="Điều khiển slide">
        <button className="slide-nav" onClick={prevSlide} type="button" aria-label="Slide trước">
          ‹
        </button>
        <button className="slide-nav" onClick={nextSlide} type="button" aria-label="Slide sau">
          ›
        </button>
      </div>
    </div>
  );
}
