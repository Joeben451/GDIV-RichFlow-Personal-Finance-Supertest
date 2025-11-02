import React from 'react';
import './AdminPanel.css';
import UserList from '../UserList/UserList';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'online' | 'offline';
  joinedDate: string;
}

const AdminPanel: React.FC = () => {

  const [users] = React.useState<User[]>([
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Admin',
      status: 'offline',
      joinedDate: '2024-01-15'
    },
        {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'User',
      status: 'offline',
      joinedDate: '2024-01-15'
    },
        {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'User',
      status: 'online',
      joinedDate: '2024-01-15'
    },
        {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'User',
      status: 'offline',
      joinedDate: '2024-01-15'
    },
        {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Admin',
      status: 'offline',
      joinedDate: '2024-01-15'
    },
        {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Admin',
      status: 'online',
      joinedDate: '2024-01-15'
    },
        {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Admin',
      status: 'offline',
      joinedDate: '2024-01-15'
    },
        {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'User',
      status: 'offline',
      joinedDate: '2024-01-15'
    },
        {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'User',
      status: 'online',
      joinedDate: '2024-01-15'
    },
        {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'User',
      status: 'offline',
      joinedDate: '2024-01-15'
    },
        {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Admin',
      status: 'offline',
      joinedDate: '2024-01-15'
    },
        {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'Admin',
      status: 'online',
      joinedDate: '2024-01-15'
    },
  ]);

  const handleEdit = (userId: number) => {
    console.log('Edit user:', userId);
    // Add your edit logic here
  };

  const handleDelete = (userId: number) => {
    console.log('Delete user:', userId);
    // Add your delete logic here
  };

  return (
    <section className="admin-section">
      <div className="admin-header">
        <h2 className="admin-title">Users</h2>
      </div>

      <div className="admin-content">
        <UserList 
          users={users} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </section>
  );
};

export default AdminPanel;