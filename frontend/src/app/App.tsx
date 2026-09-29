import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "../features/auth/AuthProvider";
import { ToastProvider } from "../components/ui/Toast";
import { AppRouter } from "./router";

export const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
);
