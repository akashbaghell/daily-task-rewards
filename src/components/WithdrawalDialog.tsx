import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, IndianRupee, Building2 } from 'lucide-react';

interface WithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maxAmount: number;
}

export const WithdrawalDialog = ({ open, onOpenChange, maxAmount }: WithdrawalDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [amount, setAmount] = useState('5000');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const withdrawAmount = parseInt(amount);
    
    if (withdrawAmount < 5000) {
      toast.error('Minimum withdrawal is ₹5000');
      return;
    }
    
    if (withdrawAmount > maxAmount) {
      toast.error(`Maximum withdrawal is ₹${maxAmount}`);
      return;
    }
    
    if (accountNumber !== confirmAccountNumber) {
      toast.error('Account numbers do not match');
      return;
    }
    
    if (!bankName.trim() || !accountNumber.trim() || !ifscCode.trim() || !accountHolderName.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('withdrawal_requests')
      .insert({
        user_id: user?.id,
        amount: withdrawAmount,
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        ifsc_code: ifscCode.trim().toUpperCase(),
        account_holder_name: accountHolderName.trim(),
      });

    if (error) {
      toast.error('Failed to submit withdrawal request');
    } else {
      toast.success('Withdrawal request submitted! Admin will review soon.');
      onOpenChange(false);
      // Reset form
      setAmount('5000');
      setBankName('');
      setAccountNumber('');
      setConfirmAccountNumber('');
      setIfscCode('');
      setAccountHolderName('');
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Withdraw to Bank
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Available Balance</span>
            <span className="font-bold text-primary flex items-center gap-1">
              <IndianRupee className="h-4 w-4" />
              {maxAmount}
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount (Min ₹5000)</Label>
            <Input
              id="amount"
              type="number"
              min={5000}
              max={maxAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. State Bank of India"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountHolderName">Account Holder Name</Label>
            <Input
              id="accountHolderName"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              placeholder="Name as per bank account"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Enter account number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmAccountNumber">Confirm Account Number</Label>
            <Input
              id="confirmAccountNumber"
              value={confirmAccountNumber}
              onChange={(e) => setConfirmAccountNumber(e.target.value)}
              placeholder="Re-enter account number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ifscCode">IFSC Code</Label>
            <Input
              id="ifscCode"
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value)}
              placeholder="e.g. SBIN0001234"
              className="uppercase"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <IndianRupee className="h-4 w-4 mr-2" />
                Submit Withdrawal Request
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
