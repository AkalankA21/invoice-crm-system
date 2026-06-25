import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define(
    'Invoice',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'invoice_id',
      },
      invoiceNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'invoice_no',
      },
      customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'customer_id',
      },
      createdById: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by_id',
      },
      issueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'invoice_date',
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
      },
      discountType: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      discountValue: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      discountAmount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
      },
      taxRate: {
        type: DataTypes.DECIMAL(6, 2),
        defaultValue: 0,
      },
      taxAmount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
      },
      amountPaid: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        field: 'paid_amount',
      },
      grandTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      paymentStatus: {
        type: DataTypes.STRING,
        defaultValue: 'pending',
        field: 'status',
      },
      publicViewToken: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      publicViewHash: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'invoices',
      timestamps: false,
      underscored: true,
    }
  );
