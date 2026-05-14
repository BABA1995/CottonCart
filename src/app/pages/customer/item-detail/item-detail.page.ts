import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonIcon, IonSpinner,
  NavController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logoWhatsapp, callOutline, bedOutline, colorPaletteOutline,
  scaleOutline, layersOutline, shieldCheckmarkOutline, cubeOutline,
  starOutline, checkmarkCircleOutline, closeCircleOutline,
  chevronBackOutline, chevronForwardOutline, cartOutline
} from 'ionicons/icons';
import { ItemService } from '../../../services/item.service';
import { ShopService } from '../../../services/shop.service';
import { ShopItem, CATEGORY_MAP, COTTON_OPTIONS } from '../../../models/shop-item.model';
import { ShopModel } from '../../../models/shop.model';

@Component({
  selector: 'app-item-detail',
  templateUrl: './item-detail.page.html',
  styleUrls: ['./item-detail.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
    IonIcon, IonSpinner,
    NgIf, NgFor, DecimalPipe
  ],
})
export class ItemDetailPage implements OnInit {

  item: ShopItem | null = null;
  shop: ShopModel | null = null;
  loading = true;

  shopId   = '';
  itemId   = '';

  /** Currently shown photo index */
  photoIndex = 0;

  readonly categoryMap = CATEGORY_MAP;
  readonly cottonMap   = COTTON_OPTIONS.reduce((acc, c) => { acc[c.key] = c; return acc; }, {} as Record<string, any>);

  constructor(
    private route:       ActivatedRoute,
    private itemService: ItemService,
    private shopService: ShopService,
    private navCtrl:     NavController,
    private toastCtrl:   ToastController
  ) {
    addIcons({
      logoWhatsapp, callOutline, bedOutline, colorPaletteOutline,
      scaleOutline, layersOutline, shieldCheckmarkOutline, cubeOutline,
      starOutline, checkmarkCircleOutline, closeCircleOutline,
      chevronBackOutline, chevronForwardOutline, cartOutline
    });
  }

  ngOnInit() {
    this.shopId = this.route.snapshot.paramMap.get('shopId') ?? '';
    this.itemId = this.route.snapshot.paramMap.get('itemId') ?? '';
    this.load();
  }

  async load() {
    this.loading = true;
    try {
      const [item, shop] = await Promise.all([
        this.itemService.getItemById(this.shopId, this.itemId),
        this.shopService.getShopByIdOnce(this.shopId)
      ]);
      this.item = item;
      this.shop = shop;
    } catch (e) {
      console.error(e);
    } finally {
      this.loading = false;
    }
  }

  // ── Photo carousel ────────────────────────────────────────────────────────

  prevPhoto() {
    if (!this.item?.images?.length) return;
    this.photoIndex = (this.photoIndex - 1 + this.item.images.length) % this.item.images.length;
  }

  nextPhoto() {
    if (!this.item?.images?.length) return;
    this.photoIndex = (this.photoIndex + 1) % this.item.images.length;
  }

  // ── WhatsApp ──────────────────────────────────────────────────────────────

  enquireWhatsApp() {
    if (!this.shop || !this.item) return;
    const phone = this.shop.phone.replace(/\D/g, '');
    const msg   = encodeURIComponent(
      `Hi, I'm interested in your item *${this.item.name}* (${this.item.sizeLabel}) listed at ₹${this.item.price}. Is it available?`
    );
    window.open(`https://wa.me/91${phone}?text=${msg}`, '_blank');
  }

  callShop() {
    if (!this.shop) return;
    window.open(`tel:${this.shop.phone}`);
  }

  // ── Discount ──────────────────────────────────────────────────────────────

  discountPct(): number {
    if (!this.item?.mrp || this.item.mrp <= this.item.price) return 0;
    return Math.round(((this.item.mrp - this.item.price) / this.item.mrp) * 100);
  }

  cottonLabel(key: string): string {
    return this.cottonMap[key]?.label ?? key;
  }

  categoryLabel(key: string): string {
    return this.categoryMap[key]?.label ?? key;
  }
}
