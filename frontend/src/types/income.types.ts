export interface IncomeLine {
  id: number;
  name: string;
  amount: number;
  type: 'Earned' | 'Portfolio' | 'Passive';
}