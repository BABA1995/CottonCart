import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, DatePipe, TitleCasePipe } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonSpinner, IonCard, IonCardContent, IonChip, IonLabel,
  IonRefresher, IonRefresherContent,
  NavController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  receiptOutline, timeOutline, checkmarkCircleOutline, closeCircleOutline,
  cubeOutline, bicycleOutline, bedOutline, callOutline, locationOutline,
  personOutline, checkmarkDoneOutline, arrowForwardOutline
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { OrderService } from '../../../services/order.service';
import { OrderModel, OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../../models/order.model';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonButton, IonIcon, IonSpinner, IonCard, IonCardContent, IonChip, IonLabel,
    IonRefresher, IonRefresherContent,
    NgIf, NgFor, DatePipe, TitleCasePipe
  ],
})
export class OrdersPage implements OnInit, OnDestroy {

  allOrders:      OrderModel[] = [];
  filteredOrders: OrderModel[] = [];
  activeFilter    = 'all';
  loading         = true;
  updatingId: string | null = null;
  expandedId: string | null = null;
  currentShopId   = '';

  readonly filters = [
    { key: 'all',         label: 'All'         },
    { key: 'pending',     label: 'Pending'      },
    { key: 'confirmed',   label: 'Confirmed'    },
    { key: 'in_progress', label: 'Making'       },
    { key: 'ready',       label: 'Ready'        },
    { key: 'delivered',   label: 'Delivered'    },
  ];

  readonly statusLabels = ORDER_STATUS_LABELS;
  readonly statusColors = ORDER_STATUS_COLORS;

  private ordersSub?: Subscription;
  private userSub?:   Subscription;

  constructor(
    private authService: AuthService,
    private orderService: OrderService,
    private navCtrl: NavController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      receiptOutline, timeOutline, checkmarkCircleOutline, closeCircleOutline,
      cubeOutline, bicycleOutline, bedOutline, callOutline, locationOutline,
      personOutline, checkmarkDoneOutline, arrowForwardOutline
    });
  }

  ngOnInit() {
    this.userSub = this.authService.currentUser$.subscribe(u => {
      if (u) { this.currentShopId = u.uid; this.loadOrders(u.uid); }
    });
  }

  ngOnDestroy() {
    this.ordersSub?.unsubscribe();
    this.userSub?.unsubscribe();
  }

  loadOrders(shopId: string) {
    this.loading = true;
    this.ordersSub?.unsubscribe();
    this.ordersSub = this.orderService.getShopOrders(shopId).subscribe({
      next: orders => {
        // Sort client-side to avoid composite index requirement
        this.allOrders = [...orders].sort((a, b) => {
          const ta = (a.createdAt as any)?.seconds ?? 0;
          const tb = (b.createdAt as any)?.seconds ?? 0;
          return tb - ta;
        });
        this.applyFilter();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilter() {
    this.filteredOrders = this.activeFilter === 'all'
      ? this.allOrders
      : this.allOrders.filter(o => o.status === this.activeFilter);
  }

  setFilter(key: string) { this.activeFilter = key; this.applyFilter(); }

  toggleExpand(id: string) {
    this.expandedId = this.expandedId === id ? null : id;
  }

  countFor(key: string): number {
    return key === 'all'
      ? this.allOrders.length
      : this.allOrders.filter(o => o.status === key).length;
  }

  // ─── Status transitions ───────────────────────────────────────────────────

  nextStatus(current: OrderStatus): OrderStatus | null {
    const flow: Record<string, OrderStatus> = {
      pending:     'confirmed',
      confirmed:   'in_progress',
      in_progress: 'ready',
      ready:       'delivered'
    };
    return flow[current] ?? null;
  }

  nextLabel(current: OrderStatus): string {
    const labels: Record<string, string> = {
      pending:     'Confirm Order',
      confirmed:   'Start Making',
      in_progress: 'Mark Ready',
      ready:       'Mark Delivered'
    };
    return labels[current] ?? '';
  }

  async advanceStatus(order: OrderModel) {
    const next = this.nextStatus(order.status);
    if (!next) return;
    this.updatingId = order.id!;
    try {
      await this.orderService.updateOrderStatus(order.id!, next);
      this.showToast(`Order marked as "${this.statusLabels[next]}"`, 'success');
    } catch (e) {
      this.showToast('Update failed. Try again.', 'danger');
    } finally {
      this.updatingId = null;
    }
  }

  async cancelOrder(order: OrderModel) {
    this.updatingId = order.id!;
    try {
      await this.orderService.updateOrderStatus(order.id!, 'cancelled');
      this.showToast('Order cancelled', 'warning');
    } catch (e) {
      this.showToast('Update failed.', 'danger');
    } finally {
      this.updatingId = null;
    }
  }

  formatSize(order: OrderModel): string {
    if (order.size === 'Custom' && order.customLength) {
      return `Custom (${order.customLength}″×${order.customWidth}″×${order.customThickness}″)`;
    }
    return order.size;
  }

  doRefresh(event: any) {
    if (this.currentShopId) this.loadOrders(this.currentShopId);
    setTimeout(() => event.target.complete(), 1500);
  }

  async showToast(message: string, color = 'danger') {
    const t = await this.toastCtrl.create({ message, duration: 3000, position: 'bottom', color });
    t.present();
  }
}
