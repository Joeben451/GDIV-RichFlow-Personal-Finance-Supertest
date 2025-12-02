import React from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  lastLogin: string | null;
  createdAt: string;
}

interface UserListProps {
  users: User[];
  currentUserId?: number;
  onEdit?: (userId: number) => void;
  onDelete?: (userId: number) => void;
  onUserClick?: (userId: number, userName: string) => void;
}

const UserList: React.FC<UserListProps> = ({ users, currentUserId, onEdit, onDelete, onUserClick }) => {
  return (
    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-200px)] bg-(--color-card) shadow-md rounded-b-lg relative max-md:max-h-[calc(100vh-150px)] max-md:p-2 max-sm:p-1">
      <table className="w-full border-collapse max-md:block">
        <thead className="bg-(--color-dark) sticky top-0 z-10 max-md:hidden">
          <tr>
            <th className="py-5 px-4 text-center font-semibold text-white border-b-2 border-(--color-border) text-sm bg-(--color-dark) sticky top-0 max-lg:py-4 max-lg:px-3 max-lg:text-[13px]">ID</th>
            <th className="py-5 px-4 text-center font-semibold text-white border-b-2 border-(--color-border) text-sm bg-(--color-dark) sticky top-0 max-lg:py-4 max-lg:px-3 max-lg:text-[13px]">Name</th>
            <th className="py-5 px-4 text-center font-semibold text-white border-b-2 border-(--color-border) text-sm bg-(--color-dark) sticky top-0 max-lg:py-4 max-lg:px-3 max-lg:text-[13px]">Email</th>
            <th className="py-5 px-4 text-center font-semibold text-white border-b-2 border-(--color-border) text-sm bg-(--color-dark) sticky top-0 max-lg:py-4 max-lg:px-3 max-lg:text-[13px]">Date of Creation</th>
            <th className="py-5 px-4 text-center font-semibold text-white border-b-2 border-(--color-border) text-sm bg-(--color-dark) sticky top-0 max-lg:py-4 max-lg:px-3 max-lg:text-[13px]">Last Login</th>
            <th className="py-5 px-4 text-center font-semibold text-white border-b-2 border-(--color-border) text-sm bg-(--color-dark) sticky top-0 max-lg:py-4 max-lg:px-3 max-lg:text-[13px]">Actions</th>
          </tr>
        </thead>
        <tbody className="max-md:block">
          {users.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center text-gray-400 py-10 px-4 italic">
                No users found
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr 
                key={user.id}
                className={`bg-(--color-card) hover:bg-(--color-dark) max-md:block max-md:mb-4 max-md:bg-(--color-dark) max-md:rounded-lg max-md:p-4 max-md:border max-md:border-(--color-border) max-sm:p-3 max-sm:mb-3 ${onUserClick ? 'cursor-pointer hover:bg-(--color-border)' : ''}`}
                onClick={() => onUserClick?.(user.id, user.name)}
              >
                <td data-label="ID" className="py-5 px-4 border-b border-(--color-dark) text-sm text-gray-200 text-center max-lg:py-4 max-lg:px-3 max-lg:text-[13px] max-md:flex max-md:justify-between max-md:items-center max-md:py-3 max-md:px-0 max-md:border-b max-md:border-(--color-border) max-md:text-left max-md:before:content-[attr(data-label)] max-md:before:font-semibold max-md:before:text-white max-md:before:flex-[0_0_45%] max-md:before:text-[13px] max-sm:py-2 max-sm:text-xs max-sm:flex-col max-sm:items-start max-sm:gap-2 max-sm:before:flex-none max-sm:before:w-full max-sm:before:text-xs">{user.id}</td>
                <td data-label="Name" className="py-5 px-4 border-b border-(--color-dark) text-sm text-gray-200 text-center max-lg:py-4 max-lg:px-3 max-lg:text-[13px] max-md:flex max-md:justify-between max-md:items-center max-md:py-3 max-md:px-0 max-md:border-b max-md:border-(--color-border) max-md:text-left max-md:before:content-[attr(data-label)] max-md:before:font-semibold max-md:before:text-white max-md:before:flex-[0_0_45%] max-md:before:text-[13px] max-sm:py-2 max-sm:text-xs max-sm:flex-col max-sm:items-start max-sm:gap-2 max-sm:before:flex-none max-sm:before:w-full max-sm:before:text-xs">{user.name}</td>
                <td data-label="Email" className="py-5 px-4 border-b border-(--color-dark) text-sm text-gray-200 text-center max-lg:py-4 max-lg:px-3 max-lg:text-[13px] max-md:flex max-md:justify-between max-md:items-center max-md:py-3 max-md:px-0 max-md:border-b max-md:border-(--color-border) max-md:text-left max-md:before:content-[attr(data-label)] max-md:before:font-semibold max-md:before:text-white max-md:before:flex-[0_0_45%] max-md:before:text-[13px] max-sm:py-2 max-sm:text-xs max-sm:flex-col max-sm:items-start max-sm:gap-2 max-sm:before:flex-none max-sm:before:w-full max-sm:before:text-xs">{user.email}</td>
                <td data-label="Date of Creation" className="py-5 px-4 border-b border-(--color-dark) text-sm text-gray-200 text-center max-lg:py-4 max-lg:px-3 max-lg:text-[13px] max-md:flex max-md:justify-between max-md:items-center max-md:py-3 max-md:px-0 max-md:border-b max-md:border-(--color-border) max-md:text-left max-md:before:content-[attr(data-label)] max-md:before:font-semibold max-md:before:text-white max-md:before:flex-[0_0_45%] max-md:before:text-[13px] max-sm:py-2 max-sm:text-xs max-sm:flex-col max-sm:items-start max-sm:gap-2 max-sm:before:flex-none max-sm:before:w-full max-sm:before:text-xs">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </td>
                <td data-label="Last Login" className="py-5 px-4 border-b border-(--color-dark) text-sm text-gray-200 text-center max-lg:py-4 max-lg:px-3 max-lg:text-[13px] max-md:flex max-md:justify-between max-md:items-center max-md:py-3 max-md:px-0 max-md:border-b max-md:border-(--color-border) max-md:text-left max-md:before:content-[attr(data-label)] max-md:before:font-semibold max-md:before:text-white max-md:before:flex-[0_0_45%] max-md:before:text-[13px] max-sm:py-2 max-sm:text-xs max-sm:flex-col max-sm:items-start max-sm:gap-2 max-sm:before:flex-none max-sm:before:w-full max-sm:before:text-xs">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                </td>
                <td data-label="Actions" className="py-5 px-4 border-b border-(--color-dark) text-sm text-gray-200 text-center max-lg:py-4 max-lg:px-3 max-lg:text-[13px] max-md:flex max-md:justify-between max-md:items-center max-md:py-3 max-md:px-0 max-md:border-none max-md:pt-4 max-md:text-left max-md:before:content-[attr(data-label)] max-md:before:font-semibold max-md:before:text-white max-md:before:flex-[0_0_45%] max-md:before:text-[13px] max-sm:py-2 max-sm:text-xs max-sm:flex-col max-sm:items-start max-sm:gap-2 max-sm:before:flex-none max-sm:before:w-full max-sm:before:text-xs">
                  {user.id !== currentUserId ? (
                    <button 
                      className="py-1.5 px-3 mr-2 border-none rounded bg-red-600 text-white text-xs cursor-pointer transition-opacity hover:opacity-80 max-lg:py-1.5 max-lg:px-2.5 max-lg:mr-1.5 max-lg:text-[11px] max-md:min-h-11 max-md:w-full max-md:py-2.5 max-md:px-3 max-md:text-[13px] max-sm:py-2 max-sm:px-2.5 max-sm:text-xs max-sm:mr-0 max-sm:mb-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(user.id);
                      }}
                    >
                      Delete
                    </button>
                  ) : (
                    <span className="text-gray-500 text-sm">You</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserList;