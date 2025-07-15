import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserFilters, UserFormData } from '../types/User';
import { initialUsers } from '../data/users';

interface UserContextType {
  users: User[];
  filters: UserFilters;
  selectedUser: User | null;
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  
  setFilters: (filters: UserFilters) => void;
  setSelectedUser: (user: User | null) => void;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  openEditModal: (user: User) => void;
  closeEditModal: () => void;
  openDeleteModal: (user: User) => void;
  closeDeleteModal: () => void;
  
  createUser: (user: UserFormData) => void;
  updateUser: (id: string, user: UserFormData) => void;
  deleteUser: (id: string) => void;
  
  filteredUsers: User[];
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    project: '',
    designation: ''
  });

  // Filter users based on filter criteria
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.last_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesProject = !filters.project || user.project === filters.project;
    const matchesDesignation = !filters.designation || user.designation === filters.designation;
    
    return matchesSearch && matchesProject && matchesDesignation;
  });

  // Create a new user
  const createUser = (userData: UserFormData) => {
    const newUser = {
      ...userData,
      id: Date.now().toString()
    };
    setUsers(prev => [...prev, newUser]);
    closeCreateModal();
  };

  // Update an existing user
  const updateUser = (id: string, userData: UserFormData) => {
    setUsers(prev => 
      prev.map(user => 
        user.id === id ? { ...userData, id } : user
      )
    );
    closeEditModal();
  };

  // Delete a user
  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(user => user.id !== id));
    closeDeleteModal();
  };

  // Modal controls
  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);
  
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };
  
  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  const value = {
    users,
    filters,
    selectedUser,
    isCreateModalOpen,
    isEditModalOpen,
    isDeleteModalOpen,
    setFilters,
    setSelectedUser,
    openCreateModal,
    closeCreateModal,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
    createUser,
    updateUser,
    deleteUser,
    filteredUsers
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUsers = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UserProvider');
  }
  return context;
};