import React, { useEffect, useState } from 'react';
import UserList from '../UserList/UserList';
import AdminUserFinancialView from '../AdminUserFinancialView/AdminUserFinancialView';
import { adminAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalUsers: number;
  activeToday: number;
  newThisWeek: number;
  admins: number;
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
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, activeToday: 0, newThisWeek: 0, admins: 0 });

  // Calculate statistics from users
  const calculateStats = (userList: User[]): Stats => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      totalUsers: userList.length,
      activeToday: userList.filter(u => u.lastLogin && new Date(u.lastLogin) >= today).length,
      newThisWeek: userList.filter(u => new Date(u.createdAt) >= weekAgo).length,
      admins: userList.filter(u => u.isAdmin).length,
    };
  };

  // Fetch users from the database
  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await adminAPI.getUsers();

        const transformedUsers = response.users.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin || false,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }));

        setUsers(transformedUsers);
        setFilteredUsers(transformedUsers);
        setStats(calculateStats(transformedUsers));
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

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await adminAPI.deleteUser(userId);
      const updatedUsers = users.filter(user => user.id !== userId);
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers.filter(user =>
        !searchQuery.trim() ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.toString().includes(searchQuery)
      ));
      setStats(calculateStats(updatedUsers));
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
      <main className="rf-dashboard-content">
        <AdminUserFinancialView
          userId={selectedUserId}
          userName={selectedUserName}
          onBack={handleBackToUserList}
        />
      </main>
    );
  }

  return (
    <main className="rf-dashboard-content">
      {/* Statistics Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rf-card flex flex-col">
            <span className="text-xs uppercase tracking-wider text-(--color-text-muted) mb-1">Total Users</span>
            <span className="text-2xl font-bold text-(--color-gold)">{stats.totalUsers}</span>
          </div>
          <div className="rf-card flex flex-col">
            <span className="text-xs uppercase tracking-wider text-(--color-text-muted) mb-1">Active Today</span>
            <span className="text-2xl font-bold text-(--color-success)">{stats.activeToday}</span>
          </div>
          <div className="rf-card flex flex-col">
            <span className="text-xs uppercase tracking-wider text-(--color-text-muted) mb-1">New This Week</span>
            <span className="text-2xl font-bold text-(--color-purple-light)">{stats.newThisWeek}</span>
          </div>
          <div className="rf-card flex flex-col">
            <span className="text-xs uppercase tracking-wider text-(--color-text-muted) mb-1">Administrators</span>
            <span className="text-2xl font-bold text-(--color-purple)">{stats.admins}</span>
          </div>
        </div>
      )}

      {/* Header Card with Title and Search */}
      <div className="rf-card mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-(--color-gold) m-0">User Directory</h2>
            <span className="text-sm text-(--color-text-muted)">
              {!loading && !error && (
                searchQuery 
                  ? `${filteredUsers.length} result${filteredUsers.length !== 1 ? 's' : ''} found`
                  : 'Click on a user to view their financial details'
              )}
            </span>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[280px] sm:max-w-[400px]">
            <input
              type="text"
              className="rf-input w-full"
              placeholder="Search users..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="rf-card p-0 overflow-hidden">
        {authLoading || loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-3 border-(--color-border) border-t-(--color-purple) rounded-full animate-spin"></div>
            <span className="text-sm text-(--color-text-muted)">Loading users...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span className="text-4xl">⚠️</span>
            <span className="text-sm text-(--color-error)">{error}</span>
            <button className="rf-btn-primary w-auto px-6 py-2 text-sm" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-4xl opacity-40">👤</span>
            <span className="text-sm text-(--color-text-dim)">
              {searchQuery ? 'No users match your search' : 'No users found'}
            </span>
          </div>
        ) : (
          <UserList
            users={filteredUsers}
            currentUserId={user?.id ? Number(user.id) : undefined}
            onDelete={handleDelete}
            onUserClick={handleUserClick}
          />
        )}
      </div>
    </main>
  );
};

export default AdminPanel;