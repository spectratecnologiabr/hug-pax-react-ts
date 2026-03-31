import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCookies, removeCookies } from '../controllers/misc/cookies.controller';
import { checkSession } from '../controllers/user/checkSession.controller';

interface ProtectedRouteProps {
    children: React.ReactElement;
}

function resolveDefaultProtectedPath(role?: string) {
    if (role === "student") return "/student/materials";
    if (role === "consultant") return "/consultant";
    if (role === "coordinator" || role === "specialist_consultant") return "/coordinator";
    if (role === "admin") return "/admin";
    return "/dashboard";
}

function canAccessStudentModule(role?: string) {
    return role === "student" || role === "educator" || role === "consultant" || role === "coordinator" || role === "specialist_consultant" || role === "admin";
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const location = useLocation();
    const [status, setStatus] = useState<"loading" | "ok" | "unauth" | "terms" | "vacation">( "loading");

    useEffect(() => {
        const token = getCookies('authToken');
        if (!token) {
            setStatus("unauth");
            return;
        }

        checkSession()
            .then(() => setStatus("ok"))
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

    if (status === "loading") {
        return null;
    }

    if (status === "terms") {
        return <Navigate to="/terms-acceptance" replace />;
    }

    if (status === "vacation") {
        return <Navigate to="/consultant/vacation" replace />;
    }

    if (status !== "ok") {
        return <Navigate to="/login" replace />;
    }

    try {
        const userDataRaw = getCookies("userData");
        const userData = typeof userDataRaw === "string"
            ? JSON.parse(userDataRaw)
            : userDataRaw;
        if (userData?.mustChangePassword && location.pathname !== "/profile") {
            return <Navigate to="/profile?forcePassword=1" replace />;
        }

        const isStudentRoute = location.pathname.startsWith("/student");
        const isStudent = userData?.role === "student";
        const hasStudentModuleAccess = canAccessStudentModule(userData?.role);

        if (isStudent && !isStudentRoute) {
            return <Navigate to="/student/materials" replace />;
        }

        if (!hasStudentModuleAccess && isStudentRoute) {
            return <Navigate to={resolveDefaultProtectedPath(userData?.role)} replace />;
        }
    } catch {
        // ignore parse errors and keep regular flow
    }

    return children;
};

export default ProtectedRoute;
