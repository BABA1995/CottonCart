import { Routes } from '@angular/router';

export const routes: Routes = [
  // Default redirect
  { path: '', redirectTo: 'splash', pathMatch: 'full' },

  // Splash & Onboarding
  { path: 'splash',      loadComponent: () => import('./pages/splash/splash.page').then(m => m.SplashPage) },
  { path: 'role-select', loadComponent: () => import('./pages/role-select/role-select.page').then(m => m.RoleSelectPage) },

  // Auth
  { path: 'login',       loadComponent: () => import('./pages/auth/login/login.page').then(m => m.LoginPage) },
  { path: 'signup',      loadComponent: () => import('./pages/auth/signup/signup.page').then(m => m.SignupPage) },

  // Customer pages
  { path: 'customer',                      loadComponent: () => import('./pages/customer/home/home.page').then(m => m.HomePage) },
  { path: 'customer/shop/:id',             loadComponent: () => import('./pages/customer/shop-detail/shop-detail.page').then(m => m.ShopDetailPage) },
  { path: 'customer/order-form/:shopId',   loadComponent: () => import('./pages/customer/order-form/order-form.page').then(m => m.OrderFormPage) },
  { path: 'customer/my-orders',            loadComponent: () => import('./pages/customer/my-orders/my-orders.page').then(m => m.MyOrdersPage) },
  { path: 'customer/profile',              loadComponent: () => import('./pages/customer/profile/profile.page').then(m => m.ProfilePage) },

  // Shop Owner pages
  { path: 'shop/dashboard', loadComponent: () => import('./pages/shop/dashboard/dashboard.page').then(m => m.DashboardPage) },
  { path: 'shop/orders',    loadComponent: () => import('./pages/shop/orders/orders.page').then(m => m.OrdersPage) },
  { path: 'shop/catalog',   loadComponent: () => import('./pages/shop/catalog/catalog.page').then(m => m.CatalogPage) },
  { path: 'shop/profile',   loadComponent: () => import('./pages/shop/shop-profile/shop-profile.page').then(m => m.ShopProfilePage) },

  // Fallback
  { path: '**', redirectTo: 'splash' }
];
