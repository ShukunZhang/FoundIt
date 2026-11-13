import React, { useState } from 'react';
import { X, Lock, Sparkles, AlertCircle, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import { FoundItem, UserProfile } from '../types';
import { studentItemLabel } from '../lib/studentView';

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: FoundItem | null;
  user: UserProfile;
  onSignIn: () => void;
  onSubmitClaim: (
    item: FoundItem,
    claimData: {
      verificationAnswer?: string;
      distinguishingDetail?: string;
      isInstant: boolean;
      pickupCode?: string;
    }
  ) => Promise<{ pickupCode?: string } | void>;
  onShowPickupCode: (code: string, itemTitle: string, deskName: string) => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({
  isOpen,
  onClose,
  item,
  user,
  onSignIn,
  onSubmitClaim,
  onShowPickupCode,
}) => {
  const [verificationAnswer, setVerificationAnswer] = useState('');
  const [distinguishingDetail, setDistinguishingDetail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  if (!isOpen || !item) return null;

  const isValuable = item.valuable;
  const isContested = item.status === 'reserved';
  const remainingInstantClaims = user.maxWeeklyInstantClaims - user.claimsUsedThisWeek;

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user.isSignedIn) {
      setErrorMsg('Please sign in with your UW WatIAM account first.');
      return;
    }

    if (isValuable && !verificationAnswer.trim()) {
      setErrorMsg('Please answer the ownership verification question so staff can verify your identity.');
      return;
    }

    if (!isValuable && distinguishingDetail.trim().length < 8) {
      setErrorMsg('Describe a mark, brand, or content that is not on the listing. The desk uses it to check the claim.');
      return;
    }

    if (!isValuable && !isContested && remainingInstantClaims <= 0) {
      setErrorMsg('You have used your 3 instant claims for this week. Contact the desk directly if this is an urgent claim.');
      return;
    }

    try {
      const result = await onSubmitClaim(item, {
        verificationAnswer: verificationAnswer.trim(),
        distinguishingDetail: distinguishingDetail.trim(),
        isInstant: !isValuable && !isContested,
      });
      if (result?.pickupCode) setGeneratedCode(result.pickupCode);
      setSubmitted(true);
    } catch (claimError) {
      setErrorMsg(claimError instanceof Error ? claimError.message : 'Could not submit the claim.');
    }
  };

  const getQuestionPlaceholder = () => {
    switch (item.category) {
      case 'wallet':
        return 'e.g. List cards inside (driver license name, gym card), approx cash amount, or photo inside...';
      case 'electronics':
        return 'e.g. Describe lockscreen image, stickers on back, Bluetooth name, serial number...';
      case 'WatCard':
        return `Confirm the full name on the card or student ID number (starts with 20...)...`;
      default:
        return 'Provide a specific detail only the rightful owner would know...';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Top Banner */}
        <div className={`px-6 py-4 flex items-center justify-between ${isValuable ? 'bg-slate-900 text-white' : 'bg-amber-400 text-slate-950'}`}>
          <div className="flex items-center gap-2">
            {isValuable ? (
              <Lock className="w-4 h-4 text-amber-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-slate-950" />
            )}
            <h3 className="font-bold text-sm tracking-wide">
              {isContested
                ? 'Contested Claim — Staff Review'
                : isValuable
                ? 'Valuable Item Claim (Staff Review)'
                : 'Instant 1-Tap Claim'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isValuable ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-amber-500/40 text-slate-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Target item preview */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0">
              {item.category.slice(0, 3).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500 font-medium">Claiming item from {item.desk}</p>
              <h4 className="font-bold text-slate-900 truncate">
                {studentItemLabel(item)}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">Colour: {item.colour}</p>
            </div>
          </div>

          {/* User Sign-in requirement check */}
          {!user.isSignedIn ? (
            <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center mx-auto text-amber-900">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">UW Sign-In Required to Claim</h4>
                <p className="text-xs text-slate-600 mt-1">
                  To protect campus belongings and limit fraudulent claims, claims require a valid WatIAM student account.
                </p>
              </div>
              <button
                onClick={onSignIn}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-950 text-white font-semibold text-xs hover:bg-slate-800 transition-colors shadow-xs"
              >
                Sign in to claim
              </button>
            </div>
          ) : submitted ? (
            /* Submission Success State */
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              {isValuable || isContested ? (
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Claim Sent to Staff Review</h4>
                  <p className="text-xs text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed">
                    Because this item is marked as valuable, staff at <span className="font-semibold text-slate-900">{item.desk}</span> will review your ownership answer. Once approved, you'll receive an in-app pickup code in your Inbox.
                  </p>
                  <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-left text-xs text-slate-700">
                    <p className="font-semibold text-slate-900 mb-1">Status progression:</p>
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      <span>Claim sent → Under staff review → Ready for pickup</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Item Reserved Instantly!</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    This item is held for 7 days. At <span className="font-semibold text-slate-900">{item.desk}</span>, staff compare the detail you wrote with the item before handing it over.
                  </p>

                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                    <p className="text-xs text-slate-500">Your pickup verification code</p>
                    <p className="text-3xl font-mono font-black text-slate-950 tracking-widest my-1">
                      {generatedCode}
                    </p>
                    <p className="text-[11px] text-amber-800">
                      Hold expires in 7 days (Nov 13, 2026)
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2">
                {!isValuable && !isContested && (
                  <button
                    onClick={() => {
                      onClose();
                      onShowPickupCode(generatedCode, studentItemLabel(item), item.desk);
                    }}
                    className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>View Full Pickup QR Pass</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Back to Search
                </button>
              </div>
            </div>
          ) : (
            /* Active Claim Form */
            <form onSubmit={handleClaim} className="space-y-4">
              {isContested && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Contested Item Claim:</span> Another student already placed a hold on this item. Submitting your details will route both claims to desk staff for manual ID verification.
                  </div>
                </div>
              )}

              {isValuable ? (
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Ownership Verification Question <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    {item.category === 'wallet'
                      ? "What is inside the wallet? List specific cards, photo, or approximate contents:"
                      : item.category === 'electronics'
                      ? "Describe the lockscreen, stickers, or distinguishing settings:"
                      : item.category === 'WatCard'
                      ? "Enter the student name and 8-digit WatCard ID:"
                      : "Describe private distinguishing marks or contents:"}
                  </p>
                  <textarea
                    rows={3}
                    value={verificationAnswer}
                    onChange={(e) => setVerificationAnswer(e.target.value)}
                    placeholder={getQuestionPlaceholder()}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Staff at {item.desk} will verify these details before approving release.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-950 mb-3">
                    <p className="font-bold">The listing hides identifying details</p>
                    <p className="text-[11px] text-amber-900 mt-0.5">
                      Brand, photos, and marks are not shown. Write one only the owner would know. The desk checks it before release.
                    </p>
                  </div>

                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Detail only you would know <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={8}
                    value={distinguishingDetail}
                    onChange={(e) => setDistinguishingDetail(e.target.value)}
                    placeholder="e.g. goose sticker on the lid, name inside the collar"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              )}

              {/* Weekly Limit Indicator */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-800">Student Claim Quota:</span>
                  <p className="text-[11px] text-slate-500">Limits fraud & hoards</p>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${remainingInstantClaims > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {remainingInstantClaims} of {user.maxWeeklyInstantClaims} instant claims left
                  </span>
                  <p className="text-[10px] text-slate-400">Resets weekly</p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors ${
                    isValuable
                      ? 'bg-slate-950 text-white hover:bg-slate-800'
                      : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                  }`}
                >
                  {isValuable ? 'Submit for Staff Review' : 'Reserve with this detail'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
