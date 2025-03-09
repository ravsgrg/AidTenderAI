import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import { ProtectedRoute } from "./lib/protected-route";
import TendersPage from "@/pages/tenders";
import CreateTenderPage from "@/pages/tenders/create";
import TenderDetailPage from "@/pages/tenders/[id]";
import BidsPage from "@/pages/bids";
import BiddersPage from "@/pages/bidders";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/tenders" component={TendersPage} />
      <ProtectedRoute path="/tenders/create" component={CreateTenderPage} />
      <ProtectedRoute path="/tenders/:id" component={TenderDetailPage} />
      <ProtectedRoute path="/bids" component={BidsPage} />
      <ProtectedRoute path="/bidders" component={BiddersPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
