import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonButton, IonIcon, IonSpinner,
  IonItem, IonInput, IonTextarea, IonLabel,
  NavController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, cartOutline, bedOutline, resizeOutline,
  colorPaletteOutline, addOutline, removeOutline,
  homeOutline, callOutline, locationOutline,
  documentTextOutline, checkmarkCircleOutline, receiptOutline,
  cloudOutline
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { ShopService } from '../../../services/shop.service';
import { OrderService } from '../../../services/order.service';

interface SizeOption {
  key: string;
  label: string;
  dims: string;
  cottonKg: number | null;   // null = custom entry
}

interface FabricOption {
  key: string;
  label: string;
  desc: string;
}

interface CottonOption {
  key: string;
  label: string;
  desc: string;
  badge: string;
}

@Component({
  selector: 'app-order-form',
  templateUrl: './order-form.page.html',
  styleUrls: ['./order-form.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
    IonButton, IonIcon, IonSpinner,
    IonItem, IonInput, IonTextarea, IonLabel,
    NgIf, NgFor, TitleCasePipe, FormsModule
  ],
})
export class OrderFormPage implements OnInit, OnDestroy {

  // ─── Route context ────────────────────────────────────────────────────────
  shopId       = '';
  shopName     = '';
  mattressType = 'custom';

  // ─── Form fields ──────────────────────────────────────────────────────────
  selectedSize     = 'Double';
  customLength     = '';
  customWidth      = '';
  customThickness  = '';
  selectedFabric   = 'Cotton';
  selectedCotton   = 'pure';        // cotton fill type
  cottonWeight     = 30;            // kg — auto from size, editable
  customCottonKg   = '';            // used when size === 'Custom'
  quantity         = 1;

  // Delivery
  deliveryName    = '';
  deliveryPhone   = '';
  deliveryAddress = '';
  deliveryCity    = '';
  deliveryPincode = '';
  notes           = '';

  // ─── State ────────────────────────────────────────────────────────────────
  loading       = false;
  loadingShop   = true;
  currentUserId = '';

  // ─── Options ──────────────────────────────────────────────────────────────
  readonly sizes: SizeOption[] = [
    { key: 'Single', label: 'Single', dims: '78″ × 36″', cottonKg: 15 },
    { key: 'Double', label: 'Double', dims: '78″ × 54″', cottonKg: 30 },
    { key: 'Queen',  label: 'Queen',  dims: '78″ × 60″', cottonKg: 35 },
    { key: 'King',   label: 'King',   dims: '78″ × 72″', cottonKg: 40 },
    { key: 'Custom', label: 'Custom', dims: 'Enter size', cottonKg: null },
  ];

  readonly fabrics: FabricOption[] = [
    { key: 'Cotton',         label: 'Cotton',         desc: 'Soft & breathable' },
    { key: 'Velvet',         label: 'Velvet',         desc: 'Premium & luxurious' },
    { key: 'Terry Cotton',   label: 'Terry Cotton',   desc: 'Absorbent & durable' },
    { key: 'Knitted Fabric', label: 'Knitted Fabric', desc: 'Stretchy & smooth' },
  ];

  readonly cottonTypes: CottonOption[] = [
    {
      key:   'pure',
      label: 'Pure White Cotton',
      desc:  '100% pure cotton filling. Superior softness, long-lasting and hygienic.',
      badge: 'Premium'
    },
    {
      key:   'mixed',
      label: 'Mixed White Cotton',
      desc:  'Quality cotton blend filling. Good comfort at a more affordable price.',
      badge: 'Standard'
    },
  ];

  private shopSub?: Subscription;
  private userSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private shopService: ShopService,
    private orderService: OrderService,
    private navCtrl: NavController,
    private toastCtrl: ToastController
  ) {
    addIcons({
      arrowBackOutline, cartOutline, bedOutline, resizeOutline,
      colorPaletteOutline, addOutline, removeOutline,
      homeOutline, callOutline, locationOutline,
      documentTextOutline, checkmarkCircleOutline, receiptOutline,
      cloudOutline
    });
  }

  ngOnInit() {
    this.shopId      = this.route.snapshot.paramMap.get('shopId') || '';
    this.mattressType = this.route.snapshot.queryParamMap.get('type') || 'custom';

    this.userSub = this.authService.currentUser$.subscribe(u => {
      if (u) {
        this.currentUserId = u.uid;
        this.deliveryName  = u.displayName || '';
      }
    });

    this.shopSub = this.shopService.getShopById(this.shopId).subscribe({
      next: shop => {
        this.shopName    = shop?.name || 'Shop';
        this.loadingShop = false;
      },
      error: () => { this.loadingShop = false; }
    });
  }

  ngOnDestroy() {
    this.shopSub?.unsubscribe();
    this.userSub?.unsubscribe();
  }

  // ─── Size selection — auto-updates cotton weight ──────────────────────────

  onSizeSelect(sizeKey: string) {
    this.selectedSize = sizeKey;
    const size = this.sizes.find(s => s.key === sizeKey);
    if (size?.cottonKg !== null && size?.cottonKg !== undefined) {
      this.cottonWeight = size.cottonKg;
    }
    // For Custom, cottonWeight comes from customCottonKg input
  }

  get effectiveCottonWeight(): number {
    if (this.selectedSize === 'Custom') {
      return +this.customCottonKg || 0;
    }
    return this.cottonWeight;
  }

  // ─── Quantity ─────────────────────────────────────────────────────────────

  increaseQty() { if (this.quantity < 10) this.quantity++; }
  decreaseQty() { if (this.quantity > 1)  this.quantity--; }

  // ─── Page title ───────────────────────────────────────────────────────────

  get pageTitle(): string {
    const t = this.mattressType;
    return `Order ${t.charAt(0).toUpperCase() + t.slice(1)} Mattress`;
  }

  // ─── Validation ───────────────────────────────────────────────────────────

  private validate(): string | null {
    if (this.selectedSize === 'Custom') {
      if (!this.customLength || !this.customWidth || !this.customThickness)
        return 'Please enter custom length, width and thickness.';
      if (!this.customCottonKg || +this.customCottonKg <= 0)
        return 'Please enter the cotton weight for your custom size.';
    }

    // Convert to string safely — ion-input type="number" can return a number at runtime
    const name    = String(this.deliveryName    || '').trim();
    const phone   = String(this.deliveryPhone   || '').trim();
    const address = String(this.deliveryAddress || '').trim();
    const city    = String(this.deliveryCity    || '').trim();
    const pincode = String(this.deliveryPincode || '').trim();

    if (!name)                          return 'Please enter the delivery name.';
    if (!phone || phone.length < 10)    return 'Please enter a valid 10-digit phone number.';
    if (!address)                       return 'Please enter the delivery address.';
    if (!city)                          return 'Please enter the city.';
    if (!pincode || pincode.length !== 6) return 'Please enter a valid 6-digit pincode.';
    return null;
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async placeOrder() {
    const err = this.validate();
    if (err) return this.showToast(err, 'warning');

    this.loading = true;
    try {
      // Build base order — Firestore rejects undefined values, so omit optional fields
      const baseOrder: any = {
        customerId:     this.currentUserId,
        customerName:   String(this.deliveryName    || '').trim(),
        customerPhone:  String(this.deliveryPhone   || '').trim(),
        shopId:         this.shopId,
        shopName:       this.shopName,
        mattressType:   this.mattressType,
        size:           this.selectedSize,
        fabricType:     this.selectedFabric,
        cottonType:     this.selectedCotton,
        cottonWeightKg: this.effectiveCottonWeight,
        quantity:       this.quantity,
        deliveryName:   String(this.deliveryName    || '').trim(),
        deliveryPhone:  String(this.deliveryPhone   || '').trim(),
        deliveryAddress:String(this.deliveryAddress || '').trim(),
        deliveryCity:   String(this.deliveryCity    || '').trim(),
        deliveryPincode:String(this.deliveryPincode || '').trim(),
        notes:          String(this.notes           || '').trim(),
        status:         'pending'
      };

      // Only add custom dimensions when size === 'Custom'
      if (this.selectedSize === 'Custom') {
        baseOrder.customLength    = +this.customLength;
        baseOrder.customWidth     = +this.customWidth;
        baseOrder.customThickness = +this.customThickness;
      }

      await this.orderService.placeOrder(baseOrder);

      await this.showToast('Order placed successfully! 🎉', 'success');
      this.navCtrl.navigateRoot('/customer/my-orders');
    } catch (e) {
      console.error(e);
      this.showToast('Failed to place order. Please try again.', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async showToast(message: string, color = 'danger') {
    const t = await this.toastCtrl.create({ message, duration: 3000, position: 'bottom', color });
    t.present();
  }
}
