import { DashboardContent } from "./dashboard-content";
import { ModelContextBadge } from "./model-context-badge";

/**
 * Dashboard Wrapper Component
 * Server component that renders dashboard content
 * Model context badge is in a separate client component
 */
export async function DashboardWrapper() {
  return (
    <div>
      {/* Model Context Badge - Client Component */}
      <ModelContextBadge />

      {/* Dashboard Content */}
      <DashboardContent />
    </div>
  );
}
