import "bootstrap/dist/css/bootstrap.min.css";

interface DatePickerProps {
  dates: {
    date: string;
    dayOfWeek: string;
    dayNumber: string;
    month: string;
  }[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({
  dates,
  selectedDate,
  onDateSelect,
}) => {
  return (
    <div id="calendar" className="d-flex justify-content-center">
      <div className="schedule d-flex justify-content-center pointer-event">
        {dates.map((dateInfo) => (
          <div
            key={dateInfo.date}
            className={`choose-date d-flex flex-column justify-content-center align-items-center date ${
              selectedDate === dateInfo.date ? "active" : ""
            }`}
            onClick={() => onDateSelect(dateInfo.date)}
          >
            <span>{dateInfo.month}</span>
            <span className="date-bold">{dateInfo.dayNumber}</span>
            <span>{dateInfo.dayOfWeek}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DatePicker;
