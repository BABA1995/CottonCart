import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, DecimalPipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonButton, IonIcon, IonSpinner, IonChip, IonLabel,
  IonCard, IonCardContent, IonBadge,
  NavController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  locationOutline, callOutline, star, starOutline,
  bedOutline, chevronForwardOutline, arrowBackOutline,
  checkmarkCircleOutline, timeOutline, storefrontOutline,
  cartOutline, leafOutline, cogOutline, sparklesOutline
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { ShopService } from '../../../services/shop.service';
import { ItemService } from '../../../services/item.service';
import { ShopModel } from '../../../models/shop.model';
import { ShopItem, CATEGORY_MAP } from '../../../models/shop-item.model';

// Each mattress type the shop can offer
interface ProductCard {
  type: string;
  label: string;
  description: string;
  icon: string;
  highlights: string[];
}

const PRODUCT_INFO: Record<string, ProductCard> = {
  spring: {
    type: 'spring',
    label: 'Spring Mattress',
    description: 'Classic bonnel or pocket spring mattresses. Great support with natural airflow for a cool sleep.',
    icon: 'sparkles-outline',
    highlights: ['Good air circulation', 'Strong edge support', 'Long lasting']
  },
  foam: {
    type: 'foam',
    label: 'Foam Mattress',
    description: 'High-density or memory foam mattresses that contour to your body for pressure relief.',
    icon: 'leaf-outline',
    highlights: ['Pressure relief', 'Motion isolation', 'Hypoallergenic']
  },
  coir: {
    type: 'coir',
    label: 'Coir Mattress',
    description: 'Natural coconut fibre mattresses. Firm, breathable and eco-friendly — a traditional favourite.',
    icon: 'bed-outline',
    highlights: ['100% natural', 'Firm support', 'Eco-friendly']
  },
  custom: {
    type: 'custom',
    label: 'Custom Mattress',
    description: 'Order a fully custom mattress tailored to your exact size, materials and comfort preferences.',
    icon: 'cog-outline',
    highlights: ['Any size', 'Your choice of material', 'Made to order']
  }
};

@Component({
  selector: 'app-shop-detail',
  templateUrl: './shop-detail.page.html',
  styleUrls: ['./shop-detail.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
    IonButton, IonIcon, IonSpinner, IonChip, IonLabel,
    IonCard, IonCardContent, IonBadge,
    NgIf, NgFor, DecimalPipe, TitleCasePipe
  ],
})
export class ShopDetailPage implements OnInit, OnDestroy {

  shop: ShopModel | null = null;
  loading                = true;
  products: ProductCard[] = [];

  shopItems:      ShopItem[] = [];
  itemsLoading    = true;

  readonly categoryMap = CATEGORY_MAP;

  private sub?:      Subscription;
  private itemsSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private shopService: ShopService,
    private itemService: ItemService,
    private navCtrl: NavController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      locationOutline, callOutline, star, starOutline,
      bedOutline, chevronForwardOutline, arrowBackOutline,
      checkmarkCircleOutline, timeOutline, storefrontOutline,
      cartOutline, leafOutline, cogOutline, sparklesOutline
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.navCtrl.back(); return; }

    this.sub = this.shopService.getShopById(id).subscribe({
      next: shop => {
        this.shop     = shop;
        this.products = this.buildProductCards(shop.tags || []);
        this.loading  = false;
      },
      error: () => {
        this.loading = false;
        this.showToast('Could not load shop details.', 'danger');
      }
    });

    // Load active catalog items for this shop
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

  // Build product cards from the shop's tags
  buildProductCards(tags: string[]): ProductCard[] {
    return tags
      .map(t => PRODUCT_INFO[t.toLowerCase()])
      .filter(Boolean);
  }

  // Navigate to order form with shop + product type
  orderNow(productType: string) {
    this.navCtrl.navigateForward(
      `/customer/order-form/${this.shop!.id}`,
      { queryParams: { type: productType } }
    );
  }

  goToItemDetail(item: ShopItem) {
    this.navCtrl.navigateForward(`/customer/item-detail/${this.shop!.id}/${item.id}`);
  }

  discountPct(item: ShopItem): number {
    if (!item.mrp || item.mrp <= item.price) return 0;
    return Math.round(((item.mrp - item.price) / item.mrp) * 100);
  }

  // Call the shop
  callShop() {
    if (this.shop?.phone) {
      window.open(`tel:${this.shop.phone}`);
    }
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
