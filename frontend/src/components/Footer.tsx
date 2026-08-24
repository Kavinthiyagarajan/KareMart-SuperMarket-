import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-auto py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-800 mb-4">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span><span className="text-emerald-600 font-extrabold">K</span>are<span className="text-emerald-600 font-extrabold">M</span>art</span>
            </Link>
            <p className="text-sm text-slate-500">Everyday essentials, securely and simply delivered.</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Shop</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/" className="hover:text-emerald-600 transition-colors">All Products</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Account</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/profile" className="hover:text-emerald-600 transition-colors">My Profile</Link></li>
              <li><Link href="/profile/orders" className="hover:text-emerald-600 transition-colors">Order History</Link></li>
              <li><Link href="/profile/wishlist" className="hover:text-emerald-600 transition-colors">Wishlist</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="/checkout" className="hover:text-emerald-600 transition-colors">Checkout</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-100 text-center text-sm text-slate-400">
          <p>&copy; <span suppressHydrationWarning>{new Date().getFullYear()}</span> KareMart. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
