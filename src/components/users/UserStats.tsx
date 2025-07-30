import { Users, UserCog, UserCheck, UserMinus, User, Shield, DollarSign, Calculator, Search, UserX } from 'lucide-react';


const UserStats = ({data}:any) => {

  // Calculate statistics for each access level
  const totalUsers = data?.length;
  const regionalDirectorUsers = data?.filter((user:any)=> user.acc_lvl === 1).length;
  const bacChairmanUsers = data?.filter((user:any)=> user.acc_lvl === 2).length;
  const bacMemberUsers = data?.filter((user:any)=> user.acc_lvl === 3).length;
  const supplyOfficerUsers = data?.filter((user:any)=> user.acc_lvl === 4).length;
  const budgetOfficerUsers = data?.filter((user:any)=> user.acc_lvl === 5).length;
  const accountantUsers = data?.filter((user:any)=> user.acc_lvl === 6).length;
  const inspectorUsers = data?.filter((user:any)=> user.acc_lvl === 7).length;
  const endUserUsers = data?.filter((user:any)=> user.acc_lvl === 8).length;
  const jobOrderUsers = data?.filter((user:any)=> user.acc_lvl === 9).length;

  const stats = [
    {
      name: 'Total Users',
      value: totalUsers,
      icon: <Users className="h-5 w-5 text-blue-600" />,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      name: 'Regional Director',
      value: regionalDirectorUsers,
      icon: <UserCog className="h-5 w-5 text-purple-600" />,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      name: 'BAC Chairman',
      value: bacChairmanUsers,
      icon: <Shield className="h-5 w-5 text-green-600" />,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      name: 'BAC Member',
      value: bacMemberUsers,
      icon: <UserCheck className="h-5 w-5 text-emerald-600" />,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    },
    {
      name: 'Supply Officer',
      value: supplyOfficerUsers,
      icon: <UserMinus className="h-5 w-5 text-yellow-600" />,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      name: 'Budget Officer',
      value: budgetOfficerUsers,
      icon: <DollarSign className="h-5 w-5 text-pink-600" />,
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600'
    },
    {
      name: 'Accountant',
      value: accountantUsers,
      icon: <Calculator className="h-5 w-5 text-orange-600" />,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      name: 'Inspector',
      value: inspectorUsers,
      icon: <Search className="h-5 w-5 text-indigo-600" />,
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600'
    },
    {
      name: 'End User',
      value: endUserUsers,
      icon: <User className="h-5 w-5 text-gray-600" />,
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600'
    },
    {
      name: 'Job Order',
      value: jobOrderUsers,
      icon: <UserX className="h-5 w-5 text-red-600" />,
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    }
  ];

  return (
    <div className="mb-8 grid lg:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 grid-cols-4 gap-5">
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