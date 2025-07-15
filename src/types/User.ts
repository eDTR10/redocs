export interface User {
  id?: string;
  email: string;
  first_name: string;
  last_name: string;
  inital: string;
  designation: string;
  project: string;
  acc_lvl: number;
  password: string;
}

export type UserFormData = Omit<User, 'id'>;

export interface UserFilters {
  search: string;
  project: string;
  designation: string;
}