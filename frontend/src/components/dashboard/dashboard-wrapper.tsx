import { DashboardContent } from "./dashboard-content";

/**
 * Dashboard Wrapper Component
 * Server component that renders dashboard content
 */
export async function DashboardWrapper() {
  return (
    <div>
      {/* Dashboard Content */}
      <DashboardContent />
    </div>
  );
}
