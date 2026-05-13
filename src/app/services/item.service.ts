import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, collectionData, doc, addDoc, updateDoc,
  deleteDoc, query, where, serverTimestamp, getDoc
} from '@angular/fire/firestore';
import {
  Storage, ref, uploadBytesResumable, getDownloadURL, deleteObject
} from '@angular/fire/storage';
import { Observable } from 'rxjs';
import { ShopItem } from '../models/shop-item.model';

@Injectable({ providedIn: 'root' })
export class ItemService {

  private firestore = inject(Firestore);
  private storage   = inject(Storage);

  // ── Subcollection ref helper ───────────────────────────────────────────────
  private itemsCol(shopId: string) {
    return collection(this.firestore, `shops/${shopId}/items`);
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  /** All items for a shop (real-time) */
  getShopItems(shopId: string): Observable<ShopItem[]> {
    const col = this.itemsCol(shopId);
    return collectionData(col, { idField: 'id' }) as Observable<ShopItem[]>;
  }

  /** Active items only – for customer-facing views */
  getActiveShopItems(shopId: string): Observable<ShopItem[]> {
    const q = query(this.itemsCol(shopId), where('isActive', '==', true));
    return collectionData(q, { idField: 'id' }) as Observable<ShopItem[]>;
  }

  /** Single item by ID */
  async getItemById(shopId: string, itemId: string): Promise<ShopItem | null> {
    const d = await getDoc(doc(this.firestore, `shops/${shopId}/items/${itemId}`));
    if (!d.exists()) return null;
    return { id: d.id, ...d.data() } as ShopItem;
  }

  // ── Write ─────────────────────────────────────────────────────────────────

  async addItem(shopId: string, item: Omit<ShopItem, 'id' | 'createdAt'>): Promise<string> {
    const ref = await addDoc(this.itemsCol(shopId), {
      ...item,
      shopId,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }

  async updateItem(shopId: string, itemId: string, data: Partial<ShopItem>): Promise<void> {
    const d = doc(this.firestore, `shops/${shopId}/items/${itemId}`);
    await updateDoc(d, { ...data, updatedAt: serverTimestamp() });
  }

  async deleteItem(shopId: string, itemId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, `shops/${shopId}/items/${itemId}`));
  }

  async toggleActive(shopId: string, itemId: string, isActive: boolean): Promise<void> {
    const d = doc(this.firestore, `shops/${shopId}/items/${itemId}`);
    await updateDoc(d, { isActive, updatedAt: serverTimestamp() });
  }

  // ── Image Upload ──────────────────────────────────────────────────────────

  /**
   * Uploads a single image File to Firebase Storage.
   * Returns a Promise<string> of the download URL.
   * Calls `onProgress(0-100)` during upload.
   */
  uploadImage(
    shopId: string,
    itemId: string,
    file: File,
    index: number,
    onProgress?: (pct: number) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const ext      = file.name.split('.').pop() ?? 'jpg';
      const path     = `shop-items/${shopId}/${itemId}/img_${index}.${ext}`;
      const storRef  = ref(this.storage, path);
      const task     = uploadBytesResumable(storRef, file);

      task.on('state_changed',
        snap => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          onProgress?.(pct);
        },
        err => reject(err),
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        }
      );
    });
  }

  /** Delete an image from Storage by its download URL */
  async deleteImage(url: string): Promise<void> {
    try {
      const storRef = ref(this.storage, url);
      await deleteObject(storRef);
    } catch { /* ignore – file may already be gone */ }
  }
}
