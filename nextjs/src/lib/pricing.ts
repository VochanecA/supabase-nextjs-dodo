import { pricingTiers, commonFeatures, type PricingTier } from '@/config/pricing';

// Eksportuj type PricingTier
export type { PricingTier };

class PricingService {
    static getAllTiers(): PricingTier[] {
        return pricingTiers;
    }

    static getTierByName(name: string): PricingTier | undefined {
        return pricingTiers.find(tier => tier.name.toLowerCase() === name.toLowerCase());
    }

    static getTierByProductId(productId: string): PricingTier | undefined {
        return pricingTiers.find(tier => tier.productId === productId);
    }

    static getCommonFeatures(): string[] {
        return commonFeatures;
    }

    static formatPrice(price: number): string {
        return new Intl.NumberFormat('en-EU', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0
        }).format(price);
    }

    static calculateAnnualPrice(monthlyPrice: number, discountPercent?: number): number {
        const annual = monthlyPrice * 12;
        if (discountPercent) {
            return annual * (1 - discountPercent / 100);
        }
        return annual;
    }
}

export default PricingService;