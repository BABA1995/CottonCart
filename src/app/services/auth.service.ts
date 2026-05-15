import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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

  // ─── Identifier helper ────────────────────────────────────────────────────

  /**
   * Converts a phone number or email into a Firebase-compatible email.
   * 10-digit phone  → 9876543210@cottoncart.app
   * Email as-is     → returned unchanged
   */
  resolveEmail(input: string): string {
    const digits = input.replace(/\D/g, '');
    if (digits.length === 10) {
      return `${digits}@cottoncart.app`;
    }
    return input.trim().toLowerCase();
  }

  // ─── Signup ───────────────────────────────────────────────────────────────

  /**
   * Creates a new account.
   * identifier = 10-digit phone OR email address
   */
  async signup(
    identifier: string,
    password:   string,
    name:       string,
    role:       'customer' | 'shop'
  ): Promise<UserModel> {
    const email  = this.resolveEmail(identifier);
    const phone  = identifier.replace(/\D/g, '').length === 10
                     ? identifier.replace(/\D/g, '') : '';

    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    const uid = credential.user.uid;

    const profile: UserModel = { uid, name, email, phone, role, createdAt: new Date() };
    await setDoc(doc(this.firestore, 'users', uid), profile);
    localStorage.setItem('selectedRole', role);
    return profile;
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  /**
   * Signs in an existing user.
   * identifier = 10-digit phone OR email address
   */
  async login(identifier: string, password: string): Promise<UserModel> {
    const email = this.resolveEmail(identifier);
    const credential = await signInWithEmailAndPassword(this.auth, email, password);
    const uid = credential.user.uid;

    const snap = await getDoc(doc(this.firestore, 'users', uid));
    const profile = snap.data() as UserModel;
    localStorage.setItem('selectedRole', profile.role);
    return profile;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  async getUserRole(uid: string): Promise<string> {
    const snap = await getDoc(doc(this.firestore, 'users', uid));
    return (snap.data() as UserModel)?.role ?? 'customer';
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    localStorage.clear();
  }
}
