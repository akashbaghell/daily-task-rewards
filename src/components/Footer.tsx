import { Link } from 'react-router-dom';
import { Play, Shield } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Play className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-bold">VidShare</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Watch videos, earn rewards, and grow your network.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/videos" className="text-muted-foreground hover:text-foreground transition-colors">
                  Watch Videos
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/referrals" className="text-muted-foreground hover:text-foreground transition-colors">
                  Referral Program
                </Link>
              </li>
              <li>
                <Link to="/wallet" className="text-muted-foreground hover:text-foreground transition-colors">
                  Wallet
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/security" className="text-muted-foreground hover:text-foreground transition-colors">
                  Security
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust Badge */}
          <div>
            <h4 className="font-semibold mb-4">Trust & Security</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Shield className="h-5 w-5 text-green-500" />
              <span>Bank-grade encryption</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Your data is protected with AES-256 encryption and secure infrastructure.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} VidShare. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Made with ❤️ in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
