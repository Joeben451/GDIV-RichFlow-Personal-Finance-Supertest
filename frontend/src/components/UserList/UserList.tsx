import React from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserListProps {
  users: User[];
  currentUserId?: number;
  onDelete?: (userId: number) => void;
  onUserClick?: (userId: number, userName: string) => void;
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getTimeAgo = (dateString: string | null): string => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
};

const UserList: React.FC<UserListProps> = ({ users, currentUserId, onDelete, onUserClick }) => {
  return (
    <div className="divide-y divide-(--color-border)">
      {users.map((user) => {
        const isCurrentUser = user.id === currentUserId;
        
        return (
          <div
            key={user.id}
            className="p-4 transition-colors hover:bg-(--color-border)/30"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* User Avatar & Primary Info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-(--color-purple) to-(--color-purple-light) flex items-center justify-center shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white truncate">{user.name}</span>
                    {user.isAdmin && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-(--color-purple)/20 text-(--color-purple-light) border border-(--color-purple)/30">
                        Admin
                      </span>
                    )}
                    {isCurrentUser && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-(--color-gold)/20 text-(--color-gold) border border-(--color-gold)/30">
                        You
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-(--color-text-muted) truncate">{user.email}</div>
                </div>
              </div>

              {/* User Meta Info */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm">
                <div className="flex flex-col">
                  <span className="text-(--color-text-dim) text-[10px] uppercase tracking-wider">ID</span>
                  <span className="text-(--color-text-muted) font-mono">#{user.id}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-(--color-text-dim) text-[10px] uppercase tracking-wider">Joined</span>
                  <span className="text-(--color-text-muted)">{formatDate(user.createdAt)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-(--color-text-dim) text-[10px] uppercase tracking-wider">Last Active</span>
                  <span className={user.lastLogin ? 'text-(--color-success)' : 'text-(--color-text-dim)'}>
                    {getTimeAgo(user.lastLogin)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 sm:ml-4">
                {!isCurrentUser && onDelete && (
                  <button
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-(--color-error)/10 text-(--color-error) border border-(--color-error)/20 hover:bg-(--color-error)/20 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(user.id);
                    }}
                  >
                    Delete
                  </button>
                )}
                {onUserClick && (
                  <button
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-(--color-purple)/10 text-(--color-purple-light) border border-(--color-purple)/20 hover:bg-(--color-purple)/20 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUserClick(user.id, user.name);
                    }}
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default UserList;