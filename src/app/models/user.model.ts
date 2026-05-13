export interface UserModel {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'shop';
  createdAt: Date;
}
