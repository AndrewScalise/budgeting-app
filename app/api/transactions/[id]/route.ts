import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Transaction from '@/models/Transaction'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const body = await request.json()
  await dbConnect()
  const updatedTransaction = await Transaction.findByIdAndUpdate(id, body, { new: true })
  return NextResponse.json(updatedTransaction)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  await dbConnect()
  await Transaction.findByIdAndDelete(id)
  return NextResponse.json({ message: 'Transaction deleted successfully' })
}