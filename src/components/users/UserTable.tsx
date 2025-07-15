import { useState, useMemo } from 'react';
import { Edit, Trash2, Eye, User, Search, UserCircle2 } from 'lucide-react';
import { accessLevelLabels, accessLevelColors } from '../../data/users';
import axios from './../../plugin/axios';
import Swal from 'sweetalert2';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useUsers } from '@/context/UserContext';
import { Switch } from "@/components/ui/switch";
import Select from 'react-select';
import { Button } from '../ui/button';

const UserTable = ({ data, getUsers }: any) => {
  const { openEditModal } = useUsers();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingActive, setUpdatingActive] = useState<number | null>(null);

  // 🟩 Filter States
  const [searchName, setSearchName] = useState('');
  const [filterProject, setFilterProject] = useState<any>(null);
  const [filterDesignation, setFilterDesignation] = useState<any>(null);

  // 🟩 Get dropdown options
  const projectOptions = useMemo(() => {
    const projects = [...new Set(data.map((u: any) => u.project))];
    return projects.map(p => ({ value: p, label: p }));
  }, [data]);

  const designationOptions = useMemo(() => {
    const designations = [...new Set(data.map((u: any) => u.designation))];
    return designations.map(d => ({ value: d, label: d }));
  }, [data]);

  // 🟩 Filtered data
  const filteredData = useMemo(() => {
    return data.filter((user: any) => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      const matchesName = fullName.includes(searchName.toLowerCase());
      const matchesProject = !filterProject || user.project === filterProject.value;
      const matchesDesignation = !filterDesignation || user.designation === filterDesignation.value;
      return matchesName && matchesProject && matchesDesignation;
    });
  }, [data, searchName, filterProject, filterDesignation]);

  async function handleToggleActive(user: any) {
    const action = user.is_active ? 'deactivate' : 'activate';
    const confirmResult = await Swal.fire({
      title: `${user.is_active ? 'Deactivate' : 'Activate'} Account?`,
      text: `Are you sure you want to ${action} the account for ${user.first_name} ${user.last_name}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Yes, ${action}`,
      cancelButtonText: 'Cancel'
    });

    if (!confirmResult.isConfirmed) return;

    setUpdatingActive(user.id);
    try {
      await axios.put(`users/update/${user.id}/`, {
        is_active: !user.is_active,
      }, {
        headers: {
          Authorization: `Token ${localStorage.getItem('Token')}`,
        },
      });
      getUsers();
      await Swal.fire({
        icon: 'success',
        title: `Account ${user.is_active ? 'deactivated' : 'activated'}!`,
        text: `The account for ${user.first_name} ${user.last_name} has been ${user.is_active ? 'deactivated' : 'activated'}.`,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'There was a problem updating the account status.',
      });
    } finally {
      setUpdatingActive(null);
    }
  }

  function handleDeleteUser(id: any) {
    setDeleting(true);
    axios
      .delete(`users/delete/${id}/`, {
        headers: {
          Authorization: `Token 3d43a067e8a84c40a405cb1eb00306cc5b5affb6`,
        },
      })
      .then(() => {
        getUsers();
        setShowDelete(false);
        setSelectedUser(null);
      })
      .catch(() => {
        setShowDelete(false);
        setSelectedUser(null);
      })
      .finally(() => setDeleting(false));
  }

  return (
    <div className="overflow-hidden bg-white shadow-md rounded-lg">
      {/* 🔍 Filters */}

      <div className="flex items-center gap-2 pt-4  pl-4">
        <UserCircle2 className="w-5 h-5 text-gray-500" />
        <h3 className="text-lg font-semibold text-gray-900">Accout List </h3>
      </div>

      <div className=' flex w-full p-4 items-end ' >

     
      <div className={(searchName || filterProject || filterDesignation)?"border-gray-200 bg-white flex-wrap gap-4 items-end grid grid-cols-3 w-[88%]":"border-gray-200 bg-white flex-wrap gap-4 items-end grid grid-cols-3 w-[100%]"}>
       

        <div className="relative ">
          <label htmlFor="name-search" className="block text-sm font-medium text-gray-700 mb-2">
            Search by Name
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              id="name-search"
              type="text"
              placeholder="Enter first or last name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>
   

      <div>
          <label htmlFor="project-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Project
          </label>
<Select
            placeholder="Project"
            value={filterProject}
            onChange={setFilterProject}
            options={projectOptions}
            isClearable
          />

          </div>
          
     <div>
          <label htmlFor="project-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Designation
          </label>
<Select
            placeholder="Designation"
            value={filterDesignation}
            onChange={setFilterDesignation}
            options={designationOptions}
            isClearable
          />
          </div>
        
    
      </div>

        {(searchName || filterProject || filterDesignation) && (
        <div className=" w-[12%] flex justify-end">
          <Button
            onClick={
              () => {
                setSearchName('');
                setFilterProject(null);
                setFilterDesignation(null);
              }
            }
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors duration-150"
          >
            Clear Filter
          </Button>
        </div>
      )}
 </div>
      {/* 👇 Your existing table stays 100% unchanged */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Project</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Designation</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Access Level</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Active</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData?.length > 0 ? (
              filteredData.map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-300 text-blue-700 font-bold text-lg shadow">
                        {user.first_name[0]}{user.last_name[0]}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {user.inital && `${user.inital}.`}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-800">{user.email}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-800">{user.project}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-800">{user.designation}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${accessLevelColors[user.acc_lvl]}`}>
                      {accessLevelLabels[user.acc_lvl] || `Level ${user.acc_lvl}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Switch
                      checked={user.is_active}
                      onCheckedChange={() => handleToggleActive(user)}
                      disabled={updatingActive === user.id}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {/* View Details Dialog */}
                      <Dialog open={showDetails && selectedUser?.id === user.id} onOpenChange={(open) => { setShowDetails(open); if (!open) setSelectedUser(null); }}>
                        <DialogTrigger asChild>
                          <button
                            onClick={() => { setSelectedUser(user); setShowDetails(true); }}
                            className="text-gray-500 hover:text-blue-600 transition-colors duration-150"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>
                              <span className="flex flex-col items-center gap-2">
                                <span className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
                                  <User className="h-12 w-12" />
                                </span>
                                <span className="text-xl font-semibold text-gray-900">
                                  {selectedUser?.first_name} {selectedUser?.last_name}
                                </span>
                                <span className="text-gray-500">{selectedUser?.email}</span>
                              </span>
                            </DialogTitle>
                          </DialogHeader>
                          <div className="mt-6">
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">User Information</h4>
                            <div className="bg-gray-50 p-4 rounded-md space-y-3">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-gray-500">Initial</p>
                                  <p className="text-sm font-medium">{selectedUser?.inital}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Designation</p>
                                  <p className="text-sm font-medium">{selectedUser?.designation}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-gray-500">Project</p>
                                  <p className="text-sm font-medium">{selectedUser?.project}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Access Level</p>
                                  <p className="text-sm font-medium">{accessLevelLabels[selectedUser?.acc_lvl] || `Level ${selectedUser?.acc_lvl}`}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-6 flex justify-end">
                            <DialogClose asChild>
                              <button
                                type="button"
                                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                              >
                                Close
                              </button>
                            </DialogClose>
                          </div>
                        </DialogContent>
                      </Dialog>
                      {/* Edit Dialog */}
                     
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-blue-500 hover:text-blue-700 transition-colors duration-150"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                       
                      {/* Delete Confirmation Dialog */}
                      <Dialog open={showDelete && selectedUser?.id === user.id} onOpenChange={(open) => { setShowDelete(open); if (!open) setSelectedUser(null); }}>
                        <DialogTrigger asChild>
                          <button
                            onClick={() => { setSelectedUser(user); setShowDelete(true); }}
                            className="text-red-500 hover:text-red-700 transition-colors duration-150"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-sm">
                          <DialogHeader>
                            <DialogTitle>Delete User</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete <b>{selectedUser?.first_name} {selectedUser?.last_name}</b>? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose asChild>
                              <button
                                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition-colors duration-150"
                                disabled={deleting}
                              >
                                Cancel
                              </button>
                            </DialogClose>
                            <button
                              onClick={() => handleDeleteUser(selectedUser?.id)}
                              className="inline-flex my-2 justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 transition-colors duration-150"
                              disabled={deleting}
                            >
                              {deleting ? "Deleting..." : `Delete, ${selectedUser?.first_name}`}
                            </button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No users found matching your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;
