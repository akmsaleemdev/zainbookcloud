import { ModulePage } from "@/components/modules/ModulePage";
import { toast } from "sonner";

const Payments = () => (
  <ModulePage title="Payments" description="Track payment transactions and history" onAdd={() => toast.info("Record payment coming soon")} addLabel="Record Payment" />
);
export default Payments;
