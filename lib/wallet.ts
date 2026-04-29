// Apple Wallet and Google Wallet integration
// Feature is currently disabled — enable via OrganizationSettings.walletEnabled
// Infrastructure is ready; activate by setting walletEnabled = true and configuring env vars.

export class WalletFeatureDisabledError extends Error {
  constructor() {
    super("Wallet-Integration ist noch nicht aktiviert.");
    this.name = "WalletFeatureDisabledError";
  }
}

export interface WalletCardData {
  slug: string;
  firstName: string;
  lastName: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  primaryColor: string;
  avatarUrl?: string;
  cardUrl: string;
}

// ─── Apple Wallet (.pkpass) ───────────────────────────────────────────────────

export async function generateAppleWalletPass(
  _data: WalletCardData
): Promise<Buffer> {
  throw new WalletFeatureDisabledError();

  // Implementation outline (activate when certificates are configured):
  // 1. Build pass.json with contact fields
  // 2. Bundle with icon.png, logo.png, strip.png
  // 3. Generate manifest.json with SHA1 hashes
  // 4. Sign manifest with Apple certificate (PKCS7)
  // 5. Return as .pkpass zip buffer
}

// ─── Google Wallet ────────────────────────────────────────────────────────────

export async function generateGoogleWalletPassUrl(
  _data: WalletCardData
): Promise<string> {
  throw new WalletFeatureDisabledError();

  // Implementation outline (activate when service account is configured):
  // 1. Create GenericObject payload with contact fields
  // 2. Sign JWT with Google service account key
  // 3. Return save URL: https://pay.google.com/gp/v/save/{jwt}
}
