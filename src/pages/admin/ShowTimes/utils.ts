export const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const getScreenTypeColor = (type: string) => {
    switch (type?.toUpperCase()) {
        case "IMAX":
            return "bg-danger";
        case "4DX":
            return "bg-warning text-dark";
        case "3D":
            return "bg-info";
        case "GOLDCLASS":
            return "bg-warning text-dark";
        default:
            return "bg-secondary";
    }
};

export const isShowtimeDeletable = (startTime: string) => {
    const stDate = new Date(startTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    stDate.setHours(0, 0, 0, 0);
    return stDate < today;
};
