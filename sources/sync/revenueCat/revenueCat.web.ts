import {
    Package,
    Purchases,
    CustomerInfo as WebCustomerInfo,
    Product as WebProduct,
    Offerings as WebOfferings,
} from '@revenuecat/purchases-js';

import {
    RevenueCatInterface,
    CustomerInfo,
    Product,
    Offerings,
    PurchaseResult,
    RevenueCatConfig,
    LogLevel,
    PaywallResult,
    PaywallOptions
} from './types';

class RevenueCatWeb implements RevenueCatInterface {
    private purchases: Purchases | null = null;

    configure(config: RevenueCatConfig) {
        // Web SDK uses a different initialization pattern
        this.purchases = Purchases.configure({
            apiKey: config.apiKey,
            appUserId: config.appUserID
        });

        // Web SDK doesn't have the same async configuration
        // It's initialized synchronously
    }

    async getCustomerInfo(): Promise<CustomerInfo> {
        if (!this.purchases) {
            throw new Error('RevenueCat not configured');
        }

        const customerInfo = await this.purchases.getCustomerInfo();
        return this.transformCustomerInfo(customerInfo);
    }

    async getOfferings(): Promise<Offerings> {
        if (!this.purchases) {
            throw new Error('RevenueCat not configured');
        }

        const offerings = await this.purchases.getOfferings();
        return this.transformOfferings(offerings);
    }

    async getProducts(productIds: string[]): Promise<Product[]> {
        if (!this.purchases) {
            throw new Error('RevenueCat not configured');
        }

        // Web SDK doesn't have a direct getProducts method
        // Products are retrieved through offerings
        const offerings = await this.purchases.getOfferings();
        const products: Product[] = [];

        // Search through all offerings for the requested products
        Object.values(offerings.all || {}).forEach(offering => {
            offering.availablePackages.forEach(pkg => {
                // Use webBillingProduct (or rcBillingProduct as fallback)
                const product = pkg.webBillingProduct || (pkg as any).rcBillingProduct;
                if (product && productIds.includes(product.identifier)) {
                    products.push(this.transformProduct(product));
                }
            });
        });

        return products;
    }

    async purchaseStoreProduct(product: Product): Promise<PurchaseResult> {
        if (!this.purchases) {
            throw new Error('RevenueCat not configured');
        }

        // Web purchases work differently - they require a package, not just a product
        // Find the package that contains this product
        const offerings = await this.purchases.getOfferings();
        let targetPackage: Package | null = null;
        for (const offering of Object.values(offerings.all || {})) {
            for (const pkg of offering.availablePackages) {
                const pkgProduct = pkg.webBillingProduct;
                if (pkgProduct && pkgProduct.identifier === product.identifier) {
                    targetPackage = pkg;
                    break;
                }
            }
            if (targetPackage) break;
        }
        if (!targetPackage) {
            throw new Error(`Package for product ${product.identifier} not found`);
        }
        const result = await this.purchases.purchase({ rcPackage: targetPackage });
        return {
            customerInfo: this.transformCustomerInfo(result.customerInfo)
        };
    }

    async syncPurchases(): Promise<void> {
        // Web SDK doesn't have a syncPurchases method
        // Customer info is always synced when retrieved
        if (!this.purchases) {
            throw new Error('RevenueCat not configured');
        }

        // Just fetch customer info to ensure sync
        await this.getCustomerInfo();
    }

    setLogLevel(level: LogLevel): void {
        // Web SDK doesn't support log levels
        // This is a no-op on web
        console.log(`RevenueCat log level set to ${LogLevel[level]} (not supported on web)`);
    }

    async presentPaywall(options?: PaywallOptions): Promise<PaywallResult> {
        // Web doesn't have native paywall support
        // We'll attempt to purchase the first available product in the current offering
        try {
            if (!this.purchases) {
                throw new Error('RevenueCat not configured');
            }

            // Get the offering to use (provided or current)
            const offerings = await this.getOfferings();
            const offering = options?.offering || offerings.current;
            
            if (!offering || offering.availablePackages.length === 0) {
                console.error('No offerings available');
                return PaywallResult.ERROR;
            }

            // Get the first available package
            const firstPackage = offering.availablePackages[0];
            
            try {
                // Attempt to purchase
                await this.purchaseStoreProduct(firstPackage.product);
                return PaywallResult.PURCHASED;
            } catch (purchaseError: any) {
                // Check if user cancelled
                if (purchaseError.message?.includes('cancelled') || purchaseError.code === 'UserCancelled') {
                    return PaywallResult.CANCELLED;
                }
                console.error('Purchase failed:', purchaseError);
                return PaywallResult.ERROR;
            }
        } catch (error) {
            console.error('Error presenting paywall on web:', error);
            return PaywallResult.ERROR;
        }
    }

    async presentPaywallIfNeeded(options?: PaywallOptions & { requiredEntitlementIdentifier: string }): Promise<PaywallResult> {
        // Check if user has the required entitlement
        try {
            const customerInfo = await this.getCustomerInfo();
            const hasEntitlement = customerInfo.entitlements.all[options?.requiredEntitlementIdentifier || 'pro']?.isActive;
            
            if (hasEntitlement) {
                // User already has the entitlement, no need to show paywall
                return PaywallResult.NOT_PRESENTED;
            }
            
            // User doesn't have entitlement, present paywall
            return this.presentPaywall(options);
        } catch (error) {
            console.error('Error checking entitlement:', error);
            return PaywallResult.ERROR;
        }
    }

    // Transform web types to our common types
    private transformCustomerInfo(webInfo: WebCustomerInfo): CustomerInfo {
        const activeSubscriptions: Record<string, any> = webInfo.activeSubscriptions || {};

        // Transform entitlements
        const entitlements: Record<string, { isActive: boolean; identifier: string }> = {};
        Object.entries(webInfo.entitlements.all || {}).forEach(([key, entitlement]) => {
            entitlements[key] = {
                isActive: entitlement.isActive,
                identifier: entitlement.identifier
            };
        });

        return {
            activeSubscriptions,
            entitlements: { all: entitlements },
            originalAppUserId: webInfo.originalAppUserId,
            requestDate: new Date(webInfo.requestDate)
        };
    }

    private transformProduct(webProduct: WebProduct): Product {
        return {
            identifier: webProduct.identifier,
            priceString: webProduct.currentPrice.formattedPrice,
            price: webProduct.currentPrice.amountMicros / 1000000,
            currencyCode: webProduct.currentPrice.currency,
            title: webProduct.title,
            description: webProduct.description || ''
        };
    }

    private transformOfferings(webOfferings: WebOfferings): Offerings {
        const transformPackages = (packages: Package[]) => {
            return packages
                .map(pkg => {
                    const product = pkg.webBillingProduct;
                    if (!product) {
                        console.error('Package has no product:', pkg);
                        return null;
                    }
                    return {
                        identifier: pkg.identifier,
                        packageType: 'custom', // Web SDK doesn't expose packageType
                        product: this.transformProduct(product)
                    };
                })
                .filter((pkg): pkg is NonNullable<typeof pkg> => pkg !== null);
        };

        return {
            current: webOfferings.current ? {
                identifier: webOfferings.current.identifier,
                availablePackages: transformPackages(webOfferings.current.availablePackages)
            } : null,
            all: Object.entries(webOfferings.all || {}).reduce((acc, [key, offering]) => {
                acc[key] = {
                    identifier: offering.identifier,
                    availablePackages: transformPackages(offering.availablePackages)
                };
                return acc;
            }, {} as Record<string, any>)
        };
    }
}

export default new RevenueCatWeb();