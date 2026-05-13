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
  cameraOutline, closeCircle, addOutline, checkmarkOutline,
  imageOutline, trashOutline, cloudUploadOutline
} from 'ionicons/icons';
import { AuthService } from '../../../services/auth.service';
import { ItemService } from '../../../services/item.service';
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
  isEditMode  = false;
  editItemId  = '';
  shopId      = '';
  saving      = false;

  // ── Image state ───────────────────────────────────────────────────────────
  /** URLs of already-uploaded images (from Firestore doc) */
  savedImages: string[] = [];
  /** Files selected by user but not yet uploaded */
  pendingFiles: File[] = [];
  /** Object-URL previews for pendingFiles */
  pendingPreviews: string[] = [];
  uploadProgress = 0;
  uploading      = false;

  // ── Form fields ───────────────────────────────────────────────────────────
  name         = '';
  category     = '';
  description  = '';
  price: any   = '';
  mrp: any     = '';
  sizeLabel    = '';
  fabricType   = '';
  fabricGsm: any    = '';
  threadCount: any  = '';
  fabricMeters: any = '';
  hasFilling   = false;
  cottonType   = '';
  fillWeight: any = '';
  color            = '';
  careInstructions = '';
  stockCount: any  = 1;
  isActive     = true;

  // ── Constants ─────────────────────────────────────────────────────────────
  readonly categories  = ITEM_CATEGORIES;
  readonly categoryMap = CATEGORY_MAP;
  readonly cottonOpts  = COTTON_OPTIONS;
  readonly fabricTypes = FABRIC_TYPES;

  get showFilling(): boolean {
    return this.categoryMap[this.category]?.hasFilling ?? this.hasFilling;
  }

  constructor(
    private authService: AuthService,
    private itemService: ItemService,
    private route:       ActivatedRoute,
    private navCtrl:     NavController,
    private toastCtrl:   ToastController
  ) {
    addIcons({
      cameraOutline, closeCircle, addOutline, checkmarkOutline,
      imageOutline, trashOutline, cloudUploadOutline
    });
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

    this.savedImages     = [...(item.images ?? [])];
    this.name            = item.name;
    this.category        = item.category;
    this.description     = item.description;
    this.price           = item.price;
    this.mrp             = item.mrp ?? '';
    this.sizeLabel       = item.sizeLabel;
    this.fabricType      = item.fabricType;
    this.fabricGsm       = item.fabricGsm ?? '';
    this.threadCount     = item.threadCount ?? '';
    this.fabricMeters    = item.fabricMetersUsed ?? '';
    this.hasFilling      = item.hasFilling;
    this.cottonType      = item.cottonType ?? '';
    this.fillWeight      = item.fillWeightKg ?? '';
    this.color           = item.color ?? '';
    this.careInstructions= item.careInstructions ?? '';
    this.stockCount      = item.stockCount;
    this.isActive        = item.isActive;
  }

  // ── Image picking ─────────────────────────────────────────────────────────

  triggerFilePicker() {
    const input = document.createElement('input');
    input.type  = 'file';
    input.accept= 'image/*';
    input.multiple = true;
    input.onchange = (e: any) => this.onFilesSelected(e.target.files);
    input.click();
  }

  onFilesSelected(fileList: FileList | null) {
    if (!fileList) return;
    const remaining = 3 - this.savedImages.length - this.pendingFiles.length;
    const toAdd     = Math.min(fileList.length, remaining);
    for (let i = 0; i < toAdd; i++) {
      const file = fileList[i];
      this.pendingFiles.push(file);
      this.pendingPreviews.push(URL.createObjectURL(file));
    }
    if (fileList.length > remaining) {
      this.showToast('Max 3 photos allowed', 'warning');
    }
  }

  removeSaved(index: number) {
    this.savedImages.splice(index, 1);
  }

  removePending(index: number) {
    URL.revokeObjectURL(this.pendingPreviews[index]);
    this.pendingFiles.splice(index, 1);
    this.pendingPreviews.splice(index, 1);
  }

  get totalImages() { return this.savedImages.length + this.pendingFiles.length; }

  // ── Save ──────────────────────────────────────────────────────────────────

  async save() {
    // Validation
    if (!this.name.trim())      return this.showToast('Enter item name', 'warning');
    if (!this.category)         return this.showToast('Select a category', 'warning');
    if (!this.description.trim())return this.showToast('Enter a description', 'warning');
    if (!+this.price)           return this.showToast('Enter selling price', 'warning');
    if (!this.sizeLabel.trim()) return this.showToast('Enter size / dimensions', 'warning');
    if (!this.fabricType)       return this.showToast('Select fabric type', 'warning');
    if (this.showFilling && !this.cottonType) return this.showToast('Select fill type', 'warning');

    this.saving = true;
    try {
      // 1. Determine item ID (new or existing)
      const itemId = this.isEditMode
        ? this.editItemId
        : doc_id(); // temp placeholder — replaced below for new items

      // 2. Upload pending images → get URLs
      let newUrls: string[] = [];
      if (this.pendingFiles.length > 0) {
        this.uploading = true;
        const uploadId = this.isEditMode ? itemId : 'tmp_' + Date.now();
        newUrls = await this.uploadPending(uploadId);
        this.uploading = false;
      }

      const allImages = [...this.savedImages, ...newUrls];

      // 3. Build item payload (no undefined fields)
      const payload: any = {
        name:        this.name.trim(),
        category:    this.category,
        description: this.description.trim(),
        images:      allImages,
        price:       +this.price,
        sizeLabel:   this.sizeLabel.trim(),
        fabricType:  this.fabricType,
        hasFilling:  this.showFilling,
        stockCount:  +this.stockCount || 0,
        isActive:    this.isActive,
        tags:        [],
      };

      if (+this.mrp)          payload.mrp             = +this.mrp;
      if (+this.fabricGsm)    payload.fabricGsm       = +this.fabricGsm;
      if (+this.threadCount)  payload.threadCount     = +this.threadCount;
      if (+this.fabricMeters) payload.fabricMetersUsed= +this.fabricMeters;
      if (this.color.trim())  payload.color           = this.color.trim();
      if (this.careInstructions.trim()) payload.careInstructions = this.careInstructions.trim();

      if (this.showFilling) {
        payload.cottonType  = this.cottonType;
        if (+this.fillWeight) payload.fillWeightKg = +this.fillWeight;
      }

      // 4. Write to Firestore
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
      this.uploading = false;
    }
  }

  private async uploadPending(itemId: string): Promise<string[]> {
    const urls: string[] = [];
    const base = this.savedImages.length;
    for (let i = 0; i < this.pendingFiles.length; i++) {
      this.uploadProgress = 0;
      const url = await this.itemService.uploadImage(
        this.shopId, itemId, this.pendingFiles[i], base + i,
        pct => { this.uploadProgress = pct; }
      );
      urls.push(url);
    }
    return urls;
  }

  async showToast(message: string, color = 'danger') {
    const t = await this.toastCtrl.create({ message, duration: 3000, position: 'bottom', color });
    t.present();
  }
}

/** tiny helper — only used as a placeholder, replaced by Firestore's addDoc ID */
function doc_id() { return 'new_' + Date.now(); }
