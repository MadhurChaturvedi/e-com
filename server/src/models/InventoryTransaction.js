import mongoose from 'mongoose';

const inventoryTransactionSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['sale', 'restock', 'adjustment', 'return', 'cancellation'],
    required: true,
    index: true,
  },
  quantityChanged: {
    type: Number,
    required: true,
  },
  previousStock: {
    type: Number,
    required: true,
  },
  newStock: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    trim: true,
    default: '',
  },
  referenceOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

export const InventoryTransaction = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
