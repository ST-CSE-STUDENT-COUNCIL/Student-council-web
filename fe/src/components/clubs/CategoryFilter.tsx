type Props = {
    categories: string[]
    selectedCategory: string
    onSelect: (category: string) => void
}

export function CategoryFilter({ categories, selectedCategory, onSelect }: Props) {
    return (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 justify-center">
            {categories.map((category) => (
                <button
                    key={category}
                    onClick={() => onSelect(category)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${selectedCategory === category
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                        }`}
                >
                    {category}
                </button>
            ))}
        </div>
    )
}
