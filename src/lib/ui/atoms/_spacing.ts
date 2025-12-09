import { type ResponsiveProp, type Spacing, toResponsiveClass } from '.';

export type ResponsiveSpacing =
    | ResponsiveProp<Spacing>
    | {
          x: Spacing | ResponsiveProp<Spacing>;
          y: Spacing | ResponsiveProp<Spacing>;
      }
    | {
          col: Spacing | ResponsiveProp<Spacing>;
          row: Spacing | ResponsiveProp<Spacing>;
      };

export function toSpacingClasses(prop: ResponsiveSpacing | undefined, prefix: { all: string; x: string; y: string }) {
    if (prop === undefined) {
        return undefined;
    }
    if (typeof prop === 'object' && 'x' in prop) {
        return [
            toResponsiveClass(prop.x, (m, s) => `${m}${prefix.x}-${s}`),
            toResponsiveClass(prop.y, (m, s) => `${m}${prefix.y}-${s}`)
        ];
    }
    if (typeof prop === 'object' && 'col' in prop) {
        return [
            toResponsiveClass(prop.col, (m, s) => `${m}${prefix.x}-${s}`),
            toResponsiveClass(prop.row, (m, s) => `${m}${prefix.y}-${s}`)
        ];
    }
    return [toResponsiveClass(prop, (m, s) => `${m}${prefix.all}-${s}`)];
}
