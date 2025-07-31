
import AdminLayout from '../../components/layout/AdminLayout';


import { UserProvider } from '../../context/UserContext';


const AdminDashboard = () => {



  return (
    <UserProvider>
      <AdminLayout/>
    </UserProvider>
  );
};

export default AdminDashboard;