import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define(
    'InvoiceItem',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'item_id',
      },
      invoiceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'invoice_id',
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'product_name',
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'unit_price',
      },
      lineTotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'subtotal',
      },
    },
    {
      tableName: 'invoice_items',
      timestamps: false,
      underscored: true,
    }
  );
