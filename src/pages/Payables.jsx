import TransactionsView from '../components/TransactionsView.jsx';

export default function Payables() {
  return (
    <TransactionsView
      type="despesa"
      title="Contas a pagar"
      subtitle="Fornecedores, despesas fixas e tudo que sai do caixa."
    />
  );
}
