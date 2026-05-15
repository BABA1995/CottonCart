import { Injectable, inject } from '@angular/core';
import {
  Auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  signOut,
  user
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc
} from '@angular/fire/firestore';
import { UserModel } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth      = inject(Auth);
  private firestore = inject(Firestore);

  /** Observable of the currently signed-in Firebase user */
  currentUser$ = user(this.auth);

  private recaptchaVerifier:  RecaptchaVerifier  | null = null;
  private confirmationResult: ConfirmationResult | null = null;

  // ─── Phone OTP Auth ───────────────────────────────────────────────────────

  /**
   * Step 1 — Send OTP.
   * Attaches an invisible reCAPTCHA to `containerId` and sends SMS to phoneE164.
   * phoneE164 must be in E.164 format e.g. +919876543210
   */
  async sendOtp(phoneE164: string, containerId = 'recaptcha-container'): Promise<void> {
    // Always recreate verifier to avoid stale state
    try { this.recaptchaVerifier?.clear(); } catch { /* ignore */ }

    this.recaptchaVerifier = new RecaptchaVerifier(this.auth, containerId, {
      size: 'invisible',
      callback: () => { /* reCAPTCHA passed automatically */ }
    });

    this.confirmationResult = await signInWithPhoneNumber(
      this.auth, phoneE164, this.recaptchaVerifier
    );
  }

  /**
   * Step 2 — Verify OTP.
   * Confirms the code the user entered. Creates a Firestore user profile if new.
   */
  async verifyOtp(otp: string, role: 'customer' | 'shop'): Promise<UserModel> {
    if (!this.confirmationResult) throw new Error('No OTP pending. Call sendOtp first.');
    const credential = await this.confirmationResult.confirm(otp);
    const uid   = credential.user.uid;
    const phone = credential.user.phoneNumber ?? '';
    return this.saveUserIfNew(uid, phone, role);
  }

  /** Creates user profile in Firestore on first login; returns existing profile otherwise. */
  private async saveUserIfNew(
    uid: string, phone: string, role: 'customer' | 'shop'
  ): Promise<UserModel> {
    const ref  = doc(this.firestore, 'users', uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const profile = snap.data() as UserModel;
      localStorage.setItem('selectedRole', profile.role);
      return profile;
    }

    const profile: UserModel = {
      uid, name: '', email: '', phone, role, createdAt: new Date()
    };
    await setDoc(ref, profile);
    localStorage.setItem('selectedRole', role);
    return profile;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  async getUserRole(uid: string): Promise<string> {
    const snap = await getDoc(doc(this.firestore, 'users', uid));
    return (snap.data() as UserModel)?.role ?? 'customer';
  }

  async logout(): Promise<void> {
    try { this.recaptchaVerifier?.clear(); } catch { /* ignore */ }
    await signOut(this.auth);
    localStorage.clear();
  }
}
