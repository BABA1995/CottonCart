import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  getDoc,
  setDoc,
  query,
  where,
  serverTimestamp
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { ShopModel } from '../models/shop.model';

@Injectable({ providedIn: 'root' })
export class ShopService {
  private firestore = inject(Firestore);

  /** All active shops (no location filter) */
  getActiveShops(): Observable<ShopModel[]> {
    const ref = collection(this.firestore, 'shops');
    const q   = query(ref, where('isActive', '==', true));
    return collectionData(q, { idField: 'id' }) as Observable<ShopModel[]>;
  }

  /**
   * Shops within `radiusKm` of a coordinate.
   * Firestore doesn't support geo queries natively, so we fetch all active
   * shops and filter/sort by Haversine distance on the client.
   */
  getNearbyShops(lat: number, lng: number, radiusKm = 50): Observable<ShopModel[]> {
    return this.getActiveShops().pipe(
      map(shops =>
        shops
          .map(shop => ({
            ...shop,
            distance: this.haversineDistance(lat, lng, shop.lat, shop.lng)
          }))
          .filter(shop => shop.distance <= radiusKm)
          .sort((a, b) => a.distance - b.distance)
      )
    );
  }

  /** Single shop by Firestore document ID */
  getShopById(id: string): Observable<ShopModel> {
    const ref = doc(this.firestore, 'shops', id);
    return docData(ref, { idField: 'id' }) as Observable<ShopModel>;
  }

  /** Shop owner: get their own shop (doc ID === owner uid) */
  getMyShop(uid: string): Observable<ShopModel | null> {
    const ref = doc(this.firestore, 'shops', uid);
    return docData(ref, { idField: 'id' }) as Observable<ShopModel | null>;
  }

  /** Single shop by ID — one-time fetch (Promise, not Observable) */
  async getShopByIdOnce(id: string): Promise<ShopModel | null> {
    const snap = await getDoc(doc(this.firestore, 'shops', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as ShopModel;
  }

  /** Shop owner: create or update their shop document */
  async setupShop(uid: string, data: Partial<ShopModel>): Promise<void> {
    const ref = doc(this.firestore, 'shops', uid);
    await setDoc(ref, {
      ...data,
      uid,
      isActive:     true,
      totalOrders:  0,
      reviewCount:  0,
      rating:       0,
      createdAt:    serverTimestamp()
    }, { merge: true });
  }

  /**
   * Haversine formula — returns straight-line distance in km.
   */
  haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R    = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a    =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
