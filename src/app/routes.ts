import { createMemoryRouter } from 'react-router';
import Root from './pages/Root';
import AdminAuthGuard from './components/guard/AdminAuthGuard';
import Apply from './pages/Apply';
import AdminDashboard from './pages/admin/AdminDashboard';
import JobPostingManagement from './pages/admin/JobPostingManagement';
import InterviewManagementV2 from './pages/admin/InterviewManagementV2';
import OfferManagement from './pages/admin/OfferManagement';

// The original screen components stay intact. This demo exposes five screens.
const adminChildren = [
  { index: true, Component: AdminDashboard },
  { path: 'job-postings', Component: JobPostingManagement },
  { path: 'interviews', Component: InterviewManagementV2 },
  { path: 'offers', Component: OfferManagement },
];

export const router = createMemoryRouter([
  { path: '/', Component: Root, children: [
    { path: 'apply/:jobId', Component: Apply },
    { path: 'admin', Component: AdminAuthGuard, children: adminChildren },
    { path: 'admin-v2', Component: AdminAuthGuard, children: adminChildren },
  ] },
], { initialEntries: [window.__ATS_PREVIEW__.entry] });
