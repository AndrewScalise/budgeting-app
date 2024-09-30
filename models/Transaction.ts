import mongoose from 'mongoose'

const TransactionSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  type: String,
  category: String,
  date: Date,
})

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema, 'transactions')