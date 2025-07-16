import { User } from '../types/User';

// Initial user data
export const initialUsers: User[] = [
  {
    id: '1',
    email: 'janedoe@example.com',
    first_name: 'Jane',
    last_name: 'Doe',
    inital: 'A',
    designation: 'Engineer',
    project: 'eGov',
    acc_lvl: 3,
    password: 'your_secure_password'
  },
  {
    id: '2',
    email: 'johnsmith@example.com',
    first_name: 'John',
    last_name: 'Smith',
    inital: 'B',
    designation: 'Project Manager',
    project: 'Healthcare',
    acc_lvl: 2,
    password: 'secure_password_123'
  },
  {
    id: '3',
    email: 'sarahwilliams@example.com',
    first_name: 'Sarah',
    last_name: 'Williams',
    inital: 'C',
    designation: 'Designer',
    project: 'eGov',
    acc_lvl: 4,
    password: 'design_password_321'
  },
  {
    id: '4',
    email: 'michaelbrown@example.com',
    first_name: 'Michael',
    last_name: 'Brown',
    inital: 'D',
    designation: 'DevOps',
    project: 'Banking',
    acc_lvl: 3,
    password: 'ops_secure_456'
  }
];

// Get unique projects from users
export const getUniqueProjects = (_users: User[]): string[] => {
  return  ["eGov","eLGU","ILCDB","Free Wifi"]};


// Get unique designations from users
export const getUniqueDesignations = (_users: User[]): string[] => {


  return ["eGov","eLGU","ILCDB","Free Wifi"]};

// Map access level to display text
export const accessLevelLabels: { [key: number]: string } = {
  1: 'Admin',
  2: 'Regional Director',
  3: 'Provencial Officer',
  4: 'Pronect Focal',
  5: 'Standard',
  6: 'Job Order'
};


// Map access level to color
export const accessLevelColors: Record<number, string> = {
  1: 'bg-purple-100 text-purple-800',
  2: 'bg-blue-100 text-blue-800',
  3: 'bg-green-100 text-green-800',
  4: 'bg-yellow-100 text-yellow-800',
  5: 'bg-gray-100 text-gray-800',
  6: 'bg-orange-100 text-orange-800'
};