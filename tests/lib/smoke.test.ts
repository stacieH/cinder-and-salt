describe('toolchain', () => {
  it('runs TypeScript tests', () => {
    const doubled = [1, 2, 3].map((n) => n * 2);
    expect(doubled).toEqual([2, 4, 6]);
  });
});
