'use client';

const categories = [
  'All',
  'Desain Komunikasi Visual',
  'Desain Produk',
  'Falsafah Agama',
  'Hubungan Internasional',
  'Ilmu Komunikasi',
  'Manajemen',
  'Paramadina',
  'Psikologi',
  'Teknik Informatika'
];

type CategoryFilterProps = {
  onSelectCategory: (category: string) => void;
  onSearchChange: (searchTerm: string) => void;
  selectedCategory: string;
  searchTerm: string;
};

export default function CategoryFilter({ onSelectCategory, onSearchChange, selectedCategory, searchTerm }: CategoryFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      {/* Bagian Filter Kategori */}
      <div className="flex flex-wrap gap-2 flex-grow"> {/* flex-grow agar kategori bisa memenuhi ruang */}
        {categories.map((cat) => (
          <button
            key={cat}
            className={`px-4 py-1 rounded-full text-sm border ${
              selectedCategory === cat
                ? "bg-[#2596BE] text-white hover:bg-[#1e7a9e] transition-colors duration-300"
                : "bg-white text-black border-gray-300 hover:bg-gray-100 transition-colors duration-300"
            }`}
            onClick={() => onSelectCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Bagian Search Box dengan Ikon */}
      <div className="relative w-full sm:w-auto sm:ml-auto"> {/* sm:ml-auto untuk memposisikan di kanan */}
        <input
          type="text"
          placeholder="Search Events"
          className="pl-10 pr-4 py-1 rounded-md text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2596BE] w-full sm:w-48"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {/* Ikon Pencarian */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {/* Menggunakan SVG inline untuk ikon kaca pembesar */}
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          {/* Jika menggunakan lucide-react: <Search className="h-5 w-5 text-gray-400" /> */}
        </div>
      </div>
    </div>
  );
}