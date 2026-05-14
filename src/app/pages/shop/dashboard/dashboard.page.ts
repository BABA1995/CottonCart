import { Component, OnInit, OnDestroy, AfterViewChecked } from '@angular/core';
import * as L from 'leaflet';
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
  locationOutline, locateOutline, callOutline, pricetagOutline, addCircleOutline,
  personOutline, cubeOutline, bedOutline, sparklesOutline,
  leafOutline, cogOutline, flowerOutline
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
export class DashboardPage implements OnInit, OnDestroy, AfterViewChecked {

  // ─── State ────────────────────────────────────────────────────────────────
  myShop:      ShopModel | null = null;
  recentOrders: OrderModel[]   = [];
  loadingShop  = true;
  settingUp    = false;
  currentUid   = '';
  ownerName    = '';

  // ─── Location map ─────────────────────────────────────────────────────────
  private locationMap:    L.Map | null    = null;
  private locationMarker: L.Marker | null = null;
  private mapInitialised  = false;

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
    { key: 'cotton', label: 'Cotton',  icon: 'flower-outline'   },
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
      locationOutline, locateOutline, callOutline, pricetagOutline, addCircleOutline,
      personOutline, cubeOutline, bedOutline, sparklesOutline,
      leafOutline, cogOutline, flowerOutline
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
    this.locationMap?.remove();
    this.locationMap    = null;
    this.locationMarker = null;
    this.mapInitialised = false;
  }

  /** Init the location-picker map once the setup form is visible in DOM */
  ngAfterViewChecked() {
    if (!this.myShop && !this.loadingShop && !this.mapInitialised) {
      const el = document.getElementById('location-picker-map');
      if (el) { this.initLocationMap(); }
    }
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

  // ─── Location Picker Map ──────────────────────────────────────────────────

  private initLocationMap() {
    this.mapInitialised = true;

    // Default centre: middle of India
    const defaultLat = this.form.lat || 20.5937;
    const defaultLng = this.form.lng || 78.9629;
    const zoom       = this.form.lat ? 15 : 5;

    this.locationMap = L.map('location-picker-map', { zoomControl: true })
      .setView([defaultLat, defaultLng], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.locationMap);

    // Draggable marker
    const icon = L.divIcon({
      className: '',
      html: `<div class="shop-setup-pin">🏪</div>`,
      iconSize:   [36, 36],
      iconAnchor: [18, 36]
    });

    this.locationMarker = L.marker([defaultLat, defaultLng], {
      draggable: true,
      icon
    }).addTo(this.locationMap!);

    this.locationMarker.bindPopup('📍 Drag me to your exact shop location').openPopup();

    // Update lat/lng on drag end
    this.locationMarker.on('dragend', () => {
      const pos = this.locationMarker!.getLatLng();
      this.form.lat = +pos.lat.toFixed(6);
      this.form.lng = +pos.lng.toFixed(6);
    });

    // Also allow clicking the map to move marker
    this.locationMap.on('click', (e: L.LeafletMouseEvent) => {
      this.locationMarker!.setLatLng(e.latlng);
      this.form.lat = +e.latlng.lat.toFixed(6);
      this.form.lng = +e.latlng.lng.toFixed(6);
    });
  }

  detectLocation(): void {
    if (!navigator.geolocation) {
      this.showToast('GPS not supported on this device', 'warning');
      return;
    }
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      this.form.lat = +lat.toFixed(6);
      this.form.lng = +lng.toFixed(6);

      if (this.locationMap && this.locationMarker) {
        this.locationMap.setView([lat, lng], 16);
        this.locationMarker.setLatLng([lat, lng]);
        this.locationMarker.openPopup();
      }
      this.showToast('Location detected — drag the pin to fine-tune ✅', 'success');
    }, () => {
      this.showToast('Could not detect GPS. Drag the pin on the map manually.', 'warning');
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
