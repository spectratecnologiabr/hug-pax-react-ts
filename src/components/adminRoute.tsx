import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCookies } from "../controllers/misc/cookies.controller";

interface AdminRouteProps {
  children: React.ReactElement;
}

type UserData = {
  role?: string;
};

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const [status, setStatus] = useState<"loading" | "unauth" | "educator" | "admin">("loading");

  useEffect(() => {
    const token = getCookies("authToken");
    const userData = getCookies("userData");

    if (!token || !userData) {
      setStatus("unauth");
      return;
    }

    let user: UserData;

    try {
      user = userData;
    } catch {
      setStatus("unauth");
      return;
    }

    if (user.role === "educator") {
      setStatus("educator");
    } else {
      setStatus("admin");
    }
  }, []);

  if (status === "loading") {
    return null; // ou loader se quiser
  }

  if (status === "unauth") {
    return <Navigate to="/login" replace />;
  }

  if (status === "educator") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
