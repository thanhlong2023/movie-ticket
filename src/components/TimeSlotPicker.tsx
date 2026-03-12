interface Session {
  time: string;
  room: number;
}

interface TimeSlotPickerProps {
  sessions: Session[];
  selectedTime: string;
  onTimeSelect: (time: string, room: number) => void;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  sessions,
  selectedTime,
  onTimeSelect,
}) => {
  return (
    <div className="time d-grid justify-content-center m-auto">
      {sessions.map((session, index) => (
        <button
          key={index}
          className={`btn-time ${
            selectedTime === session.time ? "active" : ""
          }`}
          onClick={() => onTimeSelect(session.time, session.room)}
        >
          {session.time}
        </button>
      ))}
    </div>
  );
};

export default TimeSlotPicker;
