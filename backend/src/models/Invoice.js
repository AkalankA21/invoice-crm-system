import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Invoice = sequelize.define(
    'Invoice',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      invoiceNumber: {
        type: DataTypes.STRING(30),
        allowNull: false,
        unique: true,
      },
      customerId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      issueDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      dueDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      discountType: {
        type: DataTypes.ENUM('fixed', 'percentage'),
        defaultValue: 'fixed',
      },
      discountValue: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
      },
      discountAmount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
      },
      taxRate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0,
      },
      taxAmount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
      },
      grandTotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      amountPaid: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
      },
      paymentStatus: {
        type: DataTypes.ENUM('Pending', 'Advance Paid', 'Fully Paid'),
        defaultValue: 'Pending',
      },
      publicViewToken: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      publicViewHash: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      notes: {
        type: DataTypes.STRING(2000),
        allowNull: true,
      },
      createdById: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
    },
    {
      tableName: 'invoices',
      defaultScope: {
        attributes: { exclude: ['publicViewHash'] },
      },
      scopes: {
        withSecrets: {
          attributes: { include: ['publicViewHash', 'publicViewToken'] },
        },
      },
      indexes: [
        { fields: ['customerId', 'paymentStatus'] },
        { fields: ['issueDate'] },
        { fields: ['invoiceNumber'] },
        { fields: ['publicViewToken'] },
      ],
    }
  );

  return Invoice;
};
