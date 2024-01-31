const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('user', 'root', 'One+Nord9', {
	host: 'localhost',
	dialect: 'mysql'
  });
  const { userTable } = require("./userTable");


    const userRefreshTokensTable = sequelize.define("user_refresh_tokens", {
        id : {
            type:DataTypes.BIGINT,
            allowNull:false,
            validate:{
                notEmpty:true
            },
            autoIncrement: true,
            primaryKey: true
        },
            user_id : {
            type:DataTypes.BIGINT,
            allowNull:false,
            validate:{
                notEmpty:true
            },
            references: {
                model: userTable,
                key: 'id'
              }
        },
        refresh_token: {
            type:DataTypes.STRING,
            allowNull:false,
            validate: {
                notEmpty: true,
            },
        },
        is_valid: {
            type:DataTypes.TINYINT,
            allowNull:false,
            validate: {
                notEmpty: true,
            },
        },
    });
    userRefreshTokensTable.belongsTo(userTable, { foreignKey: 'user_id' });
    userTable.hasMany(userRefreshTokensTable, { foreignKey: 'user_id' });
    
module.exports = {userRefreshTokensTable:userRefreshTokensTable};
