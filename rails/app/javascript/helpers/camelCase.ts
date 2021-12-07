function camelCase(snake_case: string): string {
  return snake_case.replaceAll(/_[a-z]/, s => s[1].toUpperCase())
}