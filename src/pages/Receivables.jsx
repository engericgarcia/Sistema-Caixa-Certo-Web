import TransactionsView from '../components/TransactionsView.jsx';

export default function Receivables() {
  return (
    <TransactionsView
      type="receita"
      title="Contas a receber"
      subtitle="Vendas, serviços e tudo que entra no caixa."
    />
  );
}
