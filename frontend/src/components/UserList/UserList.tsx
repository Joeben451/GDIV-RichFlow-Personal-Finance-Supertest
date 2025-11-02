import React from 'react';
import './UserList.css';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'online' | 'offline';
  joinedDate: string;
}

interface UserListProps {
  users: User[];
  onEdit?: (userId: number) => void;
  onDelete?: (userId: number) => void;
}

const UserList: React.FC<UserListProps> = ({ users, onEdit, onDelete }) => {
  return (
    <div className="users-table-container">
      <table className="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={7} className="empty-state">
                No users found
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge role-${user.role.toLowerCase()}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${user.status}`}>
                    {user.status}
                  </span>
                </td>
                <td>{new Date(user.joinedDate).toLocaleDateString()}</td>
                <td>
                  <button 
                    className="action-btn edit-btn"
                    onClick={() => onEdit?.(user.id)}
                  >
                    Edit
                  </button>
                  <button 
                    className="action-btn delete-btn"
                    onClick={() => onDelete?.(user.id)}
                  >
                    Delete
                  </button>
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