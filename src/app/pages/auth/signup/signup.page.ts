import { Component, OnInit } from '@angular/core';
import { IonContent, NavController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-signup',
  template: `<ion-content></ion-content>`,
  standalone: true,
  imports: [IonContent],
})
export class SignupPage implements OnInit {
  constructor(private navCtrl: NavController) {}
  ngOnInit() { this.navCtrl.navigateRoot('/login'); }
}
