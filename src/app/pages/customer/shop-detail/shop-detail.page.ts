import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonButton, IonIcon, IonSpinner, IonChip, IonLabel,
  NavController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  locationOutline, callOutline, star, starOutline,
  bedOutline, storefrontOutline, cartOutline, cubeOutline,
  logoWhatsapp
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { ShopService } from '../../../services/shop.service';
import { ItemService } from '../../../services/item.service';
import { ShopModel } from '../../../models/shop.model';
import { ShopItem, CATEGORY_MAP } from '../../../models/shop-item.model';

@Component({
  selector: 'app-shop-detail',
  templateUrl: './shop-detail.page.html',
  styleUrls: ['./shop-detail.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
    IonButton, IonIcon, IonSpinner, IonChip, IonLabel,
    NgIf, NgFor, DecimalPipe
  ],
})
export class ShopDetailPage implements OnInit, OnDestroy {

  shop: ShopModel | null = null;
  loading               = true;

  shopItems:    ShopItem[] = [];
  itemsLoading  = true;

  readonly categoryMap = CATEGORY_MAP;

  private sub?:      Subscription;
  private itemsSub?: Subscription;

  constructor(
    private route:       ActivatedRoute,
    private shopService: ShopService,
    private itemService: ItemService,
    private navCtrl:     NavController,
    private toastCtrl:   ToastController
  ) {
    addIcons({
      locationOutline, callOutline, star, starOutline,
      bedOutline, storefrontOutline, cartOutline, cubeOutline,
      logoWhatsapp
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.navCtrl.back(); return; }

    this.sub = this.shopService.getShopById(id).subscribe({
      next: shop => {
        this.shop    = shop;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('Could not load shop details.', 'danger');
      }
    });

    this.itemsSub = this.itemService.getActiveShopItems(id).subscribe({
      next: items => {
        this.shopItems   = items;
        this.itemsLoading = false;
      },
      error: () => { this.itemsLoading = false; }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.itemsSub?.unsubscribe();
  }

  /** Show stats row only when shop has real data */
  get hasStats(): boolean {
    return !!(this.shop &&
      ((this.shop.totalOrders  ?? 0) > 0 ||
       (this.shop.reviewCount  ?? 0) > 0 ||
       (this.shop.minPrice     ?? 0) > 0));
  }

  placeCustomOrder() {
    this.navCtrl.navigateForward(`/customer/order-form/${this.shop!.id}`);
  }

  goToItemDetail(item: ShopItem) {
    this.navCtrl.navigateForward(`/customer/item-detail/${this.shop!.id}/${item.id}`);
  }

  discountPct(item: ShopItem): number {
    if (!item.mrp || item.mrp <= item.price) return 0;
    return Math.round(((item.mrp - item.price) / item.mrp) * 100);
  }

  callShop() {
    if (this.shop?.phone) window.open(`tel:${this.shop.phone}`);
  }

  whatsAppShop() {
    if (!this.shop) return;
    const phone = this.shop.phone.replace(/\D/g, '');
    const msg   = encodeURIComponent(`Hi, I found your shop *${this.shop.name}* on CottonCart. I'd like to enquire about your products.`);
    window.open(`https://wa.me/91${phone}?text=${msg}`, '_blank');
  }

  goBack() { this.navCtrl.back(); }

  getInitials(name: string): string {
    return (name || '??').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  getStarArray(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
  }

  async showToast(message: string, color = 'danger') {
    const t = await this.toastCtrl.create({ message, duration: 3000, position: 'bottom', color });
    t.present();
  }
}
