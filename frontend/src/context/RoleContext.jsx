import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export const ROLES = {
  CAMP_COORDINATOR: 'Camp Coordinator',
  IMAGING_REVIEWER: 'Imaging Reviewer',
  PATHOLOGY_REVIEWER: 'Pathology Reviewer',
  MOLECULAR_REVIEWER: 'Molecular Reviewer',
  CASE_REVIEWER: 'Case Reviewer',
  ADMINISTRATOR: 'Administrator'
};

const RoleContext = createContext();

export function RoleProvider({ children }) {
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('eyesync_role') || ROLES.CASE_REVIEWER;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('eyesync_token') || null;
  });
  const [currentUser, setCurrentUser] = useState(null);

  // Sync token whenever role changes
  useEffect(() => {
    let isMounted = true;
    localStorage.setItem('eyesync_role', currentRole);

    api.getTokenForRole(currentRole)
      .then((res) => {
        if (isMounted && res?.access_token) {
          localStorage.setItem('eyesync_token', res.access_token);
          setToken(res.access_token);
          setCurrentUser({
            username: res.username,
            role: res.role,
            fullName: res.full_name
          });
        }
      })
      .catch((err) => {
        console.warn(`Could not sync JWT token for role '${currentRole}':`, err);
      });

    return () => { isMounted = false; };
  }, [currentRole]);

  // Least-privilege role permissions (enforced both in UI and backend RBAC)
  const permissions = {
    // Camp coordinator only sees case metadata, completeness, operational delays; clinical details masked
    canViewClinicalFindings: currentRole !== ROLES.CAMP_COORDINATOR,
    canViewImaging: [ROLES.IMAGING_REVIEWER, ROLES.CASE_REVIEWER, ROLES.ADMINISTRATOR].includes(currentRole),
    canViewPathology: [ROLES.PATHOLOGY_REVIEWER, ROLES.CASE_REVIEWER, ROLES.ADMINISTRATOR].includes(currentRole),
    canViewMolecular: [ROLES.MOLECULAR_REVIEWER, ROLES.CASE_REVIEWER, ROLES.ADMINISTRATOR].includes(currentRole),
    canReviewCase: [ROLES.CASE_REVIEWER, ROLES.ADMINISTRATOR].includes(currentRole),
    canViewAdminTools: [ROLES.ADMINISTRATOR, ROLES.CASE_REVIEWER].includes(currentRole),
  };

  return (
    <RoleContext.Provider value={{ currentRole, setCurrentRole, ROLES, permissions, token, currentUser }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
