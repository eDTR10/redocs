import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useUsers } from '../../context/UserContext';
import { UserFormData } from '../../types/User';
import SearchableSelect from '../common/SearchableSelect';
import { getUniqueProjects } from '../../data/users';
import axios from './../../plugin/axios';
import Swal from 'sweetalert2';

const initialFormData: UserFormData = {
  email: '',
  first_name: '',
  last_name: '',
  inital: '',
  designation: '',
  project: '',
  acc_lvl: 3,
  password: ''
};

const EditUserModal = ({getUsers}:any) => {
  const { isEditModalOpen, closeEditModal, selectedUser, users } = useUsers();
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const projects = getUniqueProjects(users);

  useEffect(() => {
    if (selectedUser) {
      setFormData({
        email: selectedUser.email || '',
        first_name: selectedUser.first_name || '',
        last_name: selectedUser.last_name || '',
        inital: selectedUser.inital || '',
        designation: selectedUser.designation || '',
        project: selectedUser.project || '',
        acc_lvl: selectedUser.acc_lvl || 3,
        password: ''
      });
    }
  }, [selectedUser]);

  if (!isEditModalOpen || !selectedUser) return null;

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UserFormData, string>> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.first_name) newErrors.first_name = 'First name is required';
    if (!formData.last_name) newErrors.last_name = 'Last name is required';
    if (!formData.designation) newErrors.designation = 'Designation is required';
    if (!formData.project) newErrors.project = 'Project is required';
    // Password is NOT required for edit

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'acc_lvl' ? parseInt(value, 10) : value
    }));

    if (errors[name as keyof UserFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !selectedUser.id) return;

    // Confirm update for all edits
    const confirmResult = await Swal.fire({
      title: 'Update User?',
      text: 'Are you sure you want to update this user\'s information?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update',
      cancelButtonText: 'Cancel'
    });
    if (confirmResult.isConfirmed){
        setLoading(true);
    try {
      await axios.put(`users/update/${selectedUser.id}/`, formData, {
        headers: {
          'Authorization': `Token ${localStorage.getItem('accessToken')}`
        }
      }).then(()=>{

        Swal.fire({
          icon: 'success',
          title: 'User Updated Successfully',
          text: `User ${formData.first_name} ${formData.last_name} has been updated.`,
          showConfirmButton: false,
          timer: 1500
      })
      getUsers();
       setFormData(initialFormData);
 
      setErrors({});
          closeEditModal();
    })
      
      
      
    } catch (error) {
      // Optionally handle error here
    } finally {
      setLoading(false);
    }

    }else{
      setLoading(false);
    };


  
  };

  const handleCancel = () => {
    setErrors({});
    closeEditModal();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCancel}></div>
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Edit User</h3>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-500 transition-colors duration-150"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4 ">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  id="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.first_name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                )}
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  id="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.last_name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 block w-full px-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 ">
              <div>
                <label htmlFor="inital" className="block text-sm font-medium text-gray-700">
                  Initial
                </label>
                <input
                  type="text"
                  name="inital"
                  id="inital"
                  value={formData.inital}
                  onChange={handleChange}
                  maxLength={1}
                  className="mt-1 uppercase block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="acc_lvl" className="block text-sm font-medium text-gray-700">
                  Access Level
                </label>
                <select
                  id="acc_lvl"
                  name="acc_lvl"
                  value={formData.acc_lvl}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value={1}>Admin</option>
                  <option value={2}>Regional Director</option>
                  <option value={3}>Provencial Officer</option>
                  <option value={4}>Pronect Focal</option>
                  <option value={5}>Standard</option>
                  <option value={6}>Job Order</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="designation" className="block text-sm font-medium text-gray-700">
                  Designation
                </label>
                <input
                  type="text"
                  name="designation"
                  id="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.designation ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                {errors.designation && (
                  <p className="mt-1 text-sm text-red-600">{errors.designation}</p>
                )}
              </div>
              <div>
                <SearchableSelect
                  options={projects}
                  value={formData.project}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, project: value }));
                    if (errors.project) {
                      setErrors(prev => ({ ...prev, project: undefined }));
                    }
                  }}
                  placeholder="Select Project"
                  label="Project"
                />
                {errors.project && (
                  <p className="mt-1 text-sm text-red-600">{errors.project}</p>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password <span className="text-gray-400">(leave blank to keep current)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {/* No password error since not required */}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;