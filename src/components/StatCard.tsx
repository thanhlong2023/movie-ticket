interface StatCardProps {
  icon: string;
  title: string;
  count?: number;
}

function StatCard({ icon, title, count = 0 }: StatCardProps) {
  return (
    <div className="stat-card flex gap-4">
      <div className="fs-1">{icon}</div>
      <div>
        <div className="fs-3 fw-bold">{count}</div>
        <div className="text-secondary">{title}</div>
      </div>
    </div>
  );
}

export default StatCard;
