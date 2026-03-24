import React from 'react';
import { categories, shapesByCategory } from '../data/index.js';

const ShapeSelector = ({ selectedCategory, setSelectedCategory, selectedShape, setSelectedShape }) => {
  return (
    <section
      className="flex-1 py-2 flex flex-col overflow-auto min-h-0"
      style={{ backgroundColor: 'var(--surface-primary)' }}
    >
      <div className="flex px-5 items-center justify-between mb-1">
        <h2 className="body-md tracking-widest" style={{ color: 'var(--text-brand)' }}>
          조각들
        </h2>
      </div>

      <div className="w-full flex items-center gap-2 overflow-x-auto no-scrollbar px-5 py-4 mb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setSelectedShape(shapesByCategory[cat.id][0].id);
            }}
            className={`filter-btn ${selectedCategory === cat.id ? 'bg-brand' : 'bg-secondary hover:bg-brand/10'}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-8 px-5 place-items-center overflow-y-auto no-scrollbar">
        {shapesByCategory[selectedCategory].map((shape) => (
          <button
            key={shape.id}
            onClick={() => setSelectedShape(shape.id)}
            className={`w-20 h-20 flex items-center justify-center transition-all ${
              selectedShape === shape.id ? 'bg-brand text-invert' : 'text-primary hover:bg-black/10'
            }`}
            style={{ borderRadius: 'var(--radius-1)' }}
          >
            <svg width="80" height="80" viewBox={shape.viewBox || '0 0 80 80'} className="fill-current">
              {shape.svg}
            </svg>
          </button>
        ))}
      </div>
    </section>
  );
};

export default ShapeSelector;
