// components/SearchFilter.js

export default function SearchFilter({ value, onChange, onFilterClick }) {
  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <input
          type="text"
          placeholder="Search Events"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none"
        />
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          🔍
        </span>
      </div>
      <button
        onClick={onFilterClick}
        className="px-3 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 transition"
      >
        Filter ⋮
      </button>
    </div>
  );
}
