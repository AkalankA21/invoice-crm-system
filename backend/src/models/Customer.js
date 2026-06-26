import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Customer = sequelize.define(
    'Customer',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: true,
        validate: { isEmail: true },
        set(value) {
          this.setDataValue('email', value ? value.toLowerCase().trim() : null);
        },
      },
      address: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'Sri Lanka',
        },
      },
      company: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      notes: {
        type: DataTypes.STRING(1000),
        allowNull: true,
      },
      createdById: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'customers',
      indexes: [
        { fields: ['name'] },
        { fields: ['phone'] },
        { fields: ['email'] },
      ],
    }
  );

  return Customer;
};
