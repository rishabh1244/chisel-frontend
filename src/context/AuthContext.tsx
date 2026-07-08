import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  name: string;
  email: string;
  projects: Project[];
}

interface Project {
  id: string;
  name: string;
  description: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginDemo: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const demoProjects: Project[] = [
    { id: "1", name: "Downtown Office Tower", description: "30-story commercial building" },
    { id: "2", name: "Riverside Housing Complex", description: "150-unit residential development" },
    { id: "3", name: "Highway Bridge Renovation", description: "Structural upgrade of existing bridge" },
  ];

  const loginDemo = async () => {
    setIsLoading(true);
    // simulate async auth
    await new Promise((r) => setTimeout(r, 800));
    setUser({
      name: "Demo User",
      email: "demo@example.com",
      projects: demoProjects,
    });
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}