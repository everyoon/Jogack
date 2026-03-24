import { categories } from './categories';
import { SquareShapes } from './SquareShapes';
import { CircleShapes } from './CircleShapes';
import { PolygonShapes } from './PolygonShapes';
import { StampShapes } from './StampShapes';
import { OtherShapes } from './OtherShapes';

export { categories };

export const shapesByCategory = {
  square: SquareShapes,
  circle: CircleShapes,
  polygon: PolygonShapes,
  stamp: StampShapes,
  other: OtherShapes,
};
