// src/models/user.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const bcrypt = require('bcrypt');
const BCRYPT_MIN_ROUNDS = 10;
const BCRYPT_SALT_ROUNDS = Math.max(
  BCRYPT_MIN_ROUNDS,
  Number(process.env.BCRYPT_SALT_ROUNDS || 12)
);

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  first_Name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  last_Name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email:{
    type: DataTypes.STRING,
    allowNull: false
  },
  phoneNumber:{
    type: DataTypes.STRING,
    allowNull: false
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_On: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  created_By: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  roles: {
    type: DataTypes.JSON,
    allowNull: true
  },
  failed_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lockout_until: {
    type: DataTypes.DATE,
    allowNull: true
  },
  current_session_id: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: false
});

/*
User.beforeCreate((user,options)=>{
  try{
    console.log("Called Before Create");
    const hashedPassword =  bcrypt.hashSync(user.password,10);
    user.password = hashedPassword; 
  }
  catch(err){
    console.error(err)
  }
  
 })

 
User.beforeUpdate((user,options)=>{
  try{
    console.log('Before update hook called');
    if(user.changed('password')){
      console.log('Password field changed');
    const hashedPassword =  bcrypt.hashSync(user.password,10);
    user.password = hashedPassword; 
  }
  }
  catch(err){
    console.error(err)
  }
  
 })
*/

User.beforeSave(async (user) => {
  try {
    if (user.isNewRecord || user.changed('password')) {
      const hashedPassword = await bcrypt.hash(user.password, BCRYPT_SALT_ROUNDS);
      user.password = hashedPassword;
    }
  } catch (err) {
    throw err;
  }
});


module.exports = User;
