import { BrowserRouter, Link, NavLink, Route, Routes } from "react-router-dom";
import NewIncident from "./pages/NewIncident";
import Dashboard from "./pages/Dashboard";
import IncidentDetail from "./pages/IncidentDetail";
import NotFound from "./pages/NotFound";

const App = () => (
  <BrowserRouter>
    <header className="app-header">
      <Link to="/" style={{ color: "inherit" }}>
        <h1>Aegis Notice</h1>
      </Link>
      <nav>
        <NavLink to="/" end>New incident</NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
      </nav>
    </header>
    <main>
      <Routes>
        <Route path="/" element={<NewIncident />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/incident/:id" element={<IncidentDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
  </BrowserRouter>
);

export default App;
