import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./views/Index.tsx";
import Dashboard from "./views/Dashboard.tsx";
import IncidentDetail from "./views/IncidentDetail.tsx";
import PreIntake from "./views/PreIntake.tsx";
import Recount from "./views/Recount.tsx";
import StaffDirectory from "./views/StaffDirectory.tsx";
import NotFound from "./views/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<PreIntake />} />
          <Route path="/intake" element={<Index />} />
          <Route path="/recount/:preIntakeId" element={<Recount />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/staff" element={<StaffDirectory />} />
          <Route path="/incident/:id" element={<IncidentDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
