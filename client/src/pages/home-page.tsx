import { useEffect } from "react";
import { useLocation } from "wouter";
import { DashboardPage } from "./dashboard-page";

export default function HomePage() {
  const [_, navigate] = useLocation();

  // Redirect to the dashboard page
  useEffect(() => {
    navigate("/");
  }, [navigate]);

  // If redirection doesn't happen immediately, render the dashboard
  return <DashboardPage />;
}
