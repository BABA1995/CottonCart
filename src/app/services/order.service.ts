import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { OrderModel, OrderStatus } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private firestore = inject(Firestore);

  /** Place a new order — returns the new document ID */
  async placeOrder(order: Record<string, any>): Promise<string> {
    const ref     = collection(this.firestore, 'orders');
    const newDoc  = await addDoc(ref, {
      ...order,
      createdAt: serverTimestamp()
    });
    return newDoc.id;
  }

  /** All orders for a customer (real-time) */
  getCustomerOrders(customerId: string): Observable<OrderModel[]> {
    const ref = collection(this.firestore, 'orders');
    const q   = query(
      ref,
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<OrderModel[]>;
  }

  /** All orders for a shop (real-time) */
  getShopOrders(shopId: string): Observable<OrderModel[]> {
    const ref = collection(this.firestore, 'orders');
    const q   = query(
      ref,
      where('shopId', '==', shopId),
      orderBy('createdAt', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<OrderModel[]>;
  }

  /** Update order status (used by shop owner) */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const ref = doc(this.firestore, 'orders', orderId);
    await updateDoc(ref, { status, updatedAt: serverTimestamp() });
  }
}
