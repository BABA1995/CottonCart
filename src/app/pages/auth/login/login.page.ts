import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonItem, IonInput, IonButton, IonIcon, IonSpinner,
  ToastController, NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bedOutline, mailOutline, lockClosedOutline,
  eyeOutline, eyeOffOutline, arrowBackOutline
} from 'ionicons/icons';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonItem, IonInput, IonButton, IonIcon, IonSpinner,
    NgIf, FormsModule
  ],
})
export class LoginPage {
  email        = '';
  password     = '';
  showPassword = false;
  loading      = false;
  role         = localStorage.getItem('selectedRole') || 'customer';

  constructor(
    private authService: AuthService,
    private navCtrl: NavController,
    private toastCtrl: ToastController
  ) {
    addIcons({ bedOutline, mailOutline, lockClosedOutline,
               eyeOutline, eyeOffOutline, arrowBackOutline });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async login() {
    if (!this.email || !this.password) {
      return this.showToast('Please enter email and password', 'warning');
    }
    this.loading = true;
    try {
      const user = await this.authService.login(this.email, this.password);
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

  goToSignup() {
    this.navCtrl.navigateForward('/signup');
  }

  goBack() {
    this.navCtrl.navigateBack('/role-select');
  }

  async forgotPassword() {
    this.showToast('Password reset — coming soon!', 'primary');
  }

  async showToast(message: string, color: string = 'danger') {
    const toast = await this.toastCtrl.create({
      message, duration: 3000, position: 'bottom', color
    });
    toast.present();
  }

  getErrorMessage(code: string): string {
    const errors: Record<string, string> = {
      'auth/user-not-found'    : 'No account found with this email',
      'auth/wrong-password'    : 'Incorrect password. Try again',
      'auth/invalid-email'     : 'Invalid email address',
      'auth/invalid-credential': 'Invalid email or password',
      'auth/too-many-requests' : 'Too many attempts. Please try later'
    };
    return errors[code] || 'Login failed. Please try again.';
  }
}
