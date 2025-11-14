import { Request, Response, NextFunction } from 'express';
import { getAllUsers, getUserById, deleteUserById } from '../services/admin.service';

/**
 * Get all users
 * @route GET /api/admin/users
 * @access Private (Admin only)
 */
export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await getAllUsers();

    return res.status(200).json({
      message: 'Users fetched successfully',
      users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      error: 'Failed to fetch users',
    });
  }
}

/**
 * Get a single user by ID
 * @route GET /api/admin/users/:id
 * @access Private (Admin only)
 */
export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = parseInt(req.params.id || '');

    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
      });
    }

    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    return res.status(200).json({
      message: 'User fetched successfully',
      user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      error: 'Failed to fetch user',
    });
  }
}

/**
 * Delete a user by ID
 * @route DELETE /api/admin/users/:id
 * @access Private (Admin only)
 */
export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = parseInt(req.params.id || '');

    if (isNaN(userId)) {
      return res.status(400).json({
        error: 'Invalid user ID',
      });
    }

    // Prevent deleting self
    const currentUserId = (req as any).user?.userId;
    if (currentUserId === userId) {
      return res.status(400).json({
        error: 'Cannot delete your own account',
      });
    }

    await deleteUserById(userId);

    return res.status(200).json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      error: 'Failed to delete user',
    });
  }
}
