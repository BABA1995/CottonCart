import { Component, OnInit } from '@angular/core';
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

  constructor(private router: Router) {
    // Register the bed icon for use in the template
    addIcons({ bedOutline });
  }

  ngOnInit() {
    // Wait 2.5 seconds then navigate to role selection screen
    setTimeout(() => {
      this.router.navigateByUrl('/role-select', { replaceUrl: true });
    }, 2500);
  }
}
