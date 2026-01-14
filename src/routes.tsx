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

// Admin Routes
import AdminDash from './pages/adminDash';
import CollegesPage from './pages/collegesPage';
import NewCollegePage from './pages/newCollegePage';
import EditCollegePage from './pages/editCollegePage';
import EducatorsList from './pages/educatorsList';
import NewEducatorPage from './pages/newEducatorPage';
import EditEducatorPage from './pages/editEducatorPage';

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
                
                <Route path='/admin' element={<AdminRoute><AdminDash/></AdminRoute>} />
                <Route path='/admin/colleges' element={<AdminRoute><CollegesPage/></AdminRoute>} />
                <Route path='/admin/colleges/add' element={<AdminRoute><NewCollegePage/></AdminRoute>} />
                <Route path='/admin/colleges/edit/:collegeId' element={<AdminRoute><EditCollegePage/></AdminRoute>} />
                <Route path='/admin/educators' element={<AdminRoute><EducatorsList/></AdminRoute>} />
                <Route path='/admin/educators/add' element={<AdminRoute><NewEducatorPage/></AdminRoute>} />
                <Route path='/admin/educators/edit/:educatorId' element={<AdminRoute><EditEducatorPage/></AdminRoute>} />
            </Routes>
        </BrowserRouter>
    )
}

export default MyRoutes;