import "./TicketPricePage.css";

const TicketPricePage: React.FC = () => {
  return (
    <main className="ticket-price-page">
      <div className="content">
        <h1>Giá vé</h1>
        <p className="center-text">(Áp dụng từ ngày 01/06/2023)</p>

        {/* ================= 2D ================= */}
        <h2>1. GIÁ VÉ XEM PHIM 2D</h2>

        <div className="table-responsive">
          <table className="price-table">
            <thead>
              <tr>
                <th></th>
                <th colSpan={3}>
                  Từ thứ 2 đến thứ 5
                  <br />
                  <small>From Monday to Thursday</small>
                </th>
                <th colSpan={3}>
                  Thứ 6, 7, CN và ngày Lễ
                  <br />
                  <small>Friday, Saturday, Sunday & public holiday</small>
                </th>
              </tr>
              <tr>
                <th>Thời gian</th>
                <th>
                  Ghế thường
                  <br />
                  <small>Standard</small>
                </th>
                <th className="highlight">
                  Ghế VIP
                  <br />
                  <small>VIP</small>
                </th>
                <th className="sweetbox">
                  Ghế đôi
                  <br />
                  <small>Sweetbox</small>
                </th>
                <th>
                  Ghế thường
                  <br />
                  <small>Standard</small>
                </th>
                <th className="highlight">
                  Ghế VIP
                  <br />
                  <small>VIP</small>
                </th>
                <th className="sweetbox">
                  Ghế đôi
                  <br />
                  <small>Sweetbox</small>
                </th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>
                  Trước 12h
                  <br />
                  <small>Before 12PM</small>
                </td>
                <td>55.000đ</td>
                <td className="highlight">65.000đ</td>
                <td className="sweetbox">140.000đ</td>
                <td>70.000đ</td>
                <td className="highlight">80.000đ</td>
                <td className="sweetbox">170.000đ</td>
              </tr>

              <tr>
                <td>
                  12:00 – 17:00
                  <br />
                  <small>From 12PM to before 5PM</small>
                </td>
                <td>70.000đ</td>
                <td className="highlight">75.000đ</td>
                <td className="sweetbox">160.000đ</td>
                <td>80.000đ</td>
                <td className="highlight">85.000đ</td>
                <td className="sweetbox">180.000đ</td>
              </tr>

              <tr>
                <td>
                  17:00 – 23:00
                  <br />
                  <small>From 5PM to before 11PM</small>
                </td>
                <td>80.000đ</td>
                <td className="highlight">85.000đ</td>
                <td className="sweetbox">180.000đ</td>
                <td>90.000đ</td>
                <td className="highlight">95.000đ</td>
                <td className="sweetbox">200.000đ</td>
              </tr>

              <tr>
                <td>
                  Từ 23:00
                  <br />
                  <small>From 11PM</small>
                </td>
                <td>65.000đ</td>
                <td className="highlight">70.000đ</td>
                <td className="sweetbox">150.000đ</td>
                <td>75.000đ</td>
                <td className="highlight">80.000đ</td>
                <td className="sweetbox">170.000đ</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="note">
          * Đối với phim có thời lượng từ 150 phút trở lên: phụ thu 10.000 VNĐ /
          vé
        </p>

        {/* ================= 3D ================= */}
        <h2>2. GIÁ VÉ XEM PHIM 3D</h2>

        <div className="table-responsive">
          <table className="price-table">
            <thead>
              <tr>
                <th></th>
                <th colSpan={3}>
                  Từ thứ 2 đến thứ 5
                  <br />
                  <small>From Monday to Thursday</small>
                </th>
                <th colSpan={3}>
                  Thứ 6, 7, CN và ngày Lễ
                  <br />
                  <small>Friday, Saturday, Sunday & public holiday</small>
                </th>
              </tr>
              <tr>
                <th>Thời gian</th>
                <th>
                  Ghế thường
                  <br />
                  <small>Standard</small>
                </th>
                <th className="highlight">
                  Ghế VIP
                  <br />
                  <small>VIP</small>
                </th>
                <th className="sweetbox">
                  Ghế đôi
                  <br />
                  <small>Sweetbox</small>
                </th>
                <th>
                  Ghế thường
                  <br />
                  <small>Standard</small>
                </th>
                <th className="highlight">
                  Ghế VIP
                  <br />
                  <small>VIP</small>
                </th>
                <th className="sweetbox">
                  Ghế đôi
                  <br />
                  <small>Sweetbox</small>
                </th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>
                  Trước 12h
                  <br />
                  <small>Before 12PM</small>
                </td>
                <td>60.000đ</td>
                <td className="highlight">80.000đ</td>
                <td className="sweetbox">160.000đ</td>
                <td>80.000đ</td>
                <td className="highlight">100.000đ</td>
                <td className="sweetbox">200.000đ</td>
              </tr>

              <tr>
                <td>
                  12:00 – 17:00
                  <br />
                  <small>From 12PM to before 5PM</small>
                </td>
                <td>80.000đ</td>
                <td className="highlight">90.000đ</td>
                <td className="sweetbox">180.000đ</td>
                <td>100.000đ</td>
                <td className="highlight">110.000đ</td>
                <td className="sweetbox">220.000đ</td>
              </tr>

              <tr>
                <td>
                  17:00 – 23:00
                  <br />
                  <small>From 5PM to before 11PM</small>
                </td>
                <td>100.000đ</td>
                <td className="highlight">110.000đ</td>
                <td className="sweetbox">220.000đ</td>
                <td>130.000đ</td>
                <td className="highlight">140.000đ</td>
                <td className="sweetbox">280.000đ</td>
              </tr>

              <tr>
                <td>
                  Từ 23:00
                  <br />
                  <small>From 11PM</small>
                </td>
                <td>100.000đ</td>
                <td className="highlight">110.000đ</td>
                <td className="sweetbox">220.000đ</td>
                <td>120.000đ</td>
                <td className="highlight">130.000đ</td>
                <td className="sweetbox">260.000đ</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="note">
          * Đối với phim có thời lượng từ 150 phút trở lên: phụ thu 10.000 VNĐ /
          vé
        </p>
      </div>

      {/* ================= NOTES ================= */}
      <div className="notes">
        <ul className="notes-list">
          <li>
            <strong>
              Giá vé đối với các đối tượng khán giả ưu tiên (khi trực tiếp sử
              dụng dịch vụ xem phim tại rạp chiếu phim):
            </strong>
            <ul>
              <li>
                Giảm 20% giá vé theo quy định đối với: Trẻ em (người dưới 16
                tuổi), người cao tuổi (công dân Việt Nam từ đủ 60 tuổi trở lên),
                người có công với cách mạng, người có hoàn cảnh đặc biệt khó
                khăn.
              </li>
              <li>
                Giảm 50% giá vé theo quy định đối với: Người khuyết tật nặng.
              </li>
              <li>
                Giảm giá vé 100% đối với: Người khuyết tật đặc biệt nặng, trẻ em
                dưới 0.7m đi kèm với người lớn.
              </li>
            </ul>
          </li>

          <li>
            <strong>Điều kiện:</strong>
            <ul>
              <li>
                Chỉ áp dụng khi mua vé tại quầy (không áp dụng khi mua online).
              </li>
              <li>
                Các đối tượng khán giả trên phải xuất trình giấy tờ chứng minh
                khi mua vé xem phim và trước khi vào phòng chiếu. Cụ thể:
                <ul>
                  <li>
                    Trẻ em (trường hợp trẻ em từ 14–16 tuổi), người cao tuổi:
                    xuất trình “Căn cước công dân”.
                  </li>
                  <li>
                    Người có công với cách mạng: xuất trình giấy xác nhận theo
                    quy định.
                  </li>
                  <li>
                    Người có hoàn cảnh đặc biệt khó khăn: xuất trình “Giấy chứng
                    nhận hộ nghèo”.
                  </li>
                  <li>
                    Người khuyết tật: xuất trình “Giấy xác nhận khuyết tật”.
                  </li>
                </ul>
              </li>
            </ul>
          </li>

          <li>
            <strong>
              Ưu đãi cho học sinh, sinh viên từ 22 tuổi trở xuống: Đồng giá
              55.000đ/vé 2D cho tất cả các suất chiếu phim từ Thứ 2 đến Thứ 6
              (chỉ áp dụng cho hình thức mua vé trực tiếp tại quầy, không áp
              dụng ghế đôi; mỗi thẻ được mua 1 vé/ngày và vui lòng xuất trình
              thẻ U22 kèm thẻ HSSV khi mua vé).
            </strong>
          </li>

          <li>
            <strong>
              Khán giả nghiêm túc thực hiện xem phim đúng độ tuổi theo phân loại
              phim: P, K, T13, T16, T18, C. (Trường hợp vi phạm sẽ xử phạt theo
              Quy định tại Nghị định 128/2022/NĐ-CP ngày 30/12/2022).
            </strong>
          </li>

          <li>
            <strong>
              Không bán vé cho trẻ em dưới 13 tuổi đối với các suất chiếu phim
              kết thúc sau 22h00 và không bán vé cho trẻ em dưới 16 tuổi đối với
              các suất chiếu phim kết thúc sau 23h00.
            </strong>
          </li>

          <li>
            <strong>Áp dụng giá vé ngày Lễ, Tết cho các ngày:</strong>
            <ul>
              <li>
                Các ngày nghỉ Lễ, Tết theo quy định của nhà nước: Tết Nguyên
                Đán, Tết Dương Lịch, ngày Giỗ Tổ Hùng Vương 10/3 AL, ngày 30/4,
                1/5, 2/9.
              </li>
              <li>Các ngày: 14/2, 8/3, 24/12.</li>
              <li>
                Các ngày nghỉ bù do nghỉ Lễ, Tết trùng vào thứ 7, Chủ Nhật.
              </li>
            </ul>
          </li>

          <li>
            <strong>
              Không áp dụng các chế độ ưu đãi, các chương trình khuyến mại khác
              vào các ngày 20/10, 20/11, Halloween 31/10, các ngày Lễ, Tết, suất
              chiếu sớm và suất chiếu đặc biệt.
            </strong>
          </li>

          <li>
            <strong>
              Mua vé xem phim tập thể, hợp đồng khoán gọn: Phòng Chiếu phim -
              (024) 35148647.
            </strong>
          </li>

          <li>
            <strong>
              Thuê phòng tổ chức Hội nghị, làm văn phòng, quảng cáo và các dịch
              vụ khác: Phòng Dịch vụ - (024) 35142856
            </strong>
          </li>
        </ul>

        <p className="notes-warning">
          ĐỀ NGHỊ QUÝ KHÁN GIẢ LƯU Ý KHI MUA VÉ XEM PHIM (ĐẶC BIỆT KHI MUA VÉ
          ONLINE). TCPQC KHÔNG CHẤP NHẬN HOÀN TIỀN HOẶC ĐỔI VÉ ĐÃ THANH TOÁN
          THÀNH CÔNG KHI MUA VÉ ONLINE VÀ VÉ MUA SAI QUY ĐỊNH TẠI QUẦY VÉ.
        </p>

        <p>
          Rất mong Quý khán giả phối hợp thực hiện.
          <br />
          Xin trân trọng cảm ơn!
        </p>

        <ul className="notes-list notes-list-spaced">
          <li>
            <strong>
              Ticket pricing policy for priority audiences watching movies at
              the cinema:
            </strong>
            <ul>
              <li>
                Discount 20% on ticket price for: Children and teenagers (under
                16 years old), elderly people (Vietnamese citizens aged from 60
                years old), revolutionary contributors, people with difficult
                living conditions.
              </li>
              <li>
                Discount 50% on ticket price as regulations for: People with
                severe disabilities.
              </li>
              <li>
                Discount 100% on ticket price for: People with particularly
                severe disabilities; Children under 0.7m accompanied by adults.
              </li>
            </ul>
          </li>

          <li>
            <strong>Condition:</strong>
            <ul>
              <li>
                Only applicable when buying tickets at the counter (not
                applicable for online tickets).
              </li>
              <li>
                The above-mentioned audiences must present Identification
                Documents when buying movie tickets and before entering the
                screening room. Particularly:
                <ul>
                  <li>
                    Teenagers (14–16 years old), elderly people: must present
                    “ID card”.
                  </li>
                  <li>
                    Revolutionary contributors: must present a certificate as
                    prescribed.
                  </li>
                  <li>
                    People with difficult living conditions: must present
                    “Certificate of Poor Household”.
                  </li>
                  <li>
                    People with disabilities: must present “Certificate of
                    Disability”.
                  </li>
                </ul>
              </li>
            </ul>
          </li>

          <li>
            <strong>
              Special promotion for student who is 22 years old and under: From
              Monday to Friday 55.000đ/2D ticket for all slot times (only apply
              for direct purchase at the ticket stall, one student card can buy
              one ticket/day, student should show their U22 and student cards to
              get this priority).
            </strong>
          </li>

          <li>
            <strong>
              Strict implementation of audience classification according to
              their ages: P, K, T13, T16, T18, C. (Violation will be sanctioned
              according to the provisions of Decree 128/2022/NĐ-CP dated on
              December 30, 2022).
            </strong>
          </li>

          <li>
            <strong>
              Tickets for movies ending after 22:00 are not sold to teenagers
              under 13 years old and tickets for movies ending after 23:00 are
              not sold to teenagers under 16 years old.
            </strong>
          </li>

          <li>
            <strong>* Holiday price is applied on:</strong>
            <ul>
              <li>
                The public holidays as prescribed by state: New year, Lunar new
                year, Hung’s King festival (March 10th - lunar calender), April
                30th, May 1st, September 2nd.
              </li>
              <li>Days: Valentine, Women’s Day, Noel.</li>
              <li>
                Compensatory days off due to holidays coinciding with Saturday
                and Sunday.
              </li>
            </ul>
          </li>

          <li>
            <strong>
              Do not apply preferential programs and different promotional ones
              in the day 20/10, 20/11, Halloween 31/10, holidays, sneak show and
              special show.
            </strong>
          </li>
        </ul>

        <p className="notes-warning">
          VALUED AUDIENCES PLEASE TAKE INTO CONSIDERATION WHEN BUYING MOVIE
          TICKETS (ESPECIALLY FOR ONLINE TICKETS). THE NATIONAL CINEMA CENTER
          DOES NOT ACCEPT REFUNDS OR EXCHANGES OF SUCCESSFULLY PAID TICKETS
          (ONLINE TICKETS AND INCORRECTLY PURCHASED TICKETS AT THE COUNTER)
        </p>

        <p>
          Thank you for your valued cooperation.
          <br />
          Best Regards!
        </p>

        <p>---------------------------------------------</p>

        <p>
          - Mua vé xem phim tập thể, hợp đồng khoán gọn:
          <br />
          <strong>
            <em>Phòng Chiếu phim - (024) 35148647</em>
          </strong>
        </p>

        <p>
          - Thuê phòng tổ chức Hội nghị, làm văn phòng, quảng cáo và các dịch vụ
          khác:
          <br />
          <strong>Phòng Dịch vụ - (024) 35142856</strong>
        </p>

        <p>
          <strong>.TTCPQG</strong>
        </p>
      </div>
    </main>
  );
};

export default TicketPricePage;
