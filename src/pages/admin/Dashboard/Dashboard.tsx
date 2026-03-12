import { useState, useEffect } from "react";
import api from "../../../services/api";
import "./Dashboard.css";
import StatCard from "../../../components/StatCard";
import StatCardRevenue from "../../../components/StatCardRevenue";
import type { Booking, Movie, Showtime, TheaterType, ScreenType } from "../../../types";

interface EnrichedBooking extends Booking {
  movieTitle?: string;
}

interface EnrichedShowtime extends Showtime {
  movie?: Movie;
  theater?: TheaterType;
  screen?: ScreenType;
}

const Dashboard = () => {
  const [stats, setStats] = useState({
    movies: 0,
    users: 0,
    bookings: 0,
    revenue: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    showtimes: 0, // Now represents Today's Showtimes
    theaters: 0,
    news: 0,
    promotions: 0,
  });
  const [recentBookings, setRecentBookings] = useState<EnrichedBooking[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<
    { date: string; amount: number }[]
  >([]);
  const [todayShowtimes, setTodayShowtimes] = useState<EnrichedShowtime[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          moviesRes,
          usersCountRes,
          bookingsRes,
          showtimesRes,
          theatersRes,
          screensRes,
          newsRes,
          promotionsRes,
        ] = await Promise.all([
          api.get("/movies"),
          api.get("/users-count"),
          api.get("/bookings"),
          api.get("/showtimes"),
          api.get("/theaters"),
          api.get("/screens"),
          api.get("/news"),
          api.get("/promotions"),
        ]);

        const bookings = bookingsRes.data || [];
        const movies: Movie[] = moviesRes.data || [];
        const theaters: TheaterType[] = theatersRes.data || [];
        const screens: ScreenType[] = screensRes.data || [];
        const allShowtimes: Showtime[] = showtimesRes.data || [];

        const totalRevenue = bookings.reduce(
          (sum: number, item: Booking) => sum + (item.totalPrice || 0),
          0
        );

        // Calculate today's revenue & showtimes
        const todayObj = new Date();
        const todayStr = todayObj.toISOString().split("T")[0];
        
        const todayRevenue = bookings
          .filter(
            (b: Booking) => b.createdAt && b.createdAt.startsWith(todayStr)
          )
          .reduce(
            (sum: number, item: Booking) => sum + (item.totalPrice || 0),
            0
          );

        // Filter Today's Showtimes
        const todayShowtimeList = allShowtimes.filter(st => st.startTime.startsWith(todayStr));
        
        // Enrich Today's Showtimes
        const enrichedTodayShowtimes: EnrichedShowtime[] = todayShowtimeList.map(st => {
           const movie = movies.find(m => m.id === st.movieId);
           const screen = screens.find(s => s.id === st.screenId);
           const theater = theaters.find(t => t.id === st.theaterId || (screen && t.id === screen.theaterId));
           return { ...st, movie, screen, theater };
        }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        
        setTodayShowtimes(enrichedTodayShowtimes);

        // Calculate this month's revenue
        const currentMonth = todayObj.getMonth();
        const currentYear = todayObj.getFullYear();
        const monthRevenue = bookings
          .filter((b: Booking) => {
            if (!b.createdAt) return false;
            const d = new Date(b.createdAt);
            return (
              d.getMonth() === currentMonth && d.getFullYear() === currentYear
            );
          })
          .reduce(
            (sum: number, item: Booking) => sum + (item.totalPrice || 0),
            0
          );

        // Calculate daily revenue for last 7 days
        const last7Days: { date: string; amount: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];
          const dayRevenue = bookings
            .filter(
              (b: Booking) => b.createdAt && b.createdAt.startsWith(dateStr)
            )
            .reduce(
              (sum: number, item: Booking) => sum + (item.totalPrice || 0),
              0
            );
          last7Days.push({
            date: d.toLocaleDateString("vi-VN", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
            }),
            amount: dayRevenue,
          });
        }
        setDailyRevenue(last7Days);

        setStats({
          movies: movies.length,
          users: usersCountRes.data.count || 0,
          bookings: bookings.length,
          revenue: totalRevenue,
          todayRevenue,
          monthRevenue,
          showtimes: todayShowtimeList.length, // Count TODAY'S showtimes
          theaters: theaters.length,
          news: newsRes.data.length,
          promotions: promotionsRes.data.length,
        });

        // Fetch recent bookings with expanded info
        const recentRes = await api.get(
          "/bookings?_sort=createdAt&_order=desc&_limit=5&_expand=user&_expand=showtime"
        );
        let recents = recentRes.data;

        // Manual populate movie info
        recents = recents.map((b: EnrichedBooking): EnrichedBooking => {
          if (b.showtime) {
            b.movieTitle =
              movies.find((m: Movie) => m.id == b.showtime?.movieId)?.title ||
              "Unknown";
          }
          return b;
        });

        setRecentBookings(recents);
      } catch (error) {
        console.error("Error fetching dashboard stats", error);
      }
    };

    fetchStats();
  }, []);

  // Find max revenue for bar chart scaling
  const maxRevenue = Math.max(...dailyRevenue.map((d) => d.amount), 1);
  
  const formatTime = (iso: string) => {
     return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="d-flex flex-column gap-4">
      <div className="stats-grid">
        <StatCard icon="🎬" title="Tổng số phim" count={stats.movies} />
        <StatCard icon="👥" title="Người dùng" count={stats.users} />
        <StatCard icon="🎟️" title="Vé đã đặt" count={stats.bookings} />
        <StatCard icon="🏢" title="Rạp chiếu" count={stats.theaters} />
      </div>

      <div className="stat-card bg-gradient flex align-items-start p-5 justify-content-between">
        <StatCardRevenue
          icon="📅"
          title="Lịch chiếu hôm nay"
          count={stats.showtimes}
          color="primary"
        />
        <div className="line"></div>
        <StatCardRevenue icon="📰" title="Tin tức" count={stats.news} />
        <div className="line"></div>
        <StatCardRevenue
          icon="🎁"
          title="Khuyến mãi"
          count={stats.promotions}
          color="warning"
        />
      </div>

      <div className="stat-card bg-gradient d-flex p-5 flex-column">
        <h2 className="text-start m-0 mb-4">💰 Doanh thu</h2>
        <div className="flex justify-content-between">
          <StatCardRevenue
            title="Hôm nay"
            count={stats.todayRevenue.toLocaleString("vi-VN")}
            color="success"
            revenue={true}
          />
          <div className="line"></div>
          <StatCardRevenue
            title="Tháng này"
            count={stats.monthRevenue.toLocaleString("vi-VN")}
            color="info"
            revenue={true}
          />
          <div className="line"></div>
          <StatCardRevenue
            title="Tổng cộng"
            count={stats.revenue.toLocaleString("vi-VN")}
            color="warning"
            revenue={true}
          />
        </div>
      </div>

      <div className="stat-card bg-gradient d-flex p-5 flex-column">
        <h2 className="text-start m-0 mb-5">📈 Doanh thu 7 ngày gần nhất</h2>
        <div className="flex justify-content-between align-items-end">
          {dailyRevenue.map((day, idx) => (
            <div key={idx} className="text-center">
              <div
                className="bg-danger rounded-top mx-auto"
                style={{
                  width: "40px",
                  height: `${Math.max((day.amount / maxRevenue) * 120, 5)}px`,
                  transition: "height 0.3s ease",
                }}
                title={`${day.amount.toLocaleString("vi-VN")} đ`}
              ></div>
              <div className="text-secondary d-block mt-2">{day.date}</div>
              <div className="text-white fw-bold">
                {day.amount > 0 ? `${(day.amount / 1000).toFixed(0)}k` : "-"}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Today's Showtimes */}
      <div className="stat-card stat-custom">
        <div className="d-flex justify-content-between align-items-center mb-3">
           <h2 className="text-start m-0">📅 Lịch Chiếu Hôm Nay</h2>
           <span className="badge rounded-pill bg-danger bg-opacity-25 text-danger px-3 py-2">
              {todayShowtimes.length} suất
           </span>
        </div>
        
        <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
           <table className="table table-dark table-borderless align-middle mb-0 sticky-header">
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#1a1d20' }}>
                 <tr className="text-uppercase small text-secondary">
                    <th>Giờ chiếu</th>
                    <th>Phim</th>
                    <th>Rạp</th>
                    <th>Phòng</th>
                    <th>Loại</th>
                 </tr>
              </thead>
              <tbody>
                 {todayShowtimes.length > 0 ? (
                    todayShowtimes.map(st => (
                       <tr key={st.id} className="border-bottom border-secondary border-opacity-10">
                          <td>
                             <span className="fw-bold text-warning fs-5">{formatTime(st.startTime)}</span>
                             <div className="small text-secondary">{formatTime(st.endTime)}</div>
                          </td>
                          <td>
                             <div className="d-flex align-items-center gap-3">
                                <img 
                                   src={st.movie?.image} 
                                   alt="" 
                                   width="40" 
                                   height="60" 
                                   className="rounded object-fit-cover"
                                />
                                <div>
                                   <div className="fw-bold text-white mb-1" style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {st.movie?.title}
                                   </div>
                                   <span className="badge bg-secondary me-1">{st.movie?.age_limit}</span>
                                   <small className="text-secondary">{st.movie?.duration}p</small>
                                </div>
                             </div>
                          </td>
                          <td className="text-info">{st.theater?.name}</td>
                          <td className="text-white">{st.screen?.name}</td>
                          <td>
                             <span className={`badge ${
                                st.screen?.type === 'IMAX' ? 'bg-danger' : 
                                st.screen?.type === '4DX' ? 'bg-warning text-dark' : 'bg-success'
                             }`}>
                                {st.screen?.type || '2D'}
                             </span>
                          </td>
                       </tr>
                    ))
                 ) : (
                    <tr>
                       <td colSpan={5} className="text-center py-5 text-secondary">
                          <i className="bi bi-calendar-x mb-2 d-block fs-2"></i>
                          Không có suất chiếu nào hôm nay
                       </td>
                    </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>

      <div className="stat-card stat-custom">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="text-start m-0">🎟️ Đặt vé gần đây</h2>
          <span className="badge rounded-pill bg-info bg-opacity-25 text-info px-3 py-2">
            5 đơn mới nhất
          </span>
        </div>

        <table className="table table-dark table-borderless align-middle mb-0">
          <thead>
            <tr className="text-uppercase small text-secondary">
              <th>Mã vé</th>
              <th>Khách hàng</th>
              <th>Email</th>
              <th>Phim</th>
              <th>Thời gian</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
            </tr>
          </thead>

          <tbody>
            {recentBookings.length > 0 ? (
              recentBookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="fw-semibold">#{booking.id}</td>

                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <span>
                        {booking.user?.firstName} {booking.user?.lastName}
                      </span>
                    </div>
                  </td>

                  <td className="text-secondary">{booking.user?.email}</td>

                  <td className="text-info fw-medium">
                    {booking.movieTitle || "N/A"}
                  </td>

                  <td className="text-secondary">
                    {new Date(booking.createdAt).toLocaleString("vi-VN")}
                  </td>

                  <td className="fw-bold text-success">
                    {booking.totalPrice?.toLocaleString("vi-VN")} đ
                  </td>

                  <td>
                    <span className="badge rounded-pill bg-success bg-opacity-25 text-success px-3 py-2">
                      Hoàn thành
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-5">
                  <div className="empty-state">
                    📭
                    <p className="mt-2 mb-0">Chưa có dữ liệu đặt vé</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
