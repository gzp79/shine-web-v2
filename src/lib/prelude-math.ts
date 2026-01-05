Math.clamp = function (value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
};

Math.round_q = function (value: number, precision: number): number {
    return Math.round(value / precision) * precision;
};
