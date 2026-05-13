export interface ShopModel {
  id?: string;
  uid: string;          // Firebase Auth UID of the shop owner
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  totalOrders: number;
  isActive: boolean;
  imageUrl?: string;
  tags: string[];       // e.g. ['spring', 'foam', 'coir', 'custom']
  minPrice: number;
  maxPrice: number;
  createdAt: Date;
  distance?: number;    // Calculated client-side in km
}
