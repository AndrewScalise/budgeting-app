import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Transaction from '@/models/Transaction'

export async function GET() {
  await dbConnect()
  const transactions = await Transaction.find({}).sort({ date: -1 })
  return NextResponse.json(transactions)
}

export async function POST(request: Request) {
  const body = await request.json()
  await dbConnect()
  const newTransaction = new Transaction(body)
  await newTransaction.save()
  return NextResponse.json(newTransaction)
}