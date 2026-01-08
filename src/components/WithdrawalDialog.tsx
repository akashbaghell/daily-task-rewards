import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, IndianRupee, Building2, Save } from 'lucide-react';

interface WithdrawalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maxAmount: number;
}

interface SavedBankDetails {
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
}

export const WithdrawalDialog = ({ open, onOpenChange, maxAmount }: WithdrawalDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingBankDetails, setLoadingBankDetails] = useState(false);
  const [saveBankDetails, setSaveBankDetails] = useState(false);
  const [hasSavedDetails, setHasSavedDetails] = useState(false);
  
  const [amount, setAmount] = useState('1000');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

  // Fetch saved bank details when dialog opens
  useEffect(() => {
    const fetchSavedBankDetails = async () => {
      if (!open || !user) return;
      
      setLoadingBankDetails(true);
      const { data } = await supabase
        .from('user_bank_details')
        .select('bank_name, account_holder_name, account_number, ifsc_code')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setBankName(data.bank_name);
        setAccountHolderName(data.account_holder_name);
        setAccountNumber(data.account_number);
        setConfirmAccountNumber(data.account_number);
        setIfscCode(data.ifsc_code);
        setHasSavedDetails(true);
      }
      setLoadingBankDetails(false);
    };

    fetchSavedBankDetails();
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const withdrawAmount = parseInt(amount);
    
    if (withdrawAmount < 1000) {
      toast.error('Minimum withdrawal is ₹1000');
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

    // Save bank details if checkbox is checked
    if (saveBankDetails && user) {
      const bankData = {
        user_id: user.id,
        bank_name: bankName.trim(),
        account_holder_name: accountHolderName.trim(),
        account_number: accountNumber.trim(),
        ifsc_code: ifscCode.trim().toUpperCase(),
      };

      if (hasSavedDetails) {
        await supabase
          .from('user_bank_details')
          .update(bankData)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_bank_details')
          .insert(bankData);
      }
    }

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
      setAmount('1000');
      setBankName('');
      setAccountNumber('');
      setConfirmAccountNumber('');
      setIfscCode('');
      setAccountHolderName('');
      setSaveBankDetails(false);
      setHasSavedDetails(false);
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
        
        {loadingBankDetails ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Available Balance</span>
              <span className="font-bold text-primary flex items-center gap-1">
                <IndianRupee className="h-4 w-4" />
                {maxAmount}
              </span>
            </div>

            {hasSavedDetails && (
              <div className="p-2 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-600 flex items-center gap-2">
                <Save className="h-4 w-4" />
                Bank details auto-filled from saved info
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Withdrawal Amount (Min ₹1000)</Label>
              <Input
                id="amount"
                type="number"
                min={1000}
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="saveBankDetails"
                checked={saveBankDetails}
                onCheckedChange={(checked) => setSaveBankDetails(checked === true)}
              />
              <Label htmlFor="saveBankDetails" className="text-sm cursor-pointer">
                {hasSavedDetails ? 'Update saved bank details' : 'Save bank details for future withdrawals'}
              </Label>
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
        )}
      </DialogContent>
    </Dialog>
  );
};
