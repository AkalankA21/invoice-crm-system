import { sequelize } from '../config/db.js';
import defineUser from './User.js';
import defineCustomer from './Customer.js';
import defineInvoice from './Invoice.js';
import defineInvoiceItem from './InvoiceItem.js';

const User = defineUser(sequelize);
const Customer = defineCustomer(sequelize);
const Invoice = defineInvoice(sequelize);
const InvoiceItem = defineInvoiceItem(sequelize);

User.hasMany(Customer, { foreignKey: 'createdById', as: 'customers' });
Customer.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

User.hasMany(Invoice, { foreignKey: 'createdById', as: 'invoices' });
Invoice.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

Customer.hasMany(Invoice, { foreignKey: 'customerId', as: 'invoices' });
Invoice.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Invoice.hasMany(InvoiceItem, { foreignKey: 'invoiceId', as: 'items', onDelete: 'CASCADE' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });

export const syncModels = async () => {
  await sequelize.sync({ force: false, alter: true });
};

export { sequelize, User, Customer, Invoice, InvoiceItem };
