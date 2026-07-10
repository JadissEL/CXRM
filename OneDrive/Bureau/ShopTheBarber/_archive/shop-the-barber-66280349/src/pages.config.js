import Home from './pages/Home';
import Barbers from './pages/Barbers';
import BarberProfile from './pages/BarberProfile';
import BookingForm from './pages/BookingForm';
import { ClientDashboard } from './features/client/dashboard';
import Marketplace from './pages/Marketplace';
import Blog from './pages/Blog';
import ProductDetail from './pages/ProductDetail';
import ArticleDetail from './pages/ArticleDetail';
import Profile from './pages/Profile';
import { AdminDashboard } from './features/admin/dashboard';
import { AdminAuditLogs } from './features/admin/audit';
import { AdminContentManagement } from './features/admin/content';
import { AdminFeatureToggles } from './features/admin/features';
import { AdminGlobalFinancials } from './features/admin/financials';
import { AdminPlatformHealth } from './features/admin/health';
import { AdminUserManagement } from './features/admin/users';
import { BarberDashboard } from './features/barber/dashboard';
import { BarberAnalytics } from './features/barber/analytics';
import { BarberAvailability } from './features/barber/availability';
import { BarberClientList } from './features/barber/clients';
import { BarberMessageCenter } from './features/barber/messages';
import { BarberPayouts } from './features/barber/payouts';
import { BarberPortfolioEditor } from './features/barber/portfolio';
import { BarberPromotionManagement } from './features/barber/promotions';
import { BarberReviewManagement } from './features/barber/reviews';
import { BarberServiceManagement } from './features/barber/services';
import { VendorDashboard } from './features/vendor/dashboard';
import { ShopAnalytics } from './features/shop/analytics';
import { ShopBrandingManagement } from './features/shop/branding';
import { ShopEmployeeManagement } from './features/shop/employees';
import { ShopExpenseTracking } from './features/shop/expenses';
import { ShopInventoryManagement } from './features/shop/inventory';
import { ClientBookingDetails } from './features/client/bookings';
import { ClientWallet } from './features/client/wallet';
import GiftCards from './pages/GiftCards';
import InspirationFeed from './pages/InspirationFeed';
import Loyalty from './pages/Loyalty';
import Referral from './pages/Referral';
import Help from './pages/Help';
import LegalDocuments from './pages/LegalDocuments';
import Offline from './pages/Offline';
import { Cart } from './features/ecommerce/cart';
import { Settings } from './features/client/settings';
import { Checkout } from './features/ecommerce/checkout';
import { OrderConfirmation } from './features/ecommerce/orders';
import { OrderTracking } from './features/ecommerce/orders';
import { Wishlist } from './features/ecommerce/wishlist';
import { Messages } from './features/client/messages';
import { Notifications } from './features/client/notifications';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentError from './pages/PaymentError';
import Onboarding from './pages/Onboarding';
import UserHome from './pages/UserHome';
import SelectServices from './pages/SelectServices';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Barbers": Barbers,
    "BarberProfile": BarberProfile,
    "BookingForm": BookingForm,
    "ClientDashboard": ClientDashboard,
    "Marketplace": Marketplace,
    "Blog": Blog,
    "ProductDetail": ProductDetail,
    "ArticleDetail": ArticleDetail,
    "Profile": Profile,
    "AdminDashboard": AdminDashboard,
    "AdminAuditLogs": AdminAuditLogs,
    "AdminContentManagement": AdminContentManagement,
    "AdminFeatureToggles": AdminFeatureToggles,
    "AdminGlobalFinancials": AdminGlobalFinancials,
    "AdminPlatformHealth": AdminPlatformHealth,
    "AdminUserManagement": AdminUserManagement,
    "BarberDashboard": BarberDashboard,
    "BarberAnalytics": BarberAnalytics,
    "BarberAvailability": BarberAvailability,
    "BarberClientList": BarberClientList,
    "BarberMessageCenter": BarberMessageCenter,
    "BarberPayouts": BarberPayouts,
    "BarberPortfolioEditor": BarberPortfolioEditor,
    "BarberPromotionManagement": BarberPromotionManagement,
    "BarberReviewManagement": BarberReviewManagement,
    "BarberServiceManagement": BarberServiceManagement,
    "VendorDashboard": VendorDashboard,
    "ShopAnalytics": ShopAnalytics,
    "ShopBrandingManagement": ShopBrandingManagement,
    "ShopEmployeeManagement": ShopEmployeeManagement,
    "ShopExpenseTracking": ShopExpenseTracking,
    "ShopInventoryManagement": ShopInventoryManagement,
    "ClientBookingDetails": ClientBookingDetails,
    "ClientWallet": ClientWallet,
    "GiftCards": GiftCards,
    "InspirationFeed": InspirationFeed,
    "Loyalty": Loyalty,
    "Referral": Referral,
    "Help": Help,
    "LegalDocuments": LegalDocuments,
    "Offline": Offline,
    "Cart": Cart,
    "Settings": Settings,
    "Checkout": Checkout,
    "OrderConfirmation": OrderConfirmation,
    "OrderTracking": OrderTracking,
    "Wishlist": Wishlist,
    "Messages": Messages,
    "Notifications": Notifications,
    "PaymentSuccess": PaymentSuccess,
    "PaymentError": PaymentError,
    "Onboarding": Onboarding,
    "UserHome": UserHome,
    "SelectServices": SelectServices,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};