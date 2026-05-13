import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonButton,
  IonIcon, IonSpinner, IonSearchbar,
  IonRefresher, IonRefresherContent,
  IonChip, IonLabel,
  IonCard, IonCardContent,
  IonSegment, IonSegmentButton,
  NavController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  locationOutline, starOutline, star,
  navigateOutline, logOutOutline, personCircleOutline,
  bedOutline, chevronForwardOutline, storefrontOutline,
  searchOutline, listOutline, receiptOutline, mapOutline
} from 'ionicons/icons';
import * as L from 'leaflet';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { ShopService } from '../../../services/shop.service';
import { ShopModel } from '../../../models/shop.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonButtons, IonButton,
    IonIcon, IonSpinner, IonSearchbar,
    IonRefresher, IonRefresherContent,
    IonChip, IonLabel,
    IonCard, IonCardContent,
    IonSegment, IonSegmentButton,
    NgIf, NgFor, DecimalPipe, FormsModule
  ],
})
export class HomePage implements OnInit, OnDestroy {

  allShops: ShopModel[]      = [];
  filteredShops: ShopModel[] = [];
  searchQuery                = '';
  selectedCategory           = 'all';
  loadingShops               = true;
  loadingLocation            = true;
  cityName                   = 'Detecting...';
  userName                   = '';
  userLat: number | null     = null;
  userLng: number | null     = null;
  viewMode                   = 'list';   // 'list' | 'map'

  readonly categories = [
    { key: 'all',    label: 'All Types' },
    { key: 'spring', label: 'Spring'    },
    { key: 'foam',   label: 'Foam'      },
    { key: 'coir',   label: 'Coir'      },
    { key: 'custom', label: 'Custom'    },
  ];

  private map: L.Map | null  = null;
  private shopsSub?: Subscription;
  private userSub?: Subscription;

  constructor(
    private authService: AuthService,
    private shopService: ShopService,
    private navCtrl: NavController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      locationOutline, starOutline, star,
      navigateOutline, logOutOutline, personCircleOutline,
      bedOutline, chevronForwardOutline, storefrontOutline,
      searchOutline, listOutline, receiptOutline, mapOutline
    });
  }

  ngOnInit() {
    this.loadUserName();
    this.detectLocation();
    this.loadShops();
  }

  ngOnDestroy() {
    this.map?.remove();
    this.shopsSub?.unsubscribe();
    this.userSub?.unsubscribe();
  }

  // ─── User ─────────────────────────────────────────────────────────────────

  loadUserName() {
    this.userSub = this.authService.currentUser$.subscribe(u => {
      if (u) {
        this.userName = u.displayName || u.email?.split('@')[0] || 'User';
      }
    });
  }

  // ─── Location ─────────────────────────────────────────────────────────────

  detectLocation() {
    this.loadingLocation = true;
    if (!navigator.geolocation) {
      this.cityName        = 'Location unavailable';
      this.loadingLocation = false;
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        this.userLat = pos.coords.latitude;
        this.userLng = pos.coords.longitude;
        await this.reverseGeocode(this.userLat, this.userLng);
        this.loadingLocation = false;
        this.loadShops();
      },
      () => {
        this.cityName        = 'Set location';
        this.loadingLocation = false;
      },
      { timeout: 8000 }
    );
  }

  async reverseGeocode(lat: number, lng: number) {
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      this.cityName =
        data.address?.city    ||
        data.address?.town    ||
        data.address?.village ||
        data.address?.county  ||
        'Your Location';
    } catch {
      this.cityName = 'Your Location';
    }
  }

  // ─── Shops ────────────────────────────────────────────────────────────────

  loadShops() {
    this.loadingShops = true;
    this.shopsSub?.unsubscribe();

    const src$ =
      this.userLat !== null && this.userLng !== null
        ? this.shopService.getNearbyShops(this.userLat, this.userLng, 50)
        : this.shopService.getActiveShops();

    this.shopsSub = src$.subscribe({
      next: shops => {
        this.allShops     = shops;
        this.applyFilter();
        this.loadingShops = false;
        // Refresh map pins if map is visible
        if (this.viewMode === 'map' && this.map) {
          this.refreshMapMarkers();
        }
      },
      error: () => {
        this.loadingShops = false;
        this.showToast('Could not load shops. Check your connection.', 'warning');
      }
    });
  }

  applyFilter() {
    let shops = [...this.allShops];
    if (this.selectedCategory !== 'all') {
      shops = shops.filter(s =>
        s.tags?.some(t => t.toLowerCase() === this.selectedCategory)
      );
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      shops = shops.filter(s =>
        s.name.toLowerCase().includes(q)  ||
        s.city?.toLowerCase().includes(q) ||
        s.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    this.filteredShops = shops;
  }

  onSearch()               { this.applyFilter(); }
  selectCategory(k: string){ this.selectedCategory = k; this.applyFilter(); }

  // ─── View Toggle (List / Map) ─────────────────────────────────────────────

  onViewChange(event: any) {
    this.viewMode = event.detail.value;
    if (this.viewMode === 'map') {
      // Give DOM time to render the map container
      setTimeout(() => this.initMap(), 150);
    }
  }

  // ─── Leaflet Map ──────────────────────────────────────────────────────────

  initMap() {
    const container = document.getElementById('map-container');
    if (!container) return;

    // If already initialized, just refresh size and markers
    if (this.map) {
      this.map.invalidateSize();
      this.refreshMapMarkers();
      return;
    }

    const center: L.LatLngTuple =
      this.userLat !== null && this.userLng !== null
        ? [this.userLat, this.userLng]
        : [20.5937, 78.9629]; // Centre of India fallback

    this.map = L.map('map-container', { zoomControl: true }).setView(center, 12);

    // OpenStreetMap tiles — free, no API key
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(this.map);

    // Blue pulsing dot for user's location
    if (this.userLat !== null && this.userLng !== null) {
      L.marker([this.userLat, this.userLng], {
        icon: L.divIcon({
          className: '',
          html: '<div class="user-location-marker"></div>',
          iconSize:   [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(this.map).bindPopup('<b>You are here</b>');
    }

    this.refreshMapMarkers();
  }

  refreshMapMarkers() {
    if (!this.map) return;

    // Remove old shop layers (keep tile + user marker)
    this.map.eachLayer(layer => {
      if ((layer as any)._isShopMarker) {
        this.map!.removeLayer(layer);
      }
    });

    this.filteredShops.forEach(shop => {
      if (!shop.lat || !shop.lng) return;

      const initials = this.getInitials(shop.name);

      const marker = L.marker([shop.lat, shop.lng], {
        icon: L.divIcon({
          className: '',
          html: `
            <div class="shop-map-pin">
              <span>${initials}</span>
            </div>
            <div class="shop-map-label">${shop.name}</div>
          `,
          iconSize:   [48, 60],
          iconAnchor: [24, 60]
        })
      });

      (marker as any)._isShopMarker = true;

      marker.bindPopup(`
        <div class="map-popup">
          <strong>${shop.name}</strong><br>
          ${shop.address}, ${shop.city}<br>
          ${shop.rating ? '⭐ ' + shop.rating : ''}
          ${shop.minPrice ? ' · From ₹' + shop.minPrice : ''}
        </div>
      `);

      marker.on('click', () => {
        marker.openPopup();
      });

      // Navigate on popup button click (handled via global click)
      marker.on('popupopen', () => {
        setTimeout(() => {
          const btn = document.querySelector('.popup-view-btn') as HTMLElement;
          if (btn) btn.onclick = () => this.goToShop(shop);
        }, 50);
      });

      marker.addTo(this.map!);
    });
  }

  // ─── Navigation ───────────────────────────────────────────────────────────

  goToShop(shop: ShopModel) { this.navCtrl.navigateForward(`/customer/shop/${shop.id}`); }
  goToOrders()              { this.navCtrl.navigateForward('/customer/my-orders'); }
  goToProfile()             { this.navCtrl.navigateForward('/customer/profile'); }

  async logout() {
    await this.authService.logout();
    this.navCtrl.navigateRoot('/role-select');
  }

  // ─── Pull-to-refresh ──────────────────────────────────────────────────────

  doRefresh(event: any) {
    this.loadShops();
    setTimeout(() => event.target.complete(), 1500);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  getInitials(name: string): string {
    return (name || '??')
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatDistance(km: number | undefined): string {
    if (km === undefined || km === null) return '';
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
  }

  async showToast(message: string, color = 'danger') {
    const t = await this.toastCtrl.create({ message, duration: 3000, position: 'bottom', color });
    t.present();
  }
}
