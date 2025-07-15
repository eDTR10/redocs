
import { Users, UserCog, UserCheck, UserMinus, User } from 'lucide-react';


const UserStats = ({data}:any) => {

  // Calculate statistics for each access level
  const totalUsers = data?.length;
  const adminUsers = data?.filter((user:any)=> user.acc_lvl === 1).length;
  const regionalDirectorUsers = data?.filter((user:any)=> user.acc_lvl === 2).length;
  const provencialOfficerUsers = data?.filter((user:any)=> user.acc_lvl === 3).length;
  const pronectFocalUsers = data?.filter((user:any)=> user.acc_lvl === 4).length;
  const standardUsers = data?.filter((user:any)=> user.acc_lvl === 5).length;
  const jobOrderUsers = data?.filter((user:any)=> user.acc_lvl === 6).length;

  const stats = [
    {
      name: 'Total Users',
      value: totalUsers,
      icon: <Users className="h-5 w-5 text-blue-600" />,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      name: 'Admin',
      value: adminUsers,
      icon: <UserCog className="h-5 w-5 text-purple-600" />,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      name: 'Regional Director',
      value: regionalDirectorUsers,
      icon: <UserCheck className="h-5 w-5 text-green-600" />,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      name: 'Provencial Officer',
      value: provencialOfficerUsers,
      icon: <UserMinus className="h-5 w-5 text-yellow-600" />,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      name: 'Project Focal',
      value: pronectFocalUsers,
      icon: <User className="h-5 w-5 text-pink-600" />,
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600'
    },
    {
      name: 'Standard',
      value: standardUsers,
      icon: <User className="h-5 w-5 text-orange-600 " />,
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600'
    },
    {
      name: 'Job Order',
      value: jobOrderUsers,
      icon: <User className="h-5 w-5 text-gray-600" />,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    }
  ];

  return (
    <div className="mb-8 grid md:grid-cols-3 sm:grid-cols-2 gap-5 grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="overflow-hidden rounded-lg bg-white shadow transition-all duration-300 hover:shadow-md"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-md p-3 ${stat.bgColor}`}>
                {stat.icon}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">{stat.name}</dt>
                  <dd>
                    <div className={`text-lg font-semibold ${stat.textColor}`}>{stat.value}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserStats;