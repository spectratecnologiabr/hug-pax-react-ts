import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/protectedRoute';
import AdminRoute from './components/adminRoute';

// Auth Routes
import Login from './pages/login';
import ForgotPassword from './pages/forgotPassword';
import ResetPassword from './pages/resetPassword';

// AVA Routes
import Dashboard from './pages/dashboard';
import Course from './pages/course';
import EducatorsRoom from './pages/educatorsRoom';
import Profile from './pages/profile';
import Notifications from './pages/notifications';
import Certificates from './pages/certificatesPage';
import AuthCertificate from './pages/authCertificate';

// Admin Routes
import ConsultantDash from './pages/consultantDash';
import CollegesPage from './pages/collegesPage';
import NewCollegePage from './pages/newCollegePage';
import EditCollegePage from './pages/editCollegePage';
import ViewCollegeData from './pages/viewCollegeData';
import EducatorsList from './pages/educatorsList';
import NewEducatorPage from './pages/newEducatorPage';
import EditEducatorPage from './pages/editEducatorPage';
import ViewEducatorData from './pages/viewEducatorData';
import VisitFormAnswers from './pages/visitFormAnswers';
import VisitReportPreview from "./pages/visitReportPreview";

import Courses from './pages/courses';
import NewCoursePage from './pages/newCoursePage';
import EditCoursePage from './pages/editCoursePage';

function MyRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Login/>} />
                <Route path='/login' element={<Login/>} />
                <Route path='/forgot-password' element={<ForgotPassword/>} />
                <Route path='/reset-password' element={<ResetPassword/>} />

                <Route path='/dashboard' element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
                <Route path='/courses' element={<ProtectedRoute><EducatorsRoom/></ProtectedRoute>} />
                <Route path='/course/:courseSlug' element={<ProtectedRoute><Course /></ProtectedRoute>} />
                <Route path='/course/:courseSlug/lesson/:lessonId' element={<ProtectedRoute><Course /></ProtectedRoute>} />
                <Route path='/profile' element={<ProtectedRoute><Profile/></ProtectedRoute>} />
                <Route path='/notifications' element={<ProtectedRoute><Notifications/></ProtectedRoute>} />
                <Route path='/certificates' element={<ProtectedRoute><Certificates/></ProtectedRoute>} />
                <Route path='/auth-certificate/:code' element={<AuthCertificate/>} />
                
                <Route path='/consultant' element={<AdminRoute><ConsultantDash/></AdminRoute>} />
                <Route path='/consultant/colleges' element={<AdminRoute><CollegesPage/></AdminRoute>} />
                <Route path='/consultant/colleges/add' element={<AdminRoute><NewCollegePage/></AdminRoute>} />
                <Route path='/consultant/colleges/edit/:collegeId' element={<AdminRoute><EditCollegePage/></AdminRoute>} />
                <Route path='/consultant/colleges/:collegeId' element={<AdminRoute><ViewCollegeData/></AdminRoute>} />
                <Route path='/consultant/educators' element={<AdminRoute><EducatorsList/></AdminRoute>} />
                <Route path='/consultant/educators/add' element={<AdminRoute><NewEducatorPage/></AdminRoute>} />
                <Route path='/consultant/educators/edit/:educatorId' element={<AdminRoute><EditEducatorPage/></AdminRoute>} />
                <Route path='/consultant/educators/:educatorId' element={<AdminRoute><ViewEducatorData/></AdminRoute>} />
                <Route path='/consultant/visit/:visitId' element={<AdminRoute><VisitFormAnswers/></AdminRoute>} />
                <Route path='/consultant/visits/:visitId/report-preview' element={<AdminRoute><VisitReportPreview /></AdminRoute>} />
                <Route path='/consultant/courses' element={<AdminRoute><Courses/></AdminRoute>} />
                <Route path='/consultant/courses/add' element={<AdminRoute><NewCoursePage/></AdminRoute>} />
                <Route path='/consultant/courses/edit/:courseId' element={<AdminRoute><EditCoursePage/></AdminRoute>} />
            </Routes>
        </BrowserRouter>
    )
}

export default MyRoutes;