import { useQuery } from "@tanstack/react-query";
import { api, Category } from "@/lib/api";

const CATEGORY_ICONS: Record<string, { icon: string, color: string, text: string }> = {
  "staples": { icon: "🌾", color: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
  "snacks": { icon: "🥨", color: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300" },
  "biscuits": { icon: "🍪", color: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300" },
  "beverages": { icon: "🥤", color: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
  "breakfast": { icon: "🥣", color: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  "cooking-essentials": { icon: "🍳", color: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300" },
  "instant-foods": { icon: "🍜", color: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300" },
  "sauces-spreads": { icon: "🍯", color: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-300" },
  "personal-care": { icon: "🧴", color: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-300" },
  "household-cleaning": { icon: "🧽", color: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300" },
};

export default function CategoryGrid({ onSelectCategory, currentCategory }: { onSelectCategory: (c: string) => void, currentCategory: string }) {
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  if (categories.length === 0) return null;

  return (
    <section className="my-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Explore Categories</h2>
        <button onClick={() => onSelectCategory('')} className="text-sm text-primary font-medium hover:underline">
          View All
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {categories.slice(0, 10).map((cat: Category, i: number) => {
          const config = CATEGORY_ICONS[cat.slug] || { icon: "🛒", color: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300" };
          const popular = i < 2; // Make first 2 popular
          return (
            <button 
              key={cat.slug}
              onClick={() => onSelectCategory(cat.slug)}
              className={`relative flex flex-col items-center justify-center p-6 rounded-3xl transition-all duration-300 group
                ${currentCategory === cat.slug 
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-background bg-surface shadow-md' 
                  : 'bg-surface border border-border hover:border-primary/50 hover:shadow-lg'
                }`}
            >
              {popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap z-10">
                  Popular near you
                </span>
              )}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 transition-transform group-hover:scale-110 ${config.color}`}>
                {config.icon}
              </div>
              <span className={`font-semibold text-sm text-center ${currentCategory === cat.slug ? 'text-primary' : 'text-foreground'}`}>
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
