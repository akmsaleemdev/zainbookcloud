import { ModulePage } from "@/components/modules/ModulePage";
import { toast } from "sonner";

const Organizations = () => (
  <ModulePage title="Organizations" description="Manage organizations and companies" onAdd={() => toast.info("Add organization coming soon")} addLabel="Add Organization" />
);
export default Organizations;
