import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import { ProtectedRoute } from "./lib/protected-route";
import InventoryManagement from "@/components/inventory/InventoryManagement";
import CategoriesPage from "@/pages/categories";
import TenderManagement from "./components/tender/TenderManagement";
import BidManagement from "./components/bidding/BidManagement";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/inventory" component={InventoryManagement} />
      <ProtectedRoute path="/categories" component={CategoriesPage} />
      <ProtectedRoute path="/tenders" component={TenderManagement} />
      <ProtectedRoute path="/bids" component={BidManagement} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  console.log("App rendering");
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