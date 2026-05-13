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
  private auth     = inject(Auth);
  private firestore = inject(Firestore);

  // Observable stream of current logged-in Firebase user
  currentUser$ = user(this.auth);

  /**
   * SIGNUP
   * Creates a Firebase Auth account then saves user profile to Firestore
   */
  async signup(
    email: string,
    password: string,
    name: string,
    phone: string,
    role: 'customer' | 'shop'
  ): Promise<UserModel> {
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    const uid = credential.user.uid;

    const userProfile: UserModel = {
      uid,
      name,
      email,
      phone,
      role,
      createdAt: new Date()
    };

    // Save user profile to Firestore 'users' collection
    await setDoc(doc(this.firestore, 'users', uid), userProfile);
    localStorage.setItem('selectedRole', role);
    return userProfile;
  }

  /**
   * LOGIN
   * Signs in via Firebase Auth then fetches user profile from Firestore
   */
  async login(email: string, password: string): Promise<UserModel> {
    const credential = await signInWithEmailAndPassword(this.auth, email, password);
    const uid = credential.user.uid;

    // Fetch profile from Firestore to get the role
    const userDoc = await getDoc(doc(this.firestore, 'users', uid));
    const userProfile = userDoc.data() as UserModel;
    localStorage.setItem('selectedRole', userProfile.role);
    return userProfile;
  }

  /**
   * LOGOUT
   * Signs out from Firebase and clears local storage
   */
  async logout(): Promise<void> {
    await signOut(this.auth);
    localStorage.clear();
  }

  /**
   * Get user role from Firestore by uid
   */
  async getUserRole(uid: string): Promise<string> {
    const userDoc = await getDoc(doc(this.firestore, 'users', uid));
    const data = userDoc.data() as UserModel;
    return data?.role || 'customer';
  }
}
