import { useState, useEffect, useRef } from "react";
import { findAccountByPhone, createNewVerifiedAccount, cleanPhone, getCustomAccounts } from "../accounts.js";
import { profileService, kycService } from "../services/supabaseService.js";

const PUNJAB_DISTRICTS = [
  "Sangrur",
  "Malerkotla",
  "Patiala",
  "Bathinda",
  "Ludhiana",
  "Barnala",
  "Mansa",
  "Amritsar",
  "Jalandhar",
  "Firozpur",
  "Moga",
  "Kapurthala",
  "Fatehgarh Sahib",
  "Hoshiarpur",
  "Rupnagar",
  "Mohali (SAS Nagar)",
];

const SAMPLE_VILLAGES = {
  Sangrur: ["Dhuri", "Bhawanigarh", "Lehragaga", "Sunam", "Dirba", "Sherpur"],
  Malerkotla: ["Malerkotla", "Ahmedgarh", "Amargarh"],
  Patiala: ["Nabha", "Samana", "Patran", "Rajpura"],
  Bathinda: ["Talwandi Sabo", "Rampura Phul", "Maur", "Goniana"],
  Ludhiana: ["Khanna", "Jagraon", "Samrala", "Raikot"],
  Barnala: ["Tapa", "Mehal Kalan", "Sehna"],
  Mansa: ["Budhlada", "Sardulgarh", "Bhikhi"],
};

export default function PhoneOtpKycFlow({ onComplete, onCancel, isAdminMode = false, defaultRole = "Farmer" }) {
  // Steps: 'PHONE' -> 'PHONE_OTP' -> 'KYC_DETAILS' -> 'KYC_OTP' -> 'SUCCESS'
  const [step, setStep] = useState("PHONE");

  // Phone states
  const [phone, setPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState(["", "", "", "", "", ""]);
  const [simulatedPhoneOtp, setSimulatedPhoneOtp] = useState("");
  const [phoneTimer, setPhoneTimer] = useState(60);
  const [phoneTimerActive, setPhoneTimerActive] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [showPhoneSmsToast, setShowPhoneSmsToast] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // KYC states
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState(defaultRole);
  const [district, setDistrict] = useState("Sangrur");
  const [village, setVillage] = useState("Dhuri");
  const [idType, setIdType] = useState("Aadhaar Card");
  const [idNumber, setIdNumber] = useState("");
  const [documentName, setDocumentName] = useState("aadhaar_card_scan.pdf");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [consentGiven, setConsentGiven] = useState(true);
  const [existingUserFound, setExistingUserFound] = useState(null);

  // Custom accounts in database for testing chips
  const customAccounts = getCustomAccounts();

  // Aadhaar OTP states
  const [aadhaarOtp, setAadhaarOtp] = useState(["", "", "", "", "", ""]);
  const [simulatedAadhaarOtp, setSimulatedAadhaarOtp] = useState("");
  const [aadhaarTimer, setAadhaarTimer] = useState(60);
  const [aadhaarTimerActive, setAadhaarTimerActive] = useState(false);
  const [kycError, setKycError] = useState("");
  const [showAadhaarSmsToast, setShowAadhaarSmsToast] = useState(false);

  // Verified account created
  const [createdAccount, setCreatedAccount] = useState(null);

  // Input refs for smooth 6-digit OTP navigation
  const phoneOtpRefs = useRef([]);
  const aadhaarOtpRefs = useRef([]);

  // Countdown timer for Phone OTP
  useEffect(() => {
    let interval = null;
    if (phoneTimerActive && phoneTimer > 0) {
      interval = setInterval(() => {
        setPhoneTimer(prev => prev - 1);
      }, 1000);
    } else if (phoneTimer === 0) {
      setPhoneTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [phoneTimerActive, phoneTimer]);

  // Countdown timer for Aadhaar OTP
  useEffect(() => {
    let interval = null;
    if (aadhaarTimerActive && aadhaarTimer > 0) {
      interval = setInterval(() => {
        setAadhaarTimer(prev => prev - 1);
      }, 1000);
    } else if (aadhaarTimer === 0) {
      setAadhaarTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [aadhaarTimerActive, aadhaarTimer]);

  // Update village when district changes
  const handleDistrictChange = d => {
    setDistrict(d);
    const list = SAMPLE_VILLAGES[d] || ["Block Center"];
    setVillage(list[0]);
  };

  // Handle phone input with live lookup
  const handlePhoneInputChange = val => {
    setPhone(val);
    setPhoneError("");
    const cleaned = cleanPhone(val);
    if (cleaned && cleaned.length === 10) {
      const match = findAccountByPhone(cleaned);
      setExistingUserFound(match);
    } else {
      setExistingUserFound(null);
    }
  };

  const handlePhoneSelect = val => {
    setPhone(val);
    setPhoneError("");
    const cleaned = cleanPhone(val);
    const match = findAccountByPhone(cleaned);
    setExistingUserFound(match);
  };

  // 1. Send Phone OTP
  const handleSendPhoneOtp = e => {
    e?.preventDefault();
    setPhoneError("");
    const cleaned = cleanPhone(phone);
    if (!cleaned || cleaned.length !== 10) {
      setPhoneError("Please enter a valid 10-digit Indian mobile number");
      return;
    }

    // Generate simulated 6-digit OTP
    const generated = String(Math.floor(100000 + Math.random() * 900000));
    setSimulatedPhoneOtp(generated);
    setPhoneOtp(["", "", "", "", "", ""]);
    setPhoneTimer(60);
    setPhoneTimerActive(true);
    setShowPhoneSmsToast(true);

    // Check if phone matches an existing account in database
    const existing = findAccountByPhone(cleaned);
    setExistingUserFound(existing);

    setStep("PHONE_OTP");
    setTimeout(() => {
      phoneOtpRefs.current[0]?.focus();
    }, 150);
  };

  // 2. Handle Phone OTP input changes
  const handlePhoneOtpChange = (index, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const copy = [...phoneOtp];
    copy[index] = digit;
    setPhoneOtp(copy);
    setPhoneError("");

    if (digit && index < 5) {
      phoneOtpRefs.current[index + 1]?.focus();
    }
  };

  const handlePhoneOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !phoneOtp[index] && index > 0) {
      phoneOtpRefs.current[index - 1]?.focus();
    }
  };

  const handlePhoneOtpPaste = e => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (paste) {
      const copy = [...phoneOtp];
      for (let i = 0; i < paste.length; i++) {
        copy[i] = paste[i];
      }
      setPhoneOtp(copy);
      if (paste.length === 6) {
        phoneOtpRefs.current[5]?.focus();
      } else {
        phoneOtpRefs.current[paste.length]?.focus();
      }
    }
  };

  const autoFillPhoneOtp = () => {
    if (!simulatedPhoneOtp) return;
    const digits = simulatedPhoneOtp.split("");
    setPhoneOtp(digits);
    setPhoneError("");
  };

  // 3. Verify Phone OTP
  const handleVerifyPhoneOtp = e => {
    e?.preventDefault();
    const entered = phoneOtp.join("");
    if (entered.length < 6) {
      setPhoneError("Please enter the complete 6-digit OTP sent to your phone");
      return;
    }

    if (entered !== simulatedPhoneOtp && entered !== "123456" && entered !== "999999") {
      setPhoneError(`Invalid OTP. Please enter ${simulatedPhoneOtp} (or click Auto-fill)`);
      return;
    }

    // Phone is verified!
    setShowPhoneSmsToast(false);

    // Check if this phone number is already registered in database (demo or custom)
    const cleaned = cleanPhone(phone);
    const existing = existingUserFound || findAccountByPhone(cleaned);

    if (existing) {
      // User is already registered and verified in database!
      // Do NOT verify Aadhaar again!
      // Redirect directly to the main workspace!
      setIsRedirecting(true);
      setTimeout(() => {
        onComplete?.(existing);
      }, 350);
      return;
    }

    // New user who hasn't verified Aadhaar yet:
    // Proceed to one-time KYC and Aadhaar verification
    setStep("KYC_DETAILS");
  };

  // Format Aadhaar ID input as XXXX-XXXX-XXXX
  const handleIdNumberChange = val => {
    if (idType === "Aadhaar Card") {
      const digits = val.replace(/\D/g, "").slice(0, 12);
      let formatted = "";
      for (let i = 0; i < digits.length; i++) {
        if (i === 4 || i === 8) formatted += "-";
        formatted += digits[i];
      }
      setIdNumber(formatted);
    } else {
      setIdNumber(val.toUpperCase());
    }
  };

  const useSampleAadhaar = () => {
    setIdType("Aadhaar Card");
    setIdNumber("7894-3210-5621");
    if (!fullName) setFullName("Jaswant Singh");
  };

  // 4. Request Aadhaar OTP
  const handleRequestAadhaarOtp = e => {
    e?.preventDefault();
    setKycError("");

    if (!fullName.trim()) {
      setKycError("Please enter your full name as printed on your ID proof");
      return;
    }

    const cleanId = idNumber.replace(/[^A-Za-z0-9]/g, "");
    if (idType === "Aadhaar Card" && cleanId.length !== 12) {
      setKycError("Aadhaar Card number must be exactly 12 digits (XXXX-XXXX-XXXX)");
      return;
    } else if (cleanId.length < 6) {
      setKycError(`Please enter a valid ${idType} number`);
      return;
    }

    if (!consentGiven) {
      setKycError("Please accept the government e-KYC consent declaration to proceed");
      return;
    }

    // Generate Aadhaar confirmation OTP
    const generated = String(Math.floor(100000 + Math.random() * 900000));
    setSimulatedAadhaarOtp(generated);
    setAadhaarOtp(["", "", "", "", "", ""]);
    setAadhaarTimer(60);
    setAadhaarTimerActive(true);
    setShowAadhaarSmsToast(true);

    setStep("KYC_OTP");
    setTimeout(() => {
      aadhaarOtpRefs.current[0]?.focus();
    }, 150);
  };

  // 5. Handle Aadhaar OTP input
  const handleAadhaarOtpChange = (index, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const copy = [...aadhaarOtp];
    copy[index] = digit;
    setAadhaarOtp(copy);
    setKycError("");

    if (digit && index < 5) {
      aadhaarOtpRefs.current[index + 1]?.focus();
    }
  };

  const handleAadhaarOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !aadhaarOtp[index] && index > 0) {
      aadhaarOtpRefs.current[index - 1]?.focus();
    }
  };

  const handleAadhaarOtpPaste = e => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (paste) {
      const copy = [...aadhaarOtp];
      for (let i = 0; i < paste.length; i++) {
        copy[i] = paste[i];
      }
      setAadhaarOtp(copy);
      if (paste.length === 6) {
        aadhaarOtpRefs.current[5]?.focus();
      } else {
        aadhaarOtpRefs.current[paste.length]?.focus();
      }
    }
  };

  const autoFillAadhaarOtp = () => {
    if (!simulatedAadhaarOtp) return;
    const digits = simulatedAadhaarOtp.split("");
    setAadhaarOtp(digits);
    setKycError("");
  };

  // 6. Confirm Aadhaar & Unlock Website Access
  const handleConfirmAadhaar = e => {
    e?.preventDefault();
    const entered = aadhaarOtp.join("");
    if (entered.length < 6) {
      setKycError("Please enter the complete 6-digit Aadhaar confirmation OTP");
      return;
    }

    if (entered !== simulatedAadhaarOtp && entered !== "123456" && entered !== "888888") {
      setKycError(`Invalid Aadhaar OTP. Please enter ${simulatedAadhaarOtp} (or click Auto-fill)`);
      return;
    }

    setShowAadhaarSmsToast(false);

    // Create the verified account locally (enforce that regular registration cannot grant Admin)
    const safeRole = (!isAdminMode && role === "Admin") ? "Farmer" : role;
    const newAcc = createNewVerifiedAccount({
      phone,
      name: fullName,
      role: safeRole,
      district,
      village,
      idProofType: idType,
      idProofNumber: idNumber,
      documentName,
    });

    // Sync profile to Supabase backend asynchronously if an authenticated UUID session is available
    const isValidUuid = val => typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
    const syncToSupabaseIfAvailable = async () => {
      let targetUserId = isValidUuid(newAcc.id) ? newAcc.id : null;
      if (!targetUserId) {
        const userRes = await authService.getUser();
        if (userRes?.data?.user?.id && isValidUuid(userRes.data.user.id)) {
          targetUserId = userRes.data.user.id;
        }
      }

      if (targetUserId) {
        try {
          await profileService.upsertProfile({
            id: targetUserId,
            phone: newAcc.phone,
            full_name: newAcc.name,
            first_name: newAcc.firstName,
            last_name: newAcc.lastName,
            role: newAcc.role,
            district: newAcc.district,
            village: newAcc.village,
            id_proof_type: newAcc.idProofType,
            id_proof_number_masked: newAcc.idProofNumber,
            is_verified: true,
            kyc_status: "Verified",
            id_proof_verified_at: new Date().toISOString(),
          });

          if (uploadedFile) {
            await kycService.uploadKycDocument(
              uploadedFile,
              targetUserId,
              idType,
              idNumber
            );
          }
        } catch (err) {
          console.warn("Supabase profile/KYC sync skipped:", err);
        }
      }
    };
    syncToSupabaseIfAvailable();

    setCreatedAccount(newAcc);
    setStep("SUCCESS");
  };

  // 7. Finish and enter regular website
  const handleEnterWebsite = () => {
    if (createdAccount) {
      onComplete?.(createdAccount);
    }
  };

  return (
    <div className="kl-phone-kyc-card">
      {/* Realtime Simulated SMS Alert Banner */}
      {showPhoneSmsToast && simulatedPhoneOtp && (
        <div className="kl-simulated-sms-banner">
          <div className="kl-sms-icon">💬</div>
          <div className="kl-sms-content">
            <div className="kl-sms-header">
              <b>SIMULATED SMS GATEWAY</b>
              <span>Just now · +91 {cleanPhone(phone)}</span>
            </div>
            <p>
              Your KrishiLoop login verification code is <strong>{simulatedPhoneOtp}</strong>. Valid for 10 minutes.
            </p>
          </div>
          <button
            type="button"
            className="kl-sms-copy-btn"
            onClick={autoFillPhoneOtp}
            title="Auto-fill this OTP"
          >
            Auto-fill
          </button>
        </div>
      )}

      {showAadhaarSmsToast && simulatedAadhaarOtp && (
        <div className="kl-simulated-sms-banner kl-sms-aadhaar">
          <div className="kl-sms-icon">🏛</div>
          <div className="kl-sms-content">
            <div className="kl-sms-header">
              <b>UIDAI / GOVT e-KYC GATEWAY</b>
              <span>Just now · Aadhaar ending in {idNumber.replace(/\D/g, "").slice(-4) || "XXXX"}</span>
            </div>
            <p>
              OTP for Aadhaar authentication of <b>{fullName || "User"}</b> is <strong>{simulatedAadhaarOtp}</strong>.
            </p>
          </div>
          <button
            type="button"
            className="kl-sms-copy-btn"
            onClick={autoFillAadhaarOtp}
            title="Auto-fill Aadhaar OTP"
          >
            Auto-fill
          </button>
        </div>
      )}

      {/* Progress Step Indicator */}
      <div className="kl-kyc-steps-progress">
        <div className={`kl-step-pill ${["PHONE", "PHONE_OTP"].includes(step) ? "active" : "done"}`}>
          <span className="kl-step-dot">{["KYC_DETAILS", "KYC_OTP", "SUCCESS"].includes(step) ? "✓" : "1"}</span>
          <span>Phone OTP</span>
        </div>
        <div className="kl-step-divider" />
        <div className={`kl-step-pill ${existingUserFound ? "done" : ["KYC_DETAILS", "KYC_OTP"].includes(step) ? "active" : step === "SUCCESS" ? "done" : ""}`}>
          <span className="kl-step-dot">{existingUserFound || step === "SUCCESS" ? "✓" : "2"}</span>
          <span>{existingUserFound ? "Aadhaar Verified ✓" : "Aadhaar ID Proof"}</span>
        </div>
        <div className="kl-step-divider" />
        <div className={`kl-step-pill ${step === "SUCCESS" || (step === "PHONE_OTP" && existingUserFound) ? "active" : ""}`}>
          <span className="kl-step-dot">{step === "SUCCESS" ? "✓" : "3"}</span>
          <span>{existingUserFound ? "Direct Access" : "Regular Access"}</span>
        </div>
      </div>

      {/* ================= STEP 1: ENTER PHONE NUMBER ================= */}
      {step === "PHONE" && (
        <form onSubmit={handleSendPhoneOtp} className="kl-phone-step-form">
          <div className="kl-auth-header-block">
            <div className="kl-auth-badge-pill">
              <span className="kl-pulse-dot" />
              <span>{isAdminMode ? "ADMIN USER ONBOARDING" : "PHONE & OTP AUTHENTICATION"}</span>
            </div>
            <h2>Login with Phone Number</h2>
            <p>Enter your 10-digit mobile number to receive a secure SMS verification code.</p>
          </div>

          <div className="kl-input-group">
            <label htmlFor="user-phone-input">Mobile Phone Number</label>
            <div className="kl-phone-input-wrap">
              <span className="kl-phone-prefix">
                <span className="kl-country-flag">🇮🇳</span> +91
              </span>
              <input
                id="user-phone-input"
                type="tel"
                placeholder="98765 43210"
                value={phone}
                onChange={e => handlePhoneInputChange(e.target.value)}
                maxLength={14}
                autoFocus
                required
              />
            </div>
            {phoneError && <div className="kl-input-error">{phoneError}</div>}

            {/* Live Detected User Notification */}
            {existingUserFound ? (
              <div className="kl-phone-detected-user">
                <span className="kl-dot-green">●</span>
                <div>
                  <b>Registered in Database: {existingUserFound.name}</b> ({existingUserFound.role} · {existingUserFound.district})
                  <small style={{ display: "block", opacity: 0.85 }}>Direct workspace login upon OTP verification (Aadhaar already verified ✓)</small>
                </div>
              </div>
            ) : cleanPhone(phone).length === 10 ? (
              <div className="kl-phone-detected-user kl-new-user">
                <span className="kl-dot-blue">●</span>
                <div>
                  <b>New Mobile Number</b>
                  <small style={{ display: "block", opacity: 0.85 }}>First-time 1-time Aadhaar e-KYC required. Data will be saved permanently for future direct logins.</small>
                </div>
              </div>
            ) : null}
          </div>

          {/* Quick Demo Pre-fill Chips */}
          <div className="kl-quick-phone-chips">
            <small>Quick test numbers:</small>
            <div className="kl-chips-row">
              <button
                type="button"
                className="kl-phone-chip"
                onClick={() => handlePhoneSelect("98760 12345")}
              >
                +91 98760 12345 <span className="kl-chip-tag">Registered Gurpreet</span>
              </button>
              {customAccounts && customAccounts.length > 0 ? (
                <button
                  type="button"
                  className="kl-phone-chip"
                  onClick={() => handlePhoneSelect(customAccounts[0].phone)}
                >
                  {customAccounts[0].phone} <span className="kl-chip-tag">Saved {customAccounts[0].firstName || customAccounts[0].name}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="kl-phone-chip"
                  onClick={() => handlePhoneSelect("98765 43210")}
                >
                  +91 98765 43210 <span className="kl-chip-tag">New Registration</span>
                </button>
              )}
            </div>
          </div>

          <div className="kl-form-actions-stack">
            <button type="submit" className="primary kl-btn-full">
              Get OTP via SMS <span>→</span>
            </button>
            {onCancel && (
              <button type="button" className="secondary kl-btn-full" onClick={onCancel}>
                ← Back to Persona Login
              </button>
            )}
          </div>

          <div className="kl-auth-security-notice">
            <span className="kl-shield-icon">🛡</span>
            <span>
              Secure UIDAI & Punjab Agri Registry integration. Zero-burn certified accounts only.
            </span>
          </div>
        </form>
      )}

      {/* ================= STEP 2: ENTER PHONE OTP ================= */}
      {step === "PHONE_OTP" && (
        <form onSubmit={handleVerifyPhoneOtp} className="kl-phone-step-form">
          <div className="kl-auth-header-block">
            <div className="kl-auth-badge-pill">
              <span className="kl-sms-sent-dot" />
              <span>SMS CODE SENT</span>
            </div>
            <h2>Verify Mobile Number</h2>
            <p>
              Enter the 6-digit verification code sent to{" "}
              <b>+91 {cleanPhone(phone)}</b>
            </p>
          </div>

          {existingUserFound ? (
            <div className="kl-existing-user-banner">
              <div
                className="kl-existing-user-avatar"
                style={{
                  backgroundColor: existingUserFound.avatarBg || "#d8b34d",
                  color: existingUserFound.avatarColor || "#1a2717",
                }}
              >
                {existingUserFound.initials || "✓"}
              </div>
              <div className="kl-existing-user-info">
                <div className="kl-existing-user-name">Welcome back, <b>{existingUserFound.name}</b>!</div>
                <div className="kl-existing-user-meta">
                  <span className="kl-badge-kyc-done">🛡 Aadhaar Verified ✓</span>
                  <span>{existingUserFound.role} · {existingUserFound.district}</span>
                </div>
                <div className="kl-bypass-notice">
                  ✓ Aadhaar already verified in database. Entering OTP redirects you directly to your workspace.
                </div>
              </div>
            </div>
          ) : (
            <div className="kl-phone-detected-user kl-new-user" style={{ marginBottom: 14 }}>
              <span className="kl-dot-blue">●</span>
              <div>
                <b>First-time Registration</b>
                <small style={{ display: "block", opacity: 0.85 }}>One-time Aadhaar e-KYC will follow this phone verification.</small>
              </div>
            </div>
          )}

          <div className="kl-otp-input-container">
            <label>6-Digit Verification Code</label>
            <div className="kl-otp-boxes-row" onPaste={handlePhoneOtpPaste}>
              {phoneOtp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => (phoneOtpRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className={`kl-otp-box ${digit ? "filled" : ""}`}
                  value={digit}
                  onChange={e => handlePhoneOtpChange(idx, e.target.value)}
                  onKeyDown={e => handlePhoneOtpKeyDown(idx, e.target.value ? e : e)}
                />
              ))}
            </div>

            {phoneError && <div className="kl-input-error">{phoneError}</div>}

            <div className="kl-otp-actions-bar">
              <button
                type="button"
                className="kl-link-btn"
                onClick={autoFillPhoneOtp}
              >
                ⚡ Auto-fill code ({simulatedPhoneOtp})
              </button>

              <div className="kl-resend-wrap">
                {phoneTimerActive ? (
                  <span className="kl-timer-text">Resend in {phoneTimer}s</span>
                ) : (
                  <button
                    type="button"
                    className="kl-link-btn"
                    onClick={handleSendPhoneOtp}
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="kl-form-actions-stack">
            <button type="submit" className="primary kl-btn-full" disabled={isRedirecting}>
              {isRedirecting ? (
                <>Redirecting to workspace... <span>✓</span></>
              ) : existingUserFound ? (
                <>Verify OTP &amp; Enter Workspace <span>→</span></>
              ) : (
                <>Verify Phone &amp; Continue to Aadhaar e-KYC <span>→</span></>
              )}
            </button>
            <button
              type="button"
              className="kl-sub-btn"
              onClick={() => setStep("PHONE")}
            >
              ← Change phone number
            </button>
          </div>
        </form>
      )}

      {/* ================= STEP 3: KYC & ID PROOF DETAILS ================= */}
      {step === "KYC_DETAILS" && (
        <form onSubmit={handleRequestAadhaarOtp} className="kl-kyc-details-form">
          <div className="kl-auth-header-block">
            <div className="kl-auth-badge-pill kl-pill-kyc">
              <span>🏛 MANDATORY e-KYC VERIFICATION</span>
            </div>
            <h2>Identity & Government ID Proof</h2>
            <p>
              Mobile number verified (<b>+91 {cleanPhone(phone)}</b>). Please verify your identity with Aadhaar or
              another valid Government ID to enable regular access.
            </p>
          </div>

          {kycError && <div className="kl-banner-error">{kycError}</div>}

          <div className="kl-kyc-grid">
            <div className="kl-field-col">
              <label htmlFor="kyc-full-name">Full Name (as per ID card) *</label>
              <input
                id="kyc-full-name"
                type="text"
                placeholder="e.g. Jaswant Singh"
                value={fullName}
                onChange={e => {
                  setFullName(e.target.value);
                  setKycError("");
                }}
                required
              />
            </div>

            <div className="kl-field-col">
              <label>Role in Agricultural Loop *</label>
              <select value={role} onChange={e => setRole(e.target.value)}>
                <option value="Farmer">Farmer (Residue Producer)</option>
                <option value="Collector">Collector (Baler / Logistics Fleet)</option>
                <option value="Processor">Processor (Biomass Pellet / Bio-CNG)</option>
                <option value="Buyer">Buyer (Paper Mills / Commercial Offtaker)</option>
                {isAdminMode && <option value="Admin">Admin (State Agricultural Officer)</option>}
              </select>
            </div>

            <div className="kl-field-col">
              <label>District in Punjab *</label>
              <select value={district} onChange={e => handleDistrictChange(e.target.value)}>
                {PUNJAB_DISTRICTS.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="kl-field-col">
              <label>Village / Block / Tehsils *</label>
              <input
                type="text"
                placeholder="e.g. Dhuri / Bhawanigarh"
                value={village}
                onChange={e => setVillage(e.target.value)}
                required
              />
            </div>

            <div className="kl-field-col">
              <label>Valid ID Proof Type *</label>
              <select value={idType} onChange={e => {
                setIdType(e.target.value);
                setIdNumber("");
              }}>
                <option value="Aadhaar Card">Aadhaar Card (UIDAI 12-Digits)</option>
                <option value="Kisan Credit Card">Kisan Credit Card / Farmer ID (KCC)</option>
                <option value="Voter ID Card">Voter ID Card (Election Commission EPIC)</option>
                <option value="PAN Card">PAN Card (Income Tax Dept)</option>
              </select>
            </div>

            <div className="kl-field-col">
              <div className="kl-label-with-action">
                <label>{idType} Number *</label>
                {idType === "Aadhaar Card" && (
                  <button
                    type="button"
                    className="kl-micro-link"
                    onClick={useSampleAadhaar}
                  >
                    Sample Aadhaar
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder={idType === "Aadhaar Card" ? "XXXX-XXXX-XXXX (12 digits)" : "Enter ID document number"}
                value={idNumber}
                onChange={e => handleIdNumberChange(e.target.value)}
                maxLength={idType === "Aadhaar Card" ? 14 : 20}
                required
              />
            </div>
          </div>

          {/* Document Attachment Preview */}
          <div className="kl-doc-upload-preview">
            <div className="kl-doc-icon">📄</div>
            <div className="kl-doc-info">
              <b>{documentName}</b>
              <small>Valid government ID scan · 380 KB · Ready for e-KYC</small>
            </div>
            <label className="kl-upload-chip">
              Change file
              <input
                type="file"
                style={{ display: "none" }}
                onChange={e => {
                  if (e.target.files?.[0]) {
                    const f = e.target.files[0];
                    setDocumentName(f.name);
                    setUploadedFile(f);
                  }
                }}
              />
            </label>
          </div>

          {/* UIDAI Consent Checkbox */}
          <label className="kl-consent-checkbox-wrap">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={e => setConsentGiven(e.target.checked)}
            />
            <span>
              I consent to verify my demographic details with <strong>UIDAI / Government Registry</strong> via OTP
              to authorize regular access, zero-burn certification, and direct DBT payouts on KrishiLoop.
            </span>
          </label>

          <div className="kl-form-actions-stack">
            <button type="submit" className="primary kl-btn-full">
              Verify Details & Send Aadhaar OTP <span>→</span>
            </button>
            <button
              type="button"
              className="kl-sub-btn"
              onClick={() => setStep("PHONE")}
            >
              ← Back to phone
            </button>
          </div>
        </form>
      )}

      {/* ================= STEP 4: AADHAAR / ID CONFIRMATION OTP ================= */}
      {step === "KYC_OTP" && (
        <form onSubmit={handleConfirmAadhaar} className="kl-phone-step-form">
          <div className="kl-auth-header-block">
            <div className="kl-auth-badge-pill kl-pill-aadhaar-gate">
              <span>🏛 UIDAI NATIONAL ID AUTHENTICATION</span>
            </div>
            <h2>Confirm Aadhaar e-KYC</h2>
            <p>
              Enter the 6-digit confirmation OTP sent to the mobile number registered with your Aadhaar ending in{" "}
              <strong>...{idNumber.replace(/\D/g, "").slice(-4) || "5621"}</strong>
            </p>
          </div>

          <div className="kl-aadhaar-seal-card">
            <div className="kl-aadhaar-seal-head">
              <span className="kl-govt-emblem">🇮🇳</span>
              <div>
                <b>UIDAI Electronic Know Your Customer (e-KYC)</b>
                <small>Request Ref: KL-UIDAI-{Date.now().toString(36).toUpperCase()}</small>
              </div>
            </div>
            <div className="kl-aadhaar-seal-meta">
              <span>Name: <b>{fullName}</b></span>
              <span>ID: <b>{idNumber}</b></span>
              <span>District: <b>{district}, Punjab</b></span>
            </div>
          </div>

          <div className="kl-otp-input-container">
            <label>6-Digit Aadhaar Confirmation Code</label>
            <div className="kl-otp-boxes-row" onPaste={handleAadhaarOtpPaste}>
              {aadhaarOtp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => (aadhaarOtpRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className={`kl-otp-box ${digit ? "filled" : ""}`}
                  value={digit}
                  onChange={e => handleAadhaarOtpChange(idx, e.target.value)}
                  onKeyDown={e => handleAadhaarOtpKeyDown(idx, e.target.value ? e : e)}
                />
              ))}
            </div>

            {kycError && <div className="kl-input-error">{kycError}</div>}

            <div className="kl-otp-actions-bar">
              <button
                type="button"
                className="kl-link-btn"
                onClick={autoFillAadhaarOtp}
              >
                ⚡ Auto-fill Aadhaar OTP ({simulatedAadhaarOtp})
              </button>

              <div className="kl-resend-wrap">
                {aadhaarTimerActive ? (
                  <span className="kl-timer-text">Resend in {aadhaarTimer}s</span>
                ) : (
                  <button
                    type="button"
                    className="kl-link-btn"
                    onClick={handleRequestAadhaarOtp}
                  >
                    Resend Aadhaar OTP
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="kl-form-actions-stack">
            <button type="submit" className="primary kl-btn-full">
              Confirm Aadhaar & Unlock Website Access <span>→</span>
            </button>
            <button
              type="button"
              className="kl-sub-btn"
              onClick={() => setStep("KYC_DETAILS")}
            >
              ← Edit Aadhaar details
            </button>
          </div>
        </form>
      )}

      {/* ================= STEP 5: SUCCESS & UNLOCKED ACCESS ================= */}
      {step === "SUCCESS" && (
        <div className="kl-kyc-success-view">
          <div className="kl-success-shield-anim">
            <div className="kl-success-check-badge">✓</div>
          </div>

          <div className="kl-success-head">
            <div className="kl-verified-tag">
              <span>●</span> Identity Verified · Zero-Burn Certified
            </div>
            <h2>Welcome to KrishiLoop, {createdAccount?.name}!</h2>
            <p>
              Your mobile number and government identity proof have been verified. You now have regular, full access
              to the circular agricultural workspace.
            </p>
          </div>

          <div className="kl-verified-credentials-card">
            <div className="kl-cred-row">
              <span>Account Persona</span>
              <b>{createdAccount?.role} ({createdAccount?.badge})</b>
            </div>
            <div className="kl-cred-row">
              <span>Verified Mobile</span>
              <b>{createdAccount?.phone}</b>
            </div>
            <div className="kl-cred-row">
              <span>Government ID Proof</span>
              <b>{createdAccount?.idProofType} ({createdAccount?.idProofNumber})</b>
            </div>
            <div className="kl-cred-row">
              <span>District & Village</span>
              <b>{createdAccount?.village}, {createdAccount?.district} (Punjab)</b>
            </div>
            <div className="kl-cred-row">
              <span>Traceability ID</span>
              <b className="kl-cred-id">{createdAccount?.employeeId}</b>
            </div>
            <div className="kl-cred-row">
              <span>Website Access Status</span>
              <b className="kl-access-granted">Active · Regular Full Access</b>
            </div>
          </div>

          <div className="kl-regular-features-checklist">
            <h4>Enabled Capabilities:</h4>
            <ul>
              <li>✓ Publish and manage crop residue lots (paddy/wheat straw)</li>
              <li>✓ Request mechanized baler booking and GPS collection routes</li>
              <li>✓ Algorithmic matching with biomass pellet & bio-CNG processing units</li>
              <li>✓ Monitor real-time field drone cameras & plant intake weighbridges</li>
              <li>✓ Traceable zero-burn compliance for direct DBT government payouts</li>
            </ul>
          </div>

          <div className="kl-phone-detected-user" style={{ margin: "14px 0", border: "1px solid rgba(16, 185, 129, 0.45)" }}>
            <span className="kl-dot-green">💾</span>
            <div>
              <b>Profile &amp; Aadhaar Permanently Saved in Database!</b>
              <small style={{ display: "block", opacity: 0.9 }}>
                You will never be asked for Aadhaar verification again. On your next visit, simply enter your mobile number <b>{createdAccount?.phone}</b> and OTP to be redirected directly to your workspace.
              </small>
            </div>
          </div>

          <button
            type="button"
            className="primary kl-btn-full kl-enter-btn"
            onClick={handleEnterWebsite}
          >
            Enter {createdAccount?.role} Workspace (Direct Access) <span>→</span>
          </button>
        </div>
      )}
    </div>
  );
}
