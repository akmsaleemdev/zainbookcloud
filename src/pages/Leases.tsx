import { ModulePage } from "@/components/modules/ModulePage";
import { toast } from "sonner";

const Leases = () => (
  <ModulePage title="Leases" description="Manage lease contracts and agreements" onAdd={() => toast.info("Add lease form coming soon")} addLabel="Add Lease" />
);
export default Leases;
