export type CampaignSnapshot = {
  impressions: number;
  reach: number;
  clicks: number;
  leads: number;
  conversions: number;
  spendPaise: number;
  revenuePaise: number;
  source: 'google_ads' | 'meta_ads';
  providerCampaignId: string;
  date: string;
};
export interface AdvertisingProvider {
  name: 'google_ads' | 'meta_ads';
  fetchMetrics(
    providerCampaignId: string,
    from: Date,
    to: Date,
  ): Promise<CampaignSnapshot[]>;
}
export function advertisingProvider(): never {
  throw new Error(
    'No advertising provider configured. Enter manual metrics or implement an authenticated provider adapter.',
  );
}
