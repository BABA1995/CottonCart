import { Component, OnInit } from '@angular/core';
import { IonContent, IonIcon, IonSpinner, NavController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bedOutline } from 'ionicons/icons';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, IonSpinner],
})
export class SplashPage implements OnInit {

  constructor(private navCtrl: NavController) {
    addIcons({ bedOutline });
  }

  ngOnInit() {
    setTimeout(() => {
      this.navCtrl.navigateRoot('/role-select');
    }, 2500);
  }
}
