import { BackgroundPattern } from '@/components/landing/BackgroundPattern'
import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { MetricsSection } from '@/components/landing/MetricsSection'
import { ProblemSection } from '@/components/landing/ProblemSection'
import { ProductStory } from '@/components/landing/ProductStory'
import { AiSection } from '@/components/landing/AiSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { OutreachWorkflowSection } from '@/components/landing/OutreachWorkflowSection'
import { AnalyticsSection } from '@/components/landing/AnalyticsSection'
import { UseCasesSection } from '@/components/landing/UseCasesSection'
import { TestimonialsSection } from '@/components/landing/TestimonialsSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { CtaSection } from '@/components/landing/CtaSection'
import { Footer } from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background overflow-hidden">
      <BackgroundPattern />
      <div className="relative z-10">
        <Navbar />
        <main>
          <Hero />
          <MetricsSection />
          <ProblemSection />
          <ProductStory />
          <AiSection />
          <FeaturesSection />
          <OutreachWorkflowSection />
          <AnalyticsSection />
          <UseCasesSection />
          <TestimonialsSection />
          <PricingSection />
          <CtaSection />
        </main>
        <Footer />
      </div>
    </div>
  )
}
