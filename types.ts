export enum TransactionType {
  DEPOSIT = 'deposit',
  TRANSFER = 'transfer',
  PAYMENT = 'payment'
}

export interface User {
  id: string; 
  nom: string;
  email: string;
  passwd?: string; // Utilisé lors de la création
  type?: string;
  adresse?: string;
  num_CIN?: string;
  role?: string;
  type_utilisateur?: string;
  code_utilisateur?: number; // Pour compatibilité si l'API le renvoie
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  user?: User; // Champ optionnel pour l'affichage joint
}

export interface Transaction {
  id: string;
  sourceWalletId?: string;
  destinationWalletId?: string;
  amount: number;
  type: TransactionType;
  createdAt?: string;
  description: string;
}

export interface LoginResponse {
  user: User;
  token?: string; // Au cas où l'API renverrait un token plus tard
}
