import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, AlertTriangle, DollarSign, Ban, Scale, HelpCircle } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-4">
            <FileText className="h-4 w-4" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="font-display text-3xl font-bold md:text-4xl mb-4">
            Terms & Conditions
          </h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>By accessing and using VidShare ("the Platform"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our services.</p>
              <p>We reserve the right to update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Earnings & Withdrawals
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Earning Rates:</strong> ₹20 per video watched, ₹100 per successful referral. Rates may change at our discretion.</li>
                <li><strong>Minimum Withdrawal:</strong> ₹1,000 minimum balance required for withdrawal.</li>
                <li><strong>Processing Time:</strong> Withdrawal requests are processed within 3-7 business days.</li>
                <li><strong>Verification:</strong> We reserve the right to verify user activity before processing withdrawals.</li>
                <li><strong>Bank Details:</strong> Ensure accurate bank details. We are not responsible for failed transfers due to incorrect information.</li>
                <li><strong>Taxes:</strong> Users are responsible for any applicable taxes on their earnings.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="h-5 w-5" />
                Earnings Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p className="font-medium">Important: Please read carefully</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Earnings are not guaranteed and depend on user activity and platform availability.</li>
                <li>We reserve the right to modify, suspend, or discontinue earning opportunities at any time.</li>
                <li>Promotional rates and bonuses are subject to change without notice.</li>
                <li>The platform operates on an advertising-based model; earnings may fluctuate based on ad revenue.</li>
                <li>This is not a get-rich-quick scheme. Earnings require genuine participation and time investment.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-primary" />
                Prohibited Activities
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>The following activities are strictly prohibited and may result in account suspension or termination:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Fraud:</strong> Creating multiple accounts, using bots, or any automated systems to earn rewards.</li>
                <li><strong>Fake Referrals:</strong> Self-referrals or creating fake accounts for referral bonuses.</li>
                <li><strong>VPN/Proxy Abuse:</strong> Using VPNs or proxies to manipulate location-based features.</li>
                <li><strong>Content Violation:</strong> Uploading inappropriate, copyrighted, or harmful content.</li>
                <li><strong>Harassment:</strong> Harassing other users or platform staff.</li>
                <li><strong>Account Sharing:</strong> Sharing your account credentials with others.</li>
              </ul>
              <p className="mt-4 font-medium text-destructive">Violation of these terms will result in permanent account ban and forfeiture of all earnings.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <ul className="list-disc pl-6 space-y-2">
                <li>The platform is provided "as is" without warranties of any kind.</li>
                <li>We are not liable for any indirect, incidental, or consequential damages.</li>
                <li>We are not responsible for third-party content or external links.</li>
                <li>Service interruptions may occur for maintenance or technical issues.</li>
                <li>Maximum liability is limited to the amount earned by the user in the last 30 days.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Contact & Disputes
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>For any questions, concerns, or disputes regarding these terms:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Email: <a href="mailto:support@vidshare.com" className="text-primary hover:underline">support@vidshare.com</a></li>
                <li>Response Time: Within 48-72 hours</li>
                <li>Disputes will be handled through arbitration in accordance with applicable laws.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <p className="text-center text-sm text-muted-foreground">
                By using VidShare, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Terms;
