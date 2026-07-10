import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Faq from "./pages/Faq";
import Pricing from "./pages/Pricing";
import Privacy from "./pages/Privacy";
import Programs from "./pages/Programs";
import Resources from "./pages/Resources";
import Terms from "./pages/Terms";
import Testimonials from "./pages/Testimonials";
import Tutors from "./pages/Tutors";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import SummerLessons from "./pages/SummerLessons";
import SummerStudentRegister from "./pages/SummerStudentRegister";
import SummerTutorRegister from "./pages/SummerTutorRegister";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/faq" element={<Faq />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/programs" element={<Programs />} />
      <Route path="/resources" element={<Resources />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/testimonials" element={<Testimonials />} />
      <Route path="/tutors" element={<Tutors />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/summerlessons" element={<SummerLessons />} />
      <Route path="/summerlessons/student" element={<SummerStudentRegister />} />
      <Route path="/summerlessons/tutor" element={<SummerTutorRegister />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
