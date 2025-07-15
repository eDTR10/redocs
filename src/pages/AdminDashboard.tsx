import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/layout/AdminLayout';

import UserTable from '../components/users/UserTable';
import UserStats from '../components/users/UserStats';
import CreateUserModal from '../components/modals/CreateUserModal';
import EditUserModal from '../components/modals/EditUserModal';
import DeleteUserModal from '../components/modals/DeleteUserModal';
import { UserProvider } from '../context/UserContext';
import axios from './../plugin/axios';

const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>([]);

  

  function getUsers() {

  axios.get('users/all/',
    {
      headers: {
        'Authorization': `Token 3d43a067e8a84c40a405cb1eb00306cc5b5affb6`
      }
    }
  )
    .then((response) => {
      setData(response.data);
    })
    .catch((error) => {
      console.error('Error fetching users:', error);
    }
    );
}


  useEffect(() => {
    getUsers();

  }, []);


  return (
    <UserProvider>
      <AdminLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Account Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your users, their roles, and permissions.
          </p>
        </div>
        
        <UserStats data={data}/>
        {/* <UserFilters /> */}
        <UserTable data={data} getUsers={getUsers}/>
        
        {/* Modals */}
        <CreateUserModal getUsers={getUsers} />
        <EditUserModal getUsers={getUsers} />
        <DeleteUserModal />
      </AdminLayout>
    </UserProvider>
  );
};

export default AdminDashboard;