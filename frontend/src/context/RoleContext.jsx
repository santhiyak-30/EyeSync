import React, { createContext, useContext, useState, useEffect } from 'react';

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

  useEffect(() => {
    localStorage.setItem('eyesync_role', currentRole);
  }, [currentRole]);

  // Least-privilege role permissions
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
    <RoleContext.Provider value={{ currentRole, setCurrentRole, ROLES, permissions }}>
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
