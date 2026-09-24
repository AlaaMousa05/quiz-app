import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { I18nProvider } from "./lib/i18n/I18nProvider";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { ToastProvider } from "./components/ui/Toast";
import { router } from "./routes/router";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ErrorBoundary>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </ErrorBoundary>
      </I18nProvider>
    </QueryClientProvider>
  );
}
