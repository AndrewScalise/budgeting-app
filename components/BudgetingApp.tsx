"use client";

import { useState, useMemo } from "react";
import { Plus, ChevronDown, ChevronUp, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

type Transaction = {
  _id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
};

type MonthlyData = {
  [key: string]: {
    income: number;
    expenses: number;
    balance: number;
    transactions: Transaction[];
  };
};

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function BudgetingApp({
  initialTransactions,
}: {
  initialTransactions: Transaction[];
}) {
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const addTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTransaction = {
      description,
      amount: parseFloat(amount),
      type,
      category,
      date,
    };
    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newTransaction),
    });
    const savedTransaction = await response.json();
    setTransactions([savedTransaction, ...transactions]);
    resetForm();
  };

  const editTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    const updatedTransaction = {
      ...editingTransaction,
      description,
      amount: parseFloat(amount),
      type,
      category,
      date,
    };

    const response = await fetch(
      `/api/transactions/${editingTransaction._id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTransaction),
      }
    );

    const savedTransaction = await response.json();
    setTransactions(
      transactions.map((t) =>
        t._id === savedTransaction._id ? savedTransaction : t
      )
    );
    setIsEditDialogOpen(false);
    resetForm();
  };

  const deleteTransaction = async (id: string) => {
    await fetch(`/api/transactions/${id}`, {
      method: "DELETE",
    });
    setTransactions(transactions.filter((t) => t._id !== id));
  };

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setType("expense");
    setCategory("");
    setDate(new Date().toISOString().split("T")[0]);
    setEditingTransaction(null);
  };

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setDescription(transaction.description);
    setAmount(transaction.amount.toString());
    setType(transaction.type);
    setCategory(transaction.category);
    setDate(transaction.date);
    setIsEditDialogOpen(true);
  };

  const calculateMonthlyData = useMemo((): MonthlyData => {
    const monthlyData: MonthlyData = {};
    transactions.forEach((transaction) => {
      const monthYear = transaction.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          income: 0,
          expenses: 0,
          balance: 0,
          transactions: [],
        };
      }
      if (transaction.type === "income") {
        monthlyData[monthYear].income += transaction.amount;
      } else {
        monthlyData[monthYear].expenses += transaction.amount;
      }
      monthlyData[monthYear].balance =
        monthlyData[monthYear].income - monthlyData[monthYear].expenses;
      monthlyData[monthYear].transactions.push(transaction);
    });
    return monthlyData;
  }, [transactions]);

  const calculateAnnualData = useMemo(() => {
    const annualData = { income: 0, expenses: 0, balance: 0 };
    transactions.forEach((transaction) => {
      if (transaction.type === "income") {
        annualData.income += transaction.amount;
      } else {
        annualData.expenses += transaction.amount;
      }
    });
    annualData.balance = annualData.income - annualData.expenses;
    return annualData;
  }, [transactions]);

  const expensesByCategory = useMemo(() => {
    const categories: { [key: string]: number } = {};
    transactions.forEach((transaction) => {
      if (transaction.type === "expense") {
        categories[transaction.category] =
          (categories[transaction.category] || 0) + transaction.amount;
      }
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const monthlyChartData = useMemo(() => {
    return Object.entries(calculateMonthlyData)
      .map(([month, data]) => ({
        name: new Date(month).toLocaleString("default", {
          month: "short",
          year: "numeric",
        }),
        income: data.income,
        expenses: data.expenses,
        balance: data.balance,
      }))
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
  }, [calculateMonthlyData]);

  const toggleMonthExpansion = (month: string) => {
    setExpandedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Personal Finance Tracker
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {editingTransaction ? "Edit Transaction" : "Add New Transaction"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={editingTransaction ? editTransaction : addTransaction}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={type}
                  onValueChange={(value: "income" | "expense") =>
                    setType(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              {editingTransaction ? (
                "Update Transaction"
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Add Transaction
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Tabs defaultValue="annual" className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="annual">Annual Dashboard</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Dashboard</TabsTrigger>
        </TabsList>
        <TabsContent value="annual">
          <Card>
            <CardHeader>
              <CardTitle>Annual Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-500">
                    Total Income
                  </h3>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(calculateAnnualData.income)}
                  </p>
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-500">
                    Total Expenses
                  </h3>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(calculateAnnualData.expenses)}
                  </p>
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-500">
                    Net Balance
                  </h3>
                  <p
                    className={`text-2xl font-bold ${
                      calculateAnnualData.balance >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(calculateAnnualData.balance)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Expenses by Category
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={expensesByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expensesByCategory.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(value as number)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Income vs Expenses
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyChartData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) => formatCurrency(value as number)}
                      />
                      <Legend />
                      <Bar dataKey="income" fill="#82ca9d" name="Income" />
                      <Bar dataKey="expenses" fill="#8884d8" name="Expenses" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Monthly Overview</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyChartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => formatCurrency(value as number)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#82ca9d"
                      name="Income"
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke="#8884d8"
                      name="Expenses"
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="#ffc658"
                      name="Balance"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {Object.entries(calculateMonthlyData)
                  .sort((a, b) => b[0].localeCompare(a[0]))
                  .map(([month, data]) => (
                    <div key={month} className="border rounded-lg p-4">
                      <div
                        className="flex justify-between items-center cursor-pointer"
                        onClick={() => toggleMonthExpansion(month)}
                      >
                        <h3 className="text-lg font-semibold">
                          {new Date(month).toLocaleString("default", {
                            month: "long",
                            year: "numeric",
                          })}
                        </h3>
                        <div className="flex items-center space-x-4">
                          <span className="text-green-600">
                            {formatCurrency(data.income)}
                          </span>
                          <span className="text-red-600">
                            {formatCurrency(data.expenses)}
                          </span>
                          <span
                            className={
                              data.balance >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {formatCurrency(data.balance)}
                          </span>
                          {expandedMonths.includes(month) ? (
                            <ChevronUp size={20} />
                          ) : (
                            <ChevronDown size={20} />
                          )}
                        </div>
                      </div>
                      {expandedMonths.includes(month) && (
                        <div className="mt-4 space-y-2">
                          {data.transactions.map((transaction) => (
                            <div
                              key={transaction._id}
                              className="flex justify-between items-center p-2 bg-gray-100 rounded"
                            >
                              <div>
                                <p className="font-medium">
                                  {transaction.description}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {transaction.category} -{" "}
                                  {formatDate(transaction.date)}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`font-semibold ${
                                    transaction.type === "income"
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {transaction.type === "income" ? "+" : "-"}
                                  {formatCurrency(transaction.amount)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDialog(transaction)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    deleteTransaction(transaction._id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <form onSubmit={editTransaction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount</Label>
              <Input
                id="edit-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type</Label>
              <Select
                value={type}
                onValueChange={(value: "income" | "expense") => setType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Input
                id="edit-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Update Transaction
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
