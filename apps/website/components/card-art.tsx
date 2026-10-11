import Image from 'next/image';

export const serviceArt = [
  'unique-service-social',
  'unique-service-meta',
  'unique-service-google',
  'unique-service-seo',
  'unique-service-website',
  'unique-service-brand',
  'unique-service-content',
  'unique-service-leads',
] as const;

export const solutionArt = [
  'unique-solution-discovery',
  'unique-solution-connection',
  'unique-solution-reach',
  'unique-solution-conversation',
  'unique-solution-improvement',
] as const;

export const journeyArt = [
  'unique-journey-visibility',
  'unique-journey-audience',
  'unique-journey-enquiries',
  'unique-journey-growth',
] as const;

export const processArt = [
  'unique-process-understand',
  'unique-process-strategy',
  'unique-process-execute',
  'unique-process-measure',
] as const;

export const partnerArt = [
  'unique-partner-conversations',
  'unique-partner-reporting',
  'unique-partner-connected',
] as const;

export const faqArt = [
  'unique-faq-service',
  'unique-faq-local',
  'unique-faq-time',
  'unique-faq-budget',
  'unique-faq-next',
] as const;

export const industryArt: Record<string, string> = {
  Restaurant: 'unique-industry-restaurant',
  'Clothing Store': 'unique-industry-retail',
  Salon: 'unique-industry-salon',
  Gym: 'unique-industry-gym',
  'Real Estate': 'unique-industry-property',
  Education: 'unique-industry-education',
  Healthcare: 'unique-industry-health',
  'Other business': 'unique-industry-business',
};

/** Decorative artwork keeps each card's heading as its accessible description. */
export function CardArt({
  name,
  className = '',
}: {
  name: string;
  className?: string;
}) {
  return (
    <div className={`card-art ${className}`} aria-hidden="true">
      <span className="art-halo" />
      <span className="art-spark">✦</span>
      <Image
        src={`/art/${name}.webp`}
        alt=""
        fill
        sizes="(max-width: 760px) 180px, 260px"
      />
    </div>
  );
}
