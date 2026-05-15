import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonInput, IonButton, IonIcon, IonSpinner,
  ToastController, NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bedOutline, personOutline, phonePortraitOutline,
  lockClosedOutline, eyeOutline, eyeOffOutline, arrowBackOutline
} from 'ionicons/icons';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonInput, IonButton, IonIcon, IonSpinner,
    NgIf, FormsModule
  ],
})
export class SignupPage {

  name            = '';
  phone           = '';   // 10-digit — becomes their login username
  password        = '';
  confirmPassword = '';
  showPassword    = false;
  loading         = false;
  role = (localStorage.getItem('selectedRole') || 'customer') as 'customer' | 'shop';

  constructor(
    private authService: AuthService,
    private navCtrl:     NavController,
    private toastCtrl:   ToastController
  ) {
    addIcons({
      bedOutline, personOutline, phonePortraitOutline,
      lockClosedOutline, eyeOutline, eyeOffOutline, arrowBackOutline
    });
  }

  async signup() {
    if (!this.name.trim())          return this.showToast('Enter your full name', 'warning');
    if (this.phone.replace(/\D/g,'').length !== 10)
                                    return this.showToast('Enter a valid 10-digit mobile number', 'warning');
    if (this.password.length < 6)   return this.showToast('Password must be at least 6 characters', 'warning');
    if (this.password !== this.confirmPassword)
                                    return this.showToast('Passwords do not match', 'warning');

    this.loading = true;
    try {
      const profile = await this.authService.signup(
        this.phone.replace(/\D/g,''),
        this.password,
        this.name.trim(),
        this.role
      );
      this.showToast('Account created! Welcome 🎉', 'success');
      setTimeout(() => {
        if (profile.role === 'shop') this.navCtrl.navigateRoot('/shop/dashboard');
        else                         this.navCtrl.navigateRoot('/customer');
      }, 800);
    } catch (e: any) {
      this.showToast(this.errorMessage(e.code), 'danger');
    } finally {
      this.loading = false;
    }
  }

  goToLogin() { this.navCtrl.navigateBack('/login'); }
  goBack()    { this.navCtrl.navigateBack('/role-select'); }

  async showToast(message: string, color = 'danger') {
    const t = await this.toastCtrl.create({
      message, duration: 3000, position: 'bottom', color
    });
    t.present();
  }

  errorMessage(code: string): string {
    const map: Record<string, string> = {
      'auth/email-already-in-use': 'This phone number is already registered. Please login.',
      'auth/weak-password'        : 'Password is too weak. Use at least 6 characters.',
    };
    return map[code] ?? 'Signup failed. Please try again.';
  }
}
