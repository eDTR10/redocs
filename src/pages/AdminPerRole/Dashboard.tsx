
import AdminPerRoleLayout from "@/components/layout/AdminPerRoleLayout";
import { UserProvider } from "@/context/UserContext";


function Dashboard() {
  return (
    <UserProvider>
      <AdminPerRoleLayout />
    </UserProvider>
  );
}

export default Dashboard;