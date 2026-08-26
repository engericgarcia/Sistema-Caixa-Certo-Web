import TransactionsView from '../components/TransactionsView.jsx';

export default function AllTransactions() {
  return (
    <TransactionsView
      type={undefined}
      title="Todos os lançamentos"
      subtitle="Receitas e despesas em uma única lista."
    />
  );
}
