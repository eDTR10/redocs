import React from 'react';
import { Search } from 'lucide-react';
import { useUsers } from '../../context/UserContext';
import { getUniqueProjects, getUniqueDesignations } from '../../data/users';
import SearchableSelect from '../common/SearchableSelect';

const UserFilters: React.FC = () => {
  const { users, filters, setFilters } = useUsers();
  
  const projects = getUniqueProjects(users);
  const designations = getUniqueDesignations(users);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value });
  };

  const handleProjectChange = (value: string) => {
    setFilters({ ...filters, project: value });
  };

  const handleDesignationChange = (value: string) => {
    setFilters({ ...filters, designation: value });
  };

  const clearFilters = () => {
    setFilters({ search: '', project: '', designation: '' });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="flex flex-row items-end gap-5">
 
          <div className="relative w-[40%]">
          
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={filters.search}
              onChange={handleSearchChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
      
        
        <div className=" w-[30%] ">
          <SearchableSelect
            options={projects}
            value={filters.project}
            onChange={handleProjectChange}
            placeholder="All Projects"
            label="Project"
          />
        </div>
        
        <div className=" w-[30%] ">
          <SearchableSelect
            options={designations}
            value={filters.designation}
            onChange={handleDesignationChange}
            placeholder="All Designations"
            label="Designation"
          />
        </div>
        
        {(filters.search || filters.project || filters.designation) && (
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserFilters;