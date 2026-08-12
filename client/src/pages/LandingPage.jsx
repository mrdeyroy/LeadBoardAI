import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { ProblemSection } from '@/components/landing/ProblemSection'
import { ProductStory } from '@/components/landing/ProductStory'
import { AiSection } from '@/components/landing/AiSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { OutreachWorkflowSection } from '@/components/landing/OutreachWorkflowSection'
import { AnalyticsSection } from '@/components/landing/AnalyticsSection'
import { UseCasesSection } from '@/components/landing/UseCasesSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { CtaSection } from '@/components/landing/CtaSection'
import { Footer } from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background">
      <Navbar />
      <main>
        <Hero />
        <ProblemSection />
        <ProductStory />
        <AiSection />
        <FeaturesSection />
        <OutreachWorkflowSection />
        <AnalyticsSection />
        <UseCasesSection />
        <PricingSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  )
}
