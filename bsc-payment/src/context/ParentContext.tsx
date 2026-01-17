import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { config } from '../config';
import { Parent, StudentWithStatus, ParentDashboardData } from '../types/types';

interface ParentContextType {
  parent: Parent | null;
  students: StudentWithStatus[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const ParentContext = createContext<ParentContextType | undefined>(undefined);

// Mock parent ID for development - will be replaced with auth later
const MOCK_PARENT_ID = "01a8013f-e2c2-48e0-a734-4f6186be6a73";

interface ParentProviderProps {
  children: ReactNode;
}

export const ParentProvider: React.FC<ParentProviderProps> = ({ children }) => {
  const [parent, setParent] = useState<Parent | null>(null);
  const [students, setStudents] = useState<StudentWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParentData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<ParentDashboardData>(
        `${config.apiUrl}/api/parents/${MOCK_PARENT_ID}/students`
      );

      setParent(response.data.parent);
      setStudents(response.data.students);
    } catch (err) {
      console.error('Error fetching parent data:', err);
      // For development, use mock data if API fails
      setParent({
        id: "00751eec-3261-4a0b-b0b1-4698df13628f",
        auth_id: 'auth_3d7fa2e5cae2454c',
        first_name: 'Ruth',
        last_name: 'Martin',
        email: 'ruth.martin5165@mail.com',
        phone: '08032162491'
      });
      setStudents([]);
      setError('Using mock data - API not available');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParentData();
  }, []);

  const refreshData = async () => {
    await fetchParentData();
  };

  return (
    <ParentContext.Provider
      value={{
        parent,
        students,
        loading,
        error,
        refreshData
      }}
    >
      {children}
    </ParentContext.Provider>
  );
};

export const useParent = (): ParentContextType => {
  const context = useContext(ParentContext);
  if (context === undefined) {
    throw new Error('useParent must be used within a ParentProvider');
  }
  return context;
};

export default ParentContext;
