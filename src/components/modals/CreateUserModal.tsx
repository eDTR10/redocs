import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useUsers } from '../../context/UserContext';
import { UserFormData } from '../../types/User';
import { getUniqueProjects} from '../../data/users';
import axios from 'axios';
import Swal from 'sweetalert2';
import Select from 'react-select';

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

const accessLevelOptions = [
  { value: 1, label: 'Regional Director' },
  { value: 2, label: 'BAC Chairman' },
  { value: 3, label: 'BAC Member' },
  { value: 4, label: 'Supply Officer' },
  { value: 5, label: 'Budget Officer' },
  { value: 6, label: 'Accountant' },
  { value: 7, label: 'Inspector' },
  { value: 8, label: 'End User' },
  { value: 9, label: 'Job Order' },
];

const CreateUserModal= ({getUsers}:any) => {
  const { isCreateModalOpen, closeCreateModal,  users } = useUsers();
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // <-- Add loading state

  const projects = getUniqueProjects(users);


  // Convert projects array to react-select options
  const projectOptions = projects.map((p: string) => ({ value: p, label: p }));

  if (!isCreateModalOpen) return null;

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
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
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
    if (!validateForm()) return; // <-- Only submit if valid

    setLoading(true); // <-- Start loading
    try {
      await axios.post('/users/', formData).then(() => {
        Swal.fire({
          icon: 'success',
          title: 'User Created Successfully',
          text: `User ${formData.first_name} ${formData.last_name} has been created.`,
          showConfirmButton: false,
          timer: 1500
        })
      });
      getUsers();
      setFormData(initialFormData);
      closeCreateModal();
    } catch (error) {
      // Optionally handle error here
    } finally {
      setLoading(false); // <-- Stop loading
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setErrors({});
    closeCreateModal();
  };

  const handleAccessLevelChange = (option: any) => {
    setFormData(prev => ({
      ...prev,
      acc_lvl: option ? option.value : 3
    }));
    if (errors.acc_lvl) {
      setErrors(prev => ({ ...prev, acc_lvl: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleCancel}></div>
        
        <div className="inline-block w-full max-w-md p-6 my-8  text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Create New User</h3>
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
                  placeholder='Tailor'
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
                  placeholder='Smith'
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
                placeholder='tailor143@dict.gov.ph'
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
                  placeholder='A'
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
                <Select
                  id="acc_lvl"
                  name="acc_lvl"
                  defaultInputValue=''
                  options={accessLevelOptions}
                  value={accessLevelOptions.find(opt => opt.value === formData.acc_lvl)}
                  onChange={handleAccessLevelChange}
                  className="mt-1"
                  classNamePrefix="react-select"
                  placeholder="Select Access Level"
                />
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
                  placeholder='Project Band Manager'
                  value={formData.designation}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.designation ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                {errors.designation && (
                  <p className="mt-1 text-sm text-red-600">{errors.designation}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                  Project
                </label>
                <Select
                  id="project"
                  name="project"
                  options={projectOptions}
                  value={projectOptions.find(opt => opt.value === formData.project)}
                  onChange={option => {
                    setFormData(prev => ({ ...prev, project: option ? option.value : '' }));
                    if (errors.project) {
                      setErrors(prev => ({ ...prev, project: undefined }));
                    }
                  }}
                  className="mt-1"
                  classNamePrefix="react-select"
                  placeholder="Select Project"
                  isClearable
                />
                {errors.project && (
                  <p className="mt-1 text-sm text-red-600">{errors.project}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  placeholder='password'
                  value={formData.password}
                  onChange={handleChange}
                  className={`mt-1 block w-full px-3 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
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
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
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
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateUserModal;