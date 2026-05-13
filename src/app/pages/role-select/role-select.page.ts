import { Component } from '@angular/core';
import { NavController, IonContent, IonIcon, IonCard, IonCardContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bedOutline, personOutline, storefrontOutline, chevronForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-role-select',
  templateUrl: './role-select.page.html',
  styleUrls: ['./role-select.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, IonCard, IonCardContent],
})
export class RoleSelectPage {

  constructor(private navCtrl: NavController) {
    addIcons({ bedOutline, personOutline, storefrontOutline, chevronForwardOutline });
  }

  selectRole(role: 'customer' | 'shop') {
    localStorage.setItem('selectedRole', role);
    this.navCtrl.navigateForward('/login');
  }
}
