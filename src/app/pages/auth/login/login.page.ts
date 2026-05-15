import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonInput, IonButton, IonIcon, IonSpinner,
  ToastController, NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bedOutline, phonePortraitOutline, lockClosedOutline,
  eyeOutline, eyeOffOutline, arrowBackOutline
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

  identifier   = '';   // phone number or email
  password     = '';
  showPassword = false;
  loading      = false;
  role         = (localStorage.getItem('selectedRole') || 'customer') as 'customer' | 'shop';

  constructor(
    private authService: AuthService,
    private navCtrl:     NavController,
    private toastCtrl:   ToastController
  ) {
    addIcons({
      bedOutline, phonePortraitOutline, lockClosedOutline,
      eyeOutline, eyeOffOutline, arrowBackOutline
    });
  }

  /** True when user typed 10 digits — shows +91 prefix hint */
  get isPhone(): boolean {
    return /^\d{10}$/.test(this.identifier.replace(/\D/g, '')) &&
           this.identifier.replace(/\D/g, '').length === 10;
  }

  async login() {
    if (!this.identifier.trim()) {
      return this.showToast('Enter your phone number or email', 'warning');
    }
    if (!this.password) {
      return this.showToast('Enter your password', 'warning');
    }

    this.loading = true;
    try {
      const profile = await this.authService.login(this.identifier, this.password);
      if (profile.role === 'shop') {
        this.navCtrl.navigateRoot('/shop/dashboard');
      } else {
        this.navCtrl.navigateRoot('/customer');
      }
    } catch (e: any) {
      this.showToast(this.errorMessage(e.code), 'danger');
    } finally {
      this.loading = false;
    }
  }

  goToSignup() { this.navCtrl.navigateForward('/signup'); }
  goBack()     { this.navCtrl.navigateBack('/role-select'); }

  async showToast(message: string, color = 'danger') {
    const t = await this.toastCtrl.create({
      message, duration: 3000, position: 'bottom', color
    });
    t.present();
  }

  errorMessage(code: string): string {
    const map: Record<string, string> = {
      'auth/user-not-found'     : 'No account found. Please sign up first.',
      'auth/wrong-password'     : 'Incorrect password. Try again.',
      'auth/invalid-credential' : 'Wrong phone number / email or password.',
      'auth/too-many-requests'  : 'Too many attempts. Try again later.',
      'auth/invalid-email'      : 'Invalid phone number or email address.',
    };
    return map[code] ?? 'Login failed. Please try again.';
  }
}
