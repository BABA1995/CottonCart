import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonItem, IonInput, IonButton,
  IonIcon, IonSpinner, ToastController, NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bedOutline, personOutline, callOutline, mailOutline,
  lockClosedOutline, eyeOutline, eyeOffOutline,
  shieldCheckmarkOutline, arrowBackOutline
} from 'ionicons/icons';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonItem, IonInput, IonButton,
    IonIcon, IonSpinner, NgIf, FormsModule
  ],
})
export class SignupPage {
  name            = '';
  phone           = '';
  email           = '';
  password        = '';
  confirmPassword = '';
  showPassword    = false;
  loading         = false;
  role            = (localStorage.getItem('selectedRole') || 'customer') as 'customer' | 'shop';

  constructor(
    private authService: AuthService,
    private navCtrl: NavController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      bedOutline, personOutline, callOutline, mailOutline,
      lockClosedOutline, eyeOutline, eyeOffOutline,
      shieldCheckmarkOutline, arrowBackOutline
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async signup() {
    if (!this.name || !this.phone || !this.email || !this.password) {
      return this.showToast('Please fill in all fields', 'warning');
    }
    if (this.phone.length !== 10) {
      return this.showToast('Enter a valid 10-digit phone number', 'warning');
    }
    if (this.password.length < 6) {
      return this.showToast('Password must be at least 6 characters', 'warning');
    }
    if (this.password !== this.confirmPassword) {
      return this.showToast('Passwords do not match', 'warning');
    }

    this.loading = true;
    try {
      const user = await this.authService.signup(
        this.email, this.password, this.name, this.phone, this.role
      );
      this.showToast('Account created successfully! 🎉', 'success');
      if (user.role === 'shop') {
        this.navCtrl.navigateRoot('/shop/dashboard');
      } else {
        this.navCtrl.navigateRoot('/customer');
      }
    } catch (err: any) {
      this.showToast(this.getErrorMessage(err.code), 'danger');
    } finally {
      this.loading = false;
    }
  }

  goToLogin() {
    this.navCtrl.navigateBack('/login');
  }

  goBack() {
    this.navCtrl.navigateBack('/role-select');
  }

  async showToast(message: string, color: string = 'danger') {
    const toast = await this.toastCtrl.create({
      message, duration: 3000, position: 'bottom', color
    });
    toast.present();
  }

  getErrorMessage(code: string): string {
    const errors: Record<string, string> = {
      'auth/email-already-in-use': 'An account with this email already exists',
      'auth/invalid-email'       : 'Invalid email address',
      'auth/weak-password'       : 'Password too weak. Use at least 6 characters'
    };
    return errors[code] || 'Signup failed. Please try again.';
  }
}
