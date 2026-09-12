import nextConfig from '../../next.config.js';

describe('next.config.js redirects', () => {
  it('permanently redirects each retired route to its section on the one page', async () => {
    const redirects = await nextConfig.redirects?.();

    expect(redirects).toEqual([
      { source: '/menu', destination: '/#menu', permanent: true },
      { source: '/gallery', destination: '/#gallery', permanent: true },
      { source: '/about', destination: '/#about', permanent: true },
      { source: '/contact', destination: '/#contact', permanent: true },
    ]);
  });
});
