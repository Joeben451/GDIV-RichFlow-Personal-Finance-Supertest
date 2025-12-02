import React, { useEffect, useState } from 'react';
import UserList from '../UserList/UserList';
import AdminUserFinancialView from '../AdminUserFinancialView/AdminUserFinancialView';
import { adminAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

interface User {
  id: number;
  name: string;
  email: string;
  lastLogin: string | null;
  createdAt: string;
}

const AdminPanel: React.FC = () => {
  const { loading: authLoading, isAuthenticated, user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');

  // Fetch users from the database
  useEffect(() => {
    // Wait for auth to finish loading before fetching users
    if (authLoading || !isAuthenticated) {
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminAPI.getUsers();
        
        // Transform the API response to match the User interface
        const transformedUsers = response.users.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        }));
        
        setUsers(transformedUsers);
        setFilteredUsers(transformedUsers);
      } catch (err) {
        setError('Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [authLoading, isAuthenticated]);

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.id.toString().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleEdit = (userId: number) => {
    // Add your edit logic here
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await adminAPI.deleteUser(userId);
      // Remove the deleted user from the state
      const updatedUsers = users.filter(user => user.id !== userId);
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers.filter(user => 
        !searchQuery.trim() || 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.toString().includes(searchQuery)
      ));
      alert('User deleted successfully');
    } catch (err) {
      alert('Failed to delete user. Please try again.');
    }
  };

  const handleUserClick = (userId: number, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
  };

  const handleBackToUserList = () => {
    setSelectedUserId(null);
    setSelectedUserName('');
  };

  // If a user is selected, show their financial data
  if (selectedUserId !== null) {
    return (
      <section className="flex flex-col h-full flex-1 mx-8 my-4 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-[#0f0f0f] scrollbar-thumb-purple-gold max-lg:mx-6 max-md:mx-4 max-md:my-3 max-sm:mx-2 max-sm:my-2">
        <AdminUserFinancialView
          userId={selectedUserId}
          userName={selectedUserName}
          onBack={handleBackToUserList}
        />
      </section>
    );
  }

  return (
    <section className="flex flex-col h-full flex-1 mx-8 my-4 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-[#0f0f0f] scrollbar-thumb-purple-gold max-lg:mx-6 max-md:mx-4 max-md:my-3 max-sm:mx-2 max-sm:my-2">
      <div className="bg-linear-to-r from-(--color-purple) to-[#9d6dd4] py-4 px-8 rounded-t-lg flex justify-between items-center gap-8 relative max-lg:px-6 max-lg:gap-6 max-md:px-4 max-md:gap-4 max-md:flex-col max-sm:px-3 max-sm:gap-3">
        <h2 className="m-0 text-[1.8rem] font-bold text-white text-center shrink-0 absolute left-1/2 -translate-x-1/2 max-lg:text-[1.6rem] max-md:text-2xl max-md:w-full max-md:static max-md:transform-none max-sm:text-xl">Users</h2>
        <div className="flex-1 max-w-[400px] ml-auto max-lg:max-w-[300px] max-lg:ml-0 max-md:max-w-full max-md:w-full">
          <input
            type="text"
            className="w-full py-2.5 px-4 border-2 border-white/20 rounded-md bg-white/10 text-white text-[0.95rem] transition-all duration-300 min-h-44px placeholder:text-white/60 focus:outline-none focus:border-white/50 focus:bg-white/15 max-sm:text-sm max-sm:py-2 max-sm:px-3"
            placeholder="Search by name, email, or ID..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="flex-1 bg-(--color-dark)">
        {authLoading || loading ? (
          <div className="text-white text-center p-8 text-lg">Loading users...</div>
        ) : error ? (
          <div className="text-red-500 text-center p-8">{error}</div>
        ) : (
          <UserList 
            users={filteredUsers}
            currentUserId={user?.id ? Number(user.id) : undefined}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onUserClick={handleUserClick}
          />
        )}
      </div>
    </section>
  );
};

export default AdminPanel;