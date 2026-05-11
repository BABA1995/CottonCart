import { Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
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

  constructor(private router: Router, private ngZone: NgZone) {
    addIcons({ bedOutline });
  }

  ngOnInit() {
    setTimeout(() => {
      // NgZone ensures navigation runs inside Angular's change detection on mobile
      this.ngZone.run(() => {
        this.router.navigate(['/role-select'], { replaceUrl: true });
      });
    }, 2500);
  }
}
