import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient.js";
import Auth from "./components/Auth.jsx";
import DocketCRM from "./components/DocketCRM.jsx";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = still checking

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F5F0", color: "#8A8578", fontFamily: "'IBM Plex Sans', sans-serif" }}>
        Loading…
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return <DocketCRM session={session} />;
}
