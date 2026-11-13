export function galleryIndex(index: number, direction: number, count: number): number {
  return count > 0 ? (((index + direction) % count) + count) % count : 0;
}

export function phoneHref(phone: string | null): string | null {
  const number = phone?.replace(/[\s().-]/g, "");
  return number && /^\+?\d{5,15}$/.test(number) ? `tel:${number}` : null;
}
