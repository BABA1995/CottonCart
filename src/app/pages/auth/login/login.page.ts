import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonInput, IonButton, IonIcon, IonSpinner,
  ToastController, NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bedOutline, phonePortraitOutline, keypadOutline,
  arrowBackOutline, checkmarkCircleOutline, refreshOutline
} from 'ionicons/icons';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonInput, IonButton, IonIcon, IonSpinner,
    NgIf, FormsModule
  ],
})
export class LoginPage {

  step: 1 | 2 = 1;      // 1 = enter phone  |  2 = enter OTP
  phone   = '';
  otp     = '';
  loading = false;
  role    = (localStorage.getItem('selectedRole') || 'customer') as 'customer' | 'shop';

  constructor(
    private authService: AuthService,
    private navCtrl:     NavController,
    private toastCtrl:   ToastController
  ) {
    addIcons({
      bedOutline, phonePortraitOutline, keypadOutline,
      arrowBackOutline, checkmarkCircleOutline, refreshOutline
    });
  }

  // ─── Step 1: Send OTP ────────────────────────────────────────────────────

  async sendOtp() {
    const digits = this.phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      return this.showToast('Enter a valid 10-digit mobile number', 'warning');
    }

    this.loading = true;
    try {
      await this.authService.sendOtp(`+91${digits}`);
      this.step = 2;
      this.showToast('OTP sent ✅', 'success');
    } catch (e: any) {
      console.error(e);
      this.showToast(this.errorMessage(e.code), 'danger');
    } finally {
      this.loading = false;
    }
  }

  // ─── Step 2: Verify OTP ──────────────────────────────────────────────────

  async verifyOtp() {
    const code = this.otp.replace(/\D/g, '');
    if (code.length !== 6) {
      return this.showToast('Enter the 6-digit OTP', 'warning');
    }

    this.loading = true;
    try {
      const profile = await this.authService.verifyOtp(code, this.role);
      if (profile.role === 'shop') {
        this.navCtrl.navigateRoot('/shop/dashboard');
      } else {
        this.navCtrl.navigateRoot('/customer');
      }
    } catch (e: any) {
      console.error(e);
      this.showToast(this.errorMessage(e.code), 'danger');
    } finally {
      this.loading = false;
    }
  }

  // ─── Navigation ──────────────────────────────────────────────────────────

  changeNumber() {
    this.step  = 1;
    this.otp   = '';
  }

  goBack() { this.navCtrl.navigateBack('/role-select'); }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  async showToast(message: string, color = 'danger') {
    const t = await this.toastCtrl.create({
      message, duration: 3000, position: 'bottom', color
    });
    t.present();
  }

  errorMessage(code: string): string {
    const map: Record<string, string> = {
      'auth/invalid-phone-number'      : 'Invalid phone number. Use a 10-digit Indian mobile number.',
      'auth/too-many-requests'         : 'Too many attempts. Please try again after some time.',
      'auth/invalid-verification-code' : 'Wrong OTP. Please check and try again.',
      'auth/code-expired'              : 'OTP expired. Tap "Change Number" to request a new one.',
      'auth/quota-exceeded'            : 'SMS quota exceeded. Try again later.',
    };
    return map[code] ?? 'Something went wrong. Please try again.';
  }
}
