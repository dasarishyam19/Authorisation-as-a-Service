const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('user', 'root', 'One+Nord9', {
	host: 'localhost',
	dialect: 'mysql'
  });

    const userTable = sequelize.define("user_details", {
            id : {
            type:DataTypes.BIGINT,
            allowNull:false,
            validate:{
                notEmpty:true
            },
            autoIncrement: true,
            primaryKey: true
        },
        email: {
            type:DataTypes.STRING,
            allowNull:false,
            validate: {
                notEmpty: true,
            },
        },
        password: {
            type:DataTypes.STRING,
            allowNull:false,
            validate: {
                notEmpty: true,
            },
        },
        first_name : {
            type:DataTypes.STRING,
            allowNull:false,
            validate:{
                notEmpty:true
            },
        },
        last_name : {
            type:DataTypes.STRING,
            allowNull:false,
            validate:{
                notEmpty:true
            },
        },
    });

module.exports = {userTable:userTable};
