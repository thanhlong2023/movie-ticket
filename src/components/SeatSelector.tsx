import React, { useState, useEffect, useMemo, useCallback } from "react";

interface Seat {
  id: number;
  screenId: number;
  row: string;
  col: number;
  code: string;
  type: "standard" | "vip" | "couple";
  status: "active" | "hidden" | "maintenance";
}

interface SeatSelectorProps {
  bookedSeats: string[];
  onSeatsChange: (seats: string[], totalPrice: number) => void;
  screenSeats?: Seat[];
  prices?: {
    standard: number;
    vip: number;
    couple: number;
  };
  rows?: number;
  cols?: number;
}

const DEFAULT_PRICES = {
  standard: 75000,
  vip: 90000,
  couple: 150000,
};

const SeatSelector: React.FC<SeatSelectorProps> = ({
  bookedSeats,
  onSeatsChange,
  screenSeats,
  prices = DEFAULT_PRICES,
  rows = 8,
  cols = 10,
}) => {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(600);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Build seat grid from database
  const seatGrid = useMemo(() => {
    if (!screenSeats || screenSeats.length === 0) {
      // Generate default grid
      const defaultSeats: Seat[] = [];
      const rowLabels = "ABCDEFGHIJKLMNOP".split("");
      for (let r = 0; r < rows; r++) {
        for (let c = 1; c <= cols; c++) {
          const rowLabel = rowLabels[r];
          defaultSeats.push({
            id: r * cols + c,
            screenId: 1,
            row: rowLabel,
            col: c,
            code: `${rowLabel}${c}`,
            type:
              r >= 3 && r <= 5 ? "vip" : r === rows - 1 ? "couple" : "standard",
            status: "active",
          });
        }
      }
      return defaultSeats;
    }
    return screenSeats;
  }, [screenSeats, rows, cols]);

  // Group seats by row
  const groupedSeats = useMemo(() => {
    const grouped: Record<string, Seat[]> = {};
    seatGrid.forEach((seat) => {
      if (!grouped[seat.row]) grouped[seat.row] = [];
      grouped[seat.row].push(seat);
    });
    // Sort seats within each row
    Object.keys(grouped).forEach((row) => {
      grouped[row].sort((a, b) => a.col - b.col);
    });
    return grouped;
  }, [seatGrid]);

  // Sorted row labels
  const sortedRows = useMemo(() => {
    return Object.keys(groupedSeats).sort();
  }, [groupedSeats]);

  // Get seat price
  const getSeatPrice = useCallback(
    (seat: Seat): number => {
      return prices[seat.type] || prices.standard;
    },
    [prices]
  );

  // Calculate total price
  useEffect(() => {
    const total = selectedSeats.reduce((acc, code) => {
      const seat = seatGrid.find((s) => s.code === code);
      if (seat) return acc + getSeatPrice(seat);
      return acc;
    }, 0);
    onSeatsChange(selectedSeats, total);
  }, [selectedSeats, seatGrid, getSeatPrice, onSeatsChange]);

  const toggleSeat = (seat: Seat) => {
    if (bookedSeats.includes(seat.code) || seat.status !== "active") return;

    setSelectedSeats((prev) =>
      prev.includes(seat.code)
        ? prev.filter((s) => s !== seat.code)
        : [...prev, seat.code]
    );
  };

  return (
    <div className="seat-selector-container">
      {/* Header with prices and timer */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div className="d-flex gap-3 flex-wrap">
          <span className="badge bg-secondary px-3 py-2">
            {prices.standard.toLocaleString()}đ - Thường
          </span>
          <span className="badge bg-warning text-dark px-3 py-2">
            {prices.vip.toLocaleString()}đ - VIP
          </span>
          <span className="badge bg-danger px-3 py-2">
            {prices.couple.toLocaleString()}đ - Đôi
          </span>
        </div>
        <div className="countdown-timer px-3 py-2 rounded border border-danger text-white">
          Thời gian chọn ghế:{" "}
          <span className="fw-bold">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Screen */}
      <div className="screen-container mb-4">
        <div className="screen-visual"></div>
        <div className="text-center text-secondary mt-2 fw-bold">MÀN HÌNH</div>
      </div>

      {/* Seat Grid - Admin Style */}
      <div
        className="seat-grid-container p-4 bg-black rounded border border-secondary d-inline-block mx-auto"
        style={{ display: "block", overflowX: "auto" }}
      >
        <div className="d-flex flex-column align-items-center">
          {sortedRows.map((rowLabel) => (
            <div
              key={rowLabel}
              className="d-flex align-items-center justify-content-center mb-1"
            >
              {/* Row Label */}
              <div
                className="text-secondary fw-bold me-3"
                style={{ width: 24, textAlign: "center" }}
              >
                {rowLabel}
              </div>

              {/* Seats */}
              {groupedSeats[rowLabel].map((seat) => {
                const isBooked = bookedSeats.includes(seat.code);
                const isSelected = selectedSeats.includes(seat.code);
                const isHidden = seat.status === "hidden";
                const isMaintenance = seat.status === "maintenance";

                if (isHidden) {
                  return (
                    <div
                      key={seat.code}
                      style={{
                        width: 40,
                        height: 40,
                        margin: 2,
                        visibility: "hidden",
                      }}
                    />
                  );
                }

                let seatClass = "seat-item";
                if (isBooked) {
                  seatClass += " seat-booked";
                } else if (isSelected) {
                  seatClass += " seat-selected";
                } else if (isMaintenance) {
                  seatClass += " seat-maintenance";
                } else if (seat.type === "vip") {
                  seatClass += " seat-vip-item";
                } else if (seat.type === "couple") {
                  seatClass += " seat-couple-item";
                } else {
                  seatClass += " seat-standard";
                }

                return (
                  <div
                    key={seat.code}
                    className={seatClass}
                    onClick={() => toggleSeat(seat)}
                    title={`${seat.code} - ${getSeatPrice(
                      seat
                    ).toLocaleString()}đ`}
                    style={{
                      cursor:
                        isBooked || isMaintenance ? "not-allowed" : "pointer",
                    }}
                  >
                    {isBooked ? "X" : seat.code}
                  </div>
                );
              })}

              {/* Row Label Right */}
              <div
                className="text-secondary fw-bold ms-3"
                style={{ width: 24, textAlign: "center" }}
              >
                {rowLabel}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="d-flex justify-content-center flex-wrap gap-4 mt-4">
        <div className="d-flex align-items-center gap-2">
          <div
            className="seat-item seat-booked"
            style={{ width: 28, height: 28, fontSize: 10 }}
          >
            X
          </div>
          <span className="text-secondary small">Đã đặt</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div
            className="seat-item seat-selected"
            style={{ width: 28, height: 28 }}
          ></div>
          <span className="text-secondary small">Đang chọn</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div
            className="seat-item seat-standard"
            style={{ width: 28, height: 28 }}
          ></div>
          <span className="text-secondary small">Thường</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div
            className="seat-item seat-vip-item"
            style={{ width: 28, height: 28 }}
          ></div>
          <span className="text-secondary small">VIP</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <div
            className="seat-item seat-couple-item"
            style={{ width: 28, height: 28 }}
          ></div>
          <span className="text-secondary small">Đôi</span>
        </div>
      </div>
    </div>
  );
};

export default SeatSelector;
