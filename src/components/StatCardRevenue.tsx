interface StatCardRevenueProps {
  icon?: string;
  title: string;
  count?: number | string;
  color?: string;
  revenue?: boolean;
}

function StatCardRevenue({
  icon,
  title,
  count = 0,
  color = "light",
  revenue = false,
}: StatCardRevenueProps) {
  return (
    <>
      <div className={`flex flex-column ${revenue ? "" : "align-items-start"}`}>
        <div className="text-secondary fs-4">
          {icon} {title}
        </div>
        <div className={`text-${color} fs-2 fw-bold ms-1`}>
          {count} {revenue && <small className="text-secondary">đ</small>}
        </div>
      </div>
    </>
  );
}

export default StatCardRevenue;
