interface CategoryFilterProps {
  selectedCategory: '대여사업' | '사물함'
  onSelect: (category: '대여사업' | '사물함') => void
}

export function CategoryFilter({ selectedCategory, onSelect }: CategoryFilterProps) {
  const categories = [
    { value: '대여사업' as const, label: '대여사업' },
    { value: '사물함' as const, label: '사물함' }
  ]

  return (
    <div className="flex justify-center mb-10">
      <div className="flex gap-4 bg-gray-50 p-2 rounded-2xl">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onSelect(cat.value)}
            className={`px-8 py-3 rounded-xl font-bold transition-all duration-200 text-lg ${
              selectedCategory === cat.value
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  )
}
