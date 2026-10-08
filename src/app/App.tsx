import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AdminProvider } from "./contexts/AdminContext";
import { AgentProvider } from "./contexts/AgentContext";
import { ApiErrorProvider } from "./contexts/ApiErrorContext";
import { ConfirmDialogProvider } from "./contexts/ConfirmDialogContext";

export default function App() {
  return (
    <AdminProvider>
      <AgentProvider>
        <ApiErrorProvider>
          <ConfirmDialogProvider>
            <RouterProvider router={router} />
          </ConfirmDialogProvider>
        </ApiErrorProvider>
      </AgentProvider>
    </AdminProvider>
  );
}