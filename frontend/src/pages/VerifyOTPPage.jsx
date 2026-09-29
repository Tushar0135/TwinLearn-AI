import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export default function VerifyOTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const email = location.state?.email || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef([]);

  /* =========================================================
     Redirect if email is missing
  ========================================================= */

  useEffect(() => {
    if (!email) {
      navigate('/register', { replace: true });
    }
  }, [email, navigate]);

  /* =========================================================
     Resend countdown
  ========================================================= */

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((previous) => previous - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  /* =========================================================
     OTP INPUT
  ========================================================= */

  const handleOtpChange = (index, value) => {
    // Only allow numbers
    const numericValue = value.replace(/\D/g, '');

    if (!numericValue) {
      const updatedOtp = [...otp];
      updatedOtp[index] = '';
      setOtp(updatedOtp);
      return;
    }

    const updatedOtp = [...otp];
    updatedOtp[index] = numericValue.slice(-1);

    setOtp(updatedOtp);
    setError('');

    // Move to next box
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /* =========================================================
     BACKSPACE
  ========================================================= */

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /* =========================================================
     PASTE OTP
  ========================================================= */

  const handlePaste = (event) => {
    event.preventDefault();

    const pasted = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);

    if (!pasted) return;

    const updatedOtp = ['', '', '', '', '', ''];

    pasted.split('').forEach((digit, index) => {
      updatedOtp[index] = digit;
    });

    setOtp(updatedOtp);
    setError('');

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  /* =========================================================
     VERIFY OTP
  ========================================================= */

  const handleVerify = async (event) => {
    event.preventDefault();

    const otpValue = otp.join('');

    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    if (!email) {
      setError('Email information is missing. Please register again.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/verify-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            otp: otpValue,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || 'Invalid or expired OTP.'
        );
      }

      /*
       * Backend returns:
       *
       * {
       *   access_token,
       *   token_type,
       *   student
       * }
       */

      localStorage.setItem(
        'twinalai_auth',
        JSON.stringify({
          user: data.student,
          token: data.access_token,
          token_type: data.token_type || 'bearer',
          loginAt: new Date().toISOString(),
        })
      );

      /*
       * Update React authentication state
       */
      if (login) {
        login(data.student, data.access_token);
      }

      setSuccess('Email verified successfully!');

      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 700);
    } catch (err) {
      setError(
        err.message ||
          'Unable to verify OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     RESEND OTP
  ========================================================= */

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) {
      return;
    }

    if (!email) {
      setError(
        'Email information is missing. Please register again.'
      );
      return;
    }

    setResending(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/resend-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || 'Unable to resend OTP.'
        );
      }

      setSuccess(
        data?.message ||
          'A new OTP has been sent to your email.'
      );

      setOtp(['', '', '', '', '', '']);

      inputRefs.current[0]?.focus();

      // Prevent repeated requests for 30 seconds
      setResendCooldown(30);
    } catch (err) {
      setError(
        err.message ||
          'Unable to resend OTP. Please try again.'
      );
    } finally {
      setResending(false);
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-[#f7f3ea] flex items-center justify-center px-4 py-10 relative overflow-hidden">

      {/* Decorative background */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-[#e6ecdf] opacity-60 blur-3xl" />

      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-[#f1ddd2] opacity-60 blur-3xl" />

      <div className="w-full max-w-md relative z-10 animate-scale-in">

        {/* Back */}
        <Link
          to="/register"
          className="inline-flex items-center gap-2 text-sm text-[#6f7068] hover:text-[#6f8061] transition-colors mb-6"
        >
          <ArrowLeft size={17} />
          Back to registration
        </Link>

        {/* Card */}
        <div className="bg-[#fffdf8] border border-[#e4ded2] rounded-3xl shadow-[0_20px_60px_rgba(62,64,56,0.08)] p-8 sm:p-10">

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#e6ecdf] flex items-center justify-center text-[#6f8061] float-soft">
              <ShieldCheck size={32} strokeWidth={1.8} />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">

            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#6f8061] flex items-center justify-center text-[#fffdf8] font-bold">
                T
              </div>

              <span className="font-semibold text-[#3e4038]">
                TwinLearnAI
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#3e4038] mb-3">
              Verify your email
            </h1>

            <p className="text-[#7d7d72] text-sm leading-relaxed">
              We've sent a 6-digit verification code to
            </p>

            <p className="font-semibold text-[#6f8061] mt-1 break-all">
              {email}
            </p>
          </div>

          {/* Success */}
          {success && (
            <div className="mb-5 rounded-xl border border-[#cfdcc6] bg-[#e6ecdf] px-4 py-3 flex items-start gap-3 text-sm text-[#5d6e51]">
              <CheckCircle2
                size={18}
                className="mt-0.5 flex-shrink-0"
              />

              <span>{success}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-xl border border-[#ead0c7] bg-[#f8e8e1] px-4 py-3 text-sm text-[#9b5d49]">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleVerify}>

            <label className="block text-sm font-semibold text-[#3e4038] mb-4 text-center">
              Enter verification code
            </label>

            {/* OTP boxes */}
            <div className="flex justify-center gap-2 sm:gap-3 mb-8">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputRefs.current[index] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(event) =>
                    handleOtpChange(
                      index,
                      event.target.value
                    )
                  }
                  onKeyDown={(event) =>
                    handleKeyDown(index, event)
                  }
                  onPaste={handlePaste}
                  className="
                    w-11 h-14
                    sm:w-12 sm:h-14
                    text-center
                    text-xl
                    font-semibold
                    rounded-xl
                    border
                    border-[#d8d1c4]
                    bg-[#fffdf8]
                    text-[#3e4038]
                    focus:border-[#6f8061]
                    focus:ring-4
                    focus:ring-[#6f8061]/10
                    outline-none
                    transition-all
                  "
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>

            {/* Verify */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                h-12
                rounded-xl
                bg-[#6f8061]
                hover:bg-[#5d6e51]
                text-[#fffdf8]
                font-semibold
                flex
                items-center
                justify-center
                gap-2
                shadow-[0_8px_20px_rgba(111,128,97,0.18)]
                hover:shadow-[0_12px_28px_rgba(111,128,97,0.24)]
                hover:-translate-y-0.5
                transition-all
                disabled:opacity-60
                disabled:hover:translate-y-0
              "
            >
              {loading ? (
                <>
                  <RefreshCw
                    size={18}
                    className="animate-spin"
                  />
                  Verifying...
                </>
              ) : (
                <>
                  Verify Email
                  <CheckCircle2 size={18} />
                </>
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="text-center mt-7">

            <p className="text-sm text-[#7d7d72] mb-2">
              Didn't receive the code?
            </p>

            <button
              type="button"
              onClick={handleResend}
              disabled={
                resendCooldown > 0 || resending
              }
              className="
                inline-flex
                items-center
                gap-2
                text-sm
                font-semibold
                text-[#6f8061]
                hover:text-[#5d6e51]
                disabled:text-[#aaa69c]
                disabled:cursor-not-allowed
                transition-colors
              "
            >
              <RefreshCw
                size={15}
                className={
                  resending
                    ? 'animate-spin'
                    : ''
                }
              />

              {resending
                ? 'Sending...'
                : resendCooldown > 0
                ? `Resend available in ${resendCooldown}s`
                : 'Resend OTP'}
            </button>
          </div>

          {/* Email information */}
          <div className="mt-8 pt-6 border-t border-[#e4ded2]">
            <div className="flex items-start gap-3">
              <Mail
                size={18}
                className="text-[#c98262] mt-0.5 flex-shrink-0"
              />

              <p className="text-xs leading-relaxed text-[#8a887f]">
                Check your inbox and spam folder. The
                verification code expires after a limited
                amount of time.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#aaa69c] mt-6">
          Secure authentication powered by TwinLearnAI
        </p>

      </div>
    </div>
  );
}