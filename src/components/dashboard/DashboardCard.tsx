import type { ReactNode } from "react";
import "./DashboardCard.css";

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  accent?: "gold" | "blue" | "green" | "purple";
}

export default function DashboardCard({
  title,
  subtitle,
  icon,
  children,
  accent = "gold",
}: DashboardCardProps) {
  return (
    <section className={`dashboard-card accent-${accent}`}>
      <div className="dashboard-card-header">
        <div className="dashboard-card-title">
          {icon && <span className="dashboard-card-icon">{icon}</span>}

          <div>
            <h2>{title}</h2>

            {subtitle && (
              <p className="dashboard-card-subtitle">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-card-body">{children}</div>
    </section>
  );
}