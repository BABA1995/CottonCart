export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export interface OrderModel {
  id?: string;
  // Customer
  customerId: string;
  customerName: string;
  customerPhone: string;
  // Shop
  shopId: string;
  shopName: string;
  // Mattress specs
  mattressType: string;    // spring | foam | coir | custom
  size: string;            // Single | Double | Queen | King | Custom
  customLength?: number;   // inches — only when size === 'Custom'
  customWidth?: number;
  customThickness?: number;
  fabricType: string;      // Cotton | Velvet | Terry Cotton | Knitted Fabric
  cottonType: string;      // pure | mixed
  cottonWeightKg: number;  // e.g. 15 (Single), 30 (Double), 35 (Queen), 40 (King)
  quantity: number;
  // Delivery
  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryPincode: string;
  // Meta
  notes?: string;
  status: OrderStatus;
  totalEstimate?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending:     'Pending Confirmation',
  confirmed:   'Order Confirmed',
  in_progress: 'Being Prepared',
  ready:       'Ready for Delivery',
  delivered:   'Delivered',
  cancelled:   'Cancelled'
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending:     'warning',
  confirmed:   'primary',
  in_progress: 'tertiary',
  ready:       'success',
  delivered:   'success',
  cancelled:   'danger'
};
