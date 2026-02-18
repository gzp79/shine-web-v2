export function pascalCase(s: string) {
    return s.replace(/(^\w|-\w)/g, (match) => match.replace(/-/, '').toUpperCase());
}
