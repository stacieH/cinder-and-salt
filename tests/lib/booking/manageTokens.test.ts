import {
  readFragmentToken,
  recallManageToken,
  rememberManageToken,
} from '@/lib/booking/manageTokens';

describe('readFragmentToken', () => {
  it('reads the token out of the fragment', () => {
    expect(readFragmentToken('#token=abc123')).toBe('abc123');
    expect(readFragmentToken('token=abc123')).toBe('abc123');
  });

  it('is null when there is no token', () => {
    expect(readFragmentToken('')).toBeNull();
    expect(readFragmentToken('#other=1')).toBeNull();
    expect(readFragmentToken('#token=')).toBeNull();
  });
});

describe('remembering a token for the tab', () => {
  beforeEach(() => window.sessionStorage.clear());

  it('reads back what it stored', () => {
    rememberManageToken('CS-7K2M9Q', 'token-1');

    expect(recallManageToken('CS-7K2M9Q')).toBe('token-1');
  });

  it('is null for a reference it has never seen', () => {
    expect(recallManageToken('CS-NOPE12')).toBeNull();
  });
});
