const VARIABLE_PLACEHOLDER = /{(?<key>\w+)}/g;

export function interpolate(template: string, values?: Record<string, unknown>) {
    if (!values) {
        return template;
    }

    return template.replace(VARIABLE_PLACEHOLDER, (match, key) => `${values[key]}` || match);
}
