import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonSpinner,
  IonChip, IonLabel, IonFab, IonFabButton,
  IonRefresher, IonRefresherContent,
  AlertController, ToastController, NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, createOutline, trashOutline, eyeOutline, eyeOffOutline,
  bedOutline, ellipseOutline, documentsOutline, colorPaletteOutline,
  snowOutline, shieldOutline, homeOutline, gridOutline,
  tabletPortraitOutline, cubeOutline, imageOutline, checkmarkCircle
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { ItemService } from '../../../services/item.service';
import { ShopService } from '../../../services/shop.service';
import { ShopItem, ITEM_CATEGORIES, CATEGORY_MAP } from '../../../models/shop-item.model';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.page.html',
  styleUrls: ['./catalog.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonButton, IonIcon, IonSpinner,
    IonChip, IonLabel, IonFab, IonFabButton,
    IonRefresher, IonRefresherContent,
    NgIf, NgFor, DecimalPipe
  ],
})
export class CatalogPage implements OnInit, OnDestroy {

  allItems:      ShopItem[] = [];
  filteredItems: ShopItem[] = [];
  activeFilter   = 'all';
  loading        = true;
  updatingId: string | null = null;

  shopId = '';

  readonly categoryFilters = [
    { key: 'all', label: 'All' },
    ...ITEM_CATEGORIES.map(c => ({ key: c.key, label: c.label }))
  ];

  readonly categoryMap = CATEGORY_MAP;

  private itemsSub?: Subscription;
  private userSub?:  Subscription;

  constructor(
    private authService:  AuthService,
    private itemService:  ItemService,
    private shopService:  ShopService,
    private navCtrl:      NavController,
    private alertCtrl:    AlertController,
    private toastCtrl:    ToastController
  ) {
    addIcons({
      addOutline, createOutline, trashOutline, eyeOutline, eyeOffOutline,
      bedOutline, ellipseOutline, documentsOutline, colorPaletteOutline,
      snowOutline, shieldOutline, homeOutline, gridOutline,
      tabletPortraitOutline, cubeOutline, imageOutline, checkmarkCircle
    });
  }

  ngOnInit() {
    this.userSub = this.authService.currentUser$.subscribe(u => {
      if (u) { this.shopId = u.uid; this.loadItems(); }
    });
  }

  ngOnDestroy() {
    this.itemsSub?.unsubscribe();
    this.userSub?.unsubscribe();
  }

  loadItems() {
    this.loading = true;
    this.itemsSub?.unsubscribe();
    this.itemsSub = this.itemService.getShopItems(this.shopId).subscribe({
      next: items => {
        this.allItems = [...items].sort((a, b) => {
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
    this.filteredItems = this.activeFilter === 'all'
      ? this.allItems
      : this.allItems.filter(i => i.category === this.activeFilter);
  }

  setFilter(key: string) { this.activeFilter = key; this.applyFilter(); }

  countFor(key: string): number {
    return key === 'all'
      ? this.allItems.length
      : this.allItems.filter(i => i.category === key).length;
  }

  goAddItem() {
    this.navCtrl.navigateForward('/shop/item-form');
  }

  goEditItem(item: ShopItem) {
    this.navCtrl.navigateForward(`/shop/item-form?id=${item.id}`);
  }

  async toggleActive(item: ShopItem) {
    if (this.updatingId) return;
    this.updatingId = item.id!;
    try {
      await this.itemService.toggleActive(this.shopId, item.id!, !item.isActive);
    } catch {
      this.showToast('Failed to update. Try again.', 'danger');
    } finally {
      this.updatingId = null;
    }
  }

  async confirmDelete(item: ShopItem) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Item?',
      message: `"${item.name}" will be permanently deleted.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete', role: 'destructive',
          handler: () => this.deleteItem(item)
        }
      ]
    });
    await alert.present();
  }

  async deleteItem(item: ShopItem) {
    try {
      // Delete all images from Storage first
      for (const url of item.images ?? []) {
        await this.itemService.deleteImage(url);
      }
      await this.itemService.deleteItem(this.shopId, item.id!);
      this.showToast('Item deleted', 'warning');
    } catch {
      this.showToast('Delete failed. Try again.', 'danger');
    }
  }

  doRefresh(event: any) {
    this.loadItems();
    setTimeout(() => event.target.complete(), 1500);
  }

  async showToast(message: string, color = 'danger') {
    const t = await this.toastCtrl.create({ message, duration: 2500, position: 'bottom', color });
    t.present();
  }

  discountPct(item: ShopItem): number {
    if (!item.mrp || item.mrp <= item.price) return 0;
    return Math.round(((item.mrp - item.price) / item.mrp) * 100);
  }
}
