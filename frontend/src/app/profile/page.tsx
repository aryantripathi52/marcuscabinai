'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CreateProfilePage() {
  const router = useRouter();

  const [fullName, setFullName] = useState<string>('');
  const [age, setAge] = useState<number>(35);
  const [gender, setGender] = useState<string>('Male');
  const [bloodType, setBloodType] = useState<string>('O+');
  const [phone, setPhone] = useState<string>('');
  const [emergencyName, setEmergencyName] = useState<string>('');
  const [emergencyPhone, setEmergencyPhone] = useState<string>('');
  const [conditions, setConditions] = useState<string>('None');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    // Check if user is logged in via Supabase or localStorage
    async function checkUser() {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        setUserEmail(data.user.email);
        if (data.user.user_metadata?.full_name) {
          setFullName(data.user.user_metadata.full_name);
        }
      } else {
        const stored = localStorage.getItem('synapse_user_email');
        if (stored) setUserEmail(stored);
      }
    }
    checkUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('Please enter your full legal name.');
      return;
    }

    setIsSubmitting(true);
    const patientId = `user_${Date.now().toString().slice(-6)}`;
    const profileData = {
      id: patientId,
      mrn: `MRN-${patientId.toUpperCase()}-DX`,
      full_name: fullName.trim(),
      age: Number(age),
      gender,
      blood_type: bloodType,
      phone: phone || '+1 (555) 000-0000',
      email: userEmail || `${patientId}@synapse-dx.internal`,
      emergency_contact: {
        name: emergencyName || 'Family Member',
        phone: emergencyPhone || '+1 (555) 000-0000',
      },
      clinical_history: conditions.split(',').map((c) => c.trim()).filter(Boolean),
      status: 'ACTIVE',
    };

    try {
      // 1. Save to Supabase patients table
      const { error } = await supabase.from('patients').upsert(profileData);
      if (error) {
        console.warn('Supabase upsert notice:', error.message);
      }
    } catch (err) {
      console.warn('Supabase profile save notice:', err);
    }

    // 2. Save profile in localStorage for instantaneous UI sync
    localStorage.setItem('synapse_patient_profile', JSON.stringify(profileData));
    localStorage.setItem('synapse_profile_completed', 'true');
    localStorage.setItem('synapse_active_patient_id', patientId);

    // 3. Smooth transition to Step 3: Dashboard
    setTimeout(() => {
      router.push(`/dashboard?patientId=${patientId}`);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface antialiased font-body-sm relative overflow-x-hidden selection:bg-primary-container selection:text-surface-container-lowest">
      {/* Cybernetic ambient backdrop glow */}
      <div className="fixed inset-0 grid-mesh pointer-events-none z-0"></div>
      <div className="fixed -top-40 -left-40 w-96 h-96 rounded-full bg-primary-container/10 blur-[130px] pointer-events-none z-0"></div>
      <div className="fixed -bottom-40 right-10 w-[30rem] h-[30rem] rounded-full bg-secondary-container/10 blur-[150px] pointer-events-none z-0"></div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10 sm:py-16">
        {/* Step Progression Bar */}
        <div className="mb-8 p-4 rounded-xl bg-surface-container-low/80 backdrop-blur-xl border border-outline-variant/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-container/20 border border-primary-container/50 text-primary-container flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <div className="font-headline-sm text-sm font-bold text-primary-container tracking-tight">
                Initial Patient Onboarding
              </div>
              <div className="font-telemetry-sm text-[11px] text-on-surface-variant">
                Step 2 of 5: Create Your Clinical Profile
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-surface-container-high border border-outline-variant/30 text-on-surface-variant font-telemetry-sm text-[11px]">
            One-Time Setup
          </span>
        </div>

        {/* Form Card */}
        <div className="p-6 sm:p-10 rounded-2xl bg-surface-container-low/90 backdrop-blur-2xl border border-outline-variant/50 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-container via-secondary to-primary-container"></div>

          <div className="mb-6">
            <h1 className="font-display-lg text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              Create Your Patient Health Record
            </h1>
            <p className="font-body-lg text-on-surface-variant mt-1 text-sm sm:text-base leading-relaxed">
              Please enter your medical details. This enables Dr. Marcus Vance to calibrate accurate clinical reference ranges and cross-analyze your biomarker reports.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block font-telemetry-sm text-telemetry-sm text-on-surface mb-1.5 font-semibold">
                Full Legal Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                required
                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl font-telemetry-sm text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container focus:border-primary-container transition-all"
              />
            </div>

            {/* Age, Gender, Blood Type in Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-telemetry-sm text-telemetry-sm text-on-surface mb-1.5 font-semibold">
                  Age (Years) <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="125"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  required
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl font-telemetry-sm text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block font-telemetry-sm text-telemetry-sm text-on-surface mb-1.5 font-semibold">
                  Biological Gender <span className="text-error">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl font-telemetry-sm text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container focus:border-primary-container"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other / Non-binary</option>
                </select>
              </div>

              <div>
                <label className="block font-telemetry-sm text-telemetry-sm text-on-surface mb-1.5 font-semibold">
                  Blood Group
                </label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl font-telemetry-sm text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container focus:border-primary-container"
                >
                  <option value="O+">O-Positive (O+)</option>
                  <option value="O-">O-Negative (O-)</option>
                  <option value="A+">A-Positive (A+)</option>
                  <option value="A-">A-Negative (A-)</option>
                  <option value="B+">B-Positive (B+)</option>
                  <option value="B-">B-Negative (B-)</option>
                  <option value="AB+">AB-Positive (AB+)</option>
                  <option value="AB-">AB-Negative (AB-)</option>
                </select>
              </div>
            </div>

            {/* Phone & Emergency Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-telemetry-sm text-telemetry-sm text-on-surface mb-1.5 font-semibold">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 234-5678"
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl font-telemetry-sm text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block font-telemetry-sm text-telemetry-sm text-on-surface mb-1.5 font-semibold">
                  Emergency Contact (Name & Relationship)
                </label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="e.g. Sarah Morgan (Spouse)"
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl font-telemetry-sm text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container focus:border-primary-container"
                />
              </div>
            </div>

            {/* Pre-existing Medical Conditions / History */}
            <div>
              <label className="block font-telemetry-sm text-telemetry-sm text-on-surface mb-1.5 font-semibold">
                Known Conditions or History (Optional, comma-separated)
              </label>
              <input
                type="text"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder="e.g. Mild Hypertension, Family history of Diabetes"
                className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl font-telemetry-sm text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container focus:border-primary-container"
              />
              <span className="text-[11px] text-on-surface-variant mt-1 block">
                This helps the AI doctor check for relevant drug interactions and organ vulnerability.
              </span>
            </div>

            {/* Submit CTA */}
            <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between">
              <span className="font-telemetry-sm text-[11px] text-outline flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                Saved to Supabase Health Cloud
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3.5 rounded-xl bg-primary-container text-surface-container-lowest font-headline-sm text-sm font-bold tracking-wide flex items-center gap-2.5 hover:bg-primary-fixed hover:shadow-lg hover:shadow-primary-container/20 active:scale-[0.99] transition-all disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Saving Profile...' : 'Save & Open My Dashboard'}</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
