import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonButton, IonIcon, IonSpinner, IonItem, IonInput, IonLabel,
  IonTextarea, IonSelect, IonSelectOption, IonToggle,
  NavController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, checkmarkOutline, imageOutline, trashOutline,
  cameraOutline, closeCircleOutline
} from 'ionicons/icons';
import { AuthService } from '../../../services/auth.service';
import { ItemService } from '../../../services/item.service';
import { CloudinaryService } from '../../../services/cloudinary.service';
import {
  ShopItem, ITEM_CATEGORIES, CATEGORY_MAP, COTTON_OPTIONS, FABRIC_TYPES
} from '../../../models/shop-item.model';

@Component({
  selector: 'app-item-form',
  templateUrl: './item-form.page.html',
  styleUrls: ['./item-form.page.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
    IonButton, IonIcon, IonSpinner, IonItem, IonInput, IonLabel,
    IonTextarea, IonSelect, IonSelectOption, IonToggle,
    NgIf, NgFor, FormsModule
  ],
})
export class ItemFormPage implements OnInit {

  // ── Mode ──────────────────────────────────────────────────────────────────
  isEditMode = false;
  editItemId = '';
  shopId     = '';
  saving     = false;

  // ── Photos (up to 3 Cloudinary URLs) ────────────────────────────────────
  photos: string[]     = ['', '', ''];   // index 0‒2
  uploadingSlot        = -1;             // -1 = none uploading

  // ── Form fields ───────────────────────────────────────────────────────────
  name             = '';
  category         = '';
  description      = '';
  price: any       = '';
  mrp: any         = '';
  sizeLabel        = '';
  fabricType       = '';
  fabricGsm: any   = '';
  threadCount: any = '';
  fabricMeters: any= '';
  hasFilling       = false;
  cottonType       = '';
  fillWeight: any  = '';
  color            = '';
  careInstructions = '';
  stockCount: any  = 1;
  isActive         = true;

  // ── Constants ─────────────────────────────────────────────────────────────
  readonly categories  = ITEM_CATEGORIES;
  readonly categoryMap = CATEGORY_MAP;
  readonly cottonOpts  = COTTON_OPTIONS;
  readonly fabricTypes = FABRIC_TYPES;
  readonly slots       = [0, 1, 2] as const;

  get showFilling(): boolean {
    return this.categoryMap[this.category]?.hasFilling ?? this.hasFilling;
  }

  /** Non-empty URLs to store in Firestore */
  get imageUrls(): string[] {
    return this.photos.filter(u => u.length > 0);
  }

  constructor(
    private authService: AuthService,
    private itemService: ItemService,
    private cloudinary:  CloudinaryService,
    private route:       ActivatedRoute,
    private navCtrl:     NavController,
    private toastCtrl:   ToastController
  ) {
    addIcons({ addOutline, checkmarkOutline, imageOutline, trashOutline,
               cameraOutline, closeCircleOutline });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(u => {
      if (u) this.shopId = u.uid;
    });

    const id = this.route.snapshot.queryParamMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.editItemId = id;
      this.loadItem(id);
    }
  }

  async loadItem(id: string) {
    const item = await this.itemService.getItemById(this.shopId, id);
    if (!item) return;

    const imgs = item.images ?? [];
    this.photos = [imgs[0] ?? '', imgs[1] ?? '', imgs[2] ?? ''];

    this.name             = item.name;
    this.category         = item.category;
    this.description      = item.description;
    this.price            = item.price;
    this.mrp              = item.mrp ?? '';
    this.sizeLabel        = item.sizeLabel;
    this.fabricType       = item.fabricType;
    this.fabricGsm        = item.fabricGsm ?? '';
    this.threadCount      = item.threadCount ?? '';
    this.fabricMeters     = item.fabricMetersUsed ?? '';
    this.hasFilling       = item.hasFilling;
    this.cottonType       = item.cottonType ?? '';
    this.fillWeight       = item.fillWeightKg ?? '';
    this.color            = item.color ?? '';
    this.careInstructions = item.careInstructions ?? '';
    this.stockCount       = item.stockCount;
    this.isActive         = item.isActive;
  }

  // ── Photo upload ──────────────────────────────────────────────────────────

  async pickPhoto(slot: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;
    input.value = '';   // allow re-picking same file

    this.uploadingSlot = slot;
    try {
      const url = await this.cloudinary.uploadImage(file);
      this.photos[slot] = url;
    } catch (e: any) {
      console.error(e);
      this.showToast('Photo upload failed. Try again.', 'danger');
    } finally {
      this.uploadingSlot = -1;
    }
  }

  removePhoto(slot: number) {
    this.photos[slot] = '';
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async save() {
    if (!this.name.trim())        return this.showToast('Enter item name', 'warning');
    if (!this.category)           return this.showToast('Select a category', 'warning');
    if (!this.description.trim()) return this.showToast('Enter a description', 'warning');
    if (!+this.price)             return this.showToast('Enter selling price', 'warning');
    if (!this.sizeLabel.trim())   return this.showToast('Enter size / dimensions', 'warning');
    if (!this.fabricType)         return this.showToast('Select fabric type', 'warning');
    if (this.showFilling && !this.cottonType) return this.showToast('Select fill type', 'warning');

    this.saving = true;
    try {
      const payload: any = {
        name:        this.name.trim(),
        category:    this.category,
        description: this.description.trim(),
        images:      this.imageUrls,
        price:       +this.price,
        sizeLabel:   this.sizeLabel.trim(),
        fabricType:  this.fabricType,
        hasFilling:  this.showFilling,
        stockCount:  +this.stockCount || 0,
        isActive:    this.isActive,
        tags:        [],
      };

      if (+this.mrp)          payload.mrp              = +this.mrp;
      if (+this.fabricGsm)    payload.fabricGsm        = +this.fabricGsm;
      if (+this.threadCount)  payload.threadCount      = +this.threadCount;
      if (+this.fabricMeters) payload.fabricMetersUsed = +this.fabricMeters;
      if (this.color.trim())  payload.color            = this.color.trim();
      if (this.careInstructions.trim())
        payload.careInstructions = this.careInstructions.trim();

      if (this.showFilling) {
        payload.cottonType = this.cottonType;
        if (+this.fillWeight) payload.fillWeightKg = +this.fillWeight;
      }

      if (this.isEditMode) {
        await this.itemService.updateItem(this.shopId, this.editItemId, payload);
        this.showToast('Item updated ✅', 'success');
      } else {
        await this.itemService.addItem(this.shopId, payload);
        this.showToast('Item added ✅', 'success');
      }

      this.navCtrl.navigateBack('/shop/catalog');
    } catch (e) {
      console.error(e);
      this.showToast('Save failed. Try again.', 'danger');
    } finally {
      this.saving = false;
    }
  }

  async showToast(message: string, color = 'danger') {
    const t = await this.toastCtrl.create({ message, duration: 3000, position: 'bottom', color });
    t.present();
  }
}
