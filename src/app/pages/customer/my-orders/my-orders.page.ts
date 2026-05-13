import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, DatePipe, TitleCasePipe } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonSpinner,
  IonRefresher, IonRefresherContent,
  IonBadge, IonCard, IonCardContent,
  NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  receiptOutline, timeOutline, checkmarkCircleOutline,
  closeCircleOutline, cubeOutline, bicycleOutline,
  storefrontOutline, chevronForwardOutline, chevronUpOutline,
  bedOutline, callOutline, locationOutline, arrowBackOutline
} from 'ionicons/icons';

import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { OrderService } from '../../../services/order.service';
import { OrderModel, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../../models/order.model';

@Component({
  selector: 'app-my-orders',
  templateUrl: './my-orders.page.html',
  styleUrls: ['./my-orders.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonButton, IonIcon, IonSpinner,
    IonRefresher, IonRefresherContent,
    IonBadge, IonCard, IonCardContent,
    NgIf, NgFor, DatePipe, TitleCasePipe
  ],
})
export class MyOrdersPage implements OnInit, OnDestroy {

  orders: OrderModel[] = [];
  loading              = true;
  expandedId: string | null = null;   // which order card is expanded

  readonly statusLabels = ORDER_STATUS_LABELS;
  readonly statusColors = ORDER_STATUS_COLORS;

  private ordersSub?: Subscription;
  private userSub?:   Subscription;

  constructor(
    private authService: AuthService,
    private orderService: OrderService,
    private navCtrl: NavController
  ) {
    addIcons({
      receiptOutline, timeOutline, checkmarkCircleOutline,
      closeCircleOutline, cubeOutline, bicycleOutline,
      storefrontOutline, chevronForwardOutline, chevronUpOutline,
      bedOutline, callOutline, locationOutline, arrowBackOutline
    });
  }

  ngOnInit() {
    this.userSub = this.authService.currentUser$.subscribe(u => {
      if (u) this.loadOrders(u.uid);
    });
  }

  ngOnDestroy() {
    this.ordersSub?.unsubscribe();
    this.userSub?.unsubscribe();
  }

  loadOrders(uid: string) {
    this.loading = true;
    this.ordersSub?.unsubscribe();
    this.ordersSub = this.orderService.getCustomerOrders(uid).subscribe({
      next: orders => {
        this.orders  = orders;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  toggleExpand(orderId: string) {
    this.expandedId = this.expandedId === orderId ? null : orderId;
  }

  doRefresh(event: any) {
    this.userSub = this.authService.currentUser$.subscribe(u => {
      if (u) this.loadOrders(u.uid);
    });
    setTimeout(() => event.target.complete(), 1500);
  }

  goBack()     { this.navCtrl.navigateBack('/customer'); }
  goToHome()   { this.navCtrl.navigateRoot('/customer'); }

  // Status step index for progress bar (0–5)
  statusStep(status: string): number {
    const steps = ['pending', 'confirmed', 'in_progress', 'ready', 'delivered'];
    return steps.indexOf(status);
  }

  statusIcon(status: string): string {
    const map: Record<string, string> = {
      pending:     'time-outline',
      confirmed:   'checkmark-circle-outline',
      in_progress: 'cube-outline',
      ready:       'bicycle-outline',
      delivered:   'checkmark-circle-outline',
      cancelled:   'close-circle-outline'
    };
    return map[status] || 'time-outline';
  }

  formatSize(order: OrderModel): string {
    if (order.size === 'Custom' && order.customLength) {
      return `Custom (${order.customLength}″ × ${order.customWidth}″ × ${order.customThickness}″)`;
    }
    return order.size;
  }
}
