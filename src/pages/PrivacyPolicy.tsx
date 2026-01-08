import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Eye, Database, UserCheck, Bell } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-4">
            <Shield className="h-4 w-4" />
            <span>Your Privacy Matters</span>
          </div>
          <h1 className="font-display text-3xl font-bold md:text-4xl mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>We collect information you provide directly to us, such as when you create an account, complete tasks, or contact us for support.</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, phone number, and password when you register.</li>
                <li><strong>Financial Information:</strong> Bank account details, UPI ID for processing withdrawals. This data is encrypted and stored securely.</li>
                <li><strong>Usage Data:</strong> Information about how you use our platform, including videos watched, tasks completed, and referrals made.</li>
                <li><strong>Device Information:</strong> IP address, browser type, and device identifiers for security purposes.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                How We Protect Your Data
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>We implement industry-standard security measures to protect your personal information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Encryption:</strong> All sensitive data, especially bank details, is encrypted using AES-256 encryption before storage.</li>
                <li><strong>Secure Transmission:</strong> All data is transmitted over HTTPS/TLS encrypted connections.</li>
                <li><strong>Access Control:</strong> Role-based access control ensures only authorized personnel can access sensitive data.</li>
                <li><strong>Regular Audits:</strong> We conduct regular security audits and vulnerability assessments.</li>
                <li><strong>Data Isolation:</strong> Financial data is stored separately from general user data.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <ul className="list-disc pl-6 space-y-2">
                <li>To create and manage your account</li>
                <li>To process your earnings and withdrawal requests</li>
                <li>To track your task completions and reward eligibility</li>
                <li>To prevent fraud and ensure platform security</li>
                <li>To communicate important updates about your account</li>
                <li>To improve our services and user experience</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Your Rights
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>You have the following rights regarding your personal data:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data we hold.</li>
                <li><strong>Correction:</strong> Request correction of inaccurate personal data.</li>
                <li><strong>Deletion:</strong> Request deletion of your account and associated data.</li>
                <li><strong>Portability:</strong> Request your data in a portable format.</li>
                <li><strong>Withdrawal:</strong> Withdraw consent for data processing at any time.</li>
              </ul>
              <p className="mt-4">To exercise these rights, please contact us at support@vidshare.com</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Updates to This Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last updated" date.</p>
              <p>We encourage you to review this privacy policy periodically for any changes. Changes to this privacy policy are effective when they are posted on this page.</p>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <p className="text-center text-sm text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:support@vidshare.com" className="text-primary hover:underline">
                  support@vidshare.com
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
