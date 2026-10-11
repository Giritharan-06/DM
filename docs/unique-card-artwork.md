# Unique artwork for every card

Created 48 original transparent PNG illustrations with the built-in imagegen tool, one prompt per asset. Cards now use subjects tailored to their section instead of sharing the same rocket, camera, target or megaphone. The original hero and two studio illustrations each remain in one place only.

The eight industry selections and three goal selections each have their own artwork. A browser check verifies that the images shown together have distinct source paths and that each selector changes to a unique image. PNG hashes and transparency are checked by `scripts/verify-unique-art.mjs`. Existing animations, reduced motion behavior and CRM-controlled social links are preserved.

All new PNGs and optimized WebP copies are saved in `apps/website/public/art/`. Images remain lazy loaded and use Next Image sizing. The 48 source WebP files total 9.41 MB; browsers receive smaller optimized versions for the displayed card size.

The exact final prompt set is in [unique-art-catalog.json](./unique-art-catalog.json). Tool mode: built-in imagegen with `transparent_background: true`; no CLI fallback used.

Validation: lint and typecheck passed; 22 browser tests passed with two expected skips for device-specific navigation and scroll behavior. Desktop, tablet and mobile previews load all artwork and have no horizontal overflow. All 48 PNGs have distinct hashes and alpha channels.

| Card or selection                         | Saved PNG                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Social Media Marketing                    | [unique-service-social.png](../apps/website/public/art/unique-service-social.png)                 |
| Meta Ads                                  | [unique-service-meta.png](../apps/website/public/art/unique-service-meta.png)                     |
| Google Ads                                | [unique-service-google.png](../apps/website/public/art/unique-service-google.png)                 |
| Search Engine Optimization                | [unique-service-seo.png](../apps/website/public/art/unique-service-seo.png)                       |
| Website Development                       | [unique-service-website.png](../apps/website/public/art/unique-service-website.png)               |
| Branding & Graphic Design                 | [unique-service-brand.png](../apps/website/public/art/unique-service-brand.png)                   |
| Content Creation                          | [unique-service-content.png](../apps/website/public/art/unique-service-content.png)               |
| Lead Generation                           | [unique-service-leads.png](../apps/website/public/art/unique-service-leads.png)                   |
| Get discovered                            | [unique-solution-discovery.png](../apps/website/public/art/unique-solution-discovery.png)         |
| Build connection                          | [unique-solution-connection.png](../apps/website/public/art/unique-solution-connection.png)       |
| Reach further                             | [unique-solution-reach.png](../apps/website/public/art/unique-solution-reach.png)                 |
| Start conversations                       | [unique-solution-conversation.png](../apps/website/public/art/unique-solution-conversation.png)   |
| Learn & improve                           | [unique-solution-improvement.png](../apps/website/public/art/unique-solution-improvement.png)     |
| Increase Visibility                       | [unique-journey-visibility.png](../apps/website/public/art/unique-journey-visibility.png)         |
| Reach the Right Audience                  | [unique-journey-audience.png](../apps/website/public/art/unique-journey-audience.png)             |
| Generate Enquiries                        | [unique-journey-enquiries.png](../apps/website/public/art/unique-journey-enquiries.png)           |
| Grow Your Business                        | [unique-journey-growth.png](../apps/website/public/art/unique-journey-growth.png)                 |
| Understand your business                  | [unique-process-understand.png](../apps/website/public/art/unique-process-understand.png)         |
| Create a strategy                         | [unique-process-strategy.png](../apps/website/public/art/unique-process-strategy.png)             |
| Execute & optimize                        | [unique-process-execute.png](../apps/website/public/art/unique-process-execute.png)               |
| Measure what matters                      | [unique-process-measure.png](../apps/website/public/art/unique-process-measure.png)               |
| Real conversations                        | [unique-partner-conversations.png](../apps/website/public/art/unique-partner-conversations.png)   |
| Reporting with context                    | [unique-partner-reporting.png](../apps/website/public/art/unique-partner-reporting.png)           |
| A connected approach                      | [unique-partner-connected.png](../apps/website/public/art/unique-partner-connected.png)           |
| Which service should I start with?        | [unique-faq-service.png](../apps/website/public/art/unique-faq-service.png)                       |
| Do you work with local businesses?        | [unique-faq-local.png](../apps/website/public/art/unique-faq-local.png)                           |
| How long does it take to see progress?    | [unique-faq-time.png](../apps/website/public/art/unique-faq-time.png)                             |
| Is advertising spend included?            | [unique-faq-budget.png](../apps/website/public/art/unique-faq-budget.png)                         |
| What happens after the free consultation? | [unique-faq-next.png](../apps/website/public/art/unique-faq-next.png)                             |
| Restaurant industry                       | [unique-industry-restaurant.png](../apps/website/public/art/unique-industry-restaurant.png)       |
| Clothing Store industry                   | [unique-industry-retail.png](../apps/website/public/art/unique-industry-retail.png)               |
| Salon industry                            | [unique-industry-salon.png](../apps/website/public/art/unique-industry-salon.png)                 |
| Gym industry                              | [unique-industry-gym.png](../apps/website/public/art/unique-industry-gym.png)                     |
| Real Estate industry                      | [unique-industry-property.png](../apps/website/public/art/unique-industry-property.png)           |
| Education industry                        | [unique-industry-education.png](../apps/website/public/art/unique-industry-education.png)         |
| Healthcare industry                       | [unique-industry-health.png](../apps/website/public/art/unique-industry-health.png)               |
| Other business industry                   | [unique-industry-business.png](../apps/website/public/art/unique-industry-business.png)           |
| More enquiries goal                       | [unique-goal-enquiries.png](../apps/website/public/art/unique-goal-enquiries.png)                 |
| A stronger brand goal                     | [unique-goal-brand.png](../apps/website/public/art/unique-goal-brand.png)                         |
| A better website goal                     | [unique-goal-website.png](../apps/website/public/art/unique-goal-website.png)                     |
| Restaurant demonstration concept          | [unique-case-restaurant.png](../apps/website/public/art/unique-case-restaurant.png)               |
| Retail demonstration concept              | [unique-case-retail.png](../apps/website/public/art/unique-case-retail.png)                       |
| Fitness demonstration concept             | [unique-case-fitness.png](../apps/website/public/art/unique-case-fitness.png)                     |
| Free consultation form                    | [unique-feature-consultation.png](../apps/website/public/art/unique-feature-consultation.png)     |
| Consultation confirmation                 | [unique-feature-success.png](../apps/website/public/art/unique-feature-success.png)               |
| Footer next chapter                       | [unique-feature-footer.png](../apps/website/public/art/unique-feature-footer.png)                 |
| Consultation invitation                   | [unique-feature-consult-scene.png](../apps/website/public/art/unique-feature-consult-scene.png)   |
| Digital experiences studio                | [unique-feature-studio-digital.png](../apps/website/public/art/unique-feature-studio-digital.png) |
