import { env } from '@/lib/env';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const configuration = new Configuration({
  basePath: PlaidEnvironments[env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': env.PLAID_CLIENT_ID || '',
      'PLAID-SECRET': env.PLAID_SECRET || '',
    },
  },
});

export const plaidClient = new PlaidApi(configuration);
