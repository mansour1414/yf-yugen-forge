import React, { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const { permissions, role } = useAuth();

  // If Admin role or permission is present in permissions list
  const hasPermission = role?.name === 'Admin' || permissions.includes(permission);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
