import { merchantSlug } from '@/lib/api/config';

describe('merchantSlug', () => {
  const original = process.env.NEXT_PUBLIC_MERCHANT_SLUG;

  afterEach(() => {
    process.env.NEXT_PUBLIC_MERCHANT_SLUG = original;
  });

  it('reads the merchant this site books for', () => {
    process.env.NEXT_PUBLIC_MERCHANT_SLUG = ' cinder-salt ';

    expect(merchantSlug()).toBe('cinder-salt');
  });

  it('fails loudly when it is not set', () => {
    delete process.env.NEXT_PUBLIC_MERCHANT_SLUG;

    expect(() => merchantSlug()).toThrow('NEXT_PUBLIC_MERCHANT_SLUG is not set');
  });

  it('fails loudly when it is blank', () => {
    process.env.NEXT_PUBLIC_MERCHANT_SLUG = '   ';

    expect(() => merchantSlug()).toThrow('NEXT_PUBLIC_MERCHANT_SLUG is not set');
  });
});
