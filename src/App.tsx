import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SEO } from './components/SEO';
import { CustomCursor } from './components/CustomCursor';
import { Spine } from './components/Spine';
import { Splash } from './components/Splash';
import { Navbar } from './components/Navbar';
import { MobileMenu } from './components/MobileMenu';
import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { Portfolio } from './components/Portfolio';
import { Process } from './components/Process';
import { WhyChoose } from './components/WhyChoose';
import { Testimonials } from './components/Testimonials';
import { Pricing } from './components/Pricing';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { NotFound } from './components/NotFound';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastProvider } from './components/admin/ToastProvider';
import { PageLoader } from './components/PageLoader';
import { HomeDataProvider } from './context/HomeDataContext';

const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Account = lazy(() => import('./pages/Account'));
const AccountContracts = lazy(() => import('./pages/AccountContracts'));
const AccountContractDetail = lazy(() => import('./pages/AccountContractDetail'));
const AccountContact = lazy(() => import('./pages/AccountContact'));
const AdminContracts = lazy(() => import('./pages/AdminContracts'));
const AdminContractForm = lazy(() => import('./pages/AdminContractForm'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminProjects = lazy(() => import('./pages/AdminProjects'));
const AdminProjectForm = lazy(() => import('./pages/AdminProjectForm'));
const AdminMedia = lazy(() => import('./pages/AdminMedia'));
const AdminClients = lazy(() => import('./pages/AdminClients'));
const AdminClientForm = lazy(() => import('./pages/AdminClientForm'));
const AdminMessages = lazy(() => import('./pages/AdminMessages'));
const AdminMessageDetails = lazy(() => import('./pages/AdminMessageDetails'));
const AdminServices = lazy(() => import('./pages/AdminServices'));
const AdminServiceForm = lazy(() => import('./pages/AdminServiceForm'));
const AdminPricing = lazy(() => import('./pages/AdminPricing'));
const AdminPricingForm = lazy(() => import('./pages/AdminPricingForm'));
const AdminHero = lazy(() => import('./pages/AdminHero'));
const AdminTestimonials = lazy(() => import('./pages/AdminTestimonials'));
const AdminTestimonialForm = lazy(() => import('./pages/AdminTestimonialForm'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminUserForm = lazy(() => import('./pages/AdminUserForm'));
const AdminRoles = lazy(() => import('./pages/AdminRoles'));
const AdminRoleForm = lazy(() => import('./pages/AdminRoleForm'));
const AdminGuide = lazy(() => import('./pages/AdminGuide'));

function EditProjectWrapper() {
  const { projectId } = useParams();
  return <AdminProjectForm projectId={projectId} />;
}

function EditClientWrapper() {
  const { clientId } = useParams();
  return <AdminClientForm clientId={clientId} />;
}

function MessageDetailsWrapper() {
  const { messageId } = useParams();
  return <AdminMessageDetails messageId={messageId!} />;
}

function EditServiceWrapper() {
  const { serviceId } = useParams();
  return <AdminServiceForm serviceId={serviceId} />;
}

function EditPricingPlanWrapper() {
  const { planId } = useParams();
  return <AdminPricingForm planId={planId} />;
}

function EditTestimonialWrapper() {
  const { testimonialId } = useParams();
  return <AdminTestimonialForm testimonialId={testimonialId} />;
}

function EditUserWrapper() {
  const { userId } = useParams();
  return <AdminUserForm userId={userId} />;
}

function EditRoleWrapper() {
  const { roleId } = useParams();
  return <AdminRoleForm roleId={roleId} />;
}

function EditContractWrapper() {
  const { contractId } = useParams();
  return <AdminContractForm contractId={contractId} />;
}

function LandingPage() {
  const [entered, setEntered] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!entered) return;

    gsap.registerPlugin(ScrollTrigger);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Magnetic buttons setup — skipped entirely for reduced-motion users,
    // since the whole point of the effect is continuous cursor-follow motion.
    if (!reduced) {
      const magneticEls = document.querySelectorAll('.magnetic');
      magneticEls.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const handleMouseMove = (e: MouseEvent) => {
          const r = htmlEl.getBoundingClientRect();
          const x = e.clientX - r.left - r.width / 2;
          const y = e.clientY - r.top - r.height / 2;
          gsap.to(htmlEl, { x: x * 0.25, y: y * 0.25, duration: 0.4, ease: 'power3.out' });
        };
        const handleMouseLeave = () => {
          gsap.to(htmlEl, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,.4)' });
        };

        htmlEl.addEventListener('mousemove', handleMouseMove as EventListener);
        htmlEl.addEventListener('mouseleave', handleMouseLeave);
      });
    }

    // Scroll reveals — reduced-motion users get the finished state
    // immediately (gsap.set, no tween, no ScrollTrigger) instead of the
    // fade+slide, so content is never left animating for someone who asked
    // not to see that, and is never accidentally left at opacity:0 either.
    gsap.utils.toArray('.reveal-up').forEach((el) => {
      if (reduced) {
        gsap.set(el as HTMLElement, { opacity: 1, y: 0 });
      } else {
        gsap.to(el as HTMLElement, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: el as HTMLElement, start: 'top 88%' },
        });
      }
    });

    // Timeline fill + dots activation
    ScrollTrigger.create({
      trigger: '.timeline',
      start: 'top 75%',
      end: 'bottom 60%',
      onUpdate: (self) => {
        const p = self.progress;
        const fill = document.getElementById('timelineFill');
        if (fill) fill.style.width = p * 100 + '%';
        const dots = document.querySelectorAll('.t-dot');
        dots.forEach((d, i) => {
          d.classList.toggle('active', p > i / (dots.length - 1) - 0.06);
        });
      },
    });

    // Orb parallax
    if (!reduced && window.innerWidth > 900) {
      const handleWindowMouseMove = (e: MouseEvent) => {
        const x = e.clientX / window.innerWidth - 0.5;
        const y = e.clientY / window.innerHeight - 0.5;
        gsap.to('.orb-1', { x: x * 40, y: y * 40, duration: 1.2, ease: 'power2.out' });
        gsap.to('.orb-2', { x: x * -30, y: y * -30, duration: 1.2, ease: 'power2.out' });
      };
      window.addEventListener('mousemove', handleWindowMouseMove);

      return () => {
        window.removeEventListener('mousemove', handleWindowMouseMove);
      };
    }
  }, [entered]);

  return (
    // HomeDataProvider fetches /api/public/home once (with bounded retry) and
    // shares it with Hero/Services/Portfolio/Testimonials/Pricing below,
    // instead of each of those sections making its own independent request.
    // Scoped to the landing page only — admin/client-portal routes are
    // unaffected and unchanged.
    <HomeDataProvider>
      <SEO path="/" />
      <div className="noise"></div>
      <CustomCursor />

      {/* FIXED BACKGROUND IMAGE */}
      <img src="/hero-bg.jpg" alt="YF Digital Studio Background" id="bgImageLayer" />
      <div className="bg-overlay-veil"></div>

      {!entered && <Splash onEnter={() => setEntered(true)} />}

      <div id="site" className={entered ? 'reveal' : ''}>
        <div className="bg-grid"></div>
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <Spine />

        <Navbar
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          isMobileMenuOpen={mobileMenuOpen}
        />
        <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        <Hero />
        <Services />
        <Portfolio />
        <Process />
        <WhyChoose />
        <Testimonials />
        <Pricing />
        <Contact />
        <Footer />
      </div>
    </HomeDataProvider>
  );
}

export function App() {
  return (
    <ToastProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/account" element={<Account />} />
        <Route path="/account/contracts" element={<AccountContracts />} />
        <Route path="/account/contracts/:contractId" element={<AccountContractDetail />} />
        <Route path="/account/contact" element={<AccountContact />} />
        
        {/* Bare /admin used to fall through to a blank page; send it to the dashboard
            (ProtectedRoute there handles the not-signed-in redirect to /admin/login). */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        
        <Route path="/admin/projects" element={<ProtectedRoute><AdminProjects /></ProtectedRoute>} />
        <Route path="/admin/projects/new" element={<ProtectedRoute><AdminProjectForm /></ProtectedRoute>} />
        <Route path="/admin/projects/:projectId/edit" element={<ProtectedRoute><EditProjectWrapper /></ProtectedRoute>} />
        
        <Route path="/admin/media" element={<ProtectedRoute><AdminMedia /></ProtectedRoute>} />
        
        <Route path="/admin/clients" element={<ProtectedRoute><AdminClients /></ProtectedRoute>} />
        <Route path="/admin/clients/new" element={<ProtectedRoute><AdminClientForm /></ProtectedRoute>} />
        <Route path="/admin/clients/:clientId/edit" element={<ProtectedRoute><EditClientWrapper /></ProtectedRoute>} />
        
        <Route path="/admin/messages" element={<ProtectedRoute><AdminMessages /></ProtectedRoute>} />
        <Route path="/admin/messages/:messageId" element={<ProtectedRoute><MessageDetailsWrapper /></ProtectedRoute>} />
        
        <Route path="/admin/services" element={<ProtectedRoute><AdminServices /></ProtectedRoute>} />
        <Route path="/admin/services/new" element={<ProtectedRoute><AdminServiceForm /></ProtectedRoute>} />
        <Route path="/admin/services/:serviceId/edit" element={<ProtectedRoute><EditServiceWrapper /></ProtectedRoute>} />
        <Route path="/admin/pricing" element={<ProtectedRoute><AdminPricing /></ProtectedRoute>} />
        <Route path="/admin/pricing/new" element={<ProtectedRoute><AdminPricingForm /></ProtectedRoute>} />
        <Route path="/admin/pricing/:planId/edit" element={<ProtectedRoute><EditPricingPlanWrapper /></ProtectedRoute>} />
        <Route path="/admin/guide" element={<ProtectedRoute><AdminGuide /></ProtectedRoute>} />
        
        <Route path="/admin/hero" element={<ProtectedRoute><AdminHero /></ProtectedRoute>} />
        
        <Route path="/admin/testimonials" element={<ProtectedRoute><AdminTestimonials /></ProtectedRoute>} />
        <Route path="/admin/testimonials/new" element={<ProtectedRoute><AdminTestimonialForm /></ProtectedRoute>} />
        <Route path="/admin/testimonials/:testimonialId/edit" element={<ProtectedRoute><EditTestimonialWrapper /></ProtectedRoute>} />
        
        <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
        
        <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/users/new" element={<ProtectedRoute><AdminUserForm /></ProtectedRoute>} />
        <Route path="/admin/users/:userId/edit" element={<ProtectedRoute><EditUserWrapper /></ProtectedRoute>} />
        
        <Route path="/admin/roles" element={<ProtectedRoute><AdminRoles /></ProtectedRoute>} />
        <Route path="/admin/roles/new" element={<ProtectedRoute><AdminRoleForm /></ProtectedRoute>} />
        <Route path="/admin/roles/:roleId/edit" element={<ProtectedRoute><EditRoleWrapper /></ProtectedRoute>} />

        <Route path="/admin/contracts" element={<ProtectedRoute><AdminContracts /></ProtectedRoute>} />
        <Route path="/admin/contracts/new" element={<ProtectedRoute><AdminContractForm /></ProtectedRoute>} />
        <Route path="/admin/contracts/:contractId/edit" element={<ProtectedRoute><EditContractWrapper /></ProtectedRoute>} />

        <Route path="/" element={<LandingPage />} />
        {/* Catch-all: any unknown URL used to render a blank page. */}
        <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ToastProvider>
  );
}

export default App;
