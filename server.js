const express = require("express")
const cors = require("cors");
const dotenv = require("dotenv")
const jwt = require("jsonwebtoken")
const app = express()
const bodyParser = require("body-parser")
const uuid = require('uuid')
const crypto = require('crypto');



const { userTable } = require("./userTable");
const { userRefreshTokensTable } = require("./userRefreshTokens");

app.post(bodyParser.urlencoded({extended: true}))
app.use(express.json())
dotenv.config()
app.use(cors());


function generateAccessToken(email, password){
	const payload = {
		email: email,
		password: password,
		iat: Math.floor(Date.now() / 1000),
		exp: Math.floor(Date.now() / 1000) + (1*24*60 * 60) // Expires in 1 day
	  };
	  const token = jwt.sign(payload, process.env.JWT_SECRET_KEY);
	return token;
}

function verifyToken(token, secret) {
	return new Promise((resolve, reject) => {
	  jwt.verify(token, secret, (error, decoded) => {
		if (error) {
		  reject(error);
		} else {
		  const now = Date.now() / 1000;
		  if (decoded.exp < now) {
			reject(new Error('Token has expired.'));
		  } else {
			resolve(decoded);
		  }
		}
	  });
	});
  }

  app.get("/verifyToken",async(req,res)=>{
		try{
			let accessToken = req.cookies.user_access_token;
			let refreshToken = req.cookies.refresh_token;
				//check if valid refresh token and then proceed to generate new accessToken,
				if(accessToken){
					let verifyTokenResult = await verifyToken(accessToken,process.env.JWT_SECRET_KEY);
					if(verifyTokenResult){
						let email = verifyTokenResult.email;
						let password = verifyTokenResult.password;
						//check if valid refresh_token against user id.
						const searchQuery = {
							where: {
							  email: req.body.email,
							},
						  };
						  
						  let users  = await userTable.findAll(searchQuery);
						  if(users[0]?.dataValues){
							let {id:userId} = users[0].dataValues;
							//get refresh token with user_id, and already existing refresh token in cookie
							let userRefreshTokenResult  = await userRefreshTokensTable.findAll({
								where: {
									user_id: userId,
									refresh_token:refreshToken,
									is_valid:1
								  },
							});
							if(userRefreshTokenResult[0].dataValues){
								let {refresh_token:validRefreshTokenInDb} = userRefreshTokenResult[0].dataValues;
								
								let newAccessToken = generateAccessToken(email, password);
								
								res.json({
									token:newAccessToken,
									refreshToken:validRefreshTokenInDb
								});
							}	
						  }else{
							throw "user details found in token are invalid, please login";
						  }
					
				}else{ 
					// no valid accessToken in cookie throw error asking to login
					throw "access Token is invalid, please login";
				}
				if(!refreshToken){
						// no refresh in cookie throw error asking to login, when user somehow deletes refresh_token 
						throw "refresh Token expired, please login";
				}
			}else{
				// no  accessToken in cookie throw error asking to login
				throw "access Token and refresh Token expired, please login";
			}
		}catch(err){
			res.statusCode = 400;
			res.statusMessage = err;
			res.end();
		}
  });

app.post("/generate", async(req, res) => {
	
	//Encryption for password
	try{
		const password = req.body.password;
		const encrypt = crypto.createHash('sha256').update(password).digest('hex');
		
			const searchQuery = {
				where: {
				  email: req.body.email,
				},
			  };
			  
			  let users  = await userTable.findAll(searchQuery);
			  if(users[0]?.dataValues){
				let {id:userId,email,password} = users[0].dataValues;
				if(password === encrypt){
					//This implies the user exists in database and user logged in with correct passoword.
					//so generate access and refresh tokens, store refresh token against user id in user_refresh_tokens table
		
						const token = generateAccessToken(email,password);  
						//using userId fetch the refreshToken, and also check if it is valid, only then retrieve
						let userRefreshTokenResult  = await userRefreshTokensTable.findAll({
							where: {
								user_id: userId,
							  },
						});
						if(userRefreshTokenResult[0].dataValues){
							let {is_valid:isRefreshTokenValid, refresh_token:refreshToken} = userRefreshTokenResult[0].dataValues;
							if(isRefreshTokenValid && refreshToken){
								//If old refresh token is valid just return that, along with new accessToken
								let newRefreshTokenUUID = uuid.v4();
								//update the old refresh token with the new one in db
								let userRefreshTokenResult = await userRefreshTokensTable.update({
									refresh_token:newRefreshTokenUUID,
								},{
									where:{
										user_id:userId,
										refresh_token:refreshToken	//old refresh token in db, should be updated with new one during login
								}
							});
								res.json({
									token : token,
									refreshToken : newRefreshTokenUUID 
								});
							}else{
								if(!isRefreshTokenValid){
									throw "Either Refresh token or email/password combination has been compromised" ;
								}
							}
						}else {
		
							let refreshTokenUUID = uuid.v4();
								
							//Insert record into user_refresh_tokens table using model in sequelize
								const refreshTokenResult = await userRefreshTokensTable.create({
									user_id:userId, 
									refresh_token:refreshTokenUUID,
									is_valid: 1
								  });
		
								  res.json({
									token : token,
									refreshToken : refreshTokenUUID 
								});
						}
						
				}else{
					//password doesnt match with correct encrypt in db, so dont generate accessToken and refreshtoken.
					throw "Either Username/Password is Incorrect";
				}
			  }else{
				throw `Corresponding user with email ${req.body.email} does not exist in the system`;
			  }
		
	}catch (err){
			res.statusCode = 400;
			res.statusMessage = err;
			res.end();
	}
	
});

  

app.listen(5000, () => {
    console.log(`server is running on port 5000`);
});

