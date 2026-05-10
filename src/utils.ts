export const generateId = () => Math.random().toString(36).substring(2, 15);

export const getIsolatedData = (key = 'cfm_transactions_isolated') => {
  const d = localStorage.getItem(key);
  return d ? JSON.parse(d) : [];
};

export const setIsolatedData = (data: any[], key = 'cfm_transactions_isolated') => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace('R$', '').trim();
};
