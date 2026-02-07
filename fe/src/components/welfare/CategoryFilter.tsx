type CategoryFilterProps = {
  selectedCategory: '대여사업' | '사물함' | '프린터' | '신입생 가이드북'
  onSelect: (category: '대여사업' | '사물함' | '프린터' | '신입생 가이드북') => void
}

export function CategoryFilter({ selectedCategory, onSelect }: CategoryFilterProps) {
  const categories = [
    { value: '대여사업' as const, label: '대여사업' },
    { value: '사물함' as const, label: '사물함' },
    { value: '프린터' as const, label: '프린터' },
    { value: '신입생 가이드북' as const, label: '신입생 가이드북' },
  ]

  return (
    <div className="flex justify-center mb-8 sm:mb-12 px-2">
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4 bg-gray-100/50 dark:bg-slate-800/50 p-2 rounded-2xl w-full sm:w-auto overflow-hidden">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onSelect(cat.value)}
            className={`w-full sm:w-auto px-3 sm:px-6 py-3 rounded-xl font-bold transition-all duration-200 text-sm sm:text-lg whitespace-nowrap ${selectedCategory === cat.value
              ? 'bg-blue-600 text-white shadow-md sm:shadow-lg sm:scale-105'
              : 'bg-white/50 sm:bg-transparent text-gray-500 hover:text-gray-900 hover:bg-white dark:bg-slate-700/50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-slate-700'
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  )
}
