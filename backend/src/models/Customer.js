import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define(
    'Customer',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        field: 'customer_id',
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'full_name',
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      company: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdById: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'created_by_id',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'customers',
      timestamps: false,
      underscored: true,
    }
  );
