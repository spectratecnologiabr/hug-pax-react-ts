import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCookies, removeCookies } from "../controllers/misc/cookies.controller";
import { checkSession } from "../controllers/user/checkSession.controller";

interface AdminRouteProps {
  children: React.ReactElement;
}

type UserData = {
  role?: string;
};

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const [status, setStatus] = useState<"loading" | "unauth" | "educator" | "vacation" | "terms" | "admin">("loading");

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

    checkSession()
      .then(() => {
        if (user.role === "educator") {
          setStatus("educator");
          return;
        }
        setStatus("admin");
      })
      .catch((error: any) => {
        const code = String(error?.response?.data?.code ?? "");
        if (code === "VACATION_MODE" && user.role === "consultant") {
          removeCookies("authToken");
          removeCookies("userData");
          setStatus("vacation");
          return;
        }
        if (code === "TERMS_ACCEPTANCE_REQUIRED") {
          setStatus("terms");
          return;
        }
        removeCookies("authToken");
        removeCookies("userData");
        setStatus("unauth");
      });
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

  if (status === "vacation") {
    return <Navigate to="/consultant/vacation" replace />;
  }

  if (status === "terms") {
    return <Navigate to="/terms-acceptance" replace />;
  }

  return children;
};

export default AdminRoute;
