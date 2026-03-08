import { useState } from "react";
import { useSubscriptionAccess } from "@/hooks/useSubscriptionAccess";
import { UpgradePrompt } from "./UpgradePrompt";
import { Button } from "@/components/ui/button";

interface UsageLimitGuardProps {
  resource: "properties" | "tenants" | "users";
  children: (props: { onCheck: () => Promise<boolean> }) => React.ReactNode;
}

/**
 * Wraps a create action to check usage limits before proceeding.
 * Usage: <UsageLimitGuard resource="tenants">{({ onCheck }) => <Button onClick={async () => { if (await onCheck()) openDialog(); }}>Add</Button>}</UsageLimitGuard>
 */
export const UsageLimitGuard = ({ resource, children }: UsageLimitGuardProps) => {
  const { checkUsageLimit } = useSubscriptionAccess();
  const [blocked, setBlocked] = useState(false);

  const onCheck = async (): Promise<boolean> => {
    const result = await checkUsageLimit(resource);
    if (!result.allowed) {
      setBlocked(true);
      return false;
    }
    return true;
  };

  if (blocked) {
    return (
      <div className="space-y-4">
        <UpgradePrompt module={resource} reason="limit" resourceName={resource} />
        <div className="text-center">
          <Button variant="ghost" onClick={() => setBlocked(false)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return <>{children({ onCheck })}</>;
};
