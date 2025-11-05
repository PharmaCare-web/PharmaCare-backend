// models/Branch.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Branch = sequelize.define("Branch", {
  branch_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  branch_name: { type: DataTypes.STRING, allowNull: false },
  location: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING }
}, {
  timestamps: false,
  tableName: "branches"
});

export default Branch;
