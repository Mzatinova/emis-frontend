import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;


//import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { ThemeProvider } from "@/components/theme-provider";
// import { EMISProvider } from "@/contexts/EMISContext";  // ADD THIS
// import Index from "./pages/Index";
// import NotFound from "./pages/NotFound";
// import StaffLogin from "./components/auth/staff";
// import StudentLogin from "./components/auth/student";

// const queryClient = new QueryClient();

// const App = () => (
//   <ThemeProvider defaultTheme="light">
//     <QueryClientProvider client={queryClient}>
//       <TooltipProvider>
//         <Toaster />
//         <Sonner />
//         <BrowserRouter>
//           <EMISProvider>  {/* WRAP ROUTES HERE */}
//             <Routes>
//               <Route path="/" element={<Index />} />
//               <Route path="/login/staff" element={<StaffLogin />} />
//               <Route path="/login/student" element={<StudentLogin />} />
//               <Route path="*" element={<NotFound />} />
//             </Routes>
//           </EMISProvider>
//         </BrowserRouter>
//       </TooltipProvider>
//     </QueryClientProvider>
//   </ThemeProvider>
// );

// export default App;