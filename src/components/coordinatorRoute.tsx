import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCookies, removeCookies } from "../controllers/misc/cookies.controller";
import { checkSession } from "../controllers/user/checkSession.controller";

interface CoordinatorRouteProps {
  children: React.ReactElement;
}

type RouteStatus = "loading" | "ok" | "unauth" | "forbidden" | "terms" | "vacation";

const CoordinatorRoute: React.FC<CoordinatorRouteProps> = ({ children }) => {
  const [status, setStatus] = useState<RouteStatus>("loading");

  useEffect(() => {
    const token = getCookies("authToken");
    if (!token) {
      setStatus("unauth");
      return;
    }

    checkSession()
      .then((session) => {
        const role = String(session?.session?.role ?? "");
        if (role !== "coordinator" && role !== "specialist_consultant") {
          setStatus("forbidden");
          return;
        }
        setStatus("ok");
      })
      .catch((error: any) => {
        const code = String(error?.response?.data?.code ?? "");
        if (code === "TERMS_ACCEPTANCE_REQUIRED") {
          setStatus("terms");
          return;
        }
        if (code === "VACATION_MODE") {
          removeCookies("authToken");
          removeCookies("userData");
          setStatus("vacation");
          return;
        }
        removeCookies("authToken");
        removeCookies("userData");
        setStatus("unauth");
      });
  }, []);

  if (status === "loading") return null;
  if (status === "terms") return <Navigate to="/terms-acceptance" replace />;
  if (status === "vacation") return <Navigate to="/consultant/vacation" replace />;
  if (status === "forbidden") return <Navigate to="/admin" replace />;
  if (status !== "ok") return <Navigate to="/login" replace />;

  return children;
};

export default CoordinatorRoute;
