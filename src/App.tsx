import { Routes, Route, Navigate } from "react-router";
import { useAuth } from "@/lib/auth";
import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import DebtorsRegistry from "@/pages/DebtorsRegistry";
import CustomerRecord from "@/pages/CustomerRecord";
import Lawsuits from "@/pages/Lawsuits";
import Executions from "@/pages/Executions";
import Lawyers from "@/pages/Lawyers";
import LawyerProfile from "@/pages/LawyerProfile";
import Tasks from "@/pages/Tasks";
import SessionsPage from "@/pages/SessionsPage";
import CalendarPage from "@/pages/CalendarPage";
import MessagesPage from "@/pages/MessagesPage";
import Reports from "@/pages/Reports";
import Backup from "@/pages/Backup";
import SystemCheck from "@/pages/SystemCheck";
import UsersPage from "@/pages/UsersPage";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

function Protected({ moduleKey, children }: { moduleKey: string; children: React.ReactNode }) {
  const { user, canAccess } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!canAccess(moduleKey))
    return (
      <div className="p-10 text-center text-muted-foreground">
        ليس لديك صلاحية الوصول إلى هذه الوحدة
      </div>
    );
  return <>{children}</>;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        element={
          user ? (
            <AppLayout />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route path="/" element={<Protected moduleKey="dashboard"><Dashboard /></Protected>} />
        <Route path="/customers" element={<Protected moduleKey="customers"><Customers /></Protected>} />
        <Route path="/customers/:id" element={<Protected moduleKey="customers"><CustomerRecord /></Protected>} />
        <Route path="/debtors" element={<Protected moduleKey="debtors"><DebtorsRegistry /></Protected>} />
        <Route path="/lawsuits" element={<Protected moduleKey="lawsuits"><Lawsuits /></Protected>} />
        <Route path="/executions" element={<Protected moduleKey="executions"><Executions /></Protected>} />
        <Route path="/lawyers" element={<Protected moduleKey="lawyers"><Lawyers /></Protected>} />
        <Route path="/lawyers/:id" element={<Protected moduleKey="lawyers"><LawyerProfile /></Protected>} />
        <Route path="/tasks" element={<Protected moduleKey="tasks"><Tasks /></Protected>} />
        <Route path="/sessions" element={<Protected moduleKey="sessions"><SessionsPage /></Protected>} />
        <Route path="/calendar" element={<Protected moduleKey="calendar"><CalendarPage /></Protected>} />
        <Route path="/messages" element={<Protected moduleKey="messages"><MessagesPage /></Protected>} />
        <Route path="/reports" element={<Protected moduleKey="reports"><Reports /></Protected>} />
        <Route path="/backup" element={<Protected moduleKey="backup"><Backup /></Protected>} />
        <Route path="/system-check" element={<Protected moduleKey="system"><SystemCheck /></Protected>} />
        <Route path="/users" element={<Protected moduleKey="users"><UsersPage /></Protected>} />
        <Route path="/settings" element={<Protected moduleKey="settings"><Settings /></Protected>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
