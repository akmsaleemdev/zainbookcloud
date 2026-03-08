import { ModulePage } from "@/components/modules/ModulePage";
import { toast } from "sonner";

const Invoices = () => (
  <ModulePage title="Invoices" description="Track and manage all invoices" onAdd={() => toast.info("Create invoice coming soon")} addLabel="Create Invoice" />
);
export default Invoices;
