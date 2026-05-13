import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonButton, IonIcon, IonSpinner, IonCard, IonCardContent,
  IonItem, IonInput, IonLabel,
  NavController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  storefrontOutline, receiptOutline, checkmarkCircleOutline,
  timeOutline, bicycleOutline, logOutOutline, listOutline,
  locationOutline, callOutline, pricetagOutline, addCircleOutline,
  personOutline, cubeOutline, bedOutline, sparklesOutline,
  leafOutline, cogOutline
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { ShopService } from '../../../services/shop.service';
import { OrderService } from '../../../services/order.service';
import { ShopModel } from '../../../models/shop.model';
import { OrderModel, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../../models/order.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonButton, IonIcon, IonSpinner, IonCard, IonCardContent,
    IonItem, IonInput, IonLabel,
    NgIf, NgFor, FormsModule, DecimalPipe
  ],
})
export class DashboardPage implements OnInit, OnDestroy {

  // ─── State ────────────────────────────────────────────────────────────────
  myShop:      ShopModel | null = null;
  recentOrders: OrderModel[]   = [];
  loadingShop  = true;
  settingUp    = false;
  currentUid   = '';
  ownerName    = '';

  // ─── Setup form ───────────────────────────────────────────────────────────
  form = {
    name:     '',
    phone:    '',
    address:  '',
    city:     '',
    state:    '',
    pincode:  '',
    minPrice: '',
    maxPrice: '',
    tags:     [] as string[],
    lat:      0,
    lng:      0
  };

  readonly tagOptions = [
    { key: 'spring', label: 'Spring',  icon: 'sparkles-outline' },
    { key: 'foam',   label: 'Foam',    icon: 'leaf-outline'     },
    { key: 'coir',   label: 'Coir',    icon: 'bed-outline'      },
    { key: 'custom', label: 'Custom',  icon: 'cog-outline'      },
  ];

  readonly statusLabels = ORDER_STATUS_LABELS;
  readonly statusColors = ORDER_STATUS_COLORS;

  private shopSub?:   Subscription;
  private ordersSub?: Subscription;
  private userSub?:   Subscription;

  constructor(
    private authService: AuthService,
    private shopService: ShopService,
    private orderService: OrderService,
    private navCtrl: NavController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      storefrontOutline, receiptOutline, checkmarkCircleOutline,
      timeOutline, bicycleOutline, logOutOutline, listOutline,
      locationOutline, callOutline, pricetagOutline, addCircleOutline,
      personOutline, cubeOutline, bedOutline, sparklesOutline,
      leafOutline, cogOutline
    });
  }

  ngOnInit() {
    this.userSub = this.authService.currentUser$.subscribe(u => {
      if (u) {
        this.currentUid = u.uid;
        this.ownerName  = u.displayName || u.email?.split('@')[0] || 'Owner';
        this.loadShop(u.uid);
      }
    });
  }

  ngOnDestroy() {
    this.shopSub?.unsubscribe();
    this.ordersSub?.unsubscribe();
    this.userSub?.unsubscribe();
  }

  // ─── Load Shop ────────────────────────────────────────────────────────────

  loadShop(uid: string) {
    this.shopSub = this.shopService.getMyShop(uid).subscribe({
      next: shop => {
        this.myShop     = shop || null;
        this.loadingShop = false;
        if (shop?.uid) this.loadRecentOrders(shop.uid);
      },
      error: () => { this.loadingShop = false; }
    });
  }

  loadRecentOrders(shopId: string) {
    this.ordersSub?.unsubscribe();
    this.ordersSub = this.orderService.getShopOrders(shopId).subscribe({
      next: orders => { this.recentOrders = orders.slice(0, 5); }
    });
  }

  // ─── Tag Toggle ───────────────────────────────────────────────────────────

  toggleTag(key: string) {
    const i = this.form.tags.indexOf(key);
    if (i === -1) this.form.tags.push(key);
    else           this.form.tags.splice(i, 1);
  }

  isTagSelected(key: string) { return this.form.tags.includes(key); }

  // ─── Get GPS ──────────────────────────────────────────────────────────────

  getLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      this.form.lat = pos.coords.latitude;
      this.form.lng = pos.coords.longitude;
      this.showToast('Location detected ✅', 'success');
    }, () => {
      this.showToast('Could not detect location. Enter coordinates manually.', 'warning');
    });
  }

  // ─── Setup Shop ───────────────────────────────────────────────────────────

  async submitSetup() {
    const f = this.form;
    if (!f.name.trim())    return this.showToast('Enter shop name', 'warning');
    if (!f.phone.trim())   return this.showToast('Enter phone number', 'warning');
    if (!f.address.trim()) return this.showToast('Enter address', 'warning');
    if (!f.city.trim())    return this.showToast('Enter city', 'warning');
    if (!f.state.trim())   return this.showToast('Enter state', 'warning');
    if (!f.pincode.trim()) return this.showToast('Enter pincode', 'warning');
    if (f.tags.length === 0) return this.showToast('Select at least one mattress type', 'warning');

    this.settingUp = true;
    try {
      await this.shopService.setupShop(this.currentUid, {
        name:      f.name.trim(),
        ownerName: this.ownerName,
        phone:     f.phone.trim(),
        email:     '',
        address:   f.address.trim(),
        city:      f.city.trim(),
        state:     f.state.trim(),
        pincode:   f.pincode.trim(),
        lat:       f.lat || 0,
        lng:       f.lng || 0,
        tags:      f.tags,
        minPrice:  +f.minPrice || 0,
        maxPrice:  +f.maxPrice || 0,
      } as any);
      this.showToast('Shop created successfully! 🎉', 'success');
    } catch (e) {
      console.error(e);
      this.showToast('Failed to create shop. Try again.', 'danger');
    } finally {
      this.settingUp = false;
    }
  }

  // ─── Stats ────────────────────────────────────────────────────────────────

  get totalOrders()    { return this.recentOrders.length; }
  get pendingOrders()  { return this.recentOrders.filter(o => o.status === 'pending').length; }
  get deliveredOrders(){ return this.recentOrders.filter(o => o.status === 'delivered').length; }

  // ─── Navigation ───────────────────────────────────────────────────────────

  goToOrders()  { this.navCtrl.navigateForward('/shop/orders'); }
  goToCatalog() { this.navCtrl.navigateForward('/shop/catalog'); }
  goToProfile() { this.navCtrl.navigateForward('/shop/profile'); }

  async logout() {
    await this.authService.logout();
    this.navCtrl.navigateRoot('/role-select');
  }

  async showToast(message: string, color = 'danger') {
    const t = await this.toastCtrl.create({ message, duration: 3000, position: 'bottom', color });
    t.present();
  }
}
