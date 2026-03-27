import HeroSection from "@/components/HeroSection";
import LiveMapSection from "@/components/LiveMapSection";
import ProblemSection from "@/components/ProblemSection";
import CoreComponents from "@/components/CoreComponents";
import SafetySection from "@/components/SafetySection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <LiveMapSection />
      <ProblemSection />
      <CoreComponents />
      <SafetySection />
      <Footer />
    </main>
  );
};

export default Index;
