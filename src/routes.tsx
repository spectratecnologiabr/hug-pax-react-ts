import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/protectedRoute';
import AdminRoute from './components/adminRoute';
import CoordinatorRoute from './components/coordinatorRoute';

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

// Consultant Routes
import ConsultantDash from './pages/consultantDash';
import CollegesPage from './pages/collegesPage';
import EducatorsList from './pages/educatorsList';
import ViewEducatorData from './pages/viewEducatorData';
import VisitFormAnswers from './pages/visitFormAnswers';
import VisitReportPreview from "./pages/visitReportPreview";

import Courses from './pages/courses';
import NewCoursePage from './pages/newCoursePage';
import EditCoursePage from './pages/editCoursePage';

import AdminDash from './pages/adminDash';
import AgendaAdminPage from './pages/agendaAdminPage';
import SeriesAdminPage from './pages/seriesAdminPage';
import AdminCommunicationPage from './pages/adminCommunicationPage';
import AdminRetentionTriggersPage from './pages/adminRetentionTriggersPage';
import AdminUsersPage from './pages/adminUsersPage';
import AdminCertificatesPage from './pages/adminCertificatesPage';
import AdminLogsPage from './pages/adminLogsPage';
import AdminCommunicationTemplatesPage from './pages/adminCommunicationTemplatesPage';
import ConsultantVacationPage from './pages/consultantVacationPage';
import TermsAndConditionsPage from './pages/termsAndConditionsPage';
import TermsAcceptancePage from './pages/termsAcceptancePage';
import AdminLegalDocumentsPage from './pages/adminLegalDocumentsPage';
import SchoolFinalReportPage from './pages/schoolFinalReportPage';
import AdminReportsCenterPage from './pages/adminReportsCenterPage';
import EducatorReportPage from './pages/educatorReportPage';
import HelpdeskPage from './pages/helpdeskPage';
import HelpdeskWidget from './components/helpdeskWidget';
import AdminHelpdeskPage from './pages/adminHelpdeskPage';
import CoordinatorDash from './pages/coordinatorDash';
import CoordinatorAgendaPage from './pages/coordinatorAgendaPage';
import CoordinatorConsultantsPage from './pages/coordinatorConsultantsPage';
import CoordinatorReportsCenterPage from './pages/coordinatorReportsCenterPage';
import CoordinatorPerformancePage from './pages/coordinatorPerformancePage';

function MyRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Login/>} />
                <Route path='/login' element={<Login/>} />
                <Route path='/forgot-password' element={<ForgotPassword/>} />
                <Route path='/reset-password' element={<ResetPassword/>} />
                <Route path='/consultant/vacation' element={<ConsultantVacationPage/>} />
                <Route path='/terms-and-conditions' element={<TermsAndConditionsPage/>} />
                <Route path='/terms-acceptance' element={<TermsAcceptancePage/>} />

                <Route path='/dashboard' element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
                <Route path='/courses' element={<ProtectedRoute><EducatorsRoom/></ProtectedRoute>} />
                <Route path='/course/:courseSlug' element={<ProtectedRoute><Course /></ProtectedRoute>} />
                <Route path='/course/:courseSlug/lesson/:lessonId' element={<ProtectedRoute><Course /></ProtectedRoute>} />
                <Route path='/profile' element={<ProtectedRoute><Profile/></ProtectedRoute>} />
                <Route path='/notifications' element={<ProtectedRoute><Notifications/></ProtectedRoute>} />
                <Route path='/certificates' element={<ProtectedRoute><Certificates/></ProtectedRoute>} />
                <Route path='/helpdesk' element={<ProtectedRoute><HelpdeskPage/></ProtectedRoute>} />
                <Route path='/auth-certificate/:code' element={<AuthCertificate/>} />
                
                <Route path='/consultant' element={<AdminRoute><ConsultantDash/></AdminRoute>} />
                <Route path='/consultant/colleges' element={<AdminRoute><CollegesPage/></AdminRoute>} />
                <Route path='/consultant/educators' element={<AdminRoute><EducatorsList/></AdminRoute>} />
                <Route path='/consultant/visit/:visitId' element={<AdminRoute><VisitFormAnswers/></AdminRoute>} />
                <Route path='/consultant/visits/:visitId/report-preview' element={<AdminRoute><VisitReportPreview /></AdminRoute>} />
                <Route path='/consultant/colleges/:collegeId/final-report' element={<AdminRoute><SchoolFinalReportPage/></AdminRoute>} />

                <Route path='/coordinator' element={<CoordinatorRoute><CoordinatorDash/></CoordinatorRoute>} />
                <Route path='/coordinator/performance' element={<CoordinatorRoute><CoordinatorPerformancePage/></CoordinatorRoute>} />
                <Route path='/coordinator/agenda' element={<CoordinatorRoute><CoordinatorAgendaPage/></CoordinatorRoute>} />
                <Route path='/coordinator/consultants' element={<CoordinatorRoute><CoordinatorConsultantsPage/></CoordinatorRoute>} />
                <Route path='/coordinator/colleges' element={<CoordinatorRoute><CollegesPage/></CoordinatorRoute>} />
                <Route path='/coordinator/educators' element={<CoordinatorRoute><EducatorsList/></CoordinatorRoute>} />
                <Route path='/coordinator/reports-center' element={<CoordinatorRoute><CoordinatorReportsCenterPage/></CoordinatorRoute>} />
                <Route path='/coordinator/certificates' element={<CoordinatorRoute><AdminCertificatesPage/></CoordinatorRoute>} />
                <Route path='/coordinator/visits/:visitId/report-preview' element={<CoordinatorRoute><VisitReportPreview /></CoordinatorRoute>} />
                <Route path='/coordinator/colleges/:collegeId/final-report' element={<CoordinatorRoute><SchoolFinalReportPage/></CoordinatorRoute>} />
                <Route path='/coordinator/educators/:educatorId/report' element={<CoordinatorRoute><EducatorReportPage/></CoordinatorRoute>} />

                <Route path='/admin' element={<AdminRoute><AdminDash/></AdminRoute>} />
                <Route path='/admin/performance' element={<AdminRoute><CoordinatorPerformancePage/></AdminRoute>} />
                <Route path='/admin/agenda' element={<AdminRoute><AgendaAdminPage/></AdminRoute>} />
                <Route path='/admin/courses' element={<AdminRoute><Courses/></AdminRoute>} />
                <Route path='/admin/courses/add' element={<AdminRoute><NewCoursePage/></AdminRoute>} />
                <Route path='/admin/courses/edit/:courseId' element={<AdminRoute><EditCoursePage/></AdminRoute>} />
                <Route path='/admin/colleges' element={<AdminRoute><CollegesPage/></AdminRoute>} />
                <Route path='/admin/educators/:educatorId' element={<AdminRoute><ViewEducatorData/></AdminRoute>} />
                <Route path='/admin/educators/:educatorId/report' element={<AdminRoute><EducatorReportPage/></AdminRoute>} />
                <Route path='/admin/visits/:visitId/report-preview' element={<AdminRoute><VisitReportPreview /></AdminRoute>} />
                <Route path='/admin/colleges/:collegeId/final-report' element={<AdminRoute><SchoolFinalReportPage/></AdminRoute>} />
                <Route path='/admin/series' element={<AdminRoute><SeriesAdminPage/></AdminRoute>} />
                <Route path='/admin/communications' element={<AdminRoute><AdminCommunicationPage/></AdminRoute>} />
                <Route path='/admin/communications/templates' element={<AdminRoute><AdminCommunicationTemplatesPage/></AdminRoute>} />
                <Route path='/admin/communications/retention' element={<AdminRoute><AdminRetentionTriggersPage/></AdminRoute>} />
                <Route path='/admin/helpdesk' element={<AdminRoute><AdminHelpdeskPage/></AdminRoute>} />
                <Route path='/admin/legal-documents' element={<AdminRoute><AdminLegalDocumentsPage/></AdminRoute>} />
                <Route path='/admin/users' element={<AdminRoute><AdminUsersPage/></AdminRoute>} />
                <Route path='/admin/reports-center' element={<AdminRoute><AdminReportsCenterPage/></AdminRoute>} />
                <Route path='/admin/certificates' element={<AdminRoute><AdminCertificatesPage/></AdminRoute>} />
                <Route path='/admin/logs' element={<AdminRoute><AdminLogsPage/></AdminRoute>} />
            </Routes>
            <HelpdeskWidget />
        </BrowserRouter>
    )
}

export default MyRoutes;
