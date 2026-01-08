import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, Lock, Database, Eye, Server, 
  UserCheck, Key, AlertTriangle, CheckCircle2 
} from 'lucide-react';

const Security = () => {
  const securityFeatures = [
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description: 'All sensitive data including bank details are encrypted using AES-256 encryption before storage.',
    },
    {
      icon: Server,
      title: 'Secure Infrastructure',
      description: 'Our platform runs on enterprise-grade servers with SSL/TLS encryption for all communications.',
    },
    {
      icon: Database,
      title: 'Data Isolation',
      description: 'Financial data is stored separately from user profiles with strict access controls.',
    },
    {
      icon: UserCheck,
      title: 'Role-Based Access',
      description: 'Only authorized administrators can access sensitive financial information.',
    },
    {
      icon: Key,
      title: 'Secure Authentication',
      description: 'Industry-standard authentication with secure password hashing using bcrypt.',
    },
    {
      icon: Eye,
      title: 'Privacy by Design',
      description: 'Your personal data is never shared with third parties without your consent.',
    },
  ];

  const securityChecklist = [
    'Bank details encrypted with AES-256',
    'All API endpoints protected with authentication',
    'Rate limiting to prevent abuse',
    'Regular security audits and updates',
    'HTTPS/TLS for all connections',
    'Row-level security on database',
    'Input validation and sanitization',
    'Secure session management',
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400 mb-4">
            <Shield className="h-4 w-4" />
            <span>Your Security is Our Priority</span>
          </div>
          <h1 className="font-display text-3xl font-bold md:text-4xl mb-4">
            Platform Security
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We implement industry-leading security measures to protect your data and earnings. 
            Your trust is our most valuable asset.
          </p>
        </div>

        {/* Security Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10">
          {securityFeatures.map((feature, index) => (
            <Card key={index} className="hover:border-primary/30 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bank Details Security */}
        <Card className="mb-10 border-green-500/30 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-green-500" />
              How We Protect Your Bank Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your financial information receives the highest level of protection:
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  <strong>Encryption at Rest:</strong> Bank details are encrypted before being stored in our database.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  <strong>Restricted Access:</strong> Only authorized admin personnel can view decrypted bank details for payment processing.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  <strong>Masked Display:</strong> Users see only masked versions of their bank details (e.g., ****1234).
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  <strong>Audit Logging:</strong> All access to sensitive data is logged for security monitoring.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Security Checklist */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security Measures Implemented
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {securityChecklist.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Responsibilities */}
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              Your Role in Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Help us keep your account secure by following these best practices:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">•</span>
                Use a strong, unique password for your account
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">•</span>
                Never share your login credentials with anyone
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">•</span>
                Log out from shared or public devices
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">•</span>
                Report any suspicious activity immediately
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">•</span>
                Keep your email account secure (used for password recovery)
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <p className="text-center text-sm text-muted-foreground">
              Have security concerns or found a vulnerability? Contact us at{' '}
              <a href="mailto:security@vidshare.com" className="text-primary hover:underline">
                security@vidshare.com
              </a>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Security;
