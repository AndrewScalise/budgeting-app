import BudgetingApp from "@/components/BudgetingApp";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export default async function Home() {
  await dbConnect();
  const transactions = await Transaction.find({}).sort({ date: -1 });

  return (
    <BudgetingApp
      initialTransactions={JSON.parse(JSON.stringify(transactions))}
    />
  );
}
