export interface PricingTier {
    name: string;
    description: string;
    price: number;
    popular?: boolean;
    features: string[];
    saved?: number;
    trial?: number;
    productId: string;
}

export const pricingTiers: PricingTier[] = [
    {
        name: "Starter",
        description: "Perfect for small businesses getting started",
        price: 29,
        trial: 14,
        productId: "pdt_a1EG4eSKFx8iPO1t53SPM",
        features: [
            "Up to 1,000 transactions/month",
            "Basic payment processing",
            "Dodo Payments Standard",
            "Email support",
            "Basic analytics dashboard",
            "3 payment gateways"
        ]
    },
    {
        name: "Growth",
        description: "Ideal for growing businesses",
        price: 79,
        popular: true,
        saved: 15,
        trial: 7,
        productId: "pdt_a1EG4eSKFx8iPO1t53SPM",
        features: [
            "Up to 10,000 transactions/month",
            "Advanced payment processing",
            "Dodo Payments Pro",
            "Priority email & chat support",
            "Advanced analytics",
            "10+ payment gateways",
            "Recurring billing",
            "Fraud detection",
            "Custom checkout pages"
        ]
    },
    {
        name: "Premium",
        description: "For enterprises with high volume",
        price: 199,
        saved: 20,
        productId: "pdt_a1EG4eSKFx8iPO1t53SPM",
        features: [
            "Unlimited transactions",
            "Enterprise payment processing",
            "Dodo Payments Enterprise",
            "24/7 phone & dedicated support",
            "Custom analytics & reporting",
            "All payment gateways",
            "Advanced fraud protection",
            "White-label solutions",
            "API priority access",
            "Custom SLAs",
            "Dedicated account manager"
        ]
    }
];

export const commonFeatures = [
    "Secure PCI DSS compliance",
    "Multiple currency support",
    "Mobile-optimized checkout",
    "Auto-deposit to bank account",
    "Payment security",
    "Basic reporting"
];