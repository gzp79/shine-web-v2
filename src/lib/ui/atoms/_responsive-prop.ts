export type MediaType = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type MediaVarPostfixType = '' | '-sm' | '-md' | '-lg' | '-xl';
export type MediaClassPrefixType = '' | 'sm:' | 'md:' | 'lg:' | 'xl:';

export type ResponsiveProp<T extends NonNullable<unknown>> =
    | T
    | {
          xs: T;
          sm?: T;
          md?: T;
          lg?: T;
          xl?: T;
      };

export function toResponsiveClass<T extends NonNullable<unknown>>(
    prop: T | ResponsiveProp<T>,
    className: (media: MediaClassPrefixType, prop: T) => string | string[]
): string[] {
    if (typeof prop === 'object' && 'xs' in prop) {
        const res = [
            className('', prop.xs),
            prop.sm ? className('sm:', prop.sm) : [],
            prop.md ? className('md:', prop.md) : [],
            prop.lg ? className('lg:', prop.lg) : [],
            prop.xl ? className('xl:', prop.xl) : []
        ].flat();
        return res;
    } else {
        return [className('', prop)].flat();
    }
}

export function toResponsiveVar<T extends NonNullable<unknown>>(
    prop: T | ResponsiveProp<T>,
    format: (media: MediaVarPostfixType, prop: T) => string | string[]
): string[] {
    if (typeof prop === 'object' && 'xs' in prop) {
        const res = [
            format('', prop.xs),
            prop.sm ? format('-sm', prop.sm) : [],
            prop.md ? format('-md', prop.md) : [],
            prop.lg ? format('-lg', prop.lg) : [],
            prop.xl ? format('-xl', prop.xl) : []
        ].flat();
        return res;
    } else {
        return [format('', prop)].flat();
    }
}
