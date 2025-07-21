import AdminPerRoleLayout from "@/components/layout/AdminPerRoleLayout";
import { UserProvider } from "@/context/UserContext";


function Document() {
  return (
    <UserProvider>
      <AdminPerRoleLayout />
    </UserProvider>
  );
}

export default Document
