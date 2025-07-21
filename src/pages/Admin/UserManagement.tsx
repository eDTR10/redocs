
import UserStats from '@/components/users/UserStats';

import axios from '../../plugin/axios';
import { useEffect, useState } from 'react'
import UserTable from '@/components/users/UserTable';
import CreateUserModal from '@/components/modals/CreateUserModal';
import EditUserModal from '@/components/modals/EditUserModal';
import DeleteUserModal from '@/components/modals/DeleteUserModal';

function UserManagement() {

      const [data, setData] = useState<any>([]);

  

  function getUsers() {

  axios.get('users/all/',
    {
      headers: {
        'Authorization': `Token ${localStorage.getItem('accessToken')}`
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
    <div>

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
    </div>
  )
}

export default UserManagement