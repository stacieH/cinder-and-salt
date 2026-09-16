export const bookingKeys = {
  rules: ['booking', 'rules'] as const,
  availabilityRoot: ['booking', 'availability'] as const,
  /** One entry per date, party size, and manage token, so changing any of them refetches. */
  availability: (date: string, partySize: number, manageToken: string | null = null) =>
    ['booking', 'availability', date, partySize, manageToken] as const,
  managed: (token: string) => ['booking', 'managed', token] as const,
  demo: ['booking', 'demo'] as const,
};
