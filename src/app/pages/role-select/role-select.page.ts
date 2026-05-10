import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bedOutline, personOutline, storefrontOutline, chevronForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-role-select',
  templateUrl: './role-select.page.html',
  styleUrls: ['./role-select.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon],
})
export class RoleSelectPage {

  constructor(private router: Router) {
    // Register all icons used in the template
    addIcons({ bedOutline, personOutline, storefrontOutline, chevronForwardOutline });
  }

  /**
   * Called when user taps a role card.
   * Saves the selected role to localStorage and navigates to Login.
   * @param role - 'customer' or 'shop'
   */
  selectRole(role: 'customer' | 'shop') {
    // Save role so Login/Signup pages know which flow to show
    localStorage.setItem('selectedRole', role);

    // Navigate to login page
    this.router.navigateByUrl('/login');
  }
}
